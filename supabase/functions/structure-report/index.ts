import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const { report_id } = await req.json()
        const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
        const geminiKey = Deno.env.get('GEMINI_API_KEY')

        const { data: report } = await supabase.from('reports').select('raw_text, user_id').eq('id', report_id).single()
        if (!report?.raw_text) throw new Error("No raw text found to structure.")

        console.log(`[Stage 2] Structuring report: ${report_id}`)

        const prompt = `You are a medical data structuring engine.
Convert the following raw medical report text into structured JSON.
Return a single valid JSON object in this exact structure:
{
  "patient_info": { "age": number | null, "gender": string | null, "blood_group": string | null },
  "lab_tests": [
    {
      "test_name": string,
      "value": number | string,
      "unit": string | null,
      "normal_min": number | null,
      "normal_max": number | null,
      "status": "Normal" | "High" | "Low" | "Borderline" | "Abnormal" | "Unknown"
    }
  ],
  "doctor_notes": string | null
}

RULES:
- Extract only rows with a test name and a value.
- If no reference range, set min/max to null and status to "Unknown".
- Return ONLY JSON. No backticks or markdown.

RAW TEXT:
${report.raw_text}`

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { response_mime_type: "application/json" }
            })
        })

        const result = await response.json()
        let jsonString = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}"

        // Clean markdown backticks if Gemini added them despite the mime_type setting
        jsonString = jsonString.replace(/```json/g, "").replace(/```/g, "").trim()

        const parsedJson = JSON.parse(jsonString)
        console.log(`[Stage 2] Extracted ${parsedJson.lab_tests?.length || 0} tests.`)

        const { data: structured, error: insertErr } = await supabase
            .from('structured_reports')
            .insert({
                report_id: report_id,
                user_id: report.user_id,
                parsed_json: parsedJson
            })
            .select('id')
            .single()

        if (insertErr) throw insertErr

        // --- STAGE 3: TREND ENGINE ---
        console.log(`[Stage 3] Searching for previous reports for user: ${report.user_id}`)

        const { data: previousReports } = await supabase
            .from('structured_reports')
            .select('parsed_json')
            .eq('user_id', report.user_id)
            .neq('id', structured.id)
            .order('created_at', { ascending: false })
            .limit(1)

        if (previousReports?.[0]?.parsed_json && parsedJson.lab_tests) {
            const prevData = previousReports[0].parsed_json as any
            const trendResults = []

            // Helper to clean names for better matching (e.g. "M.C.V." matches "M. C. V.")
            const standardize = (name: string) => name.toLowerCase().replace(/[\s.]/g, '').replace(/^total/, '').trim();

            for (const currentTest of parsedJson.lab_tests) {
                const currentStandard = standardize(currentTest.test_name)

                const prevTest = prevData.lab_tests?.find(
                    (t: any) => standardize(t.test_name) === currentStandard
                )

                if (prevTest && !isNaN(parseFloat(currentTest.value)) && !isNaN(parseFloat(prevTest.value))) {
                    const currentVal = parseFloat(currentTest.value)
                    const prevVal = parseFloat(prevTest.value)

                    let status = "Stable"
                    if (currentVal > prevVal) status = "Increased"
                    else if (currentVal < prevVal) status = "Decreased"

                    trendResults.push({
                        report_id: report_id, // Link to the primary report ID, not the structured one
                        test_name: currentTest.test_name,
                        previous_value: prevVal,
                        current_value: currentVal,
                        trend_status: status,
                        percentage_change: prevVal !== 0 ? ((currentVal - prevVal) / prevVal) * 100 : 0
                    })
                }
            }

            if (trendResults.length > 0) {
                console.log(`[Stage 3] Attempting to save ${trendResults.length} trends...`)
                const { error: trendErr } = await supabase.from('trend_cache').insert(trendResults)

                if (trendErr) {
                    console.error(`[Stage 3] DB Error: ${trendErr.message}`)
                } else {
                    console.log(`[Stage 3] Successfully saved ${trendResults.length} trends.`)
                }
            } else {
                console.log("[Stage 3] No matching numeric tests found for trends.")
            }
        } else {
            console.log("[Stage 3] No previous report found to compare with.")
        }

        await supabase.from('reports').update({
            analysis: "Trends & Structuring Complete."
        }).eq('id', report_id)

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error(`FATAL ERROR: ${error.message}`)
        return new Response(JSON.stringify({ error: error.message }), { status: 200, headers: corsHeaders })
    }
})

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

        // 1. Fetch the raw_text from Stage 1
        const { data: report } = await supabase.from('reports').select('raw_text, user_id').eq('id', report_id).single()
        if (!report?.raw_text) throw new Error("No raw text found to structure.")

        console.log(`Structuring report: ${report_id}`)

        // 2. The Medical Structuring Prompt
        const prompt = `You are a medical data architect. Convert the following raw medical report text into a clean, valid JSON object. 

STRICT RULES:
- If a value is marked "High", "Low", or falls outside the reference range, set "is_abnormal" to true.
- Use null if a specific field like "gender" or "age" is missing.
- Extract every single lab test parameter.
- Ensure the output is ONLY valid JSON. No markdown backticks.

REQUIRED JSON STRUCTURE:
{
  "patient_info": { "name": string, "age": string, "gender": string },
  "report_meta": { "lab_name": string, "date": string, "report_type": string },
  "lab_tests": [
    {
      "test_name": string,
      "value": number or string,
      "unit": string,
      "is_abnormal": boolean,
      "reference_range": string,
      "category": string (e.g., CBC, Liver, Kidney)
    }
  ]
}

RAW TEXT TO PROCESS:
${report.raw_text}`

        // 3. Call Gemini (v1beta for stable JSON output)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { response_mime_type: "application/json" }
            })
        })

        const result = await response.json()
        const parsedJson = JSON.parse(result.candidates?.[0]?.content?.parts?.[0]?.text || "{}")

        // 4. Save to structured_reports table
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

        // 5. Update parent report status
        await supabase.from('reports').update({
            analysis: "Structuring Complete. Ready for Analysis."
        }).eq('id', report_id)

        return new Response(JSON.stringify({ success: true, structured_id: structured.id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error(`ERROR: ${error.message}`)
        return new Response(JSON.stringify({ error: error.message }), { status: 200, headers: corsHeaders })
    }
})

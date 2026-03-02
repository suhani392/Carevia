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

        // 1. Fetch Structured Data & Trends
        const { data: structured } = await supabase.from('structured_reports').select('id, parsed_json, user_id').eq('report_id', report_id).single()
        if (!structured) throw new Error("Structured data not found.")

        const { data: trends } = await supabase.from('trend_cache').select('*').eq('report_id', report_id)

        // 2. Fetch User Profile for context (Optional but requested)
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', structured.user_id).single()

        const prompt = `You are Carevia AI.
You are a medical report explanation engine.
You explain structured lab report data in simple, calm, and easy-to-understand language.
You do NOT diagnose. You do NOT prescribe medication. You do NOT predict disease. You do NOT use fear-based language.
You ONLY use the structured data provided. NEVER use outside medical knowledge beyond basic explanations.

DATA PROVIDED:
- User Profile: ${JSON.stringify(profile || {})}
- Structured Data: ${JSON.stringify(structured.parsed_json)}
- Trends: ${JSON.stringify(trends || [])}

TASK:
I have analysed your report and here is what I have found:
Present each test in sections exactly in this pattern:
Test Name – Value + Unit (Status)
Next lines:
- One short sentence explaining what the test measures.
- One sentence stating the user's value and the normal range.
- One sentence clearly stating whether it is within range or outside (use phrases like "a little lower than normal", "a bit high").

FINAL SUMMARY:
In 5-8 calm sentences summarize the results.Reassure the user if mostly normal.

OUTPUT FORMAT:
Return ONLY a single valid JSON object with this structure:
{
  "introduction": "I have analysed your report and here is what I have found:",
  "explanations": [
    {
      "category": "e.g. Blood Cells",
      "test_name": "Haemoglobin",
      "heading": "Haemoglobin – 10.8 gm% (Low)",
      "explanation_lines": [
        "Haemoglobin carries oxygen in the blood.",
        "Your value is 10.8 gm%, while the normal range is 12–16.",
        "This is a little lower than normal.",
        "You may consider discussing this with a doctor for further evaluation."
      ]
    }
  ],
  "summary": "The 5-8 sentence summary.",
  "takeaways": {
    "biggest_concern": "statement or null",
    "most_reassuring_finding": "statement or null",
    "what_to_monitor": "statement or null"
  }
}

RULES:
- No markdown. No emojis. No extra formatting.
- 8th-grade level language.`

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { response_mime_type: "application/json" }
            })
        })

        const result = await response.json()
        console.log(`[Stage 4] Gemini raw response: ${JSON.stringify(result)}`)

        let jsonString = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}"
        jsonString = jsonString.replace(/```json/g, "").replace(/```/g, "").trim()

        const explanationJson = JSON.parse(jsonString)
        console.log(`[Stage 4] Successfully parsed explanation JSON. Length: ${explanationJson.explanations?.length}`)

        // 3. Store the result
        const { error: updateErr } = await supabase.from('structured_reports').update({ explanation_json: explanationJson }).eq('id', structured.id)
        if (updateErr) throw new Error(`Update explanation error: ${updateErr.message}`)

        // 4. Update parent status
        console.log(`[Stage 4] Setting final status for report: ${report_id}`)
        await supabase.from('reports').update({ analysis: "Analysis Complete. Expert insights ready!" }).eq('id', report_id)

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (error) {
        console.error(`[Stage 4] Error: ${error.message}`)
        return new Response(JSON.stringify({ error: error.message }), { status: 200, headers: corsHeaders })
    }
})

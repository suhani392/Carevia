import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  let reportId: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    reportId = body.report_id;

    console.log(`[V2-Explain] Starting for report: ${reportId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const aiKey = Deno.env.get('GEMINI_API_KEY');

    if (!reportId) throw new Error("Missing report_id");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handshake: Prove we started
    await supabase.from('reports').update({ analysis: "Simplifying terms..." }).eq('id', reportId)

    const { data: structured, error: structErr } = await supabase.from('structured_reports').select('*').eq('report_id', reportId).single()
    if (structErr || !structured?.parsed_json) throw new Error("No structured data found to explain.");

    const prompt = `You are a world-class patient health explainer.
    Explain these lab results in extremely simple, 8th-grade language.
    
    EXACT JSON FORMAT:
    {
      "introduction": "A friendly opening sentence.",
      "explanations": [
        {
          "category": "e.g. Heart Health",
          "heading": "Test Name - Status",
          "explanation_lines": ["Line 1", "Line 2"]
        }
      ],
      "summary": "A reassuring closing."
    }

    DATA: ${JSON.stringify(structured.parsed_json)}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${aiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    })

    const result = await response.json()
    if (result.error) throw new Error(`Stage 3 AI: ${result.error.message}`);

    const explanationJson = JSON.parse(result.candidates?.[0]?.content?.parts?.[0]?.text || "{}");

    await supabase.from('structured_reports').update({ explanation_json: explanationJson }).eq('id', structured.id)
    await supabase.from('reports').update({ analysis: "Complete! Insights ready." }).eq('id', reportId)

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e: any) {
    console.error("[Stage 3] Error:", e.message);
    if (reportId) {
      const supabase = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '')
      await supabase.from('reports').update({ analysis: `Error: ${e.message}` }).eq('id', reportId)
    }
    return new Response(JSON.stringify({ error: e.message }), { status: 200, headers: corsHeaders })
  }
})

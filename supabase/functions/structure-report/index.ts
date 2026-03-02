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

        console.log(`[Stage 2] Starting for ${reportId}`);

        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const aiKey = Deno.env.get('GEMINI_API_KEY');

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Immediate Handshake
        await supabase.from('reports').update({ analysis: "Organizing tests..." }).eq('id', reportId)

        const { data: report, error: reportErr } = await supabase.from('reports').select('raw_text, user_id').eq('id', reportId).single()
        if (reportErr || !report?.raw_text) throw new Error("Stage 2: No text found.");

        const prompt = `Convert this medical text into structured JSON with lab_tests (test_name, value, unit, status). TEXT: ${report.raw_text}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${aiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { response_mime_type: "application/json" }
            })
        })

        const result = await response.json()
        if (result.error) throw new Error(`Stage 2 AI: ${result.error.message}`);

        const jsonString = result.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsedJson = JSON.parse(jsonString || "{}");

        await supabase.from('structured_reports').upsert({
            report_id: reportId,
            user_id: report.user_id,
            parsed_json: parsedJson
        }, { onConflict: 'report_id' });

        await supabase.from('reports').update({ analysis: "Analyzing trends..." }).eq('id', reportId)

        // Anti-Quota Delay
        await new Promise(r => setTimeout(r, 2000));

        console.log(`[Stage 2] Triggering Stage 3 for ${reportId}`);
        fetch(`${supabaseUrl}/functions/v1/generate-explanation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
            body: JSON.stringify({ report_id: reportId })
        }).catch(e => console.error("[Stage 2] Stage 3 trigger failed:", e));

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    } catch (e: any) {
        console.error("[Stage 2] Error:", e.message);
        if (reportId) {
            const supabase = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '')
            await supabase.from('reports').update({ analysis: `Error: ${e.message}` }).eq('id', reportId)
        }
        return new Response(JSON.stringify({ error: e.message }), { status: 200, headers: corsHeaders })
    }
})

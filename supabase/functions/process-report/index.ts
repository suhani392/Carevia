import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function uint8ToBase64(data: Uint8Array): string {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let result = ""; let i = 0; const len = data.length;
    for (i = 0; i < len - 2; i += 3) {
        result += alphabet[data[i] >> 2];
        result += alphabet[((data[i] & 0x03) << 4) | (data[i + 1] >> 4)];
        result += alphabet[((data[i + 1] & 0x0f) << 2) | (data[i + 2] >> 6)];
        result += alphabet[data[i + 2] & 0x3f];
    }
    if (i < len) {
        result += alphabet[data[i] >> 2];
        if (i === len - 1) { result += alphabet[(data[i] & 0x03) << 4]; result += "=="; }
        else { result += alphabet[((data[i] & 0x03) << 4) | (data[i + 1] >> 4)]; result += alphabet[(data[i + 1] & 0x0f) << 2]; result += "="; }
    }
    return result;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    let reportId: string | null = null;
    try {
        const body = await req.json().catch(() => ({}));
        reportId = body.report_id;
        const supUrl = Deno.env.get('SUPABASE_URL') || "";
        const supKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || "";
        const aiKey = Deno.env.get('GEMINI_API_KEY') || "";
        const supabase = createClient(supUrl, supKey);

        console.log(`[Stage 1] Started for ${reportId}`);
        await supabase.from('reports').update({ analysis: "Waiting for cloud response..." }).eq('id', reportId);

        const { data: report } = await supabase.from('reports').select('uri, user_id').eq('id', reportId).single();
        const fileName = report.uri.split('?')[0].split('/').pop();
        const { data: fileData } = await supabase.storage.from('reports').download(`${report.user_id}/${fileName}`);

        await supabase.from('reports').update({ analysis: "Reading your report..." }).eq('id', reportId);

        const arrayBuffer = await fileData.arrayBuffer();
        const base64Content = uint8ToBase64(new Uint8Array(arrayBuffer));
        const mimeType = fileName?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${aiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "Extract all text from this medical report. Raw text only." },
                        { inline_data: { mime_type: mimeType, data: base64Content } }
                    ]
                }]
            })
        });

        const result = await response.json();
        if (result.error) throw new Error(result.error.message);

        const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        await supabase.from('reports').update({ raw_text: rawText, analysis: "Organizing data..." }).eq('id', reportId);

        // 2-second delay to protect Quota
        await new Promise(r => setTimeout(r, 2000));

        console.log(`[Stage 1] Triggering Stage 2 for ${reportId}`);
        // Triggers Stage 2
        fetch(`${supUrl}/functions/v1/structure-report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supKey}` },
            body: JSON.stringify({ report_id: reportId })
        }).catch(e => console.error("[Stage 1] Trigger failed:", e));

        return new Response(JSON.stringify({ success: true, status: "Stage 2 Triggered" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (err: any) {
        console.error("[Stage 1] Error:", err.message);
        if (reportId) {
            const supabase = createClient(Deno.env.get('SUPABASE_URL') || "", Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || "");
            await supabase.from('reports').update({ analysis: `Error: ${err.message}` }).eq('id', reportId);
        }
        return new Response(JSON.stringify({ error: err.message }), { status: 200, headers: corsHeaders });
    }
})

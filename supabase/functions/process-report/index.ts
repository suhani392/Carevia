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

        const { data: report } = await supabase.from('reports').select('uri, user_id').eq('id', report_id).single()
        if (!report) throw new Error(`Report not found`)

        const fileName = report.uri.split('/').pop()
        const { data: fileData } = await supabase.storage.from('reports').download(`${report.user_id}/${fileName}`)
        if (!fileData) throw new Error(`Download failed`)

        const mimeType = fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'
        const arrayBuffer = await fileData.arrayBuffer()
        const base64Image = toBase64(arrayBuffer)

        // Using gemini-flash-latest (This is the stable Flash alias in your project list)
        const model = 'gemini-flash-latest';
        console.log(`Using Stable Model: ${model}`)

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        {
                            text: `You are an advanced medical OCR extraction engine.
Your task is to extract all visible and readable text exactly as it appears from the provided medical report image.
STRICT INSTRUCTIONS:
•	Extract every readable word, number, symbol, abbreviation, handwritten note, table value, reference range and unit.
•	Preserve original spelling, capitalization, punctuation, line breaks, spacing, and formatting as closely as possible.
•	Maintain the exact reading order (left to right, top to bottom).
•	If text is unclear but partially readable, extract the readable portion without guessing and mention in bracket that “text is not clear”.
•	Do NOT correct spelling.
•	Do NOT summarize.
•	Do NOT interpret.
•	Do NOT explain.
•	Do NOT add labels.
•	Do NOT structure into JSON or sections.
•	Do NOT omit repeated text.
•	Do NOT hallucinate missing content.
Important:
We do NOT explain here.
We do NOT generate JSON here.
Only raw text extraction.` },
                        { inline_data: { mime_type: mimeType, data: base64Image } }
                    ]
                }]
            })
        })

        const result = await response.json()
        const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text

        if (!rawText) {
            console.error("Gemini Error:", JSON.stringify(result))
            throw new Error(result?.error?.message || "Gemini failed to return text.")
        }

        // Update Database
        await supabase.from('reports').update({
            raw_text: rawText,
            analysis: "Intelligence Perception Complete. Starting Stage 2..."
        }).eq('id', report_id)

        // CHAINING: Trigger Stage 2 (Structuring)
        console.log("Triggering Stage 2: structure-report...")
        const chainResp = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/structure-report`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            },
            body: JSON.stringify({ report_id })
        })

        console.log(`Stage 2 trigger response status: ${chainResp.status}`)

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (error) {
        console.error(`ERROR: ${error.message}`)
        return new Response(JSON.stringify({ error: error.message }), { status: 200, headers: corsHeaders })
    }
})

function toBase64(buffer: ArrayBuffer) {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    const chunkSize = 0x8000
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
    }
    return btoa(binary)
}

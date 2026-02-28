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
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const geminiKey = Deno.env.get('GEMINI_API_KEY')

        const supabase = createClient(supabaseUrl, supabaseKey)

        // 1. Fetch report details
        const { data: report } = await supabase.from('reports').select('uri, user_id').eq('id', report_id).single()
        if (!report) throw new Error(`Report not found`)

        const fileName = report.uri.split('/').pop()
        const { data: fileData } = await supabase.storage.from('reports').download(`${report.user_id}/${fileName}`)
        if (!fileData) throw new Error(`Download failed`)

        const mimeType = fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'
        const arrayBuffer = await fileData.arrayBuffer()
        const base64Image = toBase64(arrayBuffer)

        // 2. OCR Stage
        const model = 'gemini-flash-latest';
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "Extract all visible text exactly as it appears. Raw text only." },
                        { inline_data: { mime_type: mimeType, data: base64Image } }
                    ]
                }]
            })
        })

        const result = await response.json()
        const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text
        if (!rawText) throw new Error("OCR failed")

        // 3. Save Raw Text
        await supabase.from('reports').update({
            raw_text: rawText,
            analysis: "Perception Complete. Starting Structuring..."
        }).eq('id', report_id)

        // 4. CHAINING - Automatically trigger Stage 2 (Structuring)
        console.log("Chaining: Triggering structure-report...")

        // We call the other function asynchronously (don't wait for it to finish)
        fetch(`${supabaseUrl}/functions/v1/structure-report`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({ report_id })
        }).catch(err => console.error("Chaining error:", err))

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

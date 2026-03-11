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

// STAGE 3 HELPER: Standardize test names for matching (e.g., Hb = Haemoglobin)
function standardize(name: string): string {
    if (!name) return "";
    return name.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .replace('haemoglobin', 'hb')
        .replace('hemoglobin', 'hb')
        .replace('bloodglucose', 'sugar')
        .replace('fastingbloodsugar', 'fbs');
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    let reportId: string | null = null;
    let stage: string = 'ocr';

    try {
        const body = await req.json().catch(() => ({}));
        reportId = body.report_id;
        stage = body.stage || 'ocr';

        if (!reportId) throw new Error("Missing report_id");

        const supUrl = Deno.env.get('SUPABASE_URL') || "";
        const supKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || "";
        const aiKey = Deno.env.get('GEMINI_API_KEY') || "";
        const supabase = createClient(supUrl, supKey);

        // DEBUG: Check which key we are actually using (BW WU should be the new one)
        console.log(`[AUTH] Using AI Key ending in: ...${aiKey.slice(-4)}`);

        if (stage === 'ocr') {
            const { data: report, error: fetchErr } = await supabase.from('reports').select('uri, user_id').eq('id', reportId).single();
            if (fetchErr) throw new Error(`Fetch Metadata Failed: ${fetchErr.message}`);

            await supabase.from('reports').update({ analysis: "Reading your report..." }).eq('id', reportId);

            const fileName = report.uri.split('?')[0].split('/').pop();
            const { data: fileData, error: dlErr } = await supabase.storage.from('reports').download(`${report.user_id}/${fileName}`);
            if (dlErr) throw new Error(`Download Failed: ${dlErr.message}`);

            const arrayBuffer = await fileData.arrayBuffer();
            const base64Content = uint8ToBase64(new Uint8Array(arrayBuffer));
            const mimeType = fileName?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';

            // --- PLAN STAGE 1.4: GEMINI OCR PROMPT ---
            const ocrPrompt = `You are an advanced medical OCR extraction engine.
Your task is to extract all visible and readable text exactly as it appears from the provided medical report image.
STRICT INSTRUCTIONS:
• Extract every readable word, number, symbol, abbreviation, handwritten note, table value, reference range and unit.
• Preserve original spelling, capitalization, punctuation, line breaks, spacing, and formatting as closely as possible.
• Maintain the exact reading order (left to right, top to bottom).
• If text is unclear but partially readable, extract the readable portion without guessing and mention in bracket that “text is not clear”.
• Do NOT correct spelling.
• Do NOT summarize.
• Do NOT interpret.
• Do NOT explain.
• Do NOT add labels.
• Do NOT structure into JSON or sections.
• Do NOT omit repeated text.
• Do NOT hallucinate missing content.
Important: We do NOT explain here. We do NOT generate JSON here. Only raw text extraction.`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${aiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: ocrPrompt },
                            { inline_data: { mime_type: mimeType, data: base64Content } }
                        ]
                    }]
                })
            });

            const result = await response.json();
            if (result.error) {
                console.error(`[AI ERROR] OCR Failed: ${JSON.stringify(result.error)}`);
                throw new Error(`Gemini OCR: ${result.error.message}`);
            }

            const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
            await supabase.from('reports').update({ raw_text: rawText, analysis: "Organizing medical data..." }).eq('id', reportId);

            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        } else if (stage === 'structuring') {
            const { data: report, error: reportErr } = await supabase.from('reports').select('raw_text, user_id').eq('id', reportId).single();
            if (reportErr || !report?.raw_text) throw new Error("Raw text not found for structuring.");

            // --- PLAN STAGE 2.3: STRUCTURING PROMPT ---
            const structPrompt = `You are a medical data structuring engine.
Convert the following raw medical report text into structured JSON.
Extract:
1. Structured laboratory test rows
2. Patient details (age, gender, blood group if available)
3. Doctor / Pathologist notes (if present)
Ignore:
Clinical significance text, interpretation paragraphs, method descriptions, addresses, report headers, accession details, barcode numbers, lab certifications, repeated footers, and any educational explanations not directly tied to a specific reported test value.
Return a single valid JSON object in this exact structure:
{
"patient_info": { "age": number | null, "gender": string | null, "blood_group": string | null },
"lab_tests": [
{ "test_name": string, "value": number | string, "unit": string | null, "normal_min": number | null, "normal_max": number | null, "status": "Normal" | "High" | "Low" | "Borderline" | "Abnormal" | "Unknown" }
],
"doctor_notes": string | null
}
Extract only structured laboratory rows that contain a test name and a reported value. Merge multi-line test names into a single string. Preserve units exactly as written in the report. Maintain the exact appearance order of tests. Do not merge duplicate tests. Include calculated parameters as independent tests.
Parse biological reference ranges as follows:
"X - Y" → normal_min = X, normal_max = Y
"< X" or "<= X" → normal_max = X
"> X" or ">= X" → normal_min = X
"Up to X" → normal_max = X
If multiple descriptive ranges are provided (Desirable / Borderline / High), use the first normal or optimal range only.
If no biological reference interval is provided, set normal_min = null, normal_max = null, and status = "Unknown".
If the result is non-numeric (e.g., "Non Reactive", "Not Detected", "Clear", "Negative", "Positive", "Pending"):
value = raw string, unit = null, normal_min = null, normal_max = null, status = "Normal" if it matches the reference text exactly, otherwise "Abnormal".
Determine status using: value < normal_min → "Low", value > normal_max → "High", value within range → "Normal", value slightly outside range (less than 5% deviation) → "Borderline".
If the report explicitly marks H, L, High, or Low, respect that flag over calculated comparison.
Extract patient information: Age must be numeric only. Gender must be normalized to "Male", "Female", or "Other". Blood group must be extracted only if explicitly mentioned.
Do not infer gender from name. If any field is not present, set it to null.
Extract doctor notes only if explicitly labeled (Medical Remarks, Conclusion, etc.). Exclude method descriptions.
Return valid JSON only. No explanation. No markdown. No extra text.

TEXT TO PARSE:
${report.raw_text}`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${aiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: structPrompt }] }],
                    generationConfig: { response_mime_type: "application/json" }
                })
            });

            const result = await response.json();
            if (result.error) {
                console.error(`[AI ERROR] Structuring Failed: ${JSON.stringify(result.error)}`);
                throw new Error(`Gemini Structuring: ${result.error.message}`);
            }

            const parsedJson = JSON.parse(result.candidates?.[0]?.content?.parts?.[0]?.text || "{}");

            // --- STAGE 3: TREND CALCULATION ---
            const { data: prevReport } = await supabase
                .from('structured_reports')
                .select('parsed_json')
                .eq('user_id', report.user_id)
                .neq('report_id', reportId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (prevReport?.parsed_json?.lab_tests && parsedJson.lab_tests) {
                const trends = [];
                for (const current of parsedJson.lab_tests) {
                    const match = prevReport.parsed_json.lab_tests.find((p: any) =>
                        standardize(p.test_name) === standardize(current.test_name)
                    );

                    if (match && !isNaN(parseFloat(current.value)) && !isNaN(parseFloat(match.value))) {
                        const curVal = parseFloat(current.value);
                        const preVal = parseFloat(match.value);
                        const diff = curVal - preVal;
                        trends.push({
                            report_id: reportId,
                            test_name: current.test_name,
                            previous_value: preVal,
                            current_value: curVal,
                            trend_status: diff > 0 ? "Increased" : diff < 0 ? "Decreased" : "Stable",
                            percentage_change: preVal !== 0 ? ((diff / preVal) * 100) : 0
                        });
                    }
                }
                if (trends.length > 0) {
                    await supabase.from('trend_cache').insert(trends);
                }
            }

            // 1. Check if structured report already exists
            const { data: existing } = await supabase
                .from('structured_reports')
                .select('id')
                .eq('report_id', reportId)
                .maybeSingle();

            let saveResult;
            if (existing) {
                saveResult = await supabase.from('structured_reports').update({ parsed_json: parsedJson }).eq('id', existing.id);
            } else {
                saveResult = await supabase.from('structured_reports').insert({
                    report_id: reportId,
                    user_id: report.user_id,
                    parsed_json: parsedJson
                });
            }

            if (saveResult.error) throw new Error(`DB Save Failed: ${saveResult.error.message}`);

            await supabase.from('reports').update({ analysis: "Carevia is writing insights..." }).eq('id', reportId);
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        } else if (stage === 'explanation') {
            const { data: struct, error: structErr } = await supabase.from('structured_reports').select('parsed_json').eq('report_id', reportId).maybeSingle();
            if (structErr || !struct?.parsed_json) throw new Error("Step 2 data missing from database.");

            // Fetch calculated trends for this report
            const { data: trends } = await supabase.from('trend_cache').select('test_name, trend_status, percentage_change').eq('report_id', reportId);

            // --- PLAN STAGE 4.2 & 4.3: EXPLANATION PROMPT (USER BLUEPRINT) ---
            const explainPrompt = `You are Carevia AI. 
You are a medical report explanation engine. 
You explain structured lab report data in simple, calm, and easy-to-understand language. 
You do NOT diagnose. 
You do NOT prescribe medication. 
You do NOT predict disease. 
You do NOT use fear-based language. 
You may suggest consulting a doctor, but only if clearly required based on abnormal values. 
You ONLY use the structured data provided. 
You NEVER use outside medical knowledge beyond a basic explanation of what each test measures. 

Your task is to generate a clear, structured explanation in the following style and format: 
Start with: “I have analysed your report and here is what I have found:” 

Then, for each test, present it in sections exactly in this pattern: 
Test Name – Value + Unit (Status) 

In the next lines: 
* One short sentence explaining what the test measures (in simple language). 
* One sentence stating the user’s value and the normal range. 
* One sentence clearly stating whether it is within range, slightly low, slightly high, or outside range. 
* If mildly abnormal, use phrases like: 
  - “a little lower than normal” 
  - “a little higher than normal” 
  - “a bit low” 
  - “a bit high” 
* Avoid dramatic or alarming wording. 

If multiple related tests belong to one category (for example Differential Count, RBC Indices, Liver Function, Kidney Function, Electrolytes), group them under one heading and explain each clearly beneath it. 

For normal values: 
* Use reassuring but neutral language such as: 
  - “This is within the normal range.” 
  - “This indicates a normal value.” 

For abnormal values: 
* Clearly state they are outside the normal range. 
* Do not mention diseases. 
* Do not speculate. 
* If clearly abnormal, add one calm line: 
“You may consider discussing this with a doctor for further evaluation.” 

After explaining all parameters, provide a final section titled: Overall Summary 
In 5–8 calm sentences: 
* Summarize how many values are normal. 
* Clearly list which values are slightly low or high (if any). 
* State whether the overall report appears largely stable based on provided data. 
* Suggest medical consultation only if meaningful abnormalities exist. 
* If most values are normal, clearly reassure the user. 

Tone must always be: Calm, Supportive, Clear, Non-judgmental, Medically responsible, Easy to understand (8th-grade level).
Do not use emojis. Do not add extra formatting beyond clean headings and paragraphs. 

Return a single valid JSON object exactly in this structure:
{
  "introduction": "string",
  "explanations": [
    {
      "category": "string | null",
      "test_name": "string",
      "heading": "string",
      "explanation_lines": ["string"]
    }
  ],
  "summary": "string",
  "takeaways": {
    "biggest_concern": "string | null",
    "most_reassuring_finding": "string | null",
    "what_to_monitor": "string | null"
  }
}

DATA TO EXPLAIN:
${JSON.stringify(struct.parsed_json)}

TREND DATA (COMPARISON):
${JSON.stringify(trends || [])}
`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${aiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: explainPrompt }] }],
                    generationConfig: { response_mime_type: "application/json" }
                })
            });

            const result = await response.json();
            if (result.error) {
                console.error(`[AI ERROR] Explanation Failed: ${JSON.stringify(result.error)}`);
                throw new Error(`Gemini Explanation: ${result.error.message}`);
            }

            const explanationJson = JSON.parse(result.candidates?.[0]?.content?.parts?.[0]?.text || "{}");

            const { error: finalErr } = await supabase.from('structured_reports').update({ explanation_json: explanationJson }).eq('report_id', reportId);
            if (finalErr) throw new Error(`Final Update Failed: ${finalErr.message}`);

            await supabase.from('reports').update({ analysis: "Complete! Insights ready." }).eq('id', reportId);

            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ error: "Invalid stage" }), { status: 400, headers: corsHeaders });

    } catch (err: any) {
        console.error(`[Process-Report Error] Stage: ${stage} | Message:`, err.message);
        if (reportId) {
            const supabase = createClient(Deno.env.get('SUPABASE_URL') || "", Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || "");
            await supabase.from('reports').update({ analysis: `Error: ${err.message}` }).eq('id', reportId);
        }
        return new Response(JSON.stringify({ error: err.message }), { status: 200, headers: corsHeaders });
    }
})

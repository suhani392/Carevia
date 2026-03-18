import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const body = await req.json();
        const { message, report_id } = body;
        console.log(`[AI-Chat] START: Msg("${message?.slice(0, 20)}") | ReportID: ${report_id}`);

        const supUrl = Deno.env.get('SUPABASE_URL') || "";
        const supKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || "";
        const aiKey = Deno.env.get('GEMINI_API_KEY') || "";
        const supabase = createClient(supUrl, supKey);

        // Fetch User
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            console.error("[Auth] No Authorization header found");
            throw new Error("No login token found. Please sign out and sign in again.");
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authErr } = await supabase.auth.getUser(token);

        if (authErr || !user) {
            console.error(`[Auth Error] ${authErr?.message || "Invalid User"}`);
            throw new Error("Your session expired. Please log in again.");
        }

        console.log(`[User] Verified: ${user.id}`);
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        console.log(`[Profile] Fetched for: ${profile?.full_name || "Unknown"}`);

        let systemPrompt = "";
        let contextData = "";

        if (report_id) {
            // --- STAGE 5: REPORT-BASED Q&A ---
            const { data: struct } = await supabase.from('structured_reports').select('parsed_json, id').eq('report_id', report_id).single();
            const { data: trends } = await supabase.from('trend_cache').select('*').eq('structured_report_id', struct?.id);

            contextData = `
            STRUCTURED REPORT JSON:
            ${JSON.stringify(struct?.parsed_json || {})}

            TREND DATA:
            ${JSON.stringify(trends || [])}

            USER PROFILE:
            ${JSON.stringify({
                has_diabetes: profile?.has_diabetes,
                has_bp: profile?.has_bp,
                has_thyroid: profile?.has_thyroid
            })}
            `;

            systemPrompt = `You are Carevia AI operating in Report-Based Q&A Mode.
You are a controlled medical explanation assistant.
You must answer ONLY using:
• structured_report_json
• trend_data_json
• explicitly provided user_profile data
You are NOT allowed to use external knowledge beyond a basic explanation of what a lab test measures.
You must NOT:
• Invent or assume any missing data
• Infer diagnoses
• Predict diseases
• Estimate risk levels
• Suggest specific medications
• Suggest supplement names or dosages
• Create treatment plans
• Interpret symptoms not present in the structured data
• Calculate trends yourself
• Modify numeric values
• Extrapolate beyond the provided report
• Use alarming or fear-based language
If information is not present in the structured data, respond exactly with:
"This report does not include that information."
Do not expand beyond that sentence.
If the user asks for diagnosis: "I cannot diagnose medical conditions. I can only explain the values shown in your report."
If the user asks for medication: "I cannot prescribe or recommend medication. Please consult a qualified healthcare professional."
If the user asks about risk: "I cannot predict medical risk. I can only explain the report values provided."
Trend Handling Rules:
• Use only the provided trend_data_json.
• Never calculate differences or percentages yourself.
• If no trend data exists, say: "Trend comparison is not available for this parameter."
Length & Style Rules:
• Keep answers EXTREMELY crisp, short, and to the point (maximum 3-4 sentences total unless listing specific data).
• Provide complete information but immediately get to the point. Avoid lengthy medical background blurbs.
• Always use clear, simple bullet points if explaining multiple items.
• YOU MUST bold the main points and key terms using double asterisks (e.g. **Condition Name**).
Tone Rules: Calm, Neutral, Supportive, Clear, Medically responsible.
`;
        } else {
            // --- STAGE 6: GENERAL HEALTH MODE ---
            // Emergency Check (Hardened List)
            const emergencyKeywords = [
                'chest pain', 'breathing', 'unconscious', 'bleeding', 'seizure',
                'stroke', 'heart attack', 'suicidal', 'overdose', 'severe injury',
                'trauma', 'choking', 'poisoning'
            ];
            const isEmergency = emergencyKeywords.some(k => message.toLowerCase().includes(k));

            if (isEmergency) {
                const response = "I am not able to assess emergencies. Please seek immediate medical attention or contact local emergency services.";
                await supabase.from('general_ai_conversations').insert({
                    user_id: user?.id,
                    user_message: message,
                    ai_response: response,
                    risk_flag: 'emergency_detected'
                });
                return new Response(JSON.stringify({ text: response, isEmergency: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            systemPrompt = `You are Carevia AI, operating in General Health Education Mode.
You are a health information assistant. You provide general health education only.
You are NOT a doctor.
You must NOT:
• Diagnose conditions
• Suggest or prescribe medication
• Create treatment plans
• Recommend specific supplements or dosages
• Provide emergency decision-making instructions
• Predict disease outcomes
• Replace professional medical consultation
You must answer only with general educational information.
If a user describes life-threatening symptoms (Chest pain, Breathing issues, etc.), respond EXACTLY with:
"I am not able to assess emergencies. Please seek immediate medical attention or contact local emergency services."
If the user asks for diagnosis: "I cannot diagnose medical conditions. Please consult a qualified healthcare professional."
If the user asks for medication/treatment: "I cannot prescribe or recommend medication. Please consult a qualified healthcare professional."
Length & Style Rules:
• Keep answers EXTREMELY crisp, short, and to the point (maximum 3-4 sentences total unless listing explicit items).
• Avoid writing long essays or deep background medical histories. Give the user the simplest, most direct complete answer.
• Use bullet points strictly when listing.
• YOU MUST bold the main points and key terms using double asterisks (e.g. **Action Step**).
Tone: Calm, Neutral, Supportive, Clear, Medically responsible.`;

            contextData = `USER PROFILE: ${JSON.stringify(profile)}`;
        }

        // Call Gemini
        console.log("[AI] Requesting Gemini...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${aiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: systemPrompt },
                        { text: `CONTEXT: ${contextData}` },
                        { text: `USER QUESTION: ${message}` }
                    ]
                }]
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error(`[Gemini API Error] ${response.status}: ${errBody}`);
            throw new Error(`Gemini API returned ${response.status}`);
        }

        const result = await response.json();
        const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that.";
        console.log(`[AI Response] Length: ${aiText.length}`);

        // Log to DB
        if (report_id) {
            await supabase.from('ai_conversations').insert({ user_id: user?.id, report_id, user_message: message, ai_response: aiText });
        } else {
            await supabase.from('general_ai_conversations').insert({ user_id: user?.id, user_message: message, ai_response: aiText });
        }

        return new Response(JSON.stringify({ text: aiText, is_emergency: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 200, headers: corsHeaders });
    }
})

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { OcrAgent } from './agents/OcrAgent.ts'
import { StructuringAgent } from './agents/StructuringAgent.ts'
import { RiskAgent } from './agents/RiskAgent.ts'
import { GuardrailAgent } from './agents/GuardrailAgent.ts'
import { AlertAgent } from './agents/AlertAgent.ts'
import { FamilyAgent } from './agents/FamilyAgent.ts'
import { LanguageAgent } from './agents/LanguageAgent.ts'
import { AuditLogger } from './services/AuditLogger.ts'

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

        console.log(`[AUTH] Using AI Key ending in: ...${aiKey.slice(-4)}`);

        // --- STAGE 1: OCR ---
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

            // 🤖 1. Call OCR Agent
            const ocrResult = await OcrAgent.run(supabase, reportId, mimeType, base64Content, aiKey);

            if (ocrResult.confidence === 'LOW') {
                await supabase.from('reports').update({
                    report_confidence: 'LOW',
                    analysis: "Action Required: The report is too blurry. Please re-upload for accurate results.",
                    raw_text: ocrResult.extracted_text
                }).eq('id', reportId);
                return new Response(JSON.stringify({ success: true, confidence: 'LOW' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            await supabase.from('reports').update({
                raw_text: ocrResult.extracted_text,
                report_confidence: ocrResult.confidence,
                analysis: "Organizing medical data..."
            }).eq('id', reportId);

            return new Response(JSON.stringify({ success: true, confidence: ocrResult.confidence }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

            // --- STAGE 2: STRUCTURING & RISK EVALUATION ---
        } else if (stage === 'structuring') {
            const { data: report, error: reportErr } = await supabase.from('reports').select('raw_text, user_id').eq('id', reportId).single();
            if (reportErr || !report?.raw_text) throw new Error("Raw text not found for structuring.");

            // 🤖 2. Call Structuring Agent
            const structureData = await StructuringAgent.run(supabase, reportId, report.user_id, report.raw_text, aiKey);

            // 🤖 3. Call Context-Aware Risk Evaluation Agent
            const riskData = await RiskAgent.evaluate(supabase, reportId, report.user_id, structureData.structuredReportId, structureData.parsedJson);

            // 🤖 4. Alert & Action Triggers
            if (riskData.riskLevel === 'High Risk' || riskData.riskLevel === 'Critical') {
                await AlertAgent.trigger(supabase, reportId, report.user_id, riskData.riskLevel, riskData.reasons);
                await FamilyAgent.evaluateEscalation(supabase, reportId, report.user_id, riskData.riskLevel, riskData.reasons);
            } else {
                // Log skips for transparency in audit trail
                await AlertAgent.skip(supabase, reportId, riskData.riskLevel);
                await FamilyAgent.skip(supabase, reportId, riskData.riskLevel);
            }

            await supabase.from('reports').update({ analysis: "Carevia is writing insights..." }).eq('id', reportId);
            return new Response(JSON.stringify({ success: true, riskLevel: riskData.riskLevel }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

            // --- STAGE 3: COMPLIANT EXPLANATION ---
        } else if (stage === 'explanation') {
            const { data: struct, error: structErr } = await supabase.from('structured_reports').select('id, parsed_json, user_id').eq('report_id', reportId).maybeSingle();
            if (structErr || !struct?.parsed_json) throw new Error("Structured data missing from database.");

            const { data: report } = await supabase.from('reports').select('risk_classification').eq('id', reportId).single();
            const riskLevel = report?.risk_classification || 'Normal';

            // Fetch user profile for context
            let profileContext = "No prior health conditions specifically recorded.";
            let targetLanguage = 'en';

            if (struct.user_id) {
                const { data: profile } = await supabase.from('profiles').select('has_diabetes, has_bp, has_thyroid').eq('id', struct.user_id).single();
                if (profile) {
                    const conditions = [];
                    if (profile.has_diabetes) conditions.push("Diabetes");
                    if (profile.has_bp) conditions.push("Hypertension (High Blood Pressure)");
                    if (profile.has_thyroid) conditions.push("Thyroid Issues");
                    if (conditions.length > 0) {
                        profileContext = `Pre-existing conditions: ${conditions.join(', ')}.`;
                    }
                }
            }

            // Target Language comes from the body, injected by the frontend if available
            if (body.target_language && body.target_language !== 'en') {
                targetLanguage = body.target_language;
            }

            // Fetch trends calculated by RiskAgent
            const { data: trends } = await supabase.from('trend_cache').select('test_name, trend_status, percentage_change, previous_value').eq('structured_report_id', struct.id);

            // 🤖 5. Call Guardrail Agent to generate explanation securely (Anonymized)
            const sanitizedJson = JSON.parse(JSON.stringify(struct.parsed_json));
            if (sanitizedJson.patient_info) {
                delete sanitizedJson.patient_info.name;
            }

            const englishExplanation = await GuardrailAgent.generateSafeExplanation(
                supabase,
                reportId,
                sanitizedJson,
                trends || [],
                riskLevel,
                profileContext,
                aiKey
            );

            // 🤖 6. Multi-language Translation (Language Agent)
            let finalExplanation = englishExplanation;
            if (targetLanguage && targetLanguage !== 'en') {
                finalExplanation = await LanguageAgent.translate(supabase, reportId, englishExplanation, targetLanguage, aiKey);
            } else {
                await LanguageAgent.skip(supabase, reportId, targetLanguage || 'en');
            }

            if (targetLanguage !== 'en') {
                await supabase.from('reports').update({ analysis: "Analysis finalized..." }).eq('id', reportId);
            } else {
                await supabase.from('reports').update({ analysis: "Analysis ready" }).eq('id', reportId);
            }

            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

            // --- STAGE 4: TRANSLATION (Dynamic) ---
        } else if (stage === 'translation') {
            const { data: struct, error: structErr } = await supabase.from('structured_reports').select('id, parsed_json, explanation_json').eq('report_id', reportId).maybeSingle();
            if (structErr || !struct?.explanation_json) throw new Error("English explanation missing from database.");

            let targetLanguage = 'en';
            if (body.target_language && body.target_language !== 'en') {
                targetLanguage = body.target_language;
            }

            if (targetLanguage !== 'en') {
                await supabase.from('reports').update({ analysis: "Translating insights to your language..." }).eq('id', reportId);
                await LanguageAgent.translate(supabase, reportId, struct.explanation_json, targetLanguage, aiKey);
            }

            await supabase.from('reports').update({ analysis: "Analysis ready" }).eq('id', reportId);

            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ error: "Invalid stage" }), { status: 400, headers: corsHeaders });

    } catch (err: any) {
        console.error(`[Process-Report Error] Stage: ${stage} | Message:`, err.message);
        if (reportId) {
            const supabase = createClient(Deno.env.get('SUPABASE_URL') || "", Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || "");
            await supabase.from('reports').update({ analysis: `Error: ${err.message}` }).eq('id', reportId);

            // Log pipeline failures
            await AuditLogger.log(supabase, reportId, 'System Orchestrator', 'Pipeline Failure', err.message, 'LOW');
        }
        return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: corsHeaders });
    }
})

import { GoogleGenerativeAI } from 'npm:@google/generative-ai'
import { AuditLogger } from '../services/AuditLogger.ts';

export class LanguageAgent {
    static async translate(supabase: any, reportId: string, englishExplanation: any, targetLanguage: string, aiKey: string) {
        if (!targetLanguage || targetLanguage === 'en') {
            return englishExplanation;
        }

        try {
            console.log(`[LanguageAgent] Translating analysis to ${targetLanguage} for report ${reportId}...`);
            await supabase.from('reports').update({ analysis: "Translating insights to your language..." }).eq('id', reportId);

            // Fetch prompt from database
            const { data: promptData, error: promptErr } = await supabase
                .from('system_prompts')
                .select('prompt_template')
                .eq('agent_name', 'language_agent')
                .single();

            if (promptErr || !promptData) {
                throw new Error('Failed to load Language prompt from database');
            }

            const systemInstruction = promptData.prompt_template.replace('{{TARGET_LANGUAGE}}', targetLanguage);

            const genAI = new GoogleGenerativeAI(aiKey);
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                systemInstruction: systemInstruction
            });

            const prompt = `Translate this JSON object:\n\n${JSON.stringify(englishExplanation, null, 2)}`;

            const result = await model.generateContent(prompt);
            let rawText = result.response.text().trim();

            // Cleanup markdown if AI accidentally includes it
            if (rawText.startsWith("```json")) rawText = rawText.replace(/```json/g, "");
            if (rawText.startsWith("```")) rawText = rawText.replace(/```/g, "");
            rawText = rawText.trim();

            const translatedJson = JSON.parse(rawText);

            // Save translated JSON to the database
            let { error: updateError } = await supabase.from('structured_reports')
                .update({ translated_explanation_json: translatedJson })
                .eq('report_id', reportId);

            // Fallback if 'translated_explanation_json' column doesn't exist yet
            if (updateError && (updateError.message.includes('column') || updateError.code === 'PGRST204')) {
                console.warn("[LanguageAgent] Missing 'translated_explanation_json' column. Overwriting 'explanation_json' instead as a fallback.");
                const fallbackUpdate = await supabase.from('structured_reports')
                    .update({ explanation_json: translatedJson })
                    .eq('report_id', reportId);
                updateError = fallbackUpdate.error;
            }

            if (updateError) {
                console.error("[LanguageAgent] Error updating translated JSON:", updateError);
            } else {
                console.log("[LanguageAgent] Translation saved successfully.");
                await AuditLogger.log(
                    supabase,
                    reportId,
                    'Language Agent',
                    'Multi-Language Translation',
                    `Successfully translated report explanation into ${targetLanguage}.`,
                    'HIGH'
                );
            }

            return translatedJson;
        } catch (error: any) {
            console.error("[LanguageAgent] Error translating:", error.message);
            // Fallback gracefully to English explanation so the user still gets their report
            return englishExplanation;
        }
    }

    static async skip(supabase: any, reportId: string, language: string) {
        await AuditLogger.log(
            supabase,
            reportId,
            'Language Agent',
            'Skipped: Translation',
            `Translation skipped because target language is English (${language}).`,
            'LOW'
        );
    }
}

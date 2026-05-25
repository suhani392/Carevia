import { AuditLogger } from '../services/AuditLogger.ts';

export class StructuringAgent {
    /**
     * Converts OCR text into strict, typed medical JSON.
     * Evaluates its own mapping success and flags dangerous ambiguity.
     */
    static async run(
        supabase: any,
        reportId: string,
        userId: string,
        rawText: string,
        aiKey: string
    ) {
        // Fetch prompt from database
        const { data: promptData, error: promptErr } = await supabase
            .from('system_prompts')
            .select('prompt_template')
            .eq('agent_name', 'structuring_agent')
            .single();

        if (promptErr || !promptData) {
            throw new Error('Failed to load Structuring prompt from database');
        }

        const structPrompt = promptData.prompt_template.replace('{{RAW_TEXT}}', rawText);

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
        const metadata = parsedJson.structuring_metadata || { parameters_mapped: 0, parameters_skipped: 0, ambiguity_notes: null };

        // Determine agent confidence based on how much was safely mapped vs skipped
        let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
        let logMessage = `Mapped ${metadata.parameters_mapped} parameters successfully.`;

        if (metadata.parameters_skipped > 0 || metadata.ambiguity_notes) {
            confidence = 'MEDIUM';
            logMessage += ` Skipped ${metadata.parameters_skipped} parameters. Notes: ${metadata.ambiguity_notes}`;
        }

        if (metadata.parameters_mapped === 0) {
            confidence = 'LOW';
            logMessage = 'Failed to map any valid parameters from the text.';
        }

        // Identify identity metadata
        const patientName = parsedJson.patient_info?.name || null;
        const reportDateString = parsedJson.patient_info?.report_date || null;

        // Leave the Reasoning Trail with identity metadata
        let metaLog = `Data identified for ${patientName || 'Unknown Patient'}. Report Date: ${reportDateString || 'Not Found'}.`;
        metaLog += ` Mapped ${metadata.parameters_mapped} parameters successfully.`;

        await AuditLogger.log(
            supabase,
            reportId,
            'Structuring Agent',
            'Data Structuring & Identity Mapping',
            metaLog,
            confidence
        );

        // Save structured report FIRST to get its ID for later steps
        const { data: existing } = await supabase
            .from('structured_reports')
            .select('id')
            .eq('report_id', reportId)
            .maybeSingle();

        let structuredReportId: string;
        if (existing) {
            structuredReportId = existing.id;
            await supabase.from('structured_reports').update({ 
                parsed_json: parsedJson,
                patient_name: patientName,
                report_date: reportDateString
            }).eq('id', existing.id);
        } else {
            const { data: inserted, error: insErr } = await supabase.from('structured_reports').insert({
                report_id: reportId,
                user_id: userId,
                parsed_json: parsedJson,
                patient_name: patientName,
                report_date: reportDateString
            }).select('id').single();
            
            if (insErr) throw new Error(`DB Save Failed: ${insErr.message}`);
            structuredReportId = inserted.id;
        }

        return {
            structuredReportId,
            parsedJson,
            confidence,
            metadata
        };
    }
}

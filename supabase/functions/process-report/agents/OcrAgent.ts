import { AuditLogger } from '../services/AuditLogger.ts';

export class OcrAgent {
    /**
     * Extracts raw text from an image with strict confidence scoring.
     */
    static async run(
        supabase: any,
        reportId: string,
        mimeType: string,
        base64Content: string,
        aiKey: string
    ): Promise<{ extracted_text: string; confidence: 'HIGH' | 'MEDIUM' | 'LOW'; ambiguity_notes: string | null }> {
        
        // Fetch prompt from database
        const { data: promptData, error: promptErr } = await supabase
            .from('system_prompts')
            .select('prompt_template')
            .eq('agent_name', 'ocr_agent')
            .single();

        if (promptErr || !promptData) {
            throw new Error('Failed to load OCR prompt from database');
        }

        const ocrPrompt = promptData.prompt_template;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${aiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: ocrPrompt },
                        { inline_data: { mime_type: mimeType, data: base64Content } }
                    ]
                }],
                generationConfig: { response_mime_type: "application/json" }
            })
        });

        const result = await response.json();
        if (result.error) {
            console.error(`[AI ERROR] OCR Failed: ${JSON.stringify(result.error)}`);
            throw new Error(`Gemini OCR: ${result.error.message}`);
        }

        const rawJsonText = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const parsed = JSON.parse(rawJsonText);
        
        const confidence = parsed.confidence || 'UNKNOWN';
        const notes = parsed.ambiguity_notes ? `Notes: ${parsed.ambiguity_notes}` : 'Image was sufficiently clear.';

        // The exact moment the agent makes a decision, it leaves an auditable trail.
        await AuditLogger.log(
            supabase,
            reportId,
            'OCR Agent',
            'Report Image Extraction',
            `OCR Extraction finished. ${notes}`,
            confidence as 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN'
        );

        return {
            extracted_text: parsed.extracted_text || rawJsonText,
            confidence: confidence,
            ambiguity_notes: parsed.ambiguity_notes || null
        };
    }
}

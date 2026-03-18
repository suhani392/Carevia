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
        
        // We modified the original prompt to demand JSON and an explicit CONFIDENCE score.
        const ocrPrompt = `You are an advanced medical OCR extraction engine.
Your task is to extract all visible and readable text exactly as it appears from the provided medical report image.

STRICT INSTRUCTIONS:
• Extract every readable word, number, symbol, abbreviation, handwritten note, table value, reference range and unit.
• Preserve original spelling, capitalization, punctuation, line breaks, spacing, and formatting as closely as possible.
• Maintain the exact reading order (left to right, top to bottom).
• Evaluate the visual quality of the document. If it is blurry, glary, cut off, zoomed out, or illegible, reduce confidence to LOW or MEDIUM.
• Do NOT correct spelling. Do NOT summarize or explain.

Return a single valid JSON object EXACTLY in this structure:
{
  "extracted_text": "The perfectly preserved raw text goes here...",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "ambiguity_notes": "State why it is low confidence (e.g., 'Bottom left is blurry', 'Too dark'), or set to null if perfectly readable."
}`;

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

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
        const structPrompt = `You are a medical data structuring engine.
Convert the following raw medical report text into structured JSON.
Extract:
1. Structured laboratory test rows
2. Patient details (age, gender, blood group if available)
3. Doctor / Pathologist notes (if present)
Ignore:
Clinical significance text, interpretation paragraphs, method descriptions, addresses, accession details, barcode numbers, lab certifications, repeated footers, and any educational explanations not directly tied to a specific reported test value.

Return a single valid JSON object exactly in this format:
{
  "patient_info": { "name": string | null, "age": number | null, "gender": string | null, "blood_group": string | null, "report_date": "YYYY-MM-DD" | null },
  "lab_tests": [
    { "test_name": string, "value": number | string, "unit": string | null, "normal_min": number | null, "normal_max": number | null, "status": "Normal" | "High" | "Low" | "Borderline" | "Abnormal" | "Unknown" }
  ],
  "doctor_notes": string | null,
  "structuring_metadata": {
    "parameters_mapped": number,
    "parameters_skipped": number,
    "ambiguity_notes": "string or null - write exactly what was too blurry/unclear to map"
  }
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
Extract patient information from anywhere in the document (check headers especially):
- Name: The full name of the patient (e.g. "Sahil Sharma" or "P Name: Suhani"). Search for labels like "Patient Name", "Name of Patient", "Name:".
- Age: Numeric only. 
- Gender: "Male", "Female", or "Other". 
- Blood group: Extracted only if explicitly mentioned.
- Report Date: The actual date the medical tests were performed. Search all document corners/headers for: "Date of Collection", "Reported on", "Issue Date", "Date:", "Sample Received", "Collected On", "Date of Report", "Collected Date", "Result Date", "Sample Drawn", "Tested On". Look for DD/MM/YYYY or MM/DD/YYYY formats near these labels. Format strictly as YYYY-MM-DD. 
Do not infer gender from name. If any field is not present, set it to null.
Extract doctor notes only if explicitly labeled (Medical Remarks, Conclusion, etc.). Exclude method descriptions.

CRITICAL INSTRUCTION FOR EDGE CASES:
If a parameter name is unclear, or the value is half-cut off, DO NOT GUESS. Skip it.
Update "parameters_skipped" and explain what you skipped in "ambiguity_notes".

Return valid JSON only. No markdown formatting. No extra text.

TEXT TO PARSE:
${rawText}`;

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

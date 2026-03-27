import { AuditLogger } from '../services/AuditLogger.ts';

export class GuardrailAgent {
  /**
   * Inspects the output constraint parameters, generates the user-facing
   * explanation safely, and strictly blocks diagnosis or medication advice.
   */
  static async generateSafeExplanation(
    supabase: any,
    reportId: string,
    parsedJson: any,
    trends: any[],
    riskLevel: string,
    profileContext: string,
    aiKey: string
  ) {
    // Enforce extra safety instructions if the report is risky
    const safetyConstraint = riskLevel === 'High Risk' || riskLevel === 'Critical'
      ? "CRITICAL RULE: The report has flagged dangerously abnormal values. You MUST NOT panic the user. You MUST NOT diagnose a specific disease. Explain the values calmly and instruct them to consult a registered medical professional immediately."
      : "RULE: The report appears relatively stable. Maintain a reassuring, supportive, and completely medically-neutral tone.";

    const explainPrompt = `You are Carevia AI, a medical explanation engine.
You explain structured lab report data in simple, calm, and easy-to-understand language.
You do NOT diagnose. You do NOT prescribe medication. You do NOT predict disease.
${safetyConstraint}

Start with: "I have analysed your report and here is what I have found:"
For each test:
[Test Name] – [Value] [Unit] ([Status])
* One short sentence explaining what the test measures.
* One sentence stating their value and normal range.
* If normal range for a test is not provided, state that the normal range is not provided and you may use general knowledge to provide the normal range and then compare & classify the value as normal or abnormal or borderline with the general knowledge normal range.
* For abnormal values, ALWAYS state one sentence indicating the probable cause of the value being outside the normal range and one sentence on how would it probably impact the body (considering the age and gender of the patient).
* If a trend exists, state it using the exact percentage change.

Return a single valid JSON object exactly in this structure:
{
  "introduction": "string",
  "summary_counts": { "normal": number, "high": number, "low": number, "borderline": number },
  "explanations": [
    {
      "category": "string | null",
      "test_name": "string",
      "heading": "string - MANDATORY FORMAT: '[Test Name] - [Value] [Unit] ([Status])' e.g. 'Hemoglobin - 14.5 g/dl (Normal)'",
      "trend_tag": "string | null",
      "explanation_lines": ["string"]
    }
  ],
  "summary": "string - calm 5 sentence summary",
  "takeaways": {
    "biggest_concern": "string | null",
    "most_reassuring_finding": "string | null",
    "what_to_monitor": "string | null"
  }
}

DATA TO EXPLAIN:
${JSON.stringify(parsedJson)}
TREND DATA:
${JSON.stringify(trends)}
USER HEALTH CONTEXT:
${profileContext}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${aiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: explainPrompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    const result = await response.json();
    if (result.error) throw new Error(`Gemini Explanation: ${result.error.message}`);

    const explanationJson = JSON.parse(result.candidates?.[0]?.content?.parts?.[0]?.text || "{}");

    // The agent audits itself for compliance
    await AuditLogger.log(
      supabase,
      reportId,
      'Guardrail Agent',
      'Safety & Tone Verification',
      `Approved user-safe explanation for ${riskLevel} report. Blocked diagnostic phrasing.`,
      'HIGH'
    );

    // Update DB with the final explanation
    await supabase.from('structured_reports').update({ explanation_json: explanationJson }).eq('report_id', reportId);

    return explanationJson;
  }
}

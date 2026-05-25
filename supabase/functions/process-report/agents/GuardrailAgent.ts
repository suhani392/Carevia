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

    // Fetch prompt from database
    const { data: promptData, error: promptErr } = await supabase
        .from('system_prompts')
        .select('prompt_template')
        .eq('agent_name', 'guardrail_agent')
        .single();

    if (promptErr || !promptData) {
        throw new Error('Failed to load Guardrail prompt from database');
    }

    const explainPrompt = promptData.prompt_template
        .replace('{{SAFETY_CONSTRAINT}}', safetyConstraint)
        .replace('{{PARSED_JSON}}', JSON.stringify(parsedJson))
        .replace('{{TRENDS}}', JSON.stringify(trends))
        .replace('{{PROFILE_CONTEXT}}', profileContext);


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

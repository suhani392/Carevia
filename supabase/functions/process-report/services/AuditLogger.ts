export class AuditLogger {
    /**
     * securely records the undeniable reasoning trail of every agent decision.
     */
    static async log(
        supabase: any,
        reportId: string,
        agentName: string,
        eventType: string,
        decisionReason: string,
        confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN' = 'UNKNOWN'
    ) {
        try {
            const { error } = await supabase.from('audit_logs').insert({
                report_id: reportId,
                agent_name: agentName,
                event_type: eventType,
                decision_reason: decisionReason,
                confidence: confidence
            });

            if (error) {
                console.error(`[AuditLogger Error] Failed to log step for ${agentName}:`, error.message);
            } else {
                console.log(`[Audit Trail] ${agentName}: ${eventType} (${confidence})`);
            }
        } catch (err: any) {
            console.error(`[AuditLogger Exception]`, err.message);
        }
    }
}

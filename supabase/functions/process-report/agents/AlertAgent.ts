import { AuditLogger } from '../services/AuditLogger.ts';

export class AlertAgent {
    /**
     * Converts risk classifications into active system alerts and banners
     * so the UI isn't passive.
     */
    static async trigger(
        supabase: any,
        reportId: string,
        userId: string,
        riskLevel: string,
        reasons: string[]
    ) {
        // We only trigger explicit actions if the risk warrants it
        if (riskLevel === 'Normal' || riskLevel === 'Moderate Risk') {
            return; // No intrusive system alerts needed
        }

        const message = riskLevel === 'Critical' 
            ? `Critical abnormalities detected (${reasons[0]}). Immediate physician consultation recommended.`
            : `High risk patterns detected. Please review your report carefully and consult a doctor.`;

        // Create the Action in the database
        const { error } = await supabase.from('alerts_and_actions').insert({
            report_id: reportId,
            user_id: userId,
            risk_level: riskLevel,
            action_type: 'URGENT_UI_BANNER',
            action_message: message,
            status: 'Pending'
        });

        if (!error) {
            await AuditLogger.log(
                supabase,
                reportId,
                'Alert Agent',
                'System Notification Dispatch',
                `Triggered URGENT_UI_BANNER due to ${riskLevel}.`,
                'HIGH'
            );
        } else {
            console.error('[AlertAgent] Failed to trigger alert:', error);
        }
    }
}

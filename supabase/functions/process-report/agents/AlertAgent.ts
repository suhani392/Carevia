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

        // 🦾 Consolidate all reasons into a single, user-friendly summary alert
        // We list up to 3 major concerns to keep the alert readable
        const majorConcerns = reasons.slice(0, 3);
        const concernText = majorConcerns.length > 1 
            ? `${majorConcerns.slice(0, -1).join(', ')} and ${majorConcerns.slice(-1)}`
            : majorConcerns[0] || 'concerning patterns';

        const message = `Urgent: ${concernText} were detected in your report. This is classified as ${riskLevel}. Please consult a doctor immediately.`;

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
                'Emergency Banner Dispatch',
                `Triggered URGENT_UI_BANNER due to ${riskLevel}. Consolidated ${reasons.length} findings.`,
                'HIGH'
            );
        } else {
            console.error('[AlertAgent] Failed to trigger alert:', error);
        }
    }

    static async skip(supabase: any, reportId: string, riskLevel: string) {
        await AuditLogger.log(
            supabase,
            reportId,
            'Alert Agent',
            'Skipped: Notification',
            `User-facing alert skipped because risk level is ${riskLevel} (Below threshold).`,
            'LOW'
        );
    }
}

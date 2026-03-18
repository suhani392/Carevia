import { AuditLogger } from '../services/AuditLogger.ts';

export class FamilyAgent {
    /**
     * Family Escalation Agent
     * Checks if the highly-at-risk patient is a dependent (elderly/child), 
     * and automatically notifies the Caregiver account.
     */
    static async evaluateEscalation(
        supabase: any,
        reportId: string,
        userId: string,
        riskLevel: string
    ) {
        // Only escalate dangerous reports
        if (riskLevel !== 'Critical' && riskLevel !== 'High Risk') {
            return;
        }

        // Check if there is a caregiver linked (assuming standard profiles/links logic)
        // Since we don't know the exact schema for family links, we look for a simple dependent flag
        // or a shared caregiver ID. If none, we fail gracefully.
        
        // Example check: Does this user have a designated primary caregiver?
        const { data: profile } = await supabase.from('profiles').select('caregiver_id, age').eq('id', userId).maybeSingle();
        
        if (profile && profile.caregiver_id) {
            const isVulnerable = profile.age ? profile.age < 18 || profile.age > 65 : true;

            // Create Family Escaltion Action if vulnerable or caregiver explicitly exists
            const { error } = await supabase.from('alerts_and_actions').insert({
                report_id: reportId,
                user_id: profile.caregiver_id, // Target the caregiver!
                risk_level: riskLevel,
                action_type: 'FAMILY_ESCALATION',
                action_message: `A report for your dependent was flagged as ${riskLevel}. Please review it immediately.`,
                status: 'Pending'
            });

            if (!error) {
                // Escalate status on the original report for the UI
                await supabase.from('reports').update({ escalation_status: 'Escalated to Caregiver' }).eq('id', reportId);

                await AuditLogger.log(
                    supabase,
                    reportId,
                    'Family Escalation Agent',
                    'Caregiver Notification',
                    `Escalated ${riskLevel} report to assigned caregiver (${profile.caregiver_id}).`,
                    'HIGH'
                );
            }
        } else {
            // No family relation found
            await AuditLogger.log(
                supabase,
                reportId,
                'Family Escalation Agent',
                'Caregiver Search',
                `No caregiver linked to profile. Escalation skipped.`,
                'LOW'
            );
        }
    }
}

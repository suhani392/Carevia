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
        riskLevel: string,
        reasons: string[] = []
    ) {
        // Only escalate dangerous reports
        if (riskLevel !== 'Critical' && riskLevel !== 'High Risk') {
            return;
        }

        // We use the existing 'family_id' in profiles to identify family members
        const { data: userProfile } = await supabase
            .from('profiles')
            .select('family_id, full_name')
            .eq('id', userId)
            .maybeSingle();

        const activeFamilyId = userProfile?.family_id;

        if (activeFamilyId) {
            // Find all other members of this family group
            const { data: familyMembers } = await supabase
                .from('profiles')
                .select('id, full_name')
                .or(`family_id.eq.${activeFamilyId},id.eq.${activeFamilyId}`)
                .neq('id', userId); // Don't alert the user themselves

            if (familyMembers && familyMembers.length > 0) {
                const patientName = userProfile.full_name || 'A family member';
                const concern = reasons.length > 0 ? reasons.slice(0, 2).join(', ') : 'abnormal patterns';

                // Create an alert for EACH family member
                const alerts = familyMembers.map((member: any) => ({
                    report_id: reportId,
                    user_id: member.id, // Primary target is the family member
                    target_user_id: userId, // The person whose report it is
                    risk_level: riskLevel,
                    action_type: 'FAMILY_ESCALATION',
                    action_message: `Emergency for ${patientName}: ${concern} has been flagged as ${riskLevel}. Please contact them immediately.`,
                    status: 'Pending'
                }));

                const { error } = await supabase.from('alerts_and_actions').insert(alerts);

                if (!error) {
                    await supabase.from('reports').update({ escalation_status: `Escalated to ${familyMembers.length} members` }).eq('id', reportId);

                    await AuditLogger.log(
                        supabase,
                        reportId,
                        'Family Escalation Agent',
                        'Family Notification',
                        `Escalated ${riskLevel} report to ${familyMembers.length} family members.`,
                        'HIGH'
                    );
                }
            } else {
                await AuditLogger.log(
                    supabase,
                    reportId,
                    'Family Escalation Agent',
                    'Search',
                    `User belongs to family ${activeFamilyId} but no other members were found.`,
                    'LOW'
                );
            }
        } else {
            // No family relation found
            await AuditLogger.log(
                supabase,
                reportId,
                'Family Escalation Agent',
                'Skipped',
                `No family_id linked to user profile. Escalation skipped.`,
                'LOW'
            );
        }
    }
}

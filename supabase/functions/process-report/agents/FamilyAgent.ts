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
                
                // 🦾 Use the same consolidated summary logic as AlertAgent
                const majorConcerns = reasons.slice(0, 3);
                const concernText = majorConcerns.length > 1 
                    ? `${majorConcerns.slice(0, -1).join(', ')} and ${majorConcerns.slice(-1)}`
                    : majorConcerns[0] || 'abnormal patterns';

                // Create alert for EACH family member except the patient themselves
                const alerts = familyMembers.map((member: any) => ({
                    report_id: reportId,
                    user_id: member.id,
                    target_user_id: userId, // Identify as patient
                    risk_level: riskLevel,
                    action_type: 'FAMILY_ESCALATION',
                    action_message: `Emergency for ${patientName}: ${concernText} were flagged as ${riskLevel}. Please contact them immediately.`,
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
                    'Skipped: No Members',
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
                'Skipped: No Family ID',
                `No family_id linked to user profile. Escalation skipped.`,
                'LOW'
            );
        }
    }

    static async skip(supabase: any, reportId: string, riskLevel: string) {
        await AuditLogger.log(
            supabase,
            reportId,
            'Family Escalation Agent',
            'Skipped: Notification',
            `Family escalation skipped because risk level is ${riskLevel} (Below threshold).`,
            'LOW'
        );
    }
}

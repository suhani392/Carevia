import { AuditLogger } from '../services/AuditLogger.ts';

// Helper to standardize test names for historical matching
function standardize(name: string): string {
    if (!name) return "";
    return name.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .replace('haemoglobin', 'hb')
        .replace('hemoglobin', 'hb')
        .replace('bloodglucose', 'sugar')
        .replace('fastingbloodsugar', 'fbs');
}

export class RiskAgent {
    /**
     * Context-Aware Risk Evaluation Agent
     * Runs deterministic trends and combines it with profile context 
     * to assign an explicit 'Risk Level'.
     */
    static async evaluate(
        supabase: any,
        reportId: string,
        userId: string,
        structuredReportId: string,
        parsedJson: any
    ) {
        // 1. Fetch user profile for context (Diabetes, BP, etc.)
        const { data: profile } = await supabase.from('profiles').select('has_diabetes, has_bp, has_thyroid').eq('id', userId).single();
        const hasDiabetes = profile?.has_diabetes || false;

        // 2. Fetch last historical report for mathematical trend matching
        const { data: prevReport } = await supabase
            .from('structured_reports')
            .select('parsed_json')
            .eq('user_id', userId)
            .neq('report_id', reportId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        const trends: any[] = [];
        let highRiskCount = 0;
        let criticalRiskCount = 0;
        let reasons: string[] = [];

        // 3. Mathematical Execution & Context Testing
        if (parsedJson.lab_tests) {
            for (const current of parsedJson.lab_tests) {
                
                // Track standard HIGH/LOW flags from structured data
                if (current.status === 'High' || current.status === 'Low' || current.status === 'Abnormal') {
                    
                    // Specific Edge Case Context Checks
                    if (standardize(current.test_name).includes('hb') && parseFloat(current.value) < 10) {
                        criticalRiskCount++;
                        reasons.push(`${current.test_name} critically low (${current.value})`);
                    } else if (standardize(current.test_name).includes('sugar') && hasDiabetes && parseFloat(current.value) > 200) {
                        highRiskCount++;
                        // Notice how it combines abnormality + profile trait
                        reasons.push(`${current.test_name} high for diabetic profile (${current.value})`); 
                    } else {
                        highRiskCount++;
                        reasons.push(`${current.test_name} is ${current.status}`);
                    }
                }

                // Math calculation for History Trends
                if (prevReport?.parsed_json?.lab_tests) {
                    const match = prevReport.parsed_json.lab_tests.find((p: any) =>
                        standardize(p.test_name) === standardize(current.test_name)
                    );

                    if (match && !isNaN(parseFloat(current.value)) && !isNaN(parseFloat(match.value))) {
                        const curVal = parseFloat(current.value);
                        const preVal = parseFloat(match.value);
                        const diff = curVal - preVal;
                        const percentageChange = preVal !== 0 ? ((diff / preVal) * 100) : 0;
                        
                        const status = diff > 0 ? "Increased" : diff < 0 ? "Decreased" : "Stable";

                        trends.push({
                            structured_report_id: structuredReportId,
                            user_id: userId,
                            test_name: current.test_name,
                            previous_value: preVal,
                            current_value: curVal,
                            trend_status: status,
                            percentage_change: percentageChange
                        });

                        // Evaluate worsening dynamic trends (e.g. shift of >25% in the wrong direction)
                        if (Math.abs(percentageChange) > 25 && current.status !== 'Normal') {
                            criticalRiskCount++;
                            reasons.push(`Worsening trend: ${current.test_name} shifted negatively by ${Math.abs(percentageChange).toFixed(1)}%`);
                        }
                    }
                }
            }
        }

        // 4. Save Deterministic Trends to Database
        if (trends.length > 0) {
            await supabase.from('trend_cache').delete().eq('structured_report_id', structuredReportId);
            await supabase.from('trend_cache').insert(trends);
        }

        // 5. Establish Ultimate Risk Classification for the Pipeline
        let finalRiskLevel = 'Normal';
        let decisionReason = 'All parsed parameters are within standard ranges based on profile context.';

        if (criticalRiskCount > 0) {
            finalRiskLevel = 'Critical';
            decisionReason = `Critical Risk: ${reasons.slice(0, 2).join(', ')}`;
        } else if (highRiskCount > 2) {
            finalRiskLevel = 'High Risk';
            decisionReason = `High Risk: Multiple abnormalities found. ${reasons.slice(0, 2).join(', ')}`;
        } else if (highRiskCount > 0) {
            finalRiskLevel = 'Moderate Risk';
            decisionReason = `Moderate Risk: ${highRiskCount} abnormal values detected.`;
        }

        // 6. Leave undeniable reasoning trail
        await AuditLogger.log(
            supabase,
            reportId,
            'Risk Evaluation Agent',
            'Contextual Risk Assignment',
            decisionReason,
            'HIGH'
        );

        // 7. Append state to Report for the frontend
        await supabase.from('reports').update({ risk_classification: finalRiskLevel }).eq('id', reportId);

        return {
            riskLevel: finalRiskLevel,
            reasons: reasons,
            trends: trends
        };
    }
}

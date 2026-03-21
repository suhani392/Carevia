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
        const { data: profile } = await supabase.from('profiles').select('full_name, has_diabetes, has_bp, has_thyroid').eq('id', userId).single();
        const hasDiabetes = profile?.has_diabetes || false;
        const userFullName = (profile?.full_name || "").toLowerCase().trim();
        const currentPatientName = (parsedJson.patient_info?.name || "").toLowerCase().trim();

        // 2. Determine if we should even look for trends
        const isSelfAnalysis = currentPatientName && 
                               (currentPatientName.includes(userFullName) || 
                                userFullName.includes(currentPatientName) || 
                                currentPatientName.includes(userFullName.split(' ')[0]));

        let prevReport = null;
        let matchtype = "none";

        // Step A: Attempt strict identity match first
        if (isSelfAnalysis) {
            const { data: latestNamed } = await supabase
                .from('structured_reports')
                .select('parsed_json, report_date, patient_name')
                .eq('user_id', userId)
                .neq('report_id', reportId)
                .ilike('patient_name', `%${userFullName.split(/\s+/)[0]}%`)
                .order('report_date', { ascending: false, nullsFirst: false })
                .limit(1)
                .maybeSingle();
            
            if (latestNamed) {
                prevReport = latestNamed;
                matchtype = "identity_match";
            }
        }

        // Step B: Resilient Fallback (If no name match, find ANY most recent report for this user)
        if (!prevReport) {
            const { data: lastAny } = await supabase
                .from('structured_reports')
                .select('parsed_json, report_date, patient_name')
                .eq('user_id', userId)
                .neq('report_id', reportId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            
            if (lastAny) {
                prevReport = lastAny;
                matchtype = "account_match";
            }
        }

        // Step B: Resilient Fallback (If no name match, find ANY most recent report for this user)
        if (!prevReport) {
            const { data: lastAny } = await supabase
                .from('structured_reports')
                .select('parsed_json, report_date, patient_name')
                .eq('user_id', userId)
                .neq('report_id', reportId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            
            if (lastAny) {
                prevReport = lastAny;
                matchtype = "account_match";
            }
        }

        const currentReportDate = parsedJson.patient_info?.report_date || new Date().toISOString().split('T')[0];
        const prevReportDate = prevReport?.report_date || null;
        const linkedName = prevReport?.patient_name || "Historical Record";
        let comparisonContext = "";

        if (prevReport) {
            const auditMsg = matchtype === "identity_match" 
                ? `Linking trends with historical record "${linkedName}" (${prevReportDate || 'No date'}).`
                : `Resilient lookup: Linking with account record "${linkedName}" (${prevReportDate || 'No date'}).`;
            
            await AuditLogger.log(supabase, reportId, 'Risk Evaluation Agent', 'History Linkage', auditMsg, 'HIGH');
        } else {
            // Warm welcome for first-time scans
            await AuditLogger.log(supabase, reportId, 'Risk Evaluation Agent', 'History Linkage', 
                `This is your first health record in Carevia—now we can track your future trends!`, 'MEDIUM');
        }

        if (prevReportDate) {
            const d1 = new Date(currentReportDate);
            const d2 = new Date(prevReportDate);
            const formattedCurrent = d1.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            const formattedPrev = d2.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

            if (currentReportDate > prevReportDate) {
                comparisonContext = `Comparison with your previous record from ${formattedPrev}. This is your latest report.`;
            } else if (currentReportDate < prevReportDate) {
                comparisonContext = `This report is from ${formattedCurrent}, which is OLDER than your existing record from ${formattedPrev}. Comparing backwards.`;
            } else {
                comparisonContext = `Found another report from the same date (${formattedCurrent}). Comparing results.`;
            }
        }

        const trends: any[] = [];
        let highRiskCount = 0;
        let criticalRiskCount = 0;
        let reasons: string[] = [];

        // Identity logging for debugging
        if (isSelfAnalysis) {
            await AuditLogger.log(supabase, reportId, 'Risk Evaluation Agent', 'Identity Verification', `Identity match: ${currentPatientName}. Searching history...`, 'HIGH');
        } else {
            await AuditLogger.log(supabase, reportId, 'Risk Evaluation Agent', 'Identity Verification', `No direct identity match between ${currentPatientName} and ${userFullName}. Skipping Trends.`, 'MEDIUM');
        }

        // 3. Mathematical Execution & Context Testing
        if (parsedJson.lab_tests) {
            for (const current of parsedJson.lab_tests) {
                // Robust value parsing (strip non-numeric except decimal)
                const currentStr = String(current.value || "").replace(/[^0-9.]/g, '');
                const curVal = parseFloat(currentStr);

                // Track standard HIGH/LOW flags from structured data
                if (current.status === 'High' || current.status === 'Low' || current.status === 'Abnormal') {
                    if (standardize(current.test_name).includes('hb') && curVal < 10) {
                        criticalRiskCount++;
                        reasons.push(`${current.test_name} critically low (${current.value})`);
                    } else if (standardize(current.test_name).includes('sugar') && hasDiabetes && curVal > 200) {
                        highRiskCount++;
                        reasons.push(`${current.test_name} high for diabetic profile (${current.value})`); 
                    } else {
                        highRiskCount++;
                        reasons.push(`${current.test_name} is ${current.status}`);
                    }
                }

                // Math calculation for History Trends
                if (prevReport?.parsed_json?.lab_tests) {
                    const match = prevReport.parsed_json.lab_tests.find((p: any) => {
                        const s1 = standardize(p.test_name);
                        const s2 = standardize(current.test_name);
                        return s1 === s2 || s1.includes(s2) || s2.includes(s1);
                    });

                    if (match) {
                        const prevStr = String(match.value || "").replace(/[^0-9.]/g, '');
                        const preVal = parseFloat(prevStr);

                        if (!isNaN(curVal) && !isNaN(preVal)) {
                            // CHRONOLOGICAL MATH: Always Source (Earlier) -> Target (Later)
                            let sourceVal = preVal;
                            let targetVal = curVal;
                            let sourceDate = prevReportDate;
                            let targetDate = currentReportDate;

                            if (prevReportDate && currentReportDate < prevReportDate) {
                                // Swap because current scan is actually OLDER than the one in DB
                                sourceVal = curVal;
                                targetVal = preVal;
                                sourceDate = currentReportDate;
                                targetDate = prevReportDate;
                            }

                            const diff = targetVal - sourceVal;
                            const percentageChange = sourceVal !== 0 ? ((diff / sourceVal) * 100) : 0;
                            const status = diff > 0 ? "Increased" : diff < 0 ? "Decreased" : "Stable";

                            trends.push({
                                test_name: current.test_name,
                                source_value: sourceVal,
                                target_value: targetVal,
                                source_date: sourceDate,
                                target_date: targetDate,
                                trend_status: status,
                                percentage_change: percentageChange
                            });

                            if (Math.abs(percentageChange) > 25 && current.status !== 'Normal') {
                                criticalRiskCount++;
                                reasons.push(`Worsening trend: ${current.test_name} shifted negatively by ${Math.abs(percentageChange).toFixed(1)}%`);
                            }
                        }
                    }
                }
            }
        }

        // 4. Save Deterministic Trends directly into the structured_report record
        if (trends.length > 0 || comparisonContext) {
            await supabase.from('structured_reports').update({ 
                trends_json: trends,
                comparison_context: comparisonContext
            }).eq('id', structuredReportId);
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
        let logMsg = decisionReason;
        if (prevReport) {
            logMsg += ` (Historical data found. ${trends.length} test markers matched for trends.)`;
        } else {
            logMsg += ` (No prior comparison data found for this name match.)`;
        }

        await AuditLogger.log(
            supabase,
            reportId,
            'Risk Evaluation Agent',
            'Contextual Risk Assignment',
            logMsg,
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

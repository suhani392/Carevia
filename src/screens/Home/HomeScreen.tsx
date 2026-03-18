import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, Image, Pressable, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Line, Circle, Text as SvgText, G } from 'react-native-svg';

const { width } = Dimensions.get('window');
import { LinearGradient } from 'expo-linear-gradient';
import HomeHeader from './HomeHeader';
import { ReportIcon, BotIcon } from './Icons';
import AppStatusBar from '../../components/status-bar/status-bar';
import Menu from '../../components/navigation/menu-drawer/menu';
import { useNavigation } from '../../context/NavigationContext';
import { useAppContext } from '../../context/AppContext';
import { getAvatarSource } from '../../lib/avatars';
import { supabase } from '../../lib/supabase';

const HomeScreen = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { navigate } = useNavigation();
    const { updates, alerts, userProfile, familyMembers, refreshData, t, colors, themeMode } = useAppContext();
    const [refreshing, setRefreshing] = useState(false);
    const [isUpdatesExpanded, setIsUpdatesExpanded] = useState(false);
    const [isAlertsExpanded, setIsAlertsExpanded] = useState(false);
    const [trendGraphData, setTrendGraphData] = useState<{ dates: string[], lines: { name: string, color: string, points: (number | null)[] }[] } | null>(null);

    const loadTrends = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: userReports } = await supabase
                .from('reports')
                .select('id, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });

            if (!userReports || userReports.length < 2) return;

            const { data: structs } = await supabase
                .from('structured_reports')
                .select('report_id, parsed_json')
                .in('report_id', userReports.map(r => r.id));

            if (!structs || structs.length === 0) return;

            let validReports = userReports.filter(r => structs.some(s => s.report_id === r.id));
            if (validReports.length > 4) validReports = validReports.slice(-4); // Keep only last 4 reports

            const dates = validReports.map(r => new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }));
            const biomarkerMap: { [key: string]: { [reportId: string]: number } } = {};

            validReports.forEach(report => {
                const struct = structs.find(s => s.report_id === report.id);
                if (struct?.parsed_json?.lab_tests) {
                    (struct.parsed_json.lab_tests || []).forEach((b: any) => {
                        if (!b.test_name) return;
                        const bName = b.test_name.toLowerCase().trim();
                        if (!biomarkerMap[bName]) biomarkerMap[bName] = {};

                        let yVal = 0;
                        const stat = (b.status || 'Normal').toLowerCase();
                        if (stat.includes('borderline') || stat.includes('moderate') || stat.includes('warning')) yVal = 1;
                        else if (stat.includes('high') || stat.includes('low') || stat.includes('critical') || stat.includes('danger') || stat.includes('abnormal')) yVal = 2;

                        biomarkerMap[bName][report.id] = yVal;
                    });
                }
            });

            const validTerms = Object.keys(biomarkerMap).filter(k => Object.keys(biomarkerMap[k]).length >= 2);
            const topTerms = validTerms.slice(0, 4);

            if (topTerms.length === 0) return;

            const colorsList = ['#FF4B4B', '#4ADE80', '#0062FF', '#FFB020'];

            const lines = topTerms.map((term, idx) => {
                const points = validReports.map(r => {
                    const val = biomarkerMap[term][r.id];
                    return val !== undefined ? val : null;
                });
                return { name: term.toUpperCase(), color: colorsList[idx % colorsList.length], points };
            });

            setTrendGraphData({ dates, lines });

        } catch (e) {
            console.error("Trend err:", e);
        }
    };

    useEffect(() => {
        loadTrends();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshData();
        setRefreshing(false);
    };

    const handleAlertPress = async (alert: any, subjectName: string) => {
        if (!alert.report_id) return;
        try {
            const { data: report, error } = await supabase.from('reports').select('uri, name').eq('id', alert.report_id).single();
            if (error) throw error;
            if (report && report.uri) {
                const pathParts = report.uri.split('/reports/');
                const filePath = pathParts[pathParts.length - 1];
                const { data: signData } = await supabase.storage.from('reports').createSignedUrl(filePath, 3600);

                navigate('document_view', {
                    docName: report.name,
                    ownerName: subjectName === t('you') ? userProfile?.full_name || 'Me' : subjectName,
                    docUri: signData?.signedUrl || report.uri,
                    reportId: alert.report_id
                });
            }
        } catch (error) {
            console.error('Error fetching report for alert:', error);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <AppStatusBar />
            {isMenuOpen && <Menu onClose={() => setIsMenuOpen(false)} />}

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                <HomeHeader onMenuPress={() => setIsMenuOpen(true)} />

                {/* Emergency Access Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('emergency_access')}</Text>
                    <View style={styles.emergencyRow}>

                        <Pressable
                            style={styles.modernLargeCard}
                            onPress={() => navigate('documents')}
                        >
                            <LinearGradient
                                colors={themeMode === 'dark' ? ['#1A2A47', '#001A4D'] : ['#E6F0FF', '#C7DFFF']}
                                style={styles.cardGradient}
                            >
                                <Text style={[styles.modernCardTitle, { color: themeMode === 'dark' ? '#8AB4FF' : '#0047BA' }]}>{t('documents')}</Text>

                                <View style={[styles.modernDocIconContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                                    <Image
                                        source={require('../../assets/icons/home/documents.png')}
                                        style={styles.modernDocIcon}
                                        resizeMode="contain"
                                    />
                                </View>
                            </LinearGradient>
                        </Pressable>
                        <View style={styles.modernSmallCardColumn}>
                            <Pressable
                                style={styles.modernSmallCard}
                                onPress={() => navigate('reports')}
                            >
                                <LinearGradient
                                    colors={themeMode === 'dark' ? ['#1A1A1A', '#2A2A2A'] : ['#F0F7FF', '#D8E9FF']}
                                    style={styles.cardGradientSmall}
                                >
                                    <View style={[styles.modernIconContainer, { backgroundColor: colors.card }]}>
                                        <ReportIcon size={24} color={colors.primary} />
                                    </View>
                                    <Text style={[styles.modernSmallCardText, { color: themeMode === 'dark' ? '#8AB4FF' : '#0047BA' }]}>{t('reports')}</Text>

                                </LinearGradient>
                            </Pressable>
                            <Pressable
                                style={styles.modernSmallCard}
                                onPress={() => navigate('ai_assistant')}
                            >
                                <LinearGradient
                                    colors={themeMode === 'dark' ? ['#1A1A1A', '#2A2A2A'] : ['#F0F7FF', '#D8E9FF']}
                                    style={styles.cardGradientSmall}
                                >
                                    <View style={[styles.modernIconContainer, { backgroundColor: colors.card }]}>
                                        <BotIcon size={24} color={colors.primary} />
                                    </View>
                                    <Text style={[styles.modernSmallCardText, { color: themeMode === 'dark' ? '#8AB4FF' : '#0047BA' }]}>{t('ai_assistant')}</Text>

                                </LinearGradient>
                            </Pressable>
                        </View>
                    </View>
                </View>
                {/* Trend Analysis Section */}
                {trendGraphData && trendGraphData.dates.length > 0 && trendGraphData.lines.length > 0 && (
                    <View style={[styles.section, { marginTop: 40 }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('trend_analysis')}</Text>
                        <View style={[{ paddingVertical: 20, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3 }, { backgroundColor: colors.card }]}>
                            {(() => {
                                const GRAPH_HEIGHT = 160;
                                const GRAPH_WIDTH = width - 40; // Full container width
                                const PADDING_TOP = 20;
                                const PADDING_BOTTOM = 30;
                                const PADDING_LEFT = 65;
                                const PADDING_RIGHT = 45;
                                const Y_MAX = 2;

                                const innerWidth = GRAPH_WIDTH - PADDING_LEFT - PADDING_RIGHT;
                                const innerHeight = GRAPH_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

                                const getY = (val: number, lineIndex: number) => {
                                    const base = PADDING_TOP + innerHeight - (val / Y_MAX) * innerHeight;
                                    // Slight offset to prevent identical values from fully overlapping
                                    const spread = (lineIndex - (trendGraphData.lines.length / 2)) * 3;
                                    return base + spread;
                                };
                                const getX = (index: number) => PADDING_LEFT + (index / Math.max(1, trendGraphData.dates.length - 1)) * innerWidth;

                                return (
                                    <View>
                                        <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT}>
                                            {/* Y Axis Grid Lines */}
                                            <Line x1={PADDING_LEFT} y1={getY(2, 0)} x2={GRAPH_WIDTH - PADDING_RIGHT} y2={getY(2, 0)} stroke={themeMode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'} strokeWidth="1" strokeDasharray="4 4" />
                                            <Line x1={PADDING_LEFT} y1={getY(1, 0)} x2={GRAPH_WIDTH - PADDING_RIGHT} y2={getY(1, 0)} stroke={themeMode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'} strokeWidth="1" strokeDasharray="4 4" />
                                            <Line x1={PADDING_LEFT} y1={getY(0, 0)} x2={GRAPH_WIDTH - PADDING_RIGHT} y2={getY(0, 0)} stroke={themeMode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'} strokeWidth="1" strokeDasharray="4 4" />

                                            {/* Y Axis Labels */}
                                            <SvgText x={PADDING_LEFT - 10} y={getY(2, 0)} fill={colors.textSecondary} fontSize="10" textAnchor="end" alignmentBaseline="middle">Critical</SvgText>
                                            <SvgText x={PADDING_LEFT - 10} y={getY(1, 0)} fill={colors.textSecondary} fontSize="10" textAnchor="end" alignmentBaseline="middle">Moderate</SvgText>
                                            <SvgText x={PADDING_LEFT - 10} y={getY(0, 0)} fill={colors.textSecondary} fontSize="10" textAnchor="end" alignmentBaseline="middle">Normal</SvgText>

                                            {/* X Axis Labels */}
                                            {trendGraphData.dates.map((d: string, i: number) => (
                                                <SvgText key={`x-${i}`} x={getX(i)} y={GRAPH_HEIGHT - 10} fill={colors.textSecondary} fontSize="10" textAnchor="middle">{d}</SvgText>
                                            ))}

                                            {/* Lines & Points */}
                                            {trendGraphData.lines.map((line: any, lIdx: number) => {
                                                let validPoints = line.points.map((p: any, i: number) => p !== null ? { x: getX(i), y: getY(p, lIdx) } : null);
                                                return (
                                                    <G key={`line-${lIdx}`}>
                                                        {validPoints.map((pt: any, i: number) => {
                                                            if (!pt) return null;
                                                            const nextPt = validPoints.slice(i + 1).find((p: any) => p !== null);
                                                            if (nextPt) {
                                                                return <Line key={`l-${i}`} x1={pt.x} y1={pt.y} x2={nextPt.x} y2={nextPt.y} stroke={line.color} strokeWidth="2" />;
                                                            }
                                                            return null;
                                                        })}
                                                        {validPoints.map((pt: any, i: number) => {
                                                            if (!pt) return null;
                                                            return <Circle key={`c-${i}`} cx={pt.x} cy={pt.y} r="4" fill={line.color} />;
                                                        })}
                                                    </G>
                                                );
                                            })}
                                        </Svg>

                                        {/* Legend */}
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 15, paddingHorizontal: 15, justifyContent: 'center' }}>
                                            {trendGraphData.lines.map((line: any, idx: number) => (
                                                <View key={`legend-${idx}`} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15, marginBottom: 5 }}>
                                                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: line.color, marginRight: 5 }} />
                                                    <Text style={{ color: colors.text, fontSize: 12, fontFamily: 'Judson-Bold' }}>{line.name}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                );
                            })()}
                        </View>
                    </View>
                )}

                {/* Health Alerts Section */}
                {alerts && alerts.length > 0 && (
                    <View style={[styles.section, { marginTop: 40 }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('health_alerts')}</Text>
                        <>
                            {(isAlertsExpanded ? alerts : alerts.slice(0, 3)).map((alert) => {
                                let alertName = "Someone";
                                let alertPhoto = null;
                                const subjectId = alert.target_user_id || alert.user_id;

                                if (userProfile?.id === subjectId) {
                                    alertName = t('you');
                                    alertPhoto = userProfile.photo_url;
                                } else {
                                    const member = familyMembers.find(m => m.id === subjectId);
                                    if (member) {
                                        alertName = member.name.split(' ')[0]; // Extract first name for better UI
                                        alertPhoto = member.image;
                                    }
                                }

                                // Heading: "Critical Alert for Sahil" or "High Risk Alert for You"
                                const alertType = alert.risk_level === 'High Risk' ? 'High Risk' : (alert.risk_level || 'Health');
                                const alertHeading = `${alertType} Alert for ${alertName}`;

                                return (
                                    <TouchableOpacity
                                        key={alert.id}
                                        style={[styles.familyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                                        onPress={() => handleAlertPress(alert, alertName)}
                                    >
                                        <View style={styles.updateInfoRow}>
                                            {alertPhoto && getAvatarSource(alertPhoto) ? (
                                                <Image source={getAvatarSource(alertPhoto)} style={styles.updateAvatar} />
                                            ) : (
                                                <View style={[styles.updateAvatar, styles.updateAvatarPlaceholder, { backgroundColor: colors.primaryLight, borderColor: colors.cardBorder }]}>
                                                    <Text style={[styles.updateAvatarPlaceholderText, { color: colors.primary }]}>
                                                        {(alertName === t('you') ? 'Y' : (alertName || 'A').charAt(0)).toUpperCase()}
                                                    </Text>
                                                </View>
                                            )}
                                            <View style={styles.updateMeta}>
                                                <Text style={[styles.updateName, { color: colors.text }]}>{alertHeading}</Text>
                                                <Text style={[styles.updateText, { color: colors.textSecondary }]}>{alert.action_message || `New alert received.`}</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                            {alerts.length > 3 && (
                                <Pressable
                                    style={[styles.readMoreButton, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                                    onPress={() => setIsAlertsExpanded(!isAlertsExpanded)}
                                >
                                    <Text style={[styles.readMoreText, { color: colors.primary }]}>
                                        {isAlertsExpanded ? t('show_less') : t('read_more')}
                                    </Text>
                                </Pressable>
                            )}
                        </>
                    </View>
                )}

                {/* Family Updates Section */}
                <View style={[styles.section, { marginTop: 40 }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('family_updates')}</Text>

                    {updates.length > 0 ? (
                        <>
                            {(isUpdatesExpanded ? updates : updates.slice(0, 4)).map((update, index) => {
                                // Resolve sender's photo and name locally
                                let senderPhoto = update.photo_url;
                                let senderName = update.name;

                                if (userProfile?.id === update.user_id) {
                                    senderPhoto = userProfile.photo_url;
                                    senderName = t('you');
                                } else {
                                    const member = familyMembers.find(m => m.id === update.user_id);
                                    if (member) {
                                        senderPhoto = member.image;
                                        senderName = member.name;
                                    }
                                }

                                return (
                                    <View key={update.id} style={[styles.familyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                                        <View style={styles.updateInfoRow}>
                                            {senderPhoto && getAvatarSource(senderPhoto) ? (
                                                <Image
                                                    source={getAvatarSource(senderPhoto)}
                                                    style={styles.updateAvatar}
                                                />
                                            ) : (
                                                <View style={[styles.updateAvatar, styles.updateAvatarPlaceholder, { backgroundColor: colors.primaryLight, borderColor: colors.cardBorder }]}>
                                                    <Text style={[styles.updateAvatarPlaceholderText, { color: colors.primary }]}>
                                                        {(senderName || 'U').charAt(0).toUpperCase()}
                                                    </Text>
                                                </View>
                                            )}

                                            <View style={styles.updateMeta}>
                                                <Text style={[styles.updateName, { color: colors.text }]}>
                                                    {senderName}
                                                </Text>
                                                <Text style={[styles.updateText, { color: colors.textSecondary }]}>{update.text}</Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                            {updates.length > 4 && (
                                <Pressable
                                    style={[styles.readMoreButton, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                                    onPress={() => setIsUpdatesExpanded(!isUpdatesExpanded)}
                                >
                                    <Text style={[styles.readMoreText, { color: colors.primary }]}>
                                        {isUpdatesExpanded ? t('show_less') : t('read_more')}
                                    </Text>

                                </Pressable>
                            )}
                        </>
                    ) : (

                        <View style={[styles.emptyUpdatesCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                            <Text style={[styles.emptyUpdatesText, { color: colors.textSecondary }]}>{t('no_updates')}</Text>
                        </View>
                    )}
                </View>


                <View style={{ height: 120 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    section: {
        paddingHorizontal: 25,
        marginTop: 30,
    },
    sectionTitle: {
        fontFamily: 'Judson-Bold',
        fontSize: 20,
        marginBottom: 15,
    },
    emergencyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modernLargeCard: {
        width: '48%',
        height: 220,
        borderRadius: 25,
        overflow: 'hidden',
        elevation: 5,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    cardGradient: {
        flex: 1,
        padding: 18,
        alignItems: 'center',
    },
    modernCardTitle: {
        fontFamily: 'Judson-Bold',
        fontSize: 18,
        marginBottom: 15,
    },
    modernDocIconContainer: {
        flex: 1,
        width: '100%',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    modernDocIcon: {
        width: '65%',
        height: '65%',
    },
    modernSmallCardColumn: {
        width: '48%',
        justifyContent: 'space-between',
    },
    modernSmallCard: {
        height: 105,
        borderRadius: 25,
        overflow: 'hidden',
        elevation: 4,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    cardGradientSmall: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    modernIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    modernSmallCardText: {
        fontFamily: 'Judson-Bold',
        fontSize: 15,
        marginLeft: 12,
        flex: 1,
        lineHeight: 18,
    },
    familyCard: {
        borderRadius: 20,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    updateInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    updateAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    updateAvatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    updateAvatarPlaceholderText: {
        fontFamily: 'Judson-Bold',
        fontSize: 18,
    },
    updateMeta: {
        flex: 1,
    },
    updateName: {
        fontFamily: 'Judson-Bold',
        fontSize: 17,
    },
    updateText: {
        fontFamily: 'Judson-Regular',
        fontSize: 14,
        lineHeight: 18,
        marginTop: 2,
    },
    emptyUpdatesCard: {
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    emptyUpdatesText: {
        fontFamily: 'Judson-Regular',
        fontSize: 15,
    },
    readMoreButton: {
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 15,
        borderWidth: 1,
        marginTop: 5,
    },
    readMoreText: {
        fontFamily: 'Judson-Bold',
        fontSize: 14,
    },
});



export default HomeScreen;

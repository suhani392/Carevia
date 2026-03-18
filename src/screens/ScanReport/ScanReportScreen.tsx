import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, TouchableOpacity, StatusBar, Image, Animated, Modal, TextInput, ScrollView, Alert, Platform } from 'react-native';
import Pdf from 'react-native-pdf';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import { BackIcon, FlashlightIcon, ScanFrameIcon, CrossIcon, DownloadIcon, BotIcon } from '../Home/Icons';
import { useNavigation } from '../../context/NavigationContext';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';

const { width, height } = Dimensions.get('window');

// Helper to convert base64 to ArrayBuffer
const decodeBase64 = (base64: string) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const lookup = new Uint8Array(256);
    for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;
    let bufferLength = base64.length * 0.75;
    let len = base64.length, i, p = 0;
    if (base64[base64.length - 1] === "=") {
        bufferLength--;
        if (base64[base64.length - 2] === "=") bufferLength--;
    }
    const arraybuffer = new ArrayBuffer(bufferLength);
    const bytes = new Uint8Array(arraybuffer);
    for (i = 0; i < len; i += 4) {
        let encoded1 = lookup[base64.charCodeAt(i)];
        let encoded2 = lookup[base64.charCodeAt(i + 1)];
        let encoded3 = lookup[base64.charCodeAt(i + 2)];
        let encoded4 = lookup[base64.charCodeAt(i + 3)];
        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }
    return arraybuffer;
};

const ScanReportScreen = () => {
    const { goBack, navigate, screenParams } = useNavigation();
    const { colors, themeMode, t, refreshData } = useAppContext();
    const [permission, requestPermission] = useCameraPermissions();
    const [torch, setTorch] = useState(false);
    const [capturedImages, setCapturedImages] = useState<string[]>([]);
    const [isAnalysisMode, setIsAnalysisMode] = useState(false);
    const [isPdf, setIsPdf] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [reportName, setReportName] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentReportId, setCurrentReportId] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [pollingStatus, setPollingStatus] = useState('');
    const [displayStatus, setDisplayStatus] = useState('');
    const lastStatusChange = useRef(Date.now());
    const [isSaved, setIsSaved] = useState(false);
    const [showAiThinkingModal, setShowAiThinkingModal] = useState(false);
    const [aiLogs, setAiLogs] = useState<any[]>([]);
    const cameraRef = useRef<CameraView>(null);
    const scrollY = useRef(new Animated.Value(0)).current;

    const subMessages: { [key: string]: string[] } = {
        'Reading your report...': [
            'Scanning medical terms...',
            'Extracting lab values...',
            'Processing report text...',
            'Detecting report sections...',
            'Reading doctor notes...',
            'Analyzing test parameters...',
            'Checking units and measurements...',
            'Interpreting medical abbreviations...',
            'Parsing diagnostic comments...',
            'Reviewing test identifiers...'
        ],
        'Organizing medical data...': [
            'Structuring data tables...',
            'Identifying reference ranges...',
            'Organizing clinical findings...',
            'Grouping related test results...',
            'Sorting abnormal values...',
            'Mapping parameters to categories...',
            'Aligning results with standard ranges...',
            'Preparing data for interpretation...',
            'Filtering important markers...',
            'Tagging critical observations...'
        ],
        'Carevia is writing insights...': [
            'Simplifying complex terms...',
            'Finalizing your analysis...',
            'Double-checking results...',
            'Highlighting key health indicators...',
            'Generating personalized insights...',
            'Comparing results with normal ranges...',
            'Preparing your health summary...',
            'Translating medical jargon...',
            'Building easy-to-read explanations...',
            'Completing your report insights...'
        ]
    };

    const handleViewAiThinking = async () => {
        if (!currentReportId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .eq('report_id', currentReportId)
                .order('created_at', { ascending: true });
            
            if (error) throw error;
            setAiLogs(data || []);
            setShowAiThinkingModal(true);
        } catch (err: any) {
            Alert.alert("Error", err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStartAnalysis = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Auth required");

            // 1. Upload logic
            const timestamp = new Date().toLocaleDateString();
            const defaultName = `Report Analysis - ${timestamp}`;
            const extension = isPdf ? 'pdf' : 'jpg';
            const mimeType = isPdf ? 'application/pdf' : 'image/jpeg';
            const fileName = `${Date.now()}.${extension}`;
            const filePath = `${user.id}/${fileName}`;
            const base64 = await FileSystem.readAsStringAsync(capturedImages[0], { encoding: 'base64' });
            const arrayBuffer = decodeBase64(base64);

            await supabase.storage.from('reports').upload(filePath, arrayBuffer, { contentType: mimeType });
            const { data: { publicUrl } } = supabase.storage.from('reports').getPublicUrl(filePath);

            // 2. Create initial record
            const { data: reportData, error: insErr } = await supabase.from('reports').insert({
                user_id: user.id,
                name: defaultName,
                uri: publicUrl,
                analysis: "Preparing report...",
                is_saved: false
            }).select('id').single();

            if (insErr) throw insErr;

            if (reportData) {
                const reportId = reportData.id;
                setCurrentReportId(reportId);
                setPollingStatus("Preparing report...");
                setIsAnalyzing(true);

                // 3. Trigger AI Chain (non-blocking)
                console.log("[Invoke] Starting process-report for:", reportId);

                // Get the anon key from our config to send explicitly
                const anonKey = supabase['supabaseKey'];

                supabase.functions.invoke('process-report', {
                    body: { report_id: reportId },
                    headers: {
                        'apikey': anonKey,
                        'Authorization': `Bearer ${anonKey}`
                    }
                })
                    .then(({ data, error: invErr }) => {
                        console.log("[Invoke] Raw Response:", JSON.stringify({ data, error: invErr }));

                        if (invErr) {
                            console.error("[Invoke] Error Object:", invErr);
                            setIsAnalyzing(false);
                            setLoading(false);

                            let userMessage = "The AI server encountered an issue.";
                            if (invErr.message?.includes("non-2xx")) {
                                userMessage = "Cloud function crashed (500). Please check Supabase logs.";
                            }

                            Alert.alert("Analysis Failed", userMessage);
                            return;
                        }

                        if (data && data.error) {
                            setIsAnalyzing(false);
                            setLoading(false);
                            const isQuota = data.error.toLowerCase().includes("quota") || data.error.toLowerCase().includes("limit");
                            Alert.alert(
                                "AI Limit Reached",
                                isQuota
                                    ? "You've used your free AI scans for the moment. Please wait 1 minute and try again."
                                    : data.error
                            );
                            return;
                        }

                        console.log("[Invoke] Success!");
                    })
                    .catch(e => {
                        console.error("[Invoke] Critical Catch:", e);
                        setIsAnalyzing(false);
                        setLoading(false);
                        Alert.alert("Fatal Error", "Check your internet and Supabase project status.");
                    });
            }
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    // Track triggered stages to prevent double-triggering
    const stageTriggered = useRef<{ [key: string]: boolean }>({});

    useEffect(() => {
        let interval: any;
        if (isAnalyzing && currentReportId) {
            console.log("[Status] Starting polling for report:", currentReportId);
            interval = setInterval(async () => {
                try {
                    const { data, error } = await supabase
                        .from('reports')
                        .select('analysis')
                        .eq('id', currentReportId)
                        .single();

                    if (data?.analysis) {
                        const isNewStage = data.analysis !== pollingStatus;

                        if (isNewStage) {
                            setPollingStatus(data.analysis);
                            setDisplayStatus(data.analysis);
                            lastStatusChange.current = Date.now();
                            console.log("[Status] New Stage:", data.analysis);
                        } else {
                            // If status is same for > 3 seconds (1 poll), show a sub-message
                            const timePassed = Date.now() - lastStatusChange.current;
                            if (timePassed >= 3000) {
                                const msgs = subMessages[data.analysis] || [];
                                if (msgs.length > 0) {
                                    // Rotate sub-messages every poll (3s)
                                    const index = Math.floor(timePassed / 3000) % (msgs.length + 1);

                                    // Index 0 is original, others are sub-messages
                                    const nextStatus = index === 0 ? data.analysis : msgs[index - 1];
                                    if (nextStatus !== displayStatus) {
                                        setDisplayStatus(nextStatus);
                                        console.log("[Status] Update:", nextStatus);
                                    }
                                }
                            }
                        }

                        const anonKey = (supabase as any).supabaseKey;

                        // 1. If OCR is done, trigger Structuring
                        if (data.analysis === 'Organizing medical data...' && !stageTriggered.current['structuring']) {
                            stageTriggered.current['structuring'] = true;
                            console.log("[Orchestrator] Triggering Structuring...");
                            supabase.functions.invoke('process-report', {
                                body: { report_id: currentReportId, stage: 'structuring' },
                                headers: {
                                    'apikey': anonKey,
                                    'Authorization': `Bearer ${anonKey}`
                                }
                            });
                        }

                        // 2. If Structuring is done, trigger Explanation
                        if (data.analysis === 'Carevia is writing insights...' && !stageTriggered.current['explanation']) {
                            stageTriggered.current['explanation'] = true;
                            console.log("[Orchestrator] Triggering Explanation...");
                            supabase.functions.invoke('process-report', {
                                body: { report_id: currentReportId, stage: 'explanation' },
                                headers: {
                                    'apikey': anonKey,
                                    'Authorization': `Bearer ${anonKey}`
                                }
                            });
                        }

                        if (data?.analysis?.includes("ready") || data?.analysis?.includes("Insights")) {
                            // Special check: Only finish if we actually HAVE the explanation in the DB
                            const { data: structData } = await supabase
                                .from('structured_reports')
                                .select('explanation_json')
                                .eq('report_id', currentReportId)
                                .maybeSingle();

                            if (structData?.explanation_json) {
                                console.log("[Status] Explanation found! Loading UI.");
                                setAnalysisResult(structData.explanation_json);
                                setIsAnalyzing(false);
                                clearInterval(interval);
                            }
                        } else if (data?.analysis?.toLowerCase().includes("error")) {
                            console.error("[Status] Analysis failed:", data.analysis);
                            setIsAnalyzing(false);
                            clearInterval(interval);
                            Alert.alert("Analysis Failed", data.analysis || "An unexpected error occurred during processing.");
                        }
                    }
                } catch (err) {
                    console.error("[Polling] Error:", err);
                }
            }, 3000);
        }
        return () => {
            clearInterval(interval);
            // Reset triggers when component unmounts or analysis stops
            if (!isAnalyzing) stageTriggered.current = {};
        };
    }, [isAnalyzing, currentReportId, pollingStatus, displayStatus]);

    useEffect(() => {
        if (!permission) requestPermission();
    }, [permission]);

    useEffect(() => {
        if (screenParams?.uploadedAssets && screenParams.uploadedAssets.length > 0) {
            setCapturedImages(screenParams.uploadedAssets.map((a: any) => a.uri));
            setIsPdf(screenParams.uploadedAssets[0].fileType === 'application/pdf');
            setIsAnalysisMode(true);
        }
    }, [screenParams]);

    const handleCapture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
                if (photo) {
                    const manipulatedImage = await ImageManipulator.manipulateAsync(
                        photo.uri,
                        [{ crop: { originX: photo.width * 0.06, originY: 0, width: photo.width * 0.88, height: Math.min(photo.height, photo.width * 1.4) } }],
                        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
                    );
                    setCapturedImages(prev => [...prev, manipulatedImage.uri]);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
            } catch (error) {
                console.error("Capture failed:", error);
            }
        }
    };

    if (!permission) return <View style={styles.container} />;
    if (!permission.granted) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: colors.text, marginBottom: 20 }}>{t('permission_camera')}</Text>
                <TouchableOpacity onPress={requestPermission} style={{ backgroundColor: colors.primary, padding: 15, borderRadius: 10 }}>
                    <Text style={{ color: '#FFF' }}>{t('grant_permission')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (isAnalysisMode && capturedImages.length > 0) {
        return (
            <View style={[styles.analysisContainer, { backgroundColor: colors.background }]}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                <Animated.View style={[styles.stickyHeader, { height: Platform.OS === 'ios' ? 140 : 120, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: '#0062FF' }]}>
                    <View style={styles.analysisTopIcons}>
                        <Pressable style={styles.analysisIconBlock} onPress={() => setIsAnalysisMode(false)}><BackIcon size={24} color="#FFFFFF" /></Pressable>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={styles.analysisTitle}>{t('report_analysis')}</Text>
                        </View>
                        <Pressable style={styles.analysisIconBlock} onPress={goBack}><CrossIcon size={24} color="#FFFFFF" /></Pressable>
                    </View>
                </Animated.View>

                <Animated.ScrollView
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
                    scrollEventThrottle={16}
                    showsVerticalScrollIndicator={false}
                >
                    <LinearGradient colors={colors.headerGradient as any} style={styles.analysisImageWrapper}>
                        {isPdf ? (
                            <View style={styles.capturedImageContainer}><Pdf source={{ uri: capturedImages[0] }} style={styles.pdfView} /></View>
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={width * 0.72} decelerationRate="fast" contentContainerStyle={styles.multiImageScroll}>
                                {capturedImages.map((uri, index) => (
                                    <View key={index} style={styles.capturedImageContainer}>
                                        <Image source={{ uri }} style={styles.capturedImage} resizeMode="cover" />
                                        <View style={styles.pageIndicator}><Text style={styles.pageIndicatorText}>{index + 1} / {capturedImages.length}</Text></View>
                                    </View>
                                ))}
                            </ScrollView>
                        )}
                    </LinearGradient>

                    <View style={styles.analysisContent}>
                        {isAnalyzing ? (
                            <View style={styles.loadingContainer}>
                                <Text style={[styles.loadingText, { color: colors.text }]}>AI is analyzing your report...</Text>
                                <Text style={[styles.pollingSubtext, { color: colors.primary, marginBottom: 15 }]}>{displayStatus || pollingStatus || "Preparing report..."}</Text>
                                <Text style={[styles.loadingSubtext, { color: colors.textSecondary }]}>This usually takes 20-30 seconds.</Text>
                            </View>
                        ) : analysisResult ? (
                            <>
                                <View style={styles.contentSection}>
                                    <Text style={[styles.sectionHeading, { color: colors.primary }]}>Your Report Analysis</Text>
                                    {(() => {
                                        // Fallback calculation if summary_counts is missing from old reports
                                        const counts = analysisResult?.summary_counts || {
                                            normal: (analysisResult?.explanations || []).filter((e: any) => e.heading?.toLowerCase().includes('normal')).length,
                                            borderline: (analysisResult?.explanations || []).filter((e: any) => e.heading?.toLowerCase().includes('borderline')).length,
                                            abnormal: (analysisResult?.explanations || []).filter((e: any) =>
                                                e.heading?.toLowerCase().includes('high') ||
                                                e.heading?.toLowerCase().includes('low') ||
                                                e.heading?.toLowerCase().includes('abnormal')
                                            ).length
                                        };

                                        return (
                                            <View style={styles.summaryCard}>
                                                <View style={styles.summaryItem}>
                                                    <Text style={[styles.summaryCount, { color: colors.success }]}>{counts.normal}</Text>
                                                    <Text style={styles.summaryLabel}>Normal</Text>
                                                </View>
                                                <View style={styles.summaryItem}>
                                                    <Text style={[styles.summaryCount, { color: colors.warning }]}>{counts.borderline}</Text>
                                                    <Text style={styles.summaryLabel}>Borderline</Text>
                                                </View>
                                                <View style={styles.summaryItem}>
                                                    <Text style={[styles.summaryCount, { color: colors.error }]}>{counts.abnormal || (counts.high || 0) + (counts.low || 0) + (counts.abnormal || 0)}</Text>
                                                    <Text style={styles.summaryLabel}>Abnormal</Text>
                                                </View>
                                            </View>
                                        );
                                    })()}
                                    <Text style={[styles.sectionPara, { color: colors.textSecondary }]}>{analysisResult?.introduction || "Analysis complete."}</Text>
                                </View>
                                {(analysisResult?.explanations || []).map((item: any, idx: number) => {
                                    const getTestHeadingColor = (heading: string) => {
                                        if (!heading) return colors.text;
                                        const lower = heading.toLowerCase();

                                        // 1. High/Low/Danger/Abnormal (Red) - Priority 1
                                        if (lower.includes('high') || lower.includes('low') || lower.includes('danger') || lower.includes('abnormal') || lower.includes('critical') || lower.includes('urgent')) {
                                            return colors.error;
                                        }

                                        // 2. Borderline/Moderate/Warning (Yellow) - Priority 2
                                        if (lower.includes('borderline') || lower.includes('moderate') || lower.includes('caution') || lower.includes('warning') || lower.includes('risk')) {
                                            return colors.warning;
                                        }

                                        // 3. Normal/Perfect/Stable (Green) - Priority 3
                                        if (lower.includes('normal') || lower.includes('perfect') || lower.includes('optimal') || lower.includes('stable') || lower.includes('good') || lower.includes('healthy')) {
                                            return colors.success;
                                        }

                                        return colors.text;
                                    };

                                    return (
                                        <View key={idx} style={styles.contentSection}>
                                            {item?.category && item.category !== "null" && <Text style={[styles.categoryHeading, { color: colors.textSecondary }]}>{item.category}</Text>}
                                            <View style={styles.testHeadingRow}>
                                                <Text style={[styles.testHeading, { color: getTestHeadingColor(item?.heading) }]}>{item?.heading || "Medical Test"}</Text>
                                                {item?.trend_tag && (
                                                    <View style={[styles.trendBadge, { backgroundColor: item.trend_tag.startsWith('+') ? 'rgba(255, 75, 75, 0.1)' : item.trend_tag.startsWith('-') ? 'rgba(75, 255, 75, 0.1)' : 'rgba(150, 150, 150, 0.1)' }]}>
                                                        <Text style={[styles.trendBadgeText, { color: item.trend_tag.startsWith('+') ? colors.error : item.trend_tag.startsWith('-') ? colors.success : colors.textSecondary }]}>
                                                            {item.trend_tag}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                            {(item?.explanation_lines || []).map((line: string, lIdx: number) => <Text key={lIdx} style={[styles.sectionPara, { color: colors.text }]}>• {line}</Text>)}
                                        </View>
                                    );
                                })}
                                <View style={styles.contentSection}>
                                    <Text style={[styles.sectionHeading, { color: colors.text }]}>Overall Summary</Text>
                                    <Text style={[styles.sectionPara, { color: colors.textSecondary, fontFamily: 'Judson-Bold' }]}>{analysisResult?.summary || "Your report has been processed successfully."}</Text>
                                </View>

                                {analysisResult?.takeaways && (
                                    <View style={styles.contentSection}>
                                        <Text style={[styles.sectionHeading, { color: colors.text }]}>Top Insights</Text>
                                        
                                        {analysisResult.takeaways.biggest_concern && analysisResult.takeaways.biggest_concern !== 'null' && (
                                            <View style={[styles.takeawayCard, { borderColor: colors.error, backgroundColor: 'rgba(255, 75, 75, 0.05)' }]}>
                                                <Text style={[styles.takeawayTitle, { color: colors.error }]}>Biggest Concern</Text>
                                                <Text style={[styles.takeawayText, { color: colors.text }]}>{analysisResult.takeaways.biggest_concern}</Text>
                                            </View>
                                        )}

                                        {analysisResult.takeaways.most_reassuring_finding && analysisResult.takeaways.most_reassuring_finding !== 'null' && (
                                            <View style={[styles.takeawayCard, { borderColor: colors.success, backgroundColor: 'rgba(75, 255, 75, 0.05)' }]}>
                                                <Text style={[styles.takeawayTitle, { color: colors.success }]}>Most Reassuring Finding</Text>
                                                <Text style={[styles.takeawayText, { color: colors.text }]}>{analysisResult.takeaways.most_reassuring_finding}</Text>
                                            </View>
                                        )}

                                        {analysisResult.takeaways.what_to_monitor && analysisResult.takeaways.what_to_monitor !== 'null' && (
                                            <View style={[styles.takeawayCard, { borderColor: colors.warning, backgroundColor: 'rgba(255, 170, 0, 0.05)' }]}>
                                                <Text style={[styles.takeawayTitle, { color: colors.warning }]}>What to Monitor</Text>
                                                <Text style={[styles.takeawayText, { color: colors.text }]}>{analysisResult.takeaways.what_to_monitor}</Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </>
                        ) : (
                            <View style={styles.analysisFooter}>
                                <TouchableOpacity
                                    style={[styles.analyzeButton, { backgroundColor: colors.primary }]}
                                    disabled={loading}
                                    onPress={handleStartAnalysis}
                                >
                                    {loading ? (
                                        <Text style={styles.analyzeButtonText}>Preparing...</Text>
                                    ) : (
                                        <>
                                            <BotIcon size={22} color="#FFFFFF" />
                                            <Text style={styles.analyzeButtonText}>Start AI Analysis</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}

                        {analysisResult && (
                            <View style={{ gap: 15, marginTop: 10 }}>
                                <TouchableOpacity
                                    style={[styles.analyzeButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary }]}
                                    onPress={handleViewAiThinking}
                                >
                                    <BotIcon size={20} color={colors.primary} />
                                    <Text style={[styles.analyzeButtonText, { fontSize: 16, color: colors.primary }]}>View AI Thinking</Text>
                                </TouchableOpacity>

                                {!isSaved && (
                                    <TouchableOpacity
                                        style={[styles.analyzeButton, { backgroundColor: colors.primary }]}
                                        onPress={() => setShowSaveModal(true)}
                                    >
                                        <DownloadIcon size={20} color="#FFFFFF" />
                                        <Text style={[styles.analyzeButtonText, { fontSize: 16 }]}>Save Report</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    style={[styles.saveButton, { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1, width: '100%', justifyContent: 'center' }]}
                                    onPress={goBack}
                                >
                                    <Text style={[styles.saveButtonText, { color: colors.text }]}>Done</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                    <View style={{ height: 100 }} />
                </Animated.ScrollView>

                <Modal visible={showSaveModal} transparent animationType="fade" onRequestClose={() => setShowSaveModal(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('save_report')}</Text>
                            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>{t('enter_report_name')}</Text>
                            <TextInput
                                style={[styles.modalInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.primary }]}
                                placeholder={t('report_name_placeholder')}
                                placeholderTextColor={colors.textSecondary}
                                value={reportName}
                                onChangeText={setReportName}
                                autoFocus
                            />
                            <View style={styles.modalButtons}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowSaveModal(false)}>
                                    <Text style={{ color: colors.textSecondary }}>{t('cancel')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                                    disabled={loading}
                                    onPress={async () => {
                                        if (!reportName.trim() || !currentReportId) return;
                                        try {
                                            setLoading(true);
                                            const { error } = await supabase
                                                .from('reports')
                                                .update({
                                                    name: reportName.trim(),
                                                    is_saved: true
                                                })
                                                .eq('id', currentReportId);

                                            if (error) throw error;

                                            // Sync global state
                                            await refreshData();

                                            setIsSaved(true);
                                            setShowSaveModal(false);
                                            Alert.alert("Success", "Report saved to history!");
                                        } catch (error: any) {
                                            Alert.alert("Error", error.message);
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                >
                                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{loading ? t('saving') : t('save_now')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                <Modal visible={showAiThinkingModal} transparent animationType="slide" onRequestClose={() => setShowAiThinkingModal(false)}>
                    <View style={[styles.modalOverlay, { justifyContent: 'flex-end', padding: 0 }]}>
                        <View style={[styles.modalContent, { backgroundColor: colors.background, width: '100%', maxHeight: '85%', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, paddingHorizontal: 25, paddingTop: 30 }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 25 }}>
                                <Text style={[styles.modalTitle, { color: colors.text, marginBottom: 0 }]}>System Audit Trail</Text>
                                <Pressable onPress={() => setShowAiThinkingModal(false)} style={{ padding: 5, backgroundColor: colors.card, borderRadius: 20 }}>
                                    <CrossIcon size={20} color={colors.textSecondary} />
                                </Pressable>
                            </View>
                            
                            <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
                                {aiLogs.map((log, index) => (
                                    <View key={index} style={{ flexDirection: 'row', marginBottom: 25 }}>
                                        <View style={{ width: 30, alignItems: 'center' }}>
                                            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: log.confidence === 'HIGH' ? colors.success : log.confidence === 'LOW' ? colors.border : colors.warning, zIndex: 2, marginTop: 5 }} />
                                            {index !== aiLogs.length - 1 && <View style={{ width: 2, flex: 1, backgroundColor: colors.cardBorder || '#333', marginTop: -5, marginBottom: -30, zIndex: 1 }} />}
                                        </View>
                                        <View style={{ flex: 1, backgroundColor: colors.card, padding: 18, borderRadius: 20, marginLeft: 10, borderWidth: 1, borderColor: colors.cardBorder || '#333' }}>
                                            <Text style={{ fontSize: 13, fontFamily: 'Judson-Bold', color: colors.primary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>{log.agent_name}</Text>
                                            <Text style={{ fontSize: 17, fontFamily: 'Judson-Bold', color: colors.text, marginBottom: 6 }}>{log.event_type}</Text>
                                            <Text style={{ fontSize: 15, fontFamily: 'Judson-Regular', color: colors.textSecondary, lineHeight: 22 }}>{log.decision_reason}</Text>
                                        </View>
                                    </View>
                                ))}
                                <View style={{ height: 40 }} />
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView ref={cameraRef} style={styles.camera} facing="back" enableTorch={torch}>
                <View style={styles.overlay}>
                    <View style={styles.header}>
                        <Pressable onPress={() => navigate('home')} style={styles.iconCircle}><BackIcon size={24} color="#FFFFFF" /></Pressable>
                        <Pressable onPress={() => setTorch(!torch)} style={styles.iconCircle}><FlashlightIcon size={24} color={torch ? "#FFD700" : "#FFFFFF"} /></Pressable>
                    </View>
                    <View style={styles.scanFrameContainer} pointerEvents="none"><ScanFrameIcon color="#FFFFFF" size={width * 0.85} /></View>
                    <View style={styles.bottomContainer}>
                        <TouchableOpacity style={styles.captureButton} onPress={handleCapture}><View style={styles.whiteInnerCircle} /></TouchableOpacity>
                        {capturedImages.length > 0 && (
                            <TouchableOpacity style={styles.finishBtnContainer} onPress={() => setIsAnalysisMode(true)}>
                                <LinearGradient colors={colors.headerGradient as any} style={styles.finishGradient}>
                                    <Text style={styles.finishText}>{t('finish')} ({capturedImages.length})</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </CameraView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    camera: { flex: 1 },
    overlay: { flex: 1, paddingTop: 50 },
    header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 25 },
    iconCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    scanFrameContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    bottomContainer: { paddingBottom: 60, alignItems: 'center', width: '100%', flexDirection: 'row', justifyContent: 'center' },
    captureButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
    whiteInnerCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF' },
    finishBtnContainer: { position: 'absolute', right: 30, height: 50 },
    finishGradient: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 15 },
    finishText: { color: '#FFF', fontFamily: 'Judson-Bold' },
    analysisContainer: { flex: 1 },
    stickyHeader: { width: '100%', justifyContent: 'flex-end', paddingBottom: 15 },
    analysisTopIcons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', paddingHorizontal: 25 },
    analysisIconBlock: { width: 46, height: 46, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    analysisTitle: { color: '#FFF', fontSize: 20, fontFamily: 'Judson-Bold' },
    analysisImageWrapper: { paddingTop: Platform.OS === 'ios' ? 140 : 120, paddingBottom: 40, alignItems: 'center', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
    multiImageScroll: { paddingHorizontal: 25 },
    capturedImageContainer: { width: width * 0.72, height: width * 1.0, backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden', marginHorizontal: 10, elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
    capturedImage: { width: '100%', height: '100%' },
    pdfView: { flex: 1, width: width * 0.8 },
    pageIndicator: { position: 'absolute', bottom: 15, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 5, borderRadius: 10 },
    pageIndicatorText: { color: '#FFF', fontSize: 10 },
    analysisContent: { padding: 25, paddingTop: 30 },
    contentSection: { marginBottom: 30 },
    sectionHeading: { fontSize: 22, fontFamily: 'Judson-Bold', marginBottom: 10 },
    categoryHeading: { fontSize: 13, fontFamily: 'Judson-Bold', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 },
    testHeading: { fontSize: 18, fontFamily: 'Judson-Bold', marginBottom: 5 },
    sectionPara: { fontSize: 15, fontFamily: 'Judson-Regular', lineHeight: 22 },
    loadingContainer: { paddingVertical: 60, alignItems: 'center' },
    loadingText: { fontSize: 20, fontFamily: 'Judson-Bold', marginBottom: 5 },
    pollingSubtext: { fontSize: 14, fontFamily: 'Judson-Bold' },
    loadingSubtext: { fontSize: 14, fontFamily: 'Judson-Regular' },
    analyzeButton: { paddingVertical: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' },
    analyzeButtonText: { color: '#FFF', fontFamily: 'Judson-Bold', fontSize: 18, marginLeft: 12 },
    saveButton: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 15, alignSelf: 'center' },
    saveButtonText: { fontSize: 16, fontFamily: 'Judson-Bold', marginLeft: 10 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 25 },
    modalContent: { borderRadius: 30, padding: 30, alignItems: 'center' },
    modalTitle: { fontSize: 24, fontFamily: 'Judson-Bold', marginBottom: 5 },
    modalSubtitle: { fontSize: 15, fontFamily: 'Judson-Regular', marginBottom: 20, textAlign: 'center' },
    modalInput: { width: '100%', height: 55, borderRadius: 15, paddingHorizontal: 20, fontFamily: 'Judson-Regular', fontSize: 16, marginBottom: 25, borderWidth: 1 },
    modalButtons: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
    cancelBtn: { padding: 15 },
    confirmBtn: { flex: 1, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginLeft: 15 },
    analysisFooter: { marginTop: 20, width: '100%' },
    summaryCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(0, 98, 255, 0.05)',
        borderRadius: 20,
        padding: 20,
        marginVertical: 15,
    },
    summaryItem: {
        alignItems: 'center',
        flex: 1,
    },
    summaryCount: {
        fontSize: 24,
        fontFamily: 'Judson-Bold',
    },
    summaryLabel: {
        fontSize: 12,
        fontFamily: 'Judson-Regular',
        color: '#888',
        marginTop: 4,
    },
    testHeadingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    trendBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    trendBadgeText: {
        fontSize: 12,
        fontFamily: 'Judson-Bold',
    },
    takeawayCard: {
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
        marginBottom: 12,
    },
    takeawayTitle: {
        fontSize: 14,
        fontFamily: 'Judson-Bold',
        marginBottom: 5,
    },
    takeawayText: {
        fontSize: 14,
        fontFamily: 'Judson-Regular',
        lineHeight: 20,
    }
});

export default ScanReportScreen;

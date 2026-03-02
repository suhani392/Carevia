import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, TouchableOpacity, StatusBar, Image, Animated, Modal, TextInput, ScrollView, Alert } from 'react-native';
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
    const { colors, themeMode, t } = useAppContext();
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

    const cameraRef = useRef<CameraView>(null);
    const scrollY = useRef(new Animated.Value(0)).current;

    // Polling logic with heavy logging to debug
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
                        setPollingStatus(data.analysis);
                        console.log("[Status] Current:", data.analysis);
                    }

                    if (data?.analysis?.includes("Complete") || data?.analysis?.includes("ready")) {
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
                    }
                } catch (err) {
                    console.error("[Polling] Error:", err);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isAnalyzing, currentReportId]);

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
                <Animated.View style={[styles.stickyHeader, { height: 110 }]}>
                    <LinearGradient colors={colors.headerGradient as any} style={StyleSheet.absoluteFill} />
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
                                <Text style={[styles.pollingSubtext, { color: colors.primary, marginBottom: 15 }]}>{pollingStatus || "Waiting for cloud response..."}</Text>
                                <Text style={[styles.loadingSubtext, { color: colors.textSecondary }]}>This usually takes 20-30 seconds.</Text>
                            </View>
                        ) : analysisResult ? (
                            <>
                                <View style={styles.contentSection}>
                                    <Text style={[styles.sectionHeading, { color: colors.primary }]}>Your Report Analysis</Text>
                                    <Text style={[styles.sectionPara, { color: colors.textSecondary }]}>{analysisResult.introduction}</Text>
                                </View>
                                {analysisResult.explanations.map((item: any, idx: number) => (
                                    <View key={idx} style={styles.contentSection}>
                                        {item.category && item.category !== "null" && <Text style={[styles.categoryHeading, { color: colors.textSecondary }]}>{item.category}</Text>}
                                        <Text style={[styles.testHeading, { color: item.heading.toLowerCase().includes('high') || item.heading.toLowerCase().includes('low') ? colors.error : colors.text }]}>{item.heading}</Text>
                                        {item.explanation_lines.map((line: string, lIdx: number) => <Text key={lIdx} style={[styles.sectionPara, { color: colors.text }]}>• {line}</Text>)}
                                    </View>
                                ))}
                                <View style={styles.contentSection}>
                                    <Text style={[styles.sectionHeading, { color: colors.text }]}>Overall Summary</Text>
                                    <Text style={[styles.sectionPara, { color: colors.textSecondary, fontFamily: 'Judson-Bold' }]}>{analysisResult.summary}</Text>
                                </View>
                            </>
                        ) : (
                            <View style={styles.analysisFooter}>
                                <TouchableOpacity style={[styles.analyzeButton, { backgroundColor: colors.primary }]} onPress={() => setShowSaveModal(true)}>
                                    <BotIcon size={22} color="#FFFFFF" /><Text style={styles.analyzeButtonText}>Start AI Analysis</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {analysisResult && (
                            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1 }]} onPress={goBack}>
                                <DownloadIcon size={20} color={colors.primary} /><Text style={[styles.saveButtonText, { color: colors.text }]}>Back to Reports</Text>
                            </TouchableOpacity>
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
                                        if (!reportName.trim()) return;
                                        try {
                                            setLoading(true);
                                            const { data: { user } } = await supabase.auth.getUser();
                                            if (!user) throw new Error("Auth required");

                                            const fileName = `${Date.now()}.jpg`;
                                            const filePath = `${user.id}/${fileName}`;
                                            const base64 = await FileSystem.readAsStringAsync(capturedImages[0], { encoding: 'base64' });
                                            const arrayBuffer = decodeBase64(base64);

                                            await supabase.storage.from('reports').upload(filePath, arrayBuffer, { contentType: 'image/jpeg' });
                                            const { data: { publicUrl } } = supabase.storage.from('reports').getPublicUrl(filePath);

                                            const { data: reportData } = await supabase.from('reports').insert({
                                                user_id: user.id,
                                                name: reportName.trim(),
                                                uri: publicUrl,
                                                analysis: "Reading report..."
                                            }).select('id').single();

                                            if (reportData) {
                                                setCurrentReportId(reportData.id);
                                                setIsAnalyzing(true);
                                                setShowSaveModal(false);
                                                // Trigger AI Chain
                                                supabase.functions.invoke('process-report', { body: { report_id: reportData.id } });
                                            }
                                        } catch (error: any) {
                                            Alert.alert("Error", error.message);
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                >
                                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{loading ? t('uploading') : t('save_now')}</Text>
                                </TouchableOpacity>
                            </View>
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
    stickyHeader: { width: '100%', justifyContent: 'center', paddingBottom: 15 },
    analysisTopIcons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', paddingHorizontal: 25 },
    analysisIconBlock: { width: 46, height: 46, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    analysisTitle: { color: '#FFF', fontSize: 20, fontFamily: 'Judson-Bold' },
    analysisImageWrapper: { paddingBottom: 40, alignItems: 'center', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
    multiImageScroll: { paddingHorizontal: 25 },
    capturedImageContainer: { width: width * 0.72, height: width * 1.0, backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden', marginHorizontal: 10, elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
    capturedImage: { width: '100%', height: '100%' },
    pdfView: { flex: 1, width: width * 0.8 },
    pageIndicator: { position: 'absolute', bottom: 15, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 5, borderRadius: 10 },
    pageIndicatorText: { color: '#FFF', fontSize: 10 },
    analysisContent: { padding: 25 },
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
    confirmBtn: { flex: 1, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginLeft: 15 }
});

export default ScanReportScreen;

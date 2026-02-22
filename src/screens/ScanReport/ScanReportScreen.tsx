import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, TouchableOpacity, StatusBar, Image, Animated, Modal, TextInput, ScrollView } from 'react-native';
import Pdf from 'react-native-pdf';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import { BackIcon, FlashlightIcon, ScanFrameIcon, CrossIcon, DownloadIcon, BotIcon } from '../Home/Icons';
import { useNavigation } from '../../context/NavigationContext';
import { useAppContext } from '../../context/AppContext';

const { width, height } = Dimensions.get('window');

const ScanReportScreen = () => {
    const { goBack, navigate, screenParams } = useNavigation();
    const { addReport } = useAppContext();
    const [permission, requestPermission] = useCameraPermissions();
    const [torch, setTorch] = useState(false);
    const [capturedImages, setCapturedImages] = useState<string[]>([]);
    const [isAnalysisMode, setIsAnalysisMode] = useState(false);
    const [isPdf, setIsPdf] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [reportName, setReportName] = useState('');
    const cameraRef = useRef<CameraView>(null);
    const scrollY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!permission) {
            requestPermission();
        }
    }, [permission]);

    useEffect(() => {
        if (screenParams?.uploadedAssets && screenParams.uploadedAssets.length > 0) {
            const uris = screenParams.uploadedAssets.map((a: any) => a.uri);
            setCapturedImages(uris);
            setIsPdf(screenParams.uploadedAssets[0].fileType === 'application/pdf');
            setIsAnalysisMode(true);
        } else if (screenParams?.uploadedUri) {
            // Legacy support for single upload
            setCapturedImages([screenParams.uploadedUri]);
            setIsPdf(screenParams.fileType === 'application/pdf');
            setIsAnalysisMode(true);
        }
    }, [screenParams]);

    const handleCapture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 1,
                    base64: false,
                    skipProcessing: false,
                });

                if (photo) {
                    // Ultra-tight cropping to remove 98% of background
                    // Focuses purely on the document area defined by the scan-frame
                    const cropWidth = photo.width * 0.88; // Covers the inner area of the scan-frame
                    const cropHeight = Math.min(photo.height, photo.width * 1.4); // Taller A4-style aspect ratio
                    const originX = (photo.width - cropWidth) / 2;
                    const originY = Math.max(0, (photo.height - cropHeight) / 2);

                    const manipulatedImage = await ImageManipulator.manipulateAsync(
                        photo.uri,
                        [
                            {
                                crop: {
                                    originX: originX,
                                    originY: originY,
                                    width: cropWidth,
                                    height: cropHeight,
                                },
                            },
                        ],
                        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
                    );

                    setCapturedImages(prev => [...prev, manipulatedImage.uri]);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
            } catch (error) {
                console.error("Failed to take picture:", error);
            }
        }
    };

    const headerHeight = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [130, 95],
        extrapolate: 'clamp',
    });

    const titleFontSize = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [20, 18],
        extrapolate: 'clamp',
    });

    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <View style={styles.permissionContent}>
                    <Text style={styles.permissionText}>We need your permission to show the camera</Text>
                    <Pressable onPress={requestPermission} style={styles.permissionButton}>
                        <Text style={styles.permissionButtonText}>Grant Permission</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    if (isAnalysisMode && capturedImages.length > 0) {
        return (
            <View style={styles.analysisContainer}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

                <Animated.View style={[styles.stickyHeader, { height: headerHeight }]}>
                    <LinearGradient
                        colors={['#0062FF', '#0062FF']}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.analysisTopIcons}>
                        <Pressable style={styles.analysisIconBlock} onPress={() => {
                            setIsAnalysisMode(false);
                            if (isPdf) setCapturedImages([]); // Clear if it was an upload
                        }}>
                            <BackIcon size={24} color="#FFFFFF" />
                        </Pressable>
                        <View style={styles.analysisHeaderText}>
                            <Animated.Text style={[styles.analysisTitle, { fontSize: titleFontSize }]}>Your Report Analysis</Animated.Text>
                        </View>
                        <Pressable style={styles.analysisIconBlock} onPress={goBack}>
                            <CrossIcon size={24} color="#FFFFFF" />
                        </Pressable>
                    </View>
                </Animated.View>

                <Animated.ScrollView
                    showsVerticalScrollIndicator={false}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: false }
                    )}
                    scrollEventThrottle={16}
                >
                    <View>
                        <LinearGradient
                            colors={['#0062FF', '#5C8EDF']}
                            style={styles.analysisImageWrapper}
                        >
                            {isPdf ? (
                                <View style={styles.capturedImageContainer}>
                                    <Pdf
                                        source={{ uri: capturedImages[0] || '' }}
                                        style={styles.pdfView}
                                        trustAllCerts={false}
                                        onLoadComplete={(numberOfPages) => {
                                            console.log(`Number of pages: ${numberOfPages}`);
                                        }}
                                    />
                                </View>
                            ) : (
                                capturedImages.map((uri, index) => (
                                    <View key={index} style={[styles.capturedImageContainer, index > 0 && { marginTop: 20 }]}>
                                        <Image
                                            source={{ uri: uri }}
                                            style={styles.capturedImage}
                                            resizeMode="cover"
                                        />
                                        <View style={styles.pageIndicator}>
                                            <Text style={styles.pageIndicatorText}>{index + 1} / {capturedImages.length}</Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </LinearGradient>
                    </View>

                    <View style={styles.analysisContent}>
                        <View style={styles.contentSection}>
                            <Text style={styles.sectionHeading}>Overall Report Summary</Text>
                            <Text style={styles.sectionPara}>Vitamin B12 & D3 deficiency observed, along with a spike in WBCs count and low haemoglobin.</Text>
                        </View>

                        <View style={styles.contentSection}>
                            <Text style={styles.sectionHeading}>Vitamins</Text>
                            <Text style={styles.sectionPara}>Vitamin B12 : 5.3 (deficient)</Text>
                            <Text style={styles.sectionPara}>Vitamin D3 : 6.6 (deficient)</Text>
                        </View>

                        <View style={styles.contentSection}>
                            <Text style={styles.sectionHeading}>Blood Cells</Text>
                            <Text style={styles.sectionPara}>WBCs : 5.3 (high)</Text>
                        </View>

                        <View style={styles.contentSection}>
                            <Text style={styles.sectionHeading}>Other Blood Factors</Text>
                            <Text style={styles.sectionPara}>Haemoglobin : 5.3 (low)</Text>
                        </View>

                        <View style={styles.contentSection}>
                            <Text style={styles.sectionHeading}>AI Suggestions</Text>
                            <Text style={styles.sectionPara}>Prefer fish, and other fermented food items to balance your vitamin B12 levels.</Text>
                            <Text style={styles.sectionPara}>For balancing vitamin D3, morning sunlight is the best!</Text>
                            <Text style={styles.sectionPara}>Keep your health proper including proper medications if you are sick currently, as being sick makes the WBCs count to spike up for body recovery.</Text>
                            <Text style={styles.sectionPara}>Include beetroot, dates, raisins & spinach in your diet to regain the required haemoglobin level.</Text>
                        </View>

                        <View style={styles.analysisFooter}>
                            <TouchableOpacity style={styles.saveButton} onPress={() => setShowSaveModal(true)}>
                                <DownloadIcon size={20} color="#000000" />
                                <Text style={styles.saveButtonText}>Save Report</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={{ height: 100 }} />
                </Animated.ScrollView>

                <TouchableOpacity
                    style={styles.fixedChatButton}
                    onPress={() => navigate('ai_assistant')}
                >
                    <BotIcon size={28} color="#3C87FF" />
                </TouchableOpacity>

                {/* Save Report Modal */}
                <Modal
                    visible={showSaveModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowSaveModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Save Report</Text>
                            <Text style={styles.modalSubtitle}>Please enter a name for your report to stay organized.</Text>

                            <TextInput
                                style={styles.modalInput}
                                placeholder="e.g. Blood Test - Jan"
                                placeholderTextColor="#999"
                                value={reportName}
                                onChangeText={setReportName}
                                autoFocus={true}
                            />

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => setShowSaveModal(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.confirmButton}
                                    onPress={() => {
                                        if (reportName.trim()) {
                                            addReport(reportName, capturedImages[0] || '');
                                            setShowSaveModal(false);
                                            navigate('reports');
                                        }
                                    }}
                                >
                                    <LinearGradient
                                        colors={['#0062FF', '#5C8EDF']}
                                        style={styles.confirmButtonGradient}
                                    >
                                        <Text style={styles.confirmButtonText}>Save Now</Text>
                                    </LinearGradient>
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
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing="back"
                enableTorch={torch}
            >
                <View style={styles.overlay}>
                    <View style={styles.header}>
                        <Pressable onPress={() => navigate('home')}>
                            <LinearGradient
                                colors={['#0062FF', '#5C8EDF']}
                                style={styles.iconBlock}
                            >
                                <BackIcon size={24} color="#FFFFFF" />
                            </LinearGradient>
                        </Pressable>

                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                setTorch(!torch);
                            }}
                        >
                            <LinearGradient
                                colors={torch ? ['#FFD700', '#FFA500'] : ['#0062FF', '#5C8EDF']}
                                style={styles.iconBlock}
                            >
                                <FlashlightIcon size={24} color={torch ? "#000000" : "#FFFFFF"} />
                            </LinearGradient>
                        </Pressable>
                    </View>

                    <View style={styles.scanFrameContainer} pointerEvents="none">
                        <ScanFrameIcon color="#FFFFFF" size={width * 0.85} />
                    </View>

                    <View style={styles.instructionContainer}>
                        <Text style={styles.instructionText}>
                            Make sure to capture a clear picture of report
                        </Text>
                    </View>

                    <View style={styles.bottomContainer}>
                        <View style={styles.captureControls}>
                            <View style={styles.previewContainer}>
                                {capturedImages.length > 0 && (
                                    <View style={styles.thumbnailWrapper}>
                                        <Image
                                            source={{ uri: capturedImages[capturedImages.length - 1] }}
                                            style={styles.thumbnail}
                                        />
                                        <View style={styles.countBadge}>
                                            <Text style={styles.countText}>{capturedImages.length}</Text>
                                        </View>
                                    </View>
                                )}
                            </View>

                            <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
                                <LinearGradient
                                    colors={['#0062FF', '#5C8EDF']}
                                    style={styles.gradientCircle}
                                >
                                    <View style={styles.whiteInnerCircle} />
                                </LinearGradient>
                            </TouchableOpacity>

                            <View style={styles.finishContainer}>
                                {capturedImages.length > 0 && (
                                    <TouchableOpacity
                                        style={styles.finishButton}
                                        onPress={() => setIsAnalysisMode(true)}
                                    >
                                        <LinearGradient
                                            colors={['#4CAF50', '#2E7D32']}
                                            style={styles.finishGradient}
                                        >
                                            <Text style={styles.finishText}>Finish</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>
                </View>
            </CameraView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    camera: {
        flex: 1,
    },
    permissionContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FFFFFF',
    },
    permissionText: {
        textAlign: 'center',
        fontFamily: 'Judson-Regular',
        fontSize: 18,
        color: '#000000',
        marginBottom: 20,
    },
    overlay: {
        flex: 1,
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 25,
        marginBottom: 20,
    },
    iconBlock: {
        width: 46,
        height: 46,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    instructionContainer: {
        backgroundColor: 'rgba(180, 180, 180, 0.6)',
        paddingVertical: 12,
        alignItems: 'center',
        width: '100%',
        marginBottom: 40,
    },
    instructionText: {
        fontFamily: 'Judson-Regular',
        fontSize: 16,
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    scanFrameContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomContainer: {
        width: '100%',
        alignItems: 'center',
        paddingBottom: 50,
    },
    captureButton: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gradientCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    whiteInnerCircle: {
        width: 62,
        height: 62,
        borderRadius: 31,
        backgroundColor: '#FFFFFF',
    },
    permissionButton: {
        backgroundColor: '#0062FF',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 15,
    },
    permissionButtonText: {
        color: '#FFFFFF',
        fontFamily: 'Judson-Bold',
        fontSize: 16,
    },
    analysisContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    stickyHeader: {
        width: '100%',
        paddingHorizontal: 25,
        justifyContent: 'flex-end',
        paddingBottom: 12,
        zIndex: 10,
        overflow: 'hidden',
    },
    analysisImageWrapper: {
        width: '100%',
        paddingBottom: 40,
        borderBottomLeftRadius: 50,
        borderBottomRightRadius: 50,
        alignItems: 'center',
    },
    analysisTopIcons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    analysisIconBlock: {
        width: 46,
        height: 46,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    analysisHeaderText: {
        alignItems: 'center',
    },
    analysisTitle: {
        fontFamily: 'Judson-Bold',
        color: '#FFFFFF',
    },
    analysisDate: {
        display: 'none',
    },
    capturedImageContainer: {
        width: '78%',
        height: 380,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        overflow: 'hidden',
    },
    capturedImage: {
        width: '100%',
        height: '100%',
    },
    analysisContent: {
        paddingHorizontal: 25,
        marginTop: 30,
    },
    contentSection: {
        marginBottom: 25,
    },
    sectionHeading: {
        fontFamily: 'Judson-Bold',
        fontSize: 18,
        color: '#000000',
        marginBottom: 8,
    },
    sectionPara: {
        fontFamily: 'Judson-Regular',
        fontSize: 15,
        color: '#333333',
        lineHeight: 22,
        marginBottom: 4,
    },
    analysisFooter: {
        marginTop: 20,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D9E8FF',
        alignSelf: 'flex-start',
        paddingHorizontal: 25,
        paddingVertical: 14,
        borderRadius: 15,
    },
    saveButtonText: {
        fontFamily: 'Judson-Bold',
        fontSize: 16,
        color: '#000000',
        marginLeft: 10,
    },
    fixedChatButton: {
        position: 'absolute',
        bottom: 30,
        right: 25,
        width: 64,
        height: 64,
        backgroundColor: '#D9E8FF',
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    pdfView: {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF',
    },
    multiImageScroll: {
        paddingHorizontal: (width - (width * 0.78)) / 2,
        alignItems: 'center',
    },
    pageIndicator: {
        position: 'absolute',
        bottom: 15,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    pageIndicatorText: {
        color: '#FFFFFF',
        fontFamily: 'Judson-Bold',
        fontSize: 12,
    },
    captureControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 30,
    },
    previewContainer: {
        width: 60,
        height: 60,
    },
    thumbnailWrapper: {
        width: 54,
        height: 54,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        overflow: 'hidden',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    countBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#0062FF',
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
    },
    countText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontFamily: 'Judson-Bold',
    },
    finishContainer: {
        width: 80,
        height: 50,
        justifyContent: 'center',
    },
    finishButton: {
        width: '100%',
        height: 44,
    },
    finishGradient: {
        flex: 1,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    finishText: {
        color: '#FFFFFF',
        fontFamily: 'Judson-Bold',
        fontSize: 15,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 25,
    },
    modalContent: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        padding: 25,
        alignItems: 'center',
        elevation: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
    },
    modalTitle: {
        fontFamily: 'Judson-Bold',
        fontSize: 22,
        color: '#000000',
        marginBottom: 10,
    },
    modalSubtitle: {
        fontFamily: 'Judson-Regular',
        fontSize: 15,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalInput: {
        width: '100%',
        height: 55,
        backgroundColor: '#F5F9FF',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#0062FF',
        paddingHorizontal: 15,
        fontFamily: 'Judson-Regular',
        fontSize: 16,
        color: '#333333',
        marginBottom: 25,
    },
    modalButtons: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    cancelButton: {
        flex: 1,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    cancelButtonText: {
        fontFamily: 'Judson-Bold',
        fontSize: 16,
        color: '#666666',
    },
    confirmButton: {
        flex: 1.5,
        height: 50,
    },
    confirmButtonGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButtonText: {
        fontFamily: 'Judson-Bold',
        fontSize: 16,
        color: '#FFFFFF',
    }
});

export default ScanReportScreen;

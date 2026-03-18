import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
    ScrollView,
    ActivityIndicator,
    Platform,
    Alert,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import { useNavigation } from '../../context/NavigationContext';
import { useAppContext } from '../../context/AppContext';
import HomeHeader from '../Home/HomeHeader';
import AppStatusBar from '../../components/status-bar/status-bar';
import { ShareIcon, DownloadIcon } from '../Home/Icons';
import Pdf from 'react-native-pdf';
import { FileCheckIcon } from '../Documents/Icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

const DocumentView = () => {
    const { screenParams, goBack } = useNavigation();
    const { colors, themeMode } = useAppContext();
    const [isLoading, setIsLoading] = React.useState(false);
    const [isBusy, setIsBusy] = React.useState(false);

    const [currentPage, setCurrentPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);

    const docName = screenParams?.docName || 'Document';
    const ownerName = screenParams?.ownerName || 'Suhani Badhe';
    const docUri = screenParams?.docUri;
    const reportId = screenParams?.reportId;

    const [analysisResult, setAnalysisResult] = React.useState<any>(null);

    React.useEffect(() => {
        if (reportId) {
            const fetchAnalysis = async () => {
                const { data, error } = await supabase.from('structured_reports').select('explanation_json').eq('report_id', reportId).maybeSingle();
                if (data?.explanation_json) {
                    setAnalysisResult(data.explanation_json);
                }
            };
            fetchAnalysis();
        }
    }, [reportId]);

    React.useEffect(() => {
        console.log('DocumentView - Incoming URI:', docUri);
    }, [docUri]);

    const isPdf = docName.toLowerCase().endsWith('.pdf') || (docUri && docUri.toLowerCase().split('?')[0].endsWith('.pdf'));

    const handleShare = async () => {
        if (!docUri || isBusy) return;
        setIsBusy(true);
        try {
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                let localUri = docUri;

                // For remote URLs or base64, we must have a local file to share on Android
                if (docUri.startsWith('data:') || docUri.startsWith('http')) {
                    const extension = isPdf ? '.pdf' : '.jpg';
                    const tempUri = `${FileSystem.cacheDirectory}share_${Date.now()}${extension}`;

                    if (docUri.startsWith('data:')) {
                        const [, base64Data] = docUri.split(';base64,');
                        await FileSystem.writeAsStringAsync(tempUri, base64Data, {
                            encoding: FileSystem.EncodingType.Base64,
                        });
                        localUri = tempUri;
                    } else {
                        const downloadResult = await FileSystem.downloadAsync(docUri, tempUri);
                        if (downloadResult.status !== 200) throw new Error('Download failed');
                        localUri = downloadResult.uri;
                    }
                }

                await Sharing.shareAsync(localUri);
            } else {
                Alert.alert('Error', 'Sharing is not available on this device');
            }
        } catch (error) {
            // Only alert if it's not a cancellation by the user
            if (error instanceof Error && !error.message.includes('rejected')) {
                console.error('Error sharing document:', error);
                Alert.alert('Error', 'Failed to share the document');
            }
        } finally {
            setIsBusy(false);
        }
    };

    const handleDownload = () => {
        if (!docUri) return;

        Alert.alert(
            'Confirm Download',
            'Do you want to save this document to your device?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Download',
                    onPress: async () => {
                        if (isBusy) return;
                        setIsBusy(true);
                        try {
                            // Specify writeOnly to avoid requesting READ_MEDIA_AUDIO and other unnecessary permissions
                            const { status } = await MediaLibrary.requestPermissionsAsync(true);

                            if (status === 'granted') {
                                let finalUri = docUri;

                                // For remote URLs or base64, we must download to a temporary file first
                                // as MediaLibrary.createAssetAsync requires a local URI
                                if (docUri.startsWith('data:') || docUri.startsWith('http')) {
                                    const extension = isPdf ? '.pdf' : '.jpg';
                                    const tempUri = `${FileSystem.cacheDirectory}download_${Date.now()}${extension}`;

                                    if (docUri.startsWith('data:')) {
                                        const [, base64Data] = docUri.split(';base64,');
                                        await FileSystem.writeAsStringAsync(tempUri, base64Data, {
                                            encoding: FileSystem.EncodingType.Base64,
                                        });
                                        finalUri = tempUri;
                                    } else {
                                        const downloadResult = await FileSystem.downloadAsync(docUri, tempUri);
                                        if (downloadResult.status !== 200) throw new Error('Download failed');
                                        finalUri = downloadResult.uri;
                                    }
                                }

                                if (isPdf) {
                                    // For PDFs, sharing/saving to files is the standard way
                                    await Sharing.shareAsync(finalUri, {
                                        mimeType: 'application/pdf',
                                        UTI: 'com.adobe.pdf',
                                    });
                                } else {
                                    // For images, save to library
                                    const asset = await MediaLibrary.createAssetAsync(finalUri);
                                    await MediaLibrary.createAlbumAsync('Carevia Reports', asset, false);
                                    Alert.alert('Success', 'Document saved to your Carevia Reports album!');
                                }
                            } else {
                                Alert.alert('Permission Denied', 'Need storage permission to save files');
                            }
                        } catch (error) {
                            console.error('Error downloading:', error);
                            Alert.alert('Error', 'Failed to save the document');
                        } finally {
                            setIsBusy(false);
                        }
                    }
                }
            ]
        );
    };

    const openInNativeApp = async () => {
        if (!docUri) return;
        setIsLoading(true);
        try {
            let localUri = docUri;

            // Handle base64 or web URLs by saving/downloading to cache
            if (docUri.startsWith('data:') || docUri.startsWith('http')) {
                const extension = isPdf ? '.pdf' : '.jpg';
                const tempUri = `${FileSystem.cacheDirectory}view_${Date.now()}${extension}`;

                if (docUri.startsWith('data:')) {
                    const [, base64Data] = docUri.split(';base64,');
                    await FileSystem.writeAsStringAsync(tempUri, base64Data, {
                        encoding: FileSystem.EncodingType.Base64,
                    });
                } else {
                    const downloadResult = await FileSystem.downloadAsync(docUri, tempUri);
                    if (downloadResult.status !== 200) throw new Error('Download failed');
                }
                localUri = tempUri;
            }

            if (Platform.OS === 'android') {
                // For Android, we need a content:// URI to avoid security exceptions
                const contentUri = await FileSystem.getContentUriAsync(localUri);
                await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                    data: contentUri,
                    flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
                    type: isPdf ? 'application/pdf' : 'image/*',
                });
            } else {
                // For iOS, sharing is the standard way to "Open In..."
                const isAvailable = await Sharing.isAvailableAsync();
                if (isAvailable) {
                    await Sharing.shareAsync(localUri, {
                        mimeType: isPdf ? 'application/pdf' : 'image/jpeg',
                        dialogTitle: `Open ${docName}`,
                    });
                }
            }
        } catch (error) {
            console.error('Error opening document:', error);
            Alert.alert('Error', 'Failed to open the document viewer. Please try downloading it instead.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <AppStatusBar />

            <HomeHeader
                showBackButton={true}
                showRightIcon={false}
                onBackPress={goBack}
                showActionRow={false}
                showUserBlock={false}
                centerTitle={true}
                title={ownerName}
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={[styles.docTitle, { color: colors.text }]}>{docName}</Text>

                <View style={[styles.imageContainer, { aspectRatio: 0.75, backgroundColor: colors.surface, borderColor: colors.cardBorder, borderWidth: 1 }]}>
                    <View style={styles.imageWrapper}>
                        {isPdf ? (
                            <>
                                {isLoading && (
                                    <View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
                                        <ActivityIndicator color={colors.primary} size="large" />
                                    </View>
                                )}
                                <Pdf
                                    source={{ uri: docUri, cache: true }}
                                    style={[styles.pdfViewer, { backgroundColor: themeMode === 'dark' ? '#1A1A1A' : '#FFFFFF' }]}
                                    onLoadComplete={(numberOfPages) => {
                                        setTotalPages(numberOfPages);
                                        setIsLoading(false);
                                    }}
                                    onPageChanged={(page) => setCurrentPage(page)}
                                    onError={(error: any) => {
                                        setIsLoading(false);
                                        Alert.alert('PDF Error', error?.message || 'Unable to display this PDF.');
                                    }}
                                    trustAllCerts={false}
                                />
                            </>
                        ) : (
                            <Image
                                source={{ uri: docUri || 'https://img.freepik.com/free-vector/medical-report-template_23-2148509372.jpg' }}
                                style={styles.documentImage}
                                resizeMode="contain"
                                onLoadStart={() => setIsLoading(true)}
                                onLoadEnd={() => setIsLoading(false)}
                            />
                        )}
                    </View>
                    <View style={[styles.pageIndicator, { backgroundColor: colors.modalBg }]}>
                        <Text style={[styles.pageIndicatorText, { color: colors.text }]}>
                            {isPdf ? `Page ${currentPage}/${totalPages}` : `Page 1/1`}
                        </Text>
                    </View>
                </View>

                <View style={styles.buttonRow}>
                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }, isBusy && { opacity: 0.5 }]} onPress={handleShare} disabled={isBusy}>
                        <ShareIcon color={colors.primary} size={22} />
                        <Text style={[styles.actionButtonText, { color: colors.text }]}>Share</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }, isBusy && { opacity: 0.5 }]} onPress={handleDownload} disabled={isBusy}>
                        <DownloadIcon color={colors.primary} size={22} />
                        <Text style={[styles.actionButtonText, { color: colors.text }]}>Download</Text>
                    </TouchableOpacity>
                </View>

                {analysisResult && (
                    <View style={styles.analysisContent}>
                        <View style={styles.contentSection}>
                            <Text style={[styles.sectionHeading, { color: colors.primary }]}>Report Analysis</Text>
                            {(() => {
                                const counts = analysisResult?.summary_counts || {
                                    normal: (analysisResult?.explanations || []).filter((e: any) => e.heading?.toLowerCase().includes('normal')).length,
                                    borderline: (analysisResult?.explanations || []).filter((e: any) => e.heading?.toLowerCase().includes('borderline')).length,
                                    abnormal: (analysisResult?.explanations || []).filter((e: any) => e.heading?.toLowerCase().includes('high') || e.heading?.toLowerCase().includes('low') || e.heading?.toLowerCase().includes('abnormal')).length
                                };
                                return (
                                    <View style={styles.summaryCard}>
                                        <View style={styles.summaryItem}><Text style={[styles.summaryCount, { color: '#4ADE80' }]}>{counts.normal}</Text><Text style={styles.summaryLabel}>Normal</Text></View>
                                        <View style={styles.summaryItem}><Text style={[styles.summaryCount, { color: '#FFB020' }]}>{counts.borderline}</Text><Text style={styles.summaryLabel}>Borderline</Text></View>
                                        <View style={styles.summaryItem}><Text style={[styles.summaryCount, { color: '#FF4B4B' }]}>{counts.abnormal || (counts.high || 0) + (counts.low || 0) + (counts.abnormal || 0)}</Text><Text style={styles.summaryLabel}>Abnormal</Text></View>
                                    </View>
                                );
                            })()}
                            <Text style={[styles.sectionPara, { color: colors.textSecondary }]}>{analysisResult?.introduction || "Analysis complete."}</Text>
                        </View>
                        {(analysisResult?.explanations || []).map((item: any, idx: number) => {
                            const getTestHeadingColor = (heading: string) => {
                                if (!heading) return colors.text;
                                const lower = heading.toLowerCase();
                                if (lower.includes('high') || lower.includes('low') || lower.includes('danger') || lower.includes('abnormal') || lower.includes('critical') || lower.includes('urgent')) return '#FF4B4B';
                                if (lower.includes('borderline') || lower.includes('moderate') || lower.includes('caution') || lower.includes('warning') || lower.includes('risk')) return '#FFB020';
                                if (lower.includes('normal') || lower.includes('perfect') || lower.includes('optimal') || lower.includes('stable') || lower.includes('good') || lower.includes('healthy')) return '#4ADE80';
                                return colors.text;
                            };
                            return (
                                <View key={idx} style={styles.contentSection}>
                                    {item?.category && item.category !== "null" && <Text style={[styles.categoryHeading, { color: colors.textSecondary }]}>{item.category}</Text>}
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <Text style={[styles.testHeading, { color: getTestHeadingColor(item?.heading) }]}>{item?.heading || "Medical Test"}</Text>
                                        {item?.trend_tag && (
                                            <View style={[{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }, { backgroundColor: item.trend_tag.startsWith('+') ? 'rgba(255, 75, 75, 0.1)' : item.trend_tag.startsWith('-') ? 'rgba(75, 255, 75, 0.1)' : 'rgba(150, 150, 150, 0.1)' }]}>
                                                <Text style={[{ fontSize: 12, fontFamily: 'Judson-Bold' }, { color: item.trend_tag.startsWith('+') ? '#FF4B4B' : item.trend_tag.startsWith('-') ? '#4ADE80' : colors.textSecondary }]}>
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
                            <Text style={[styles.sectionPara, { color: colors.textSecondary, fontFamily: 'Judson-Bold' }]}>{analysisResult?.summary}</Text>
                        </View>
                        {analysisResult?.takeaways && (
                            <View style={styles.contentSection}>
                                <Text style={[styles.sectionHeading, { color: colors.text }]}>Top Insights</Text>
                                {analysisResult.takeaways.biggest_concern && analysisResult.takeaways.biggest_concern !== 'null' && (
                                    <View style={[{ padding: 15, borderRadius: 15, marginBottom: 15, borderWidth: 1 }, { borderColor: '#FF4B4B', backgroundColor: 'rgba(255, 75, 75, 0.05)' }]}>
                                        <Text style={[{ fontSize: 14, fontFamily: 'Judson-Bold', marginBottom: 5, textTransform: 'uppercase' }, { color: '#FF4B4B' }]}>Biggest Concern</Text>
                                        <Text style={[{ fontSize: 15, fontFamily: 'Judson-Regular' }, { color: colors.text }]}>{analysisResult.takeaways.biggest_concern}</Text>
                                    </View>
                                )}
                                {analysisResult.takeaways.most_reassuring_finding && analysisResult.takeaways.most_reassuring_finding !== 'null' && (
                                    <View style={[{ padding: 15, borderRadius: 15, marginBottom: 15, borderWidth: 1 }, { borderColor: '#4ADE80', backgroundColor: 'rgba(75, 255, 75, 0.05)' }]}>
                                        <Text style={[{ fontSize: 14, fontFamily: 'Judson-Bold', marginBottom: 5, textTransform: 'uppercase' }, { color: '#4ADE80' }]}>Most Reassuring Finding</Text>
                                        <Text style={[{ fontSize: 15, fontFamily: 'Judson-Regular' }, { color: colors.text }]}>{analysisResult.takeaways.most_reassuring_finding}</Text>
                                    </View>
                                )}
                                {analysisResult.takeaways.what_to_monitor && analysisResult.takeaways.what_to_monitor !== 'null' && (
                                    <View style={[{ padding: 15, borderRadius: 15, marginBottom: 15, borderWidth: 1 }, { borderColor: '#FFB020', backgroundColor: 'rgba(255, 170, 0, 0.05)' }]}>
                                        <Text style={[{ fontSize: 14, fontFamily: 'Judson-Bold', marginBottom: 5, textTransform: 'uppercase' }, { color: '#FFB020' }]}>What to Monitor</Text>
                                        <Text style={[{ fontSize: 15, fontFamily: 'Judson-Regular' }, { color: colors.text }]}>{analysisResult.takeaways.what_to_monitor}</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 25,
        paddingTop: 30,
    },
    docTitle: {
        fontFamily: 'Judson-Bold',
        fontSize: 22,
        marginBottom: 20,
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 0.75,
        borderRadius: 20,
        padding: 15,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    imageWrapper: {
        width: '100%',
        height: '92%',
        borderRadius: 5,
        overflow: 'hidden',
    },
    documentImage: {
        width: '100%',
        height: '100%',
    },
    pdfViewer: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    pageIndicator: {
        position: 'absolute',
        bottom: 15,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        elevation: 2,
    },
    pageIndicatorText: {
        fontFamily: 'Judson-Regular',
        fontSize: 14,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 30,
    },
    actionButton: {
        flexDirection: 'row',
        width: '47%',
        height: 55,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButtonText: {
        fontFamily: 'Judson-Bold',
        fontSize: 16,
        marginLeft: 10,
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    analysisContent: { paddingTop: 30 },
    contentSection: { marginBottom: 30 },
    sectionHeading: { fontSize: 22, fontFamily: 'Judson-Bold', marginBottom: 10 },
    categoryHeading: { fontSize: 13, fontFamily: 'Judson-Bold', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 },
    testHeading: { fontSize: 18, fontFamily: 'Judson-Bold' },
    sectionPara: { fontSize: 15, fontFamily: 'Judson-Regular', lineHeight: 22 },
    summaryCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(0, 98, 255, 0.05)', borderRadius: 20, padding: 20, marginVertical: 15 },
    summaryItem: { alignItems: 'center', flex: 1 },
    summaryCount: { fontSize: 24, fontFamily: 'Judson-Bold' },
    summaryLabel: { fontSize: 12, fontFamily: 'Judson-Regular', color: '#888', marginTop: 4 },
});

export default DocumentView;

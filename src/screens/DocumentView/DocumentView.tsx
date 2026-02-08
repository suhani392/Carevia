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
import HomeHeader from '../Home/HomeHeader';
import AppStatusBar from '../../components/status-bar/status-bar';
import { ShareIcon, DownloadIcon } from '../Home/Icons';
import { WebView } from 'react-native-webview';
import { FileCheckIcon } from '../Documents/Icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';

const { width } = Dimensions.get('window');

const DocumentView = () => {
    const { screenParams, goBack } = useNavigation();
    const [isLoading, setIsLoading] = React.useState(false);

    const docName = screenParams?.docName || 'Document';
    const ownerName = screenParams?.ownerName || 'Suhani Badhe';
    const docUri = screenParams?.docUri;

    const isPdf = docName.toLowerCase().endsWith('.pdf') || docUri?.toLowerCase().endsWith('.pdf');

    const handleShare = async () => {
        if (!docUri) return;
        try {
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(docUri);
            } else {
                Alert.alert('Error', 'Sharing is not available on this device');
            }
        } catch (error) {
            console.error('Error sharing document:', error);
            Alert.alert('Error', 'Failed to share the document');
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
                        try {
                            const { status } = await MediaLibrary.requestPermissionsAsync(true);
                            if (status === 'granted') {
                                if (isPdf) {
                                    // For PDFs, sharing is the best way to "Save to Files"
                                    await Sharing.shareAsync(docUri);
                                } else {
                                    // For images, save to gallery
                                    await MediaLibrary.saveToLibraryAsync(docUri);
                                    Alert.alert('Success', 'Document saved to your gallery!');
                                }
                            } else {
                                Alert.alert('Permission Denied', 'Need storage permission to save files');
                            }
                        } catch (error) {
                            console.error('Error downloading:', error);
                            Alert.alert('Error', 'Failed to save the document');
                        }
                    }
                }
            ]
        );
    };

    const openInNativeApp = async () => {
        if (!docUri) return;
        try {
            if (Platform.OS === 'android') {
                // For Android, we need a content:// URI to avoid security exceptions
                // and we use IntentLauncher to open the PDF viewer directly
                const contentUri = await FileSystem.getContentUriAsync(docUri);
                await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                    data: contentUri,
                    flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
                    type: 'application/pdf',
                });
            } else {
                // For iOS, sharing is the standard way to "Open In..."
                const isAvailable = await Sharing.isAvailableAsync();
                if (isAvailable) {
                    await Sharing.shareAsync(docUri, {
                        mimeType: 'application/pdf',
                        dialogTitle: `Open ${docName}`,
                    });
                }
            }
        } catch (error) {
            console.error('Error opening PDF:', error);
            Alert.alert('Error', 'Failed to open the document viewer');
        }
    };

    return (
        <View style={styles.container}>
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
                <Text style={styles.docTitle}>{docName}</Text>

                <View style={[styles.imageContainer, isPdf && { padding: 0, height: 500, aspectRatio: undefined }]}>
                    <View style={styles.imageWrapper}>
                        {isPdf ? (
                            Platform.OS === 'ios' ? (
                                <WebView
                                    source={{ uri: docUri }}
                                    style={styles.documentImage}
                                    scalesPageToFit={true}
                                    startInLoadingState={true}
                                    allowFileAccess={true}
                                    allowUniversalAccessFromFileURLs={true}
                                    originWhitelist={['*']}
                                    renderLoading={() => (
                                        <View style={styles.loadingContainer}>
                                            <ActivityIndicator color="#0062FF" size="large" />
                                        </View>
                                    )}
                                />
                            ) : isLoading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator color="#0062FF" size="large" />
                                </View>
                            ) : (
                                <View style={styles.pdfPlaceholder}>
                                    <View style={styles.vaultCard}>
                                        <View style={styles.pdfIconContainer}>
                                            <FileCheckIcon size={60} color="#0062FF" />
                                        </View>
                                        <View style={styles.verifiedBadge}>
                                            <Text style={styles.verifiedText}>✓ SECURE REPORT</Text>
                                        </View>
                                        <Text style={styles.pdfLabel} numberOfLines={1}>{docName}</Text>
                                        <Text style={styles.pdfSublabel}>Medical document ready for viewing</Text>

                                        <TouchableOpacity
                                            style={styles.openPdfButton}
                                            onPress={openInNativeApp}
                                            activeOpacity={0.8}
                                        >
                                            <LinearGradient
                                                colors={['#0062FF', '#004ecf']}
                                                style={styles.openGradient}
                                            >
                                                <Text style={styles.openPdfText}>Open Secure Viewer</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )
                        ) : (
                            <Image
                                source={{ uri: docUri || 'https://img.freepik.com/free-vector/medical-report-template_23-2148509372.jpg' }}
                                style={styles.documentImage}
                                resizeMode="contain"
                            />
                        )}
                    </View>

                    {!isPdf && (
                        <View style={styles.pageIndicator}>
                            <Text style={styles.pageIndicatorText}>Page 1/1</Text>
                        </View>
                    )}
                </View>

                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                        <ShareIcon color="#000000" size={22} />
                        <Text style={styles.actionButtonText}>Share</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
                        <DownloadIcon color="#000000" size={22} />
                        <Text style={styles.actionButtonText}>Download</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        paddingHorizontal: 25,
        paddingTop: 30,
    },
    docTitle: {
        fontFamily: 'Judson-Bold',
        fontSize: 22,
        color: '#000000',
        marginBottom: 20,
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 0.75,
        backgroundColor: '#D9D9D9',
        borderRadius: 20,
        padding: 15,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    imageWrapper: {
        width: '100%',
        height: '92%',
        backgroundColor: '#FFFFFF',
        borderRadius: 5,
        overflow: 'hidden',
    },
    documentImage: {
        width: '100%',
        height: '100%',
    },
    pageIndicator: {
        position: 'absolute',
        bottom: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        elevation: 2,
    },
    pageIndicatorText: {
        fontFamily: 'Judson-Regular',
        fontSize: 14,
        color: '#000000',
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
        backgroundColor: '#E6F0FF',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButtonText: {
        fontFamily: 'Judson-Bold',
        fontSize: 16,
        color: '#000000',
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
        backgroundColor: '#FFFFFF',
    },
    pdfPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 20,
    },
    vaultCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        padding: 25,
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    pdfIconContainer: {
        width: 100,
        height: 100,
        backgroundColor: '#F0F7FF',
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    verifiedBadge: {
        backgroundColor: '#E6F4EA',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
        marginBottom: 15,
    },
    verifiedText: {
        fontFamily: 'Judson-Bold',
        fontSize: 10,
        color: '#1E7E34',
        letterSpacing: 1,
    },
    pdfLabel: {
        fontFamily: 'Judson-Bold',
        fontSize: 18,
        color: '#000000',
        marginBottom: 6,
        textAlign: 'center',
    },
    pdfSublabel: {
        fontFamily: 'Judson-Regular',
        fontSize: 14,
        color: 'rgba(0,0,0,0.5)',
        marginBottom: 25,
        textAlign: 'center',
    },
    openPdfButton: {
        width: '100%',
        height: 55,
        borderRadius: 15,
        overflow: 'hidden',
    },
    openGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    openPdfText: {
        fontFamily: 'Judson-Bold',
        fontSize: 16,
        color: '#FFFFFF',
    },
});

export default DocumentView;

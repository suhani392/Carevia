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
import Pdf from 'react-native-pdf';
import { FileCheckIcon } from '../Documents/Icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';

const { width } = Dimensions.get('window');

const DocumentView = () => {
    const { screenParams, goBack } = useNavigation();
    const [isLoading, setIsLoading] = React.useState(false);
    const [isBusy, setIsBusy] = React.useState(false);

    const [currentPage, setCurrentPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);

    const docName = screenParams?.docName || 'Document';
    const ownerName = screenParams?.ownerName || 'Suhani Badhe';
    const docUri = screenParams?.docUri;

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

            {isPdf ? (
                <View style={styles.pdfContainer}>
                    <Text style={styles.docTitle}>{docName}</Text>
                    <View style={[styles.imageContainer, { flex: 1, aspectRatio: undefined }]}>
                        <View style={[styles.imageWrapper, { height: '100%', borderRadius: 15 }]}>
                            {isLoading && (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator color="#0062FF" size="large" />
                                </View>
                            )}
                            <Pdf
                                source={{ uri: docUri, cache: true }}
                                style={styles.pdfViewer}
                                onLoadProgress={(percent) => console.log('PDF Loading...', percent)}
                                onLoadComplete={(numberOfPages) => {
                                    console.log(`Finished loading ${numberOfPages} pages`);
                                    setTotalPages(numberOfPages);
                                    setIsLoading(false);
                                }}
                                onPageChanged={(page) => {
                                    console.log(`Current page: ${page}`);
                                    setCurrentPage(page);
                                }}
                                onError={(error: any) => {
                                    console.error('PDF Error:', error);
                                    setIsLoading(false);
                                    Alert.alert('PDF Error', error?.message || 'Unable to display this PDF.');
                                }}
                                trustAllCerts={false}
                                renderActivityIndicator={() => (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator color="#0062FF" size="large" />
                                    </View>
                                )}
                            />
                        </View>
                        <View style={styles.pageIndicator}>
                            <Text style={styles.pageIndicatorText}>
                                Page {currentPage}/{totalPages}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.actionButton, isBusy && { opacity: 0.5 }]}
                            onPress={handleShare}
                            disabled={isBusy}
                        >
                            <ShareIcon color="#000000" size={22} />
                            <Text style={styles.actionButtonText}>Share</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, isBusy && { opacity: 0.5 }]}
                            onPress={handleDownload}
                            disabled={isBusy}
                        >
                            <DownloadIcon color="#000000" size={22} />
                            <Text style={styles.actionButtonText}>Download</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Text style={styles.docTitle}>{docName}</Text>

                    <View style={styles.imageContainer}>
                        <View style={styles.imageWrapper}>
                            <Image
                                source={{ uri: docUri || 'https://img.freepik.com/free-vector/medical-report-template_23-2148509372.jpg' }}
                                style={styles.documentImage}
                                resizeMode="contain"
                                onLoadStart={() => setIsLoading(true)}
                                onLoadEnd={() => setIsLoading(false)}
                                onError={(e) => {
                                    console.error('Image Error:', e.nativeEvent.error);
                                    setIsLoading(false);
                                }}
                            />
                        </View>

                        <View style={styles.pageIndicator}>
                            <Text style={styles.pageIndicatorText}>Page 1/1</Text>
                        </View>
                    </View>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.actionButton, isBusy && { opacity: 0.5 }]}
                            onPress={handleShare}
                            disabled={isBusy}
                        >
                            <ShareIcon color="#000000" size={22} />
                            <Text style={styles.actionButtonText}>Share</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, isBusy && { opacity: 0.5 }]}
                            onPress={handleDownload}
                            disabled={isBusy}
                        >
                            <DownloadIcon color="#000000" size={22} />
                            <Text style={styles.actionButtonText}>Download</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            )}

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
    pdfViewer: {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF',
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
        zIndex: 10,
    },
    pdfContainer: {
        flex: 1,
        paddingHorizontal: 25,
        paddingTop: 30,
        paddingBottom: 20,
    },
    pdfWrapper: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
        overflow: 'hidden',
    },
});


export default DocumentView;

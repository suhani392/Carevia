import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
    ScrollView,
} from 'react-native';
import { useNavigation } from '../../context/NavigationContext';
import HomeHeader from '../Home/HomeHeader';
import AppStatusBar from '../../components/status-bar/status-bar';
import { ShareIcon, DownloadIcon } from '../Home/Icons';

const { width } = Dimensions.get('window');

const DocumentView = () => {
    const { screenParams, goBack } = useNavigation();
    const docName = screenParams?.docName || 'Document';
    const ownerName = screenParams?.ownerName || 'Suhani Badhe';

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

                <View style={styles.imageContainer}>
                    <View style={styles.imageWrapper}>
                        <Image
                            source={{ uri: 'https://img.freepik.com/free-vector/medical-report-template_23-2148509372.jpg' }}
                            style={styles.documentImage}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={styles.pageIndicator}>
                        <Text style={styles.pageIndicatorText}>Page 1/1</Text>
                    </View>
                </View>

                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.actionButton}>
                        <ShareIcon color="#000000" size={22} />
                        <Text style={styles.actionButtonText}>Share</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton}>
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
});

export default DocumentView;

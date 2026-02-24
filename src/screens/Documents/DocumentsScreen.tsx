import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Platform,
    Modal,
    TextInput,
    Alert,
    Linking,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '../../context/NavigationContext';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { FileCheckIcon, ThreeDotsIcon } from './Icons';
import * as FileSystem from 'expo-file-system/legacy';
import AppStatusBar from '../../components/status-bar/status-bar';
import HomeHeader from '../Home/HomeHeader';

// Helper to convert base64 to ArrayBuffer (more reliable for RN uploads)
const decodeBase64 = (base64: string) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const lookup = new Uint8Array(256);
    for (let i = 0; i < chars.length; i++) {
        lookup[chars.charCodeAt(i)] = i;
    }

    let bufferLength = base64.length * 0.75;
    let len = base64.length, i, p = 0;
    let encoded1, encoded2, encoded3, encoded4;

    if (base64[base64.length - 1] === "=") {
        bufferLength--;
        if (base64[base64.length - 2] === "=") bufferLength--;
    }

    const arraybuffer = new ArrayBuffer(bufferLength);
    const bytes = new Uint8Array(arraybuffer);

    for (i = 0; i < len; i += 4) {
        encoded1 = lookup[base64.charCodeAt(i)];
        encoded2 = lookup[base64.charCodeAt(i + 1)];
        encoded3 = lookup[base64.charCodeAt(i + 2)];
        encoded4 = lookup[base64.charCodeAt(i + 3)];

        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }
    return arraybuffer;
};

const { width } = Dimensions.get('window');

interface Document {
    id: string;
    name: string;
    date: string;
    timestamp: number;
    uri?: string;
}

const DocumentsScreen = () => {
    const { screenParams, goBack, navigate } = useNavigation();
    const { documents, addDocument, updateDocument, deleteDocument, addUpdate, userProfile } = useAppContext();
    const firstName = screenParams?.name ? screenParams.name.split(' ')[0] : '';
    const subTitleText = screenParams?.name ? `${firstName}'s Documents` : 'My Documents';
    const isOwner = !screenParams?.name;

    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [isActionMenuVisible, setIsActionMenuVisible] = useState(false);
    const [isFilterDropdownVisible, setIsFilterDropdownVisible] = useState(false);
    const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<any>(null);
    const [newName, setNewName] = useState('');
    const [loading, setLoading] = useState(false);
    const [memberDocuments, setMemberDocuments] = useState<Document[]>([]);
    const [isFetchingMember, setIsFetchingMember] = useState(false);

    const memberId = screenParams?.memberId;
    const currentDocs = memberId ? memberDocuments : documents;

    const dropdownAnim = useRef(new Animated.Value(0)).current;
    const actionMenuAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(dropdownAnim, {
            toValue: isFilterDropdownVisible ? 1 : 0,
            useNativeDriver: true,
            friction: 8,
            tension: 40,
        }).start();
    }, [isFilterDropdownVisible]);

    useEffect(() => {
        if (isActionMenuVisible) {
            Animated.spring(actionMenuAnim, {
                toValue: 1,
                useNativeDriver: true,
                friction: 8,
                tension: 40,
            }).start();
        } else {
            actionMenuAnim.setValue(0);
        }
    }, [isActionMenuVisible]);

    useEffect(() => {
        if (memberId) {
            fetchMemberDocuments();
        }
    }, [memberId]);

    const fetchMemberDocuments = async () => {
        if (!memberId) return;
        setIsFetchingMember(true);
        try {
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('user_id', memberId)
                .order('uploaded_at', { ascending: false });

            if (error) throw error;
            if (data) {
                setMemberDocuments(data.map(d => ({
                    id: d.id,
                    name: d.original_name,
                    date: new Date(d.uploaded_at || d.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                    timestamp: new Date(d.uploaded_at || d.created_at).getTime(),
                    uri: d.file_path
                })));
            }
        } catch (error) {
            console.error('Error fetching member documents:', error);
        } finally {
            setIsFetchingMember(false);
        }
    };

    const sortedDocuments = [...currentDocs].sort((a, b) => {
        if (sortOrder === 'newest') return b.timestamp - a.timestamp;
        return a.timestamp - b.timestamp;
    });

    const handleAddDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setLoading(true);
                const asset = result.assets[0];

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('User not found');

                const targetUserId = memberId || user.id;
                const fileName = `${Date.now()}_${asset.name.replace(/\s+/g, '_')}`;
                const filePath = `${targetUserId}/docs/${fileName}`;

                // Read file as base64 - bypasses RN fetch/blob bugs for physical uploads
                const base64 = await FileSystem.readAsStringAsync(asset.uri, {
                    encoding: 'base64',
                });

                const arrayBuffer = decodeBase64(base64);
                const contentType = asset.mimeType || 'application/octet-stream';

                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(filePath, arrayBuffer, {
                        contentType,
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('documents')
                    .getPublicUrl(filePath);

                // If adding to my own docs, use the global function
                if (!memberId) {
                    await addDocument(asset.name, publicUrl);
                } else {
                    // For member docs, we update locally and the creator is logged user
                    const { data: dbEntry, error: dbError } = await supabase
                        .from('documents')
                        .insert({
                            user_id: memberId,
                            original_name: asset.name,
                            file_path: publicUrl,
                            file_type: asset.name.split('.').pop() || 'unknown'
                        })
                        .select()
                        .single();

                    if (dbError) throw dbError;

                    const newDoc: Document = {
                        id: dbEntry.id,
                        name: dbEntry.original_name,
                        date: new Date(dbEntry.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                        timestamp: new Date(dbEntry.created_at).getTime(),
                        uri: dbEntry.file_path
                    };
                    setMemberDocuments(prev => [newDoc, ...prev]);
                    await addUpdate("Me", `You added a new document to ${screenParams.name}'s section: ${asset.name}`);
                }
                Alert.alert('Success', 'Document added successfully');
            }
        } catch (error: any) {
            console.error('Error adding document:', error);
            Alert.alert('Upload Failed', error.message || 'Failed to upload document');
        } finally {
            setLoading(false);
        }
    };



    const handleAction = (action: string) => {
        setIsActionMenuVisible(false);
        if (!selectedDoc) return;

        switch (action) {
            case 'View':
                const generateAndView = async () => {
                    if (!selectedDoc.uri) return;
                    try {
                        const pathParts = selectedDoc.uri.split('/documents/');
                        const filePath = pathParts[pathParts.length - 1];
                        const { data, error } = await supabase.storage.from('documents').createSignedUrl(filePath, 3600);
                        navigate('document_view', {
                            docName: selectedDoc.name,
                            ownerName: screenParams?.name || userProfile?.full_name || 'Me',
                            docUri: data?.signedUrl || selectedDoc.uri
                        });
                    } catch (e) {
                        navigate('document_view', {
                            docName: selectedDoc.name,
                            ownerName: screenParams?.name || userProfile?.full_name || 'Me',
                            docUri: selectedDoc.uri
                        });
                    }
                };
                generateAndView();
                break;
            case 'Rename':
                setNewName(selectedDoc.name);
                setIsRenameModalVisible(true);
                break;
            case 'Delete':
                Alert.alert(
                    'Delete Document',
                    'Are you sure you want to delete this document?',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => deleteDocument(selectedDoc.id)
                        },
                    ]
                );
                break;
            case 'Share':
                Alert.alert('Share', `Sharing ${selectedDoc.name}`);
                break;
        }
    };

    const submitRename = async () => {
        if (selectedDoc && newName.trim()) {
            await updateDocument(selectedDoc.id, newName.trim());
            setIsRenameModalVisible(false);
            setSelectedDoc(null);
        }
    };


    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        if (hour < 21) return 'Good Evening';
        return 'Good Night';
    };

    const getCurrentDate = () => {
        return new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    };

    return (
        <View style={styles.container}>
            <AppStatusBar />
            <HomeHeader
                showBackButton={true}
                onBackPress={goBack}
                showActionRow={false}
                showUserBlock={false}
                showRightIcon={false}
                centerTitle={true}
                title="Carevia"
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.titleRow}>
                    <Text style={styles.pageTitle}>{subTitleText}</Text>
                    <View>
                        <TouchableOpacity
                            style={styles.filterButton}
                            onPress={() => setIsFilterDropdownVisible(!isFilterDropdownVisible)}
                        >
                            <Text style={styles.filterText}>
                                {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
                            </Text>
                            <Text style={styles.filterArrow}>▼</Text>
                        </TouchableOpacity>

                        <Animated.View style={[
                            styles.filterDropdown,
                            {
                                opacity: dropdownAnim,
                                transform: [
                                    { scale: dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
                                    { translateY: dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }
                                ],
                                pointerEvents: isFilterDropdownVisible ? 'auto' : 'none'
                            }
                        ]}>
                            <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => {
                                    setSortOrder('newest');
                                    setIsFilterDropdownVisible(false);
                                }}
                            >
                                <Text style={styles.dropdownText}>Newest First</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => {
                                    setSortOrder('oldest');
                                    setIsFilterDropdownVisible(false);
                                }}
                            >
                                <Text style={styles.dropdownText}>Oldest First</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </View>

                <Text style={styles.subtitle}>
                    {isOwner ? 'Your uploaded medical documents' : `${firstName}'s uploaded documents`}
                </Text>

                <View style={styles.documentsList}>
                    {sortedDocuments.length > 0 ? (
                        sortedDocuments.map((doc) => {
                            const handleDocPress = async () => {
                                if (!doc.uri) return;
                                try {
                                    // Extract the relative path from the stored URL
                                    // The URL looks like: .../storage/v1/object/public/documents/USER_ID/docs/FILE.pdf
                                    // But since we use getPublicUrl, it might be the public one. 
                                    // We need to pass the raw path to createSignedUrl.
                                    // Actually, it's better if we store the path in AppContext, 
                                    // but we can extract it if we know the bucket.
                                    const pathParts = doc.uri.split('/documents/');
                                    const filePath = pathParts[pathParts.length - 1];

                                    const { data, error } = await supabase.storage
                                        .from('documents')
                                        .createSignedUrl(filePath, 3600);

                                    if (error) throw error;

                                    navigate('document_view', {
                                        docName: doc.name,
                                        ownerName: screenParams?.name || userProfile?.full_name || 'Me',
                                        docUri: data.signedUrl
                                    });
                                } catch (error) {
                                    console.error('Error generating signed URL:', error);
                                    // Fallback to direct URI if signing fails (might be a public asset)
                                    navigate('document_view', {
                                        docName: doc.name,
                                        ownerName: screenParams?.name || userProfile?.full_name || 'Me',
                                        docUri: doc.uri
                                    });
                                }
                            };

                            return (
                                <TouchableOpacity
                                    key={doc.id}
                                    style={styles.docCard}
                                    onPress={handleDocPress}
                                    onLongPress={() => {
                                        setSelectedDoc(doc);
                                        setIsActionMenuVisible(true);
                                    }}
                                >
                                    <View style={styles.docIconContainer}>
                                        <View style={styles.whiteBox}>
                                            <FileCheckIcon size={25} />
                                        </View>
                                    </View>
                                    <View style={styles.docInfo}>
                                        <Text style={styles.docName}>{doc.name}</Text>
                                        <Text style={styles.docDate}>Uploaded on {doc.date}</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setSelectedDoc(doc);
                                            setIsActionMenuVisible(true);
                                        }}
                                        style={styles.moreButton}
                                    >
                                        <ThreeDotsIcon color="rgba(0,0,0,0.6)" />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            );
                        })
                    ) : (
                        <Text style={styles.emptyText}>You haven’t added any documents yet.</Text>
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity style={styles.fab} onPress={handleAddDocument} disabled={loading}>
                <Text style={styles.fabIcon}>{loading ? '...' : '+'}</Text>
            </TouchableOpacity>

            {/* Action Menu Modal - Gradient & Radius 50 */}
            <Modal
                transparent
                visible={isActionMenuVisible}
                animationType="fade"
                onRequestClose={() => setIsActionMenuVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsActionMenuVisible(false)}
                >
                    <Animated.View style={{
                        transform: [{ scale: actionMenuAnim }],
                        opacity: actionMenuAnim
                    }}>
                        <LinearGradient
                            colors={['#0062FF', '#5C8EDF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.menuGradient}
                        >
                            {['Rename', 'Delete'].map((action, index) => (
                                <TouchableOpacity
                                    key={action}
                                    style={[
                                        styles.menuItem,
                                        index === 1 && { borderBottomWidth: 0 }
                                    ]}
                                    onPress={() => handleAction(action)}
                                >
                                    <Text style={styles.menuItemText}>{action}</Text>
                                </TouchableOpacity>
                            ))}
                        </LinearGradient>
                    </Animated.View>
                </TouchableOpacity>
            </Modal>

            {/* Rename Modal */}
            <Modal
                transparent
                visible={isRenameModalVisible}
                animationType="slide"
                onRequestClose={() => setIsRenameModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.dialogContainer}>
                        <Text style={styles.dialogTitle}>Rename Document</Text>
                        <TextInput
                            style={styles.renameInput}
                            value={newName}
                            onChangeText={setNewName}
                            autoFocus
                        />
                        <View style={styles.dialogButtons}>
                            <TouchableOpacity onPress={() => setIsRenameModalVisible(false)}>
                                <Text style={styles.dialogCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={submitRename}>
                                <Text style={styles.dialogSubmitText}>Rename</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        zIndex: 10,
    },
    pageTitle: {
        fontFamily: 'Judson-Bold',
        fontSize: 22,
        color: '#000000',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(204, 204, 204, 0.4)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    filterText: {
        fontFamily: 'Judson-Regular',
        fontSize: 16, // Increased font size
        color: '#000000',
        marginRight: 8,
    },
    filterArrow: {
        fontSize: 10,
        color: '#000000',
    },
    filterDropdown: {
        position: 'absolute',
        top: 50, // Adjusted for larger button
        right: 0,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        width: 140, // Increased width
        zIndex: 100,
    },
    dropdownItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    dropdownText: {
        fontFamily: 'Judson-Regular',
        fontSize: 14,
        color: '#000000',
    },
    subtitle: {
        fontFamily: 'Judson-Regular',
        fontSize: 16,
        color: '#000000',
        marginBottom: 20,
    },
    documentsList: {
        width: '100%',
    },
    docCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 98, 255, 0.15)',
        borderRadius: 20,
        padding: 12,
        marginBottom: 15,
    },
    docIconContainer: {
        marginRight: 15,
    },
    whiteBox: {
        width: 50,
        height: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    docInfo: {
        flex: 1,
    },
    docName: {
        fontFamily: 'Judson-Bold', // Strict Judson usage
        fontSize: 18,
        color: '#000000',
        marginBottom: 4,
    },
    docDate: {
        fontFamily: 'Judson-Regular',
        fontSize: 14,
        color: 'rgba(0,0,0,0.6)',
    },
    moreButton: {
        padding: 10,
    },
    emptyText: {
        fontFamily: 'Judson-Regular',
        fontSize: 16,
        color: 'rgba(0,0,0,0.5)',
        textAlign: 'center',
        marginTop: 50,
    },
    fab: {
        position: 'absolute',
        bottom: 40,
        right: 25,
        width: 65,
        height: 65,
        backgroundColor: '#0062FF',
        borderRadius: 32.5,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
    fabIcon: {
        fontSize: 35,
        color: '#FFFFFF',
        marginTop: -3,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuGradient: {
        borderRadius: 15, // Corner radius 15 as requested
        width: 200,
        padding: 10,
        elevation: 10,
        overflow: 'hidden',
    },
    menuItem: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    },
    menuItemText: {
        fontFamily: 'Judson-Bold',
        fontSize: 16,
        color: '#FFFFFF',
        textAlign: 'center',
    },
    dialogContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        width: '80%',
        padding: 20,
        elevation: 5,
    },
    dialogTitle: {
        fontFamily: 'Judson-Bold',
        fontSize: 20,
        color: '#000000',
        marginBottom: 15,
    },
    renameInput: {
        width: '100%',
        height: 50,
        backgroundColor: '#F5F5F5',
        borderRadius: 10,
        paddingHorizontal: 15,
        fontFamily: 'Judson-Regular',
        fontSize: 16,
        color: '#000000',
        marginBottom: 20,
    },
    dialogButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    dialogCancelText: {
        fontFamily: 'Judson-Bold',
        fontSize: 16,
        color: '#666666',
        marginRight: 20,
    },
    dialogSubmitText: {
        fontFamily: 'Judson-Bold',
        fontSize: 16,
        color: '#0062FF',
    }
});

export default DocumentsScreen;

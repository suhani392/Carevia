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
    const { documents, addDocument, updateDocument, deleteDocument, addUpdate, userProfile, t, language, colors } = useAppContext();


    const firstName = screenParams?.name ? screenParams.name.split(' ')[0] : '';
    const subTitleText = screenParams?.name ? `${firstName}${t('docs_title_other')}` : t('docs_title_me');

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
                const localeMapping: any = { en: 'en-GB', mr: 'mr-IN', hi: 'hi-IN' };
                setMemberDocuments(data.map(d => ({
                    id: d.id,
                    name: d.original_name,
                    date: new Date(d.uploaded_at || d.created_at).toLocaleDateString(localeMapping[language] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
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

                    const localeMapping: any = { en: 'en-GB', mr: 'mr-IN', hi: 'hi-IN' };
                    const newDoc: Document = {
                        id: dbEntry.id,
                        name: dbEntry.original_name,
                        date: new Date(dbEntry.created_at).toLocaleDateString(localeMapping[language] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                        timestamp: new Date(dbEntry.created_at).getTime(),
                        uri: dbEntry.file_path
                    };
                    setMemberDocuments(prev => [newDoc, ...prev]);

                    await addUpdate(`Uploaded a doc on ${screenParams.name}'s documents : ${asset.name}`);
                }
                Alert.alert(t('done'), t('done'));
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
                    t('delete_doc'),
                    t('delete_doc_confirm'),
                    [
                        { text: t('cancel'), style: 'cancel' },
                        {
                            text: t('delete'),
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
        if (hour < 12) return t('good_morning');
        if (hour < 17) return t('good_afternoon');
        if (hour < 21) return t('good_evening');
        return t('good_night');
    };


    const getCurrentDate = () => {
        return new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
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
                    <Text style={[styles.pageTitle, { color: colors.text }]}>{subTitleText}</Text>
                    <View>
                        <TouchableOpacity
                            style={[styles.filterButton, { backgroundColor: colors.card }]}
                            onPress={() => setIsFilterDropdownVisible(!isFilterDropdownVisible)}
                        >
                            <Text style={[styles.filterText, { color: colors.text }]}>
                                {sortOrder === 'newest' ? t('sort_newest') : t('sort_oldest')}
                            </Text>
                            <Text style={[styles.filterArrow, { color: colors.text }]}>▼</Text>
                        </TouchableOpacity>


                        <Animated.View style={[
                            styles.filterDropdown,
                            {
                                backgroundColor: colors.modalBg,
                                opacity: dropdownAnim,
                                transform: [
                                    { scale: dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
                                    { translateY: dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }
                                ],
                                pointerEvents: isFilterDropdownVisible ? 'auto' : 'none'
                            }
                        ]}>
                            <TouchableOpacity
                                style={[styles.dropdownItem, { borderBottomColor: colors.divider }]}
                                onPress={() => {
                                    setSortOrder('newest');
                                    setIsFilterDropdownVisible(false);
                                }}
                            >
                                <Text style={[styles.dropdownText, { color: colors.text }]}>{t('sort_newest')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.dropdownItem, { borderBottomColor: colors.divider }]}
                                onPress={() => {
                                    setSortOrder('oldest');
                                    setIsFilterDropdownVisible(false);
                                }}
                            >
                                <Text style={[styles.dropdownText, { color: colors.text }]}>{t('sort_oldest')}</Text>
                            </TouchableOpacity>

                        </Animated.View>
                    </View>
                </View>

                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {isOwner ? t('docs_subtitle_me') : `${firstName}${t('docs_subtitle_other')}`}
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
                                    style={[styles.docCard, { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1 }]}
                                    onPress={handleDocPress}
                                    onLongPress={!memberId ? () => {
                                        setSelectedDoc(doc);
                                        setIsActionMenuVisible(true);
                                    } : undefined}

                                >
                                    <View style={styles.docIconContainer}>
                                        <View style={[styles.whiteBox, { backgroundColor: colors.primaryLight }]}>
                                            <FileCheckIcon size={25} color={colors.primary} />
                                        </View>
                                    </View>
                                    <View style={styles.docInfo}>
                                        <Text style={[styles.docName, { color: colors.text }]}>{doc.name}</Text>
                                        <Text style={[styles.docDate, { color: colors.textSecondary }]}>{t('uploaded_on')} {doc.date}</Text>
                                    </View>

                                    {!memberId && (
                                        <TouchableOpacity
                                            onPress={() => {
                                                setSelectedDoc(doc);
                                                setIsActionMenuVisible(true);
                                            }}
                                            style={styles.moreButton}
                                        >
                                            <ThreeDotsIcon color={colors.textSecondary} />
                                        </TouchableOpacity>
                                    )}

                                </TouchableOpacity>
                            );
                        })
                    ) : (
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('empty_docs_msg')}</Text>
                    )}

                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={handleAddDocument} disabled={loading}>
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
                            colors={colors.headerGradient as any}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.menuGradient}
                        >
                            {['view', 'rename', 'delete'].map((action, index) => (
                                <TouchableOpacity
                                    key={action}
                                    style={[
                                        styles.menuItem,
                                        index === 2 && { borderBottomWidth: 0 }
                                    ]}
                                    onPress={() => handleAction(action.charAt(0).toUpperCase() + action.slice(1))}
                                >
                                    <Text style={styles.menuItemText}>{t(action)}</Text>
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
                    <View style={[styles.dialogContainer, { backgroundColor: colors.modalBg }]}>
                        <Text style={[styles.dialogTitle, { color: colors.text }]}>{t('rename_doc')}</Text>

                        <TextInput
                            style={[styles.renameInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, borderWidth: 1 }]}
                            value={newName}
                            onChangeText={setNewName}
                            autoFocus
                        />
                        <View style={styles.dialogButtons}>
                            <TouchableOpacity onPress={() => setIsRenameModalVisible(false)}>
                                <Text style={[styles.dialogCancelText, { color: colors.textSecondary }]}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={submitRename}>
                                <Text style={[styles.dialogSubmitText, { color: colors.primary }]}>{t('rename')}</Text>
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
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    filterText: {
        fontFamily: 'Judson-Regular',
        fontSize: 16, // Increased font size
        marginRight: 8,
    },
    filterArrow: {
        fontSize: 10,
    },
    filterDropdown: {
        position: 'absolute',
        top: 50, // Adjusted for larger button
        right: 0,
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
    },
    dropdownText: {
        fontFamily: 'Judson-Regular',
        fontSize: 14,
    },
    subtitle: {
        fontFamily: 'Judson-Regular',
        fontSize: 16,
        marginBottom: 20,
    },
    documentsList: {
        width: '100%',
    },
    docCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        padding: 12,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    docIconContainer: {
        marginRight: 15,
    },
    whiteBox: {
        width: 50,
        height: 50,
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
        marginBottom: 4,
    },
    docDate: {
        fontFamily: 'Judson-Regular',
        fontSize: 14,
    },
    moreButton: {
        padding: 10,
    },
    emptyText: {
        fontFamily: 'Judson-Regular',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 50,
    },
    fab: {
        position: 'absolute',
        bottom: 40,
        right: 25,
        width: 65,
        height: 65,
        borderRadius: 32.5,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#0062FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
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
        borderRadius: 20,
        width: '80%',
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    dialogTitle: {
        fontFamily: 'Judson-Bold',
        fontSize: 20,
        marginBottom: 15,
    },
    renameInput: {
        width: '100%',
        height: 50,
        borderRadius: 10,
        paddingHorizontal: 15,
        fontFamily: 'Judson-Regular',
        fontSize: 16,
        marginBottom: 20,
    },
    dialogButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    dialogCancelText: {
        fontFamily: 'Judson-Bold',
        fontSize: 16,
        marginRight: 20,
    },
    dialogSubmitText: {
        fontFamily: 'Judson-Bold',
        fontSize: 16,
    }
});

export default DocumentsScreen;

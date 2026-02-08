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
import { FileCheckIcon, ThreeDotsIcon } from './Icons';
import AppStatusBar from '../../components/status-bar/status-bar';
import HomeHeader from '../Home/HomeHeader';

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
    const { addUpdate } = useAppContext();
    const subTitleText = screenParams?.name ? `${screenParams.name}'s Documents` : 'My Documents';
    const isOwner = !screenParams?.name;

    const [documents, setDocuments] = useState<Document[]>([
        { id: '1', name: 'Blood Test Report', date: '28 Jan 2026', timestamp: 1738022400000 },
        { id: '2', name: 'X Ray Chest', date: '28 Jan 2026', timestamp: 1738022400001 },
        { id: '3', name: 'Prescription', date: '28 Jan 2026', timestamp: 1738022400002 },
        { id: '4', name: 'Allergies Report', date: '28 Jan 2026', timestamp: 1738022400003 },
    ]);

    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [isActionMenuVisible, setIsActionMenuVisible] = useState(false);
    const [isFilterDropdownVisible, setIsFilterDropdownVisible] = useState(false);
    const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [newName, setNewName] = useState('');

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

    const sortedDocuments = [...documents].sort((a, b) => {
        if (sortOrder === 'newest') return b.timestamp - a.timestamp;
        return a.timestamp - b.timestamp;
    });

    const addDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'], // Restrict to image and pdf
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                const newDoc: Document = {
                    id: Date.now().toString(),
                    name: asset.name,
                    date: new Date().toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    }),
                    timestamp: Date.now(),
                    uri: asset.uri,
                };
                setDocuments([newDoc, ...documents]);

                // Add to Family Updates
                const userName = screenParams?.name || 'You';
                const updateName = screenParams?.name || 'Me';
                addUpdate(updateName, `${userName} added a new document: ${asset.name}`);
            }
        } catch (error) {
            console.error('Error picking document:', error);
            Alert.alert('Error', 'Failed to pick a document');
        }
    };

    const handleAction = (action: string) => {
        setIsActionMenuVisible(false);
        if (!selectedDoc) return;

        switch (action) {
            case 'View':
                if (selectedDoc.uri) {
                    Linking.openURL(selectedDoc.uri).catch(err => {
                        console.error("Couldn't load page", err);
                        Alert.alert('Error', 'Cannot open this file type');
                    });
                } else {
                    Alert.alert('Notice', 'This is a sample document and does not have a real file attached.');
                }
                break;
            case 'Rename':
                setNewName(selectedDoc.name);
                setIsRenameModalVisible(true);
                break;
            case 'Delete':
                setDocuments(documents.filter(doc => doc.id !== selectedDoc.id));
                break;
            case 'Share':
                Alert.alert('Share', `Sharing ${selectedDoc.name}`);
                break;
        }
    };

    const submitRename = () => {
        if (selectedDoc && newName.trim()) {
            setDocuments(documents.map(doc =>
                doc.id === selectedDoc.id ? { ...doc, name: newName.trim() } : doc
            ));
            setIsRenameModalVisible(false);
            setSelectedDoc(null);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
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
                    {isOwner ? 'Your uploaded medical documents' : `${screenParams.name}'s uploaded documents`}
                </Text>

                <View style={styles.documentsList}>
                    {sortedDocuments.length > 0 ? (
                        sortedDocuments.map((doc) => (
                            <TouchableOpacity
                                key={doc.id}
                                style={styles.docCard}
                                onPress={() => navigate('document_view', { docName: doc.name, ownerName: screenParams?.name || 'Suhani Badhe' })}
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
                        ))
                    ) : (
                        <Text style={styles.emptyText}>You haven’t added any documents yet.</Text>
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity style={styles.fab} onPress={addDocument}>
                <Text style={styles.fabIcon}>+</Text>
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

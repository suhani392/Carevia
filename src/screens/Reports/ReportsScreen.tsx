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
import { useNavigation } from '../../context/NavigationContext';
import { useAppContext, Report } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { BackIcon, FileCheckIcon, ThreeDotsIcon } from './Icons';
import AppStatusBar from '../../components/status-bar/status-bar';
import HomeHeader from '../Home/HomeHeader';

const { width } = Dimensions.get('window');

const ReportsScreen = () => {
    const { screenParams, goBack, navigate } = useNavigation();
    const { reports, updateReport, deleteReport, userProfile, addUpdate, t, language, colors } = useAppContext();



    const [memberReports, setMemberReports] = useState<Report[]>([]);
    const [isFetchingMember, setIsFetchingMember] = useState(false);

    const memberId = screenParams?.memberId;
    const currentReports = memberId ? memberReports : reports;
    const firstName = screenParams?.name ? screenParams.name.split(' ')[0] : '';
    const pageTitle = memberId ? `${firstName}${t('reports_title_other')}` : t('reports_title_me');


    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [isActionMenuVisible, setIsActionMenuVisible] = useState(false);
    const [isFilterDropdownVisible, setIsFilterDropdownVisible] = useState(false);
    const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
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

    useEffect(() => {
        if (memberId) {
            fetchMemberReports();
        }
    }, [memberId]);

    const fetchMemberReports = async () => {
        if (!memberId) return;
        setIsFetchingMember(true);
        try {
            const { data, error } = await supabase
                .from('reports')
                .select('*')
                .eq('user_id', memberId)
                .eq('is_saved', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) {
                const localeMapping: any = { en: 'en-GB', mr: 'mr-IN', hi: 'hi-IN' };
                setMemberReports(data.map(r => ({
                    id: r.id,
                    name: r.name,
                    date: new Date(r.created_at).toLocaleDateString(localeMapping[language] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                    timestamp: new Date(r.created_at).getTime(),
                    uri: r.uri,
                    analysis: r.analysis
                })));
            }

        } catch (error) {
            console.error('Error fetching member reports:', error);
        } finally {
            setIsFetchingMember(false);
        }
    };

    const sortedReports = [...currentReports].sort((a, b) => {
        if (sortOrder === 'newest') return b.timestamp - a.timestamp;
        return a.timestamp - b.timestamp;
    });



    const handleAction = (action: string) => {
        setIsActionMenuVisible(false);
        if (!selectedReport) return;

        switch (action) {
            case 'View':
                const generateAndView = async () => {
                    if (!selectedReport.uri) return;
                    try {
                        const pathParts = selectedReport.uri.split('/reports/');
                        const filePath = pathParts[pathParts.length - 1];
                        const { data, error } = await supabase.storage.from('reports').createSignedUrl(filePath, 3600);
                        navigate('document_view', {
                            docName: selectedReport.name,
                            ownerName: userProfile?.full_name || 'Me',
                            docUri: data?.signedUrl || selectedReport.uri
                        });
                    } catch (e) {
                        navigate('document_view', {
                            docName: selectedReport.name,
                            ownerName: userProfile?.full_name || 'Me',
                            docUri: selectedReport.uri
                        });
                    }
                };
                generateAndView();
                break;
            case 'Rename':
                setNewName(selectedReport.name);
                setIsRenameModalVisible(true);
                break;
            case 'Delete':
                Alert.alert(
                    t('delete_report'),
                    t('delete_report_confirm'),
                    [
                        { text: t('cancel'), style: 'cancel' },
                        {
                            text: t('delete'),
                            style: 'destructive',
                            onPress: () => deleteReport(selectedReport.id)
                        },
                    ]
                );
                break;

            case 'Share':
                Alert.alert('Share', `Sharing ${selectedReport.name}`);
                break;
        }
    };

    const submitRename = async () => {
        if (selectedReport && newName.trim()) {
            await updateReport(selectedReport.id, newName.trim());
            setIsRenameModalVisible(false);
            setSelectedReport(null);
        }
    };


    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>

            <AppStatusBar />

            {/* Header */}
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
                    <Text style={[styles.pageTitle, { color: colors.text }]}>{pageTitle}</Text>
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

                <View style={styles.reportsList}>
                    {sortedReports.length > 0 ? (
                        sortedReports.map((report) => {
                            const handleReportPress = async () => {
                                if (!report.uri) return;
                                try {
                                    // Extract path from public URL
                                    const pathParts = report.uri.split('/reports/');
                                    const filePath = pathParts[pathParts.length - 1];

                                    const { data, error } = await supabase.storage
                                        .from('reports')
                                        .createSignedUrl(filePath, 3600);

                                    if (error) throw error;

                                    navigate('document_view', {
                                        docName: report.name,
                                        ownerName: userProfile?.full_name || 'Me',
                                        docUri: data.signedUrl
                                    });
                                } catch (error) {
                                    console.error('Error signing report URL:', error);
                                    navigate('document_view', {
                                        docName: report.name,
                                        ownerName: userProfile?.full_name || 'Me',
                                        docUri: report.uri
                                    });
                                }
                            };

                            return (
                                <TouchableOpacity
                                    key={report.id}
                                    style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1 }]}
                                    onPress={handleReportPress}
                                    onLongPress={!memberId ? () => {
                                        setSelectedReport(report);
                                        setIsActionMenuVisible(true);
                                    } : undefined}

                                >
                                    <View style={styles.reportIconContainer}>
                                        <View style={[styles.whiteBox, { backgroundColor: colors.primaryLight }]}>
                                            <FileCheckIcon size={25} color={colors.primary} />
                                        </View>
                                    </View>
                                    <View style={styles.reportInfo}>
                                        <Text style={[styles.reportName, { color: colors.text }]}>{report.name}</Text>
                                        <Text style={[styles.reportDate, { color: colors.textSecondary }]}>{t('uploaded_on')} {report.date}</Text>
                                    </View>


                                    {!memberId && (
                                        <TouchableOpacity
                                            onPress={() => {
                                                setSelectedReport(report);
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
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('empty_reports_msg')}</Text>
                    )}


                </View>

                <View style={{ height: 100 }} />
            </ScrollView>



            {/* Action Menu Modal */}
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
                        <Text style={[styles.dialogTitle, { color: colors.text }]}>Rename Report</Text>
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
        marginBottom: 20,
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
        fontSize: 16,
        marginRight: 8,
    },
    filterArrow: {
        fontSize: 10,
    },
    filterDropdown: {
        position: 'absolute',
        top: 50,
        right: 0,
        borderRadius: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        width: 140,
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
    reportsList: {
        width: '100%',
    },
    reportCard: {
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
    reportIconContainer: {
        marginRight: 15,
    },
    whiteBox: {
        width: 50,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reportInfo: {
        flex: 1,
    },
    reportName: {
        fontFamily: 'Judson-Bold',
        fontSize: 18,
        marginBottom: 4,
    },
    reportDate: {
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

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuGradient: {
        borderRadius: 15,
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

export default ReportsScreen;

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, Image, Dimensions, TouchableOpacity, Modal, TextInput, Alert, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import HomeHeader from '../Home/HomeHeader';
import AppStatusBar from '../../components/status-bar/status-bar';
import Menu from '../../components/navigation/menu-drawer/menu';
import { useNavigation } from '../../context/NavigationContext';
import { useAppContext } from '../../context/AppContext';
import { getAvatarSource } from '../../lib/avatars';


const { width } = Dimensions.get('window');

const FamilyScreen = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [memberEmail, setMemberEmail] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [activeMemberId, setActiveMemberId] = useState<string | null>(null);

    const { navigate } = useNavigation();
    const {
        familyMembers,
        invitations,
        sendInvitation,
        acceptInvitation,
        rejectInvitation,
        refreshData,
        loading,
        userEmail,
        invitationError,
        cancelInvitation,
        removeFamilyMember,
        t,
        colors,
        themeMode
    } = useAppContext();


    const onRefresh = async () => {
        setRefreshing(true);
        await refreshData();
        setRefreshing(false);
    };

    const handleSendInvitation = async () => {
        if (!memberEmail.trim()) return;

        try {
            await sendInvitation(memberEmail.trim());
            Alert.alert(t('invite'), `${t('sent_to')} ${memberEmail}`);
            setShowAddModal(false);
            setMemberEmail('');
        } catch (error: any) {
            Alert.alert(t('status'), error.message || t('status'));
        }

    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <AppStatusBar />
            {isMenuOpen && <Menu onClose={() => setIsMenuOpen(false)} />}

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
                }
            >
                <HomeHeader onMenuPress={() => setIsMenuOpen(true)} showActionRow={false} />

                {loading && (
                    <View style={styles.loadingContainer}>
                        <Text style={[styles.loadingText, { color: colors.primary }]}>{t('loading')}</Text>
                    </View>
                )}


                <View style={[styles.section, { marginBottom: 10 }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('family_invites')}</Text>
                    </View>


                    {invitations.length > 0 ? (
                        <View style={styles.invitesContainer}>
                            {invitations.map((invite) => (
                                <View key={invite.id} style={[styles.inviteCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                                    <View style={styles.inviteInfo}>
                                        <Text style={[styles.inviteSender, { color: colors.primary }]}>
                                            {invite.type === 'received' ? invite.sender_name : `${t('sent_to')} ${invite.receiver_email}`}
                                        </Text>
                                        <Text style={[styles.inviteText, { color: colors.textSecondary }]}>
                                            {invite.type === 'received'
                                                ? t('invited_you')
                                                : t('waiting_acceptance')}
                                        </Text>
                                    </View>

                                    <View style={styles.inviteActions}>
                                        {invite.type === 'received' ? (
                                            <>
                                                <TouchableOpacity
                                                    style={[styles.rejectButton, { backgroundColor: colors.surface }]}
                                                    onPress={() => rejectInvitation(invite.id)}
                                                >
                                                    <Text style={[styles.rejectButtonText, { color: colors.textSecondary }]}>{t('reject')}</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={styles.acceptButton}
                                                    onPress={() => acceptInvitation(invite.id)}
                                                >
                                                    <LinearGradient
                                                        colors={themeMode === 'dark' ? ['#003366', '#001A33'] : ['#0062FF', '#5C8EDF']}
                                                        style={styles.acceptButtonGradient}
                                                    >
                                                        <Text style={styles.acceptButtonText}>{t('accept')}</Text>
                                                    </LinearGradient>
                                                </TouchableOpacity>
                                            </>
                                        ) : (
                                            <TouchableOpacity
                                                style={[styles.rejectButton, { backgroundColor: colors.surface }]}
                                                onPress={() => {
                                                    Alert.alert(
                                                        t('cancel_request'),
                                                        t('remove_member_confirm'),
                                                        [
                                                            { text: t('cancel'), style: "cancel" },
                                                            { text: t('cancel_request'), onPress: () => cancelInvitation(invite.id), style: "destructive" }
                                                        ]
                                                    );
                                                }}
                                            >
                                                <Text style={[styles.rejectButtonText, { color: colors.error }]}>{t('cancel_request')}</Text>
                                            </TouchableOpacity>

                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={[styles.emptyInvitesCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                            <Text style={[styles.emptyInvitesText, { color: colors.textSecondary }]}>
                                {t('no_pending_invites')}
                            </Text>

                            {invitationError && (
                                <Text style={[styles.debugEmailText, { color: colors.error, textAlign: 'center' }]}>
                                    Your Supabase RLS policy might be blocking this. Please check your "invitations" table permissions.
                                </Text>
                            )}
                            <Text style={[styles.debugEmailText, { color: colors.textSecondary }]}>Checking for: {userEmail || 'your email'}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('family_members')}</Text>
                        <TouchableOpacity
                            style={[styles.addMemberButton, { backgroundColor: colors.primary }]}
                            activeOpacity={0.8}
                            onPress={() => setShowAddModal(true)}
                        >
                            <Text style={styles.addMemberText}>{t('add_member')}</Text>
                        </TouchableOpacity>
                    </View>


                    <View style={styles.memberGrid}>
                        {!loading && familyMembers.length > 0 ? (
                            familyMembers.map((member, index) => (
                                <View key={index} style={[styles.memberCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() => setActiveMemberId(activeMemberId === member.id ? null : member.id)}
                                        style={styles.memberInfoRow}
                                    >
                                        {member.image && getAvatarSource(member.image) ? (
                                            <Image source={getAvatarSource(member.image)} style={styles.memberAvatar} />
                                        ) : (
                                            <View style={[styles.memberAvatar, styles.avatarPlaceholder, { backgroundColor: colors.primaryLight, borderColor: colors.cardBorder }]}>
                                                <Text style={[styles.avatarPlaceholderText, { color: colors.primary }]}>
                                                    {(member.name || 'U').charAt(0).toUpperCase()}
                                                </Text>
                                            </View>
                                        )}

                                        <View style={styles.memberMeta}>
                                            <Text style={[styles.memberName, { color: colors.text }]}>{member.name}</Text>
                                            <Text style={[styles.memberEmail, { color: colors.textSecondary }]}>{member.email || 'Family Member'}</Text>
                                        </View>
                                    </TouchableOpacity>
                                    <View style={[styles.memberActions, { borderTopColor: colors.divider }]}>
                                        {activeMemberId === member.id && (
                                            <TouchableOpacity
                                                style={[styles.actionSubButton, { backgroundColor: themeMode === 'dark' ? '#3D1A1A' : '#FFF0F0', borderColor: themeMode === 'dark' ? '#5A2A2A' : '#FFE0E0' }]}
                                                onPress={() => {
                                                    Alert.alert(
                                                        t('remove_member'),
                                                        `${t('remove_member_confirm')} ${member.name}?`,
                                                        [
                                                            { text: t('cancel'), style: "cancel" },
                                                            { text: t('delete'), onPress: () => removeFamilyMember(member.id), style: "destructive" }
                                                        ]
                                                    );
                                                }}
                                            >
                                                <Text style={[styles.actionSubButtonText, { color: colors.error }]}>{t('delete')}</Text>
                                            </TouchableOpacity>

                                        )}
                                        <TouchableOpacity
                                            style={[styles.actionSubButton, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
                                            onPress={() => navigate('reports', { name: member.name, memberId: member.id })}
                                        >
                                            <Text style={[styles.actionSubButtonText, { color: colors.primary }]}>{t('reports')}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionSubButton, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
                                            onPress={() => navigate('documents', { name: member.name, memberId: member.id })}
                                        >
                                            <Text style={[styles.actionSubButtonText, { color: colors.primary }]}>{t('documents')}</Text>
                                        </TouchableOpacity>

                                    </View>
                                </View>
                            ))
                        ) : !loading ? (
                            <View style={styles.emptyMembersContainer}>
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('empty_family_msg')}</Text>
                                <TouchableOpacity
                                    style={[styles.emptyAddButton, { backgroundColor: colors.primary }]}
                                    onPress={() => setShowAddModal(true)}
                                >
                                    <Text style={styles.emptyAddButtonText}>+ {t('add_member')}</Text>
                                </TouchableOpacity>
                            </View>

                        ) : null}
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            <Modal
                visible={showAddModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowAddModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{t('add_member')}</Text>
                        <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>{t('enter_email')}</Text>

                        <TextInput
                            style={[styles.modalInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                            placeholder={t('email')}
                            placeholderTextColor={colors.textSecondary}
                            value={memberEmail}
                            onChangeText={setMemberEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoFocus={true}
                        />


                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.cancelButton, { backgroundColor: colors.surface }]}
                                onPress={() => setShowAddModal(false)}
                            >
                                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>{t('cancel')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={handleSendInvitation}
                            >
                                <LinearGradient
                                    colors={themeMode === 'dark' ? ['#003366', '#001A33'] : ['#0062FF', '#5C8EDF']}
                                    style={styles.confirmButtonGradient}
                                >
                                    <Text style={styles.confirmButtonText}>{t('invite')}</Text>
                                </LinearGradient>
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    section: {
        paddingHorizontal: 25,
        marginTop: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontFamily: 'Judson-Bold',
        fontSize: 22,
    },
    addMemberButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    addMemberText: {
        fontFamily: 'Judson-Bold',
        fontSize: 14,
        color: '#FFFFFF',
    },
    memberGrid: {
        width: '100%',
    },
    memberCard: {
        width: '100%',
        borderRadius: 20,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    memberInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    memberAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 15,
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    avatarPlaceholderText: {
        fontFamily: 'Judson-Bold',
        fontSize: 24,
    },
    memberMeta: {
        flex: 1,
    },
    memberName: {
        fontFamily: 'Judson-Bold',
        fontSize: 18,
    },
    memberEmail: {
        fontFamily: 'Judson-Regular',
        fontSize: 14,
        marginTop: 2,
    },
    memberActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        borderTopWidth: 1,
        paddingTop: 12,
    },
    actionSubButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        marginLeft: 10,
        borderWidth: 1,
    },
    actionSubButtonText: {
        fontFamily: 'Judson-Bold',
        fontSize: 13,
    },
    emptyMembersContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        fontFamily: 'Judson-Regular',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    emptyAddButton: {
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    },
    emptyAddButtonText: {
        fontFamily: 'Judson-Bold',
        fontSize: 16,
        color: '#FFFFFF',
    },
    // Invites Styles
    invitesContainer: {
        paddingHorizontal: 0,
    },
    inviteCard: {
        borderRadius: 20,
        padding: 16,
        marginBottom: 15,
        borderWidth: 1,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    inviteInfo: {
        marginBottom: 15,
    },
    inviteSender: {
        fontFamily: 'Judson-Bold',
        fontSize: 18,
    },
    inviteText: {
        fontFamily: 'Judson-Regular',
        fontSize: 14,
        marginTop: 2,
    },
    inviteActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    acceptButton: {
        width: 100,
        height: 38,
    },
    acceptButtonGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
    acceptButtonText: {
        fontFamily: 'Judson-Bold',
        fontSize: 14,
        color: '#FFFFFF',
    },
    rejectButton: {
        width: 100,
        height: 38,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderRadius: 19,
    },
    rejectButtonText: {
        fontFamily: 'Judson-Bold',
        fontSize: 14,
    },
    emptyInvitesCard: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderStyle: 'dashed',
        alignItems: 'center',
    },
    emptyInvitesText: {
        fontFamily: 'Judson-Regular',
        fontSize: 14,
    },
    debugEmailText: {
        fontFamily: 'Judson-Regular',
        fontSize: 11,
        marginTop: 5,
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
        marginBottom: 10,
    },
    modalSubtitle: {
        fontFamily: 'Judson-Regular',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    modalInput: {
        width: '100%',
        height: 55,
        borderRadius: 15,
        paddingHorizontal: 20,
        fontFamily: 'Judson-Regular',
        fontSize: 16,
        marginBottom: 20,
        borderWidth: 1,
    },
    modalButtons: {
        flexDirection: 'row',
        width: '100%',
    },
    cancelButton: {
        flex: 1,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderRadius: 15,
    },
    cancelButtonText: {
        fontFamily: 'Judson-Bold',
        fontSize: 16,
    },
    confirmButton: {
        flex: 2,
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
    },
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
    },
    loadingText: {
        fontFamily: 'Judson-Regular',
        fontSize: 14,
    }
});

export default FamilyScreen;

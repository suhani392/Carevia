import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, Image, Dimensions, TouchableOpacity, Modal, TextInput, Alert, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import HomeHeader from '../Home/HomeHeader';
import AppStatusBar from '../../components/status-bar/status-bar';
import Menu from '../../components/navigation/menu-drawer/menu';
import { useNavigation } from '../../context/NavigationContext';
import { useAppContext } from '../../context/AppContext';

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
        removeFamilyMember
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
            Alert.alert("Invitation Sent", `A family invitation has been sent to ${memberEmail}.`);
            setShowAddModal(false);
            setMemberEmail('');
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to send invitation");
        }
    };

    return (
        <View style={styles.container}>
            <AppStatusBar />
            {isMenuOpen && <Menu onClose={() => setIsMenuOpen(false)} />}

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0062FF']} />
                }
            >
                <HomeHeader onMenuPress={() => setIsMenuOpen(true)} showActionRow={false} />

                {loading && (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>Loading Family Data...</Text>
                    </View>
                )}

                <View style={[styles.section, { marginBottom: 10 }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Family Invites</Text>
                    </View>

                    {invitations.length > 0 ? (
                        <View style={styles.invitesContainer}>
                            {invitations.map((invite) => (
                                <View key={invite.id} style={styles.inviteCard}>
                                    <View style={styles.inviteInfo}>
                                        <Text style={styles.inviteSender}>
                                            {invite.type === 'received' ? invite.sender_name : `Sent to ${invite.receiver_email}`}
                                        </Text>
                                        <Text style={styles.inviteText}>
                                            {invite.type === 'received'
                                                ? 'invited you to join their family group'
                                                : 'Waiting for their acceptance...'}
                                        </Text>
                                    </View>
                                    <View style={styles.inviteActions}>
                                        {invite.type === 'received' ? (
                                            <>
                                                <TouchableOpacity
                                                    style={styles.rejectButton}
                                                    onPress={() => rejectInvitation(invite.id)}
                                                >
                                                    <Text style={styles.rejectButtonText}>Reject</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={styles.acceptButton}
                                                    onPress={() => acceptInvitation(invite.id)}
                                                >
                                                    <LinearGradient
                                                        colors={['#0062FF', '#5C8EDF']}
                                                        style={styles.acceptButtonGradient}
                                                    >
                                                        <Text style={styles.acceptButtonText}>Accept</Text>
                                                    </LinearGradient>
                                                </TouchableOpacity>
                                            </>
                                        ) : (
                                            <TouchableOpacity
                                                style={styles.rejectButton}
                                                onPress={() => {
                                                    Alert.alert(
                                                        "Cancel Invitation",
                                                        "Are you sure you want to cancel this invitation?",
                                                        [
                                                            { text: "No", style: "cancel" },
                                                            { text: "Yes, Cancel", onPress: () => cancelInvitation(invite.id), style: "destructive" }
                                                        ]
                                                    );
                                                }}
                                            >
                                                <Text style={styles.rejectButtonText}>Cancel Request</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyInvitesCard}>
                            <Text style={styles.emptyInvitesText}>
                                {invitationError ? "Database Permission Issue" : "No pending family invitations"}
                            </Text>
                            {invitationError && (
                                <Text style={[styles.debugEmailText, { color: '#FF4C4C', textAlign: 'center' }]}>
                                    Your Supabase RLS policy might be blocking this. Please check your "invitations" table permissions.
                                </Text>
                            )}
                            <Text style={styles.debugEmailText}>Checking for: {userEmail || 'your email'}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Family Members</Text>
                        <TouchableOpacity
                            style={styles.addMemberButton}
                            activeOpacity={0.8}
                            onPress={() => setShowAddModal(true)}
                        >
                            <Text style={styles.addMemberText}>Add Member</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.memberGrid}>
                        {!loading && familyMembers.length > 0 ? (
                            familyMembers.map((member, index) => (
                                <View key={index} style={styles.memberCard}>
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() => setActiveMemberId(activeMemberId === member.id ? null : member.id)}
                                        style={styles.memberInfoRow}
                                    >
                                        {member.image ? (
                                            <Image source={{ uri: member.image }} style={styles.memberAvatar} />
                                        ) : (
                                            <View style={[styles.memberAvatar, styles.avatarPlaceholder]}>
                                                <Text style={styles.avatarPlaceholderText}>
                                                    {(member.name || 'U').charAt(0).toUpperCase()}
                                                </Text>
                                            </View>
                                        )}
                                        <View style={styles.memberMeta}>
                                            <Text style={styles.memberName}>{member.name}</Text>
                                            <Text style={styles.memberEmail}>{member.email || 'Family Member'}</Text>
                                        </View>
                                    </TouchableOpacity>
                                    <View style={styles.memberActions}>
                                        {activeMemberId === member.id && (
                                            <TouchableOpacity
                                                style={[styles.actionSubButton, { backgroundColor: '#FFF0F0', borderColor: '#FFE0E0' }]}
                                                onPress={() => {
                                                    Alert.alert(
                                                        "Remove Family Member",
                                                        `Are you sure you want to remove ${member.name} from your family group? They will no longer have access to your shared space.`,
                                                        [
                                                            { text: "Cancel", style: "cancel" },
                                                            { text: "Remove", onPress: () => removeFamilyMember(member.id), style: "destructive" }
                                                        ]
                                                    );
                                                }}
                                            >
                                                <Text style={[styles.actionSubButtonText, { color: '#FF4C4C' }]}>Remove</Text>
                                            </TouchableOpacity>
                                        )}
                                        <TouchableOpacity
                                            style={styles.actionSubButton}
                                            onPress={() => navigate('reports', { name: member.name, memberId: member.id })}
                                        >
                                            <Text style={styles.actionSubButtonText}>Reports</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.actionSubButton}
                                            onPress={() => navigate('documents', { name: member.name, memberId: member.id })}
                                        >
                                            <Text style={styles.actionSubButtonText}>Documents</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        ) : !loading ? (
                            <View style={styles.emptyMembersContainer}>
                                <Text style={styles.emptyText}>You haven’t added any family members yet.</Text>
                                <TouchableOpacity
                                    style={styles.emptyAddButton}
                                    onPress={() => setShowAddModal(true)}
                                >
                                    <Text style={styles.emptyAddButtonText}>+ Add Member</Text>
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
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add Family Member</Text>
                        <Text style={styles.modalSubtitle}>Enter their email address to send a family invitation.</Text>

                        <TextInput
                            style={styles.modalInput}
                            placeholder="Email Address"
                            placeholderTextColor="#999"
                            value={memberEmail}
                            onChangeText={setMemberEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoFocus={true}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowAddModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={handleSendInvitation}
                            >
                                <LinearGradient
                                    colors={['#0062FF', '#5C8EDF']}
                                    style={styles.confirmButtonGradient}
                                >
                                    <Text style={styles.confirmButtonText}>Send Invitation</Text>
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
        backgroundColor: '#FFFFFF',
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
        color: '#000000',
    },
    addMemberButton: {
        backgroundColor: '#0062FF',
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
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#E6F0FF',
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
        backgroundColor: '#F0F7FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E6F0FF',
    },
    avatarPlaceholderText: {
        fontFamily: 'Judson-Bold',
        fontSize: 24,
        color: '#0062FF',
    },
    memberMeta: {
        flex: 1,
    },
    memberName: {
        fontFamily: 'Judson-Bold',
        fontSize: 18,
        color: '#000000',
    },
    memberEmail: {
        fontFamily: 'Judson-Regular',
        fontSize: 14,
        color: '#666666',
        marginTop: 2,
    },
    memberActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: '#F0F5FF',
        paddingTop: 12,
    },
    actionSubButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: '#F5F9FF',
        marginLeft: 10,
        borderWidth: 1,
        borderColor: '#E6F0FF',
    },
    actionSubButtonText: {
        fontFamily: 'Judson-Bold',
        fontSize: 13,
        color: '#0062FF',
    },
    emptyMembersContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        fontFamily: 'Judson-Regular',
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 20,
    },
    emptyAddButton: {
        backgroundColor: '#0062FF',
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
        backgroundColor: '#F5F9FF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#E6F0FF',
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
        color: '#0062FF',
    },
    inviteText: {
        fontFamily: 'Judson-Regular',
        fontSize: 14,
        color: '#666666',
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
        backgroundColor: '#F0F0F0',
    },
    rejectButtonText: {
        fontFamily: 'Judson-Bold',
        fontSize: 14,
        color: '#666666',
    },
    emptyInvitesCard: {
        backgroundColor: '#F9FBFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E6F0FF',
        borderStyle: 'dashed',
        alignItems: 'center',
    },
    emptyInvitesText: {
        fontFamily: 'Judson-Regular',
        fontSize: 14,
        color: '#999999',
    },
    debugEmailText: {
        fontFamily: 'Judson-Regular',
        fontSize: 11,
        color: '#CCCCCC',
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
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalInput: {
        width: '100%',
        height: 55,
        backgroundColor: '#F5F9FF',
        borderRadius: 15,
        paddingHorizontal: 20,
        fontFamily: 'Judson-Regular',
        fontSize: 16,
        color: '#000000',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E6F0FF',
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
        backgroundColor: '#F0F0F0',
    },
    cancelButtonText: {
        fontFamily: 'Judson-Bold',
        fontSize: 16,
        color: '#666666',
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
        color: '#0062FF',
    }
});

export default FamilyScreen;

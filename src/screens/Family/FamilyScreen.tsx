import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, Image, Dimensions, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
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
    const { navigate } = useNavigation();
    const { familyMembers, sendInvitation } = useAppContext();

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
            >
                <HomeHeader onMenuPress={() => setIsMenuOpen(true)} showActionRow={false} />

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
                        {familyMembers.length > 0 ? (
                            familyMembers.map((member, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.memberCard}
                                    onPress={() => navigate('documents', { name: member.name })}
                                >
                                    <Image source={{ uri: member.image }} style={styles.memberAvatar} />
                                    <Text style={styles.memberName}>{member.name}</Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.emptyMembersContainer}>
                                <Text style={styles.emptyMembersText}>You haven’t added any family members yet.</Text>
                                <TouchableOpacity
                                    style={styles.emptyMembersButton}
                                    onPress={() => setShowAddModal(true)}
                                >
                                    <Text style={styles.emptyMembersButtonText}>+ Add Member</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Add Member Modal */}
            <Modal
                visible={showAddModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowAddModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add Family Member</Text>
                        <Text style={styles.modalSubtitle}>Enter the email address of the person you'd like to invite to your family group.</Text>

                        <TextInput
                            style={styles.modalInput}
                            placeholder="member@example.com"
                            placeholderTextColor="#999"
                            value={memberEmail}
                            onChangeText={setMemberEmail}
                            autoFocus={true}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setShowAddModal(false);
                                    setMemberEmail('');
                                }}
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
        paddingHorizontal: 15, // Slightly less padding to fit 177px cards
        marginTop: 30,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 10,
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
        borderRadius: 25,
        elevation: 2,
    },
    addMemberText: {
        color: '#FFFFFF',
        fontFamily: 'Judson-Bold',
        fontSize: 14,
    },
    memberGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-evenly', // Balanced spacing
    },
    memberCard: {
        width: 170,
        height: 127,
        backgroundColor: '#D9E8FF',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    memberAvatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        marginBottom: 8,
        backgroundColor: '#FFFFFF',
    },
    memberName: {
        fontFamily: 'Judson-Regular',
        fontSize: 15,
        color: '#000000',
        textAlign: 'center',
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
        fontSize: 15,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalInput: {
        width: '100%',
        height: 55,
        backgroundColor: '#F5F9FF',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#0062FF',
        paddingHorizontal: 15,
        fontFamily: 'Judson-Regular',
        fontSize: 16,
        color: '#333333',
        marginBottom: 25,
    },
    modalButtons: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    cancelButton: {
        flex: 1,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    cancelButtonText: {
        fontFamily: 'Judson-Bold',
        fontSize: 16,
        color: '#666666',
    },
    confirmButton: {
        flex: 1.5,
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
    emptyMembersContainer: {
        flex: 1,
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyMembersText: {
        fontFamily: 'Judson-Regular',
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 20,
    },
    emptyMembersButton: {
        backgroundColor: '#0062FF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    emptyMembersButtonText: {
        color: '#FFFFFF',
        fontFamily: 'Judson-Bold',
        fontSize: 16,
    }
});


export default FamilyScreen;

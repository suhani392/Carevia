import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    TextInput,
    Modal,
    Platform,
    Dimensions,
    KeyboardAvoidingView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '../../context/NavigationContext';
import AppStatusBar from '../../components/status-bar/status-bar';
import HomeHeader from '../Home/HomeHeader';
import Menu from '../../components/navigation/menu-drawer/menu';
import {
    NameIcon,
    AgeIcon,
    GenderIcon,
    ContactIcon,
    AddressIcon,
    BloodGroupIcon,
    EmergencyContactIcon,
    ChevronRightIcon,
    ProfileEditIcon
} from './Icons';

const { width, height } = Dimensions.get('window');

interface ProfileData {
    name: string;
    age: string;
    gender: string;
    contactNumber: string;
    address: string;
    bloodGroup: string;
    emergencyContact: string;
}

const ProfileScreen = () => {
    const { goBack } = useNavigation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [profile, setProfile] = useState<ProfileData>({
        name: 'Suhani Badhe',
        age: '20 years',
        gender: 'Female',
        contactNumber: '87679 69148',
        address: 'S3 Lifestyle Apartments',
        bloodGroup: 'A+',
        emergencyContact: '87679 69148'
    });

    const [editingField, setEditingField] = useState<keyof ProfileData | null>(null);
    const [tempValue, setTempValue] = useState('');
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);

    const openEdit = (field: keyof ProfileData) => {
        setEditingField(field);
        setTempValue(profile[field]);
        setIsEditModalVisible(true);
    };

    const handleSave = () => {
        if (editingField) {
            setProfile({ ...profile, [editingField]: tempValue });
            setIsEditModalVisible(false);
            setEditingField(null);
        }
    };

    const handleCancel = () => {
        setIsEditModalVisible(false);
        setEditingField(null);
    };

    const renderEditField = () => {
        if (!editingField) return null;

        const isDropdown = editingField === 'gender' || editingField === 'bloodGroup';

        const options = {
            gender: ['Male', 'Female', 'Other'],
            bloodGroup: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
        };

        return (
            <View style={styles.editContainer}>
                <View style={styles.editHeader}>
                    <Text style={styles.editTitle}>Edit {editingField.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Text>
                    <TouchableOpacity onPress={handleCancel}>
                        <Text style={styles.closeText}>✕</Text>
                    </TouchableOpacity>
                </View>

                {isDropdown ? (
                    <View style={styles.optionsContainer}>
                        {(options[editingField as keyof typeof options]).map(option => (
                            <TouchableOpacity
                                key={option}
                                style={[styles.optionItem, tempValue === option && styles.selectedOption]}
                                onPress={() => setTempValue(option)}
                            >
                                <Text style={[styles.optionText, tempValue === option && styles.selectedOptionText]}>{option}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <TextInput
                        style={styles.input}
                        value={tempValue}
                        onChangeText={setTempValue}
                        autoFocus
                        placeholder={`Enter ${editingField}`}
                    />
                )}

                <View style={styles.editButtons}>
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                        <Text style={styles.cancelButtonText}>Don't Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const ProfileItem = ({ icon: Icon, label, value, field }: { icon: any, label: string, value: string, field: keyof ProfileData }) => (
        <TouchableOpacity style={styles.profileItem} onPress={() => openEdit(field)}>
            <View style={styles.itemLeft}>
                <View style={styles.iconContainer}>
                    <Icon color="#0062FF" size={24} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.itemLabel}>{label}</Text>
                    <Text style={styles.itemValue}>{value}</Text>
                </View>
            </View>
            <ChevronRightIcon color="#0062FF" size={20} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <AppStatusBar />
            {isMenuOpen && <Menu onClose={() => setIsMenuOpen(false)} />}

            <HomeHeader
                showBackButton={false}
                onMenuPress={() => setIsMenuOpen(true)}
                onBackPress={goBack}
                showActionRow={false}
                showUserBlock={false}
                centerTitle={true}
                title="Profile"
                showRightIcon={true}
                showCrossButton={true}
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Profile Card */}
                <LinearGradient
                    colors={['#8EBDFF', '#4C8DFF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.profileCard}
                >
                    <View style={styles.profileInfoRow}>
                        <View style={styles.avatarContainer}>
                            <Image
                                source={{ uri: 'https://avatar.iran.liara.run/public/70' }}
                                style={styles.avatar}
                            />
                            <TouchableOpacity style={styles.editBadge}>
                                <ProfileEditIcon size={16} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.headerInfo}>
                            <Text style={styles.profileName}>{profile.name}</Text>
                            <Text style={styles.profileStats}>{profile.age} • {profile.gender}</Text>
                            <Text style={styles.profileLocation}>Pune, Maharashtra</Text>
                        </View>
                    </View>
                </LinearGradient>

                <Text style={styles.sectionTitle}>My Details</Text>

                <View style={styles.itemsList}>
                    <ProfileItem icon={NameIcon} label="Name" value={profile.name} field="name" />
                    <ProfileItem icon={AgeIcon} label="Age" value={profile.age} field="age" />
                    <ProfileItem icon={GenderIcon} label="Gender" value={profile.gender} field="gender" />
                    <ProfileItem icon={ContactIcon} label="Contact Number" value={profile.contactNumber} field="contactNumber" />
                    <ProfileItem icon={AddressIcon} label="Address" value={profile.address} field="address" />
                    <ProfileItem icon={BloodGroupIcon} label="Blood Group" value={profile.bloodGroup} field="bloodGroup" />
                    <ProfileItem icon={EmergencyContactIcon} label="Emergency Contact" value={profile.emergencyContact} field="emergencyContact" />
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Edit Modal */}
            <Modal
                transparent
                visible={isEditModalVisible}
                animationType="fade"
                onRequestClose={handleCancel}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={handleCancel}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 40}
                        style={styles.keyboardView}
                    >
                        <TouchableOpacity
                            activeOpacity={1}
                            style={styles.modalContent}
                        >
                            {renderEditField()}
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </TouchableOpacity>
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
    profileCard: {
        borderRadius: 40,
        padding: 25,
        marginBottom: 35,
    },
    profileInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    editBadge: {
        position: 'absolute',
        bottom: 5,
        right: 0,
        backgroundColor: '#4C8DFF',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    headerInfo: {
        marginLeft: 20,
        flex: 1,
    },
    profileName: {
        fontFamily: 'Judson-Bold',
        fontSize: 22,
        color: '#FFFFFF',
        marginBottom: 10,
    },
    profileStats: {
        fontFamily: 'Judson-Regular',
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 5,
    },
    profileLocation: {
        fontFamily: 'Judson-Regular',
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    sectionTitle: {
        fontFamily: 'Judson-Bold',
        fontSize: 22,
        color: '#000000',
        marginBottom: 20,
    },
    itemsList: {
        width: '100%',
    },
    profileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#E6F0FF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(0, 98, 255, 0.3)',
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        marginLeft: 15,
    },
    itemLabel: {
        fontFamily: 'Judson-Bold',
        fontSize: 18,
        color: '#3C87FF',
        marginBottom: 2,
    },
    itemValue: {
        fontFamily: 'Judson-Regular',
        fontSize: 15,
        color: 'rgba(60, 135, 255, 0.8)',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        paddingHorizontal: 25,
    },
    keyboardView: {
        width: '100%',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        padding: 25,
        width: '100%',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    editContainer: {
        width: '100%',
    },
    editHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    editTitle: {
        fontFamily: 'Judson-Bold',
        fontSize: 22,
        color: '#000000',
    },
    closeText: {
        fontSize: 20,
        color: '#666',
        fontWeight: 'bold',
    },
    input: {
        width: '100%',
        height: 55,
        backgroundColor: '#F5F5F5',
        borderRadius: 15,
        paddingHorizontal: 20,
        fontFamily: 'Judson-Regular',
        fontSize: 18,
        color: '#000000',
        marginBottom: 30,
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    optionItem: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        marginRight: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    selectedOption: {
        backgroundColor: '#E6F0FF',
        borderColor: '#0062FF',
    },
    optionText: {
        fontFamily: 'Judson-Regular',
        fontSize: 16,
        color: '#666',
    },
    selectedOptionText: {
        color: '#0062FF',
        fontFamily: 'Judson-Bold',
    },
    editButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    cancelButton: {
        flex: 1,
        height: 55,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    cancelButtonText: {
        fontFamily: 'Judson-Bold',
        fontSize: 16,
        color: '#666666',
    },
    saveButton: {
        flex: 1,
        height: 55,
        backgroundColor: '#0062FF',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    saveButtonText: {
        fontFamily: 'Judson-Bold',
        fontSize: 16,
        color: '#FFFFFF',
    },
});

export default ProfileScreen;

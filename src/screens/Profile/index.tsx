import React, { useState, useEffect } from 'react';
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
    KeyboardAvoidingView,
    Alert,
    ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '../../context/NavigationContext';
import AppStatusBar from '../../components/status-bar/status-bar';
import HomeHeader from '../Home/HomeHeader';
import Menu from '../../components/navigation/menu-drawer/menu';
import AlertBox from '../../components/common/alert-box';
import { supabase } from '../../lib/supabase';
import { useAppContext } from '../../context/AppContext';
import { APP_AVATAR_LIST, getAvatarSource } from '../../lib/avatars';


// Helper to convert base64 to ArrayBuffer
const decodeBase64 = (base64: string) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const lookup = new Uint8Array(256);
    for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;

    let bufferLength = base64.length * 0.75;
    let len = base64.length, i, p = 0;
    if (base64[base64.length - 1] === "=") {
        bufferLength--;
        if (base64[base64.length - 2] === "=") bufferLength--;
    }

    const arraybuffer = new ArrayBuffer(bufferLength);
    const bytes = new Uint8Array(arraybuffer);

    for (i = 0; i < len; i += 4) {
        let encoded1 = lookup[base64.charCodeAt(i)];
        let encoded2 = lookup[base64.charCodeAt(i + 1)];
        let encoded3 = lookup[base64.charCodeAt(i + 2)];
        let encoded4 = lookup[base64.charCodeAt(i + 3)];

        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }
    return arraybuffer;
};
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
    photo_url?: string;
}

const ProfileScreen = () => {
    const { goBack, navigate } = useNavigation();
    const { updates, userProfile, refreshData, t } = useAppContext();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<ProfileData>({
        name: 'Guest User',
        age: 'N/A',
        gender: 'N/A',
        contactNumber: 'N/A',
        address: 'N/A',
        bloodGroup: 'N/A',
        emergencyContact: 'N/A'
    });

    useEffect(() => {
        if (userProfile) {
            setProfile({
                name: userProfile.full_name || 'N/A',
                age: userProfile.dob || 'N/A',
                gender: userProfile.gender || 'N/A',
                contactNumber: userProfile.phone || 'N/A',
                address: userProfile.address || 'N/A',
                bloodGroup: userProfile.blood_group || 'N/A',
                emergencyContact: userProfile.emergency_contact || 'N/A',
                photo_url: userProfile.photo_url
            });
            setLoading(false);
        }
    }, [userProfile]);

    const [editingField, setEditingField] = useState<keyof ProfileData | null>(null);
    const [tempValue, setTempValue] = useState('');
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);
    const [tempAvatar, setTempAvatar] = useState<string | null>(null);

    const APP_AVATARS = APP_AVATAR_LIST;



    // Screen automatically syncs with useAppContext() via the useEffect below



    const openEdit = (field: keyof ProfileData) => {
        setEditingField(field);
        setTempValue(profile[field] || '');
        setIsEditModalVisible(true);
    };

    const handleSave = async () => {
        if (!editingField) return;

        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const fieldMapping: any = {
                name: 'full_name',
                age: 'dob',
                gender: 'gender',
                contactNumber: 'phone',
                address: 'address',
                bloodGroup: 'blood_group',
                emergencyContact: 'emergency_contact'
            };

            const { error } = await supabase
                .from('profiles')
                .update({ [fieldMapping[editingField]]: tempValue })
                .eq('id', user.id);

            if (error) throw error;

            setProfile({ ...profile, [editingField]: tempValue });
            setIsEditModalVisible(false);
            setEditingField(null);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditModalVisible(false);
        setEditingField(null);
    };

    const handleRemovePhoto = async () => {
        try {
            setSaving(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('profiles')
                .update({ photo_url: null })
                .eq('id', user.id);

            if (error) throw error;

            setProfile(prev => ({ ...prev, photo_url: undefined }));
            await refreshData();
            Alert.alert('Success', 'Profile picture removed.');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSelectAvatar = async (avatarKey: string) => {
        try {
            setSaving(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ photo_url: avatarKey })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setProfile(prev => ({ ...prev, photo_url: avatarKey }));
            await refreshData();
            setIsAvatarModalVisible(false);
            Alert.alert('Success', 'Profile picture updated successfully!');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update photo');
        } finally {
            setSaving(false);
        }
    };


    const handleUpdatePhoto = () => {
        setTempAvatar(profile.photo_url || null);
        setIsAvatarModalVisible(true);
    };


    const showPhotoOptions = () => {
        Alert.alert(
            t('profile'),
            t('pick_character'),
            [
                { text: t('select_avatar'), onPress: handleUpdatePhoto },

                {
                    text: t('remove_photo'),
                    onPress: handleRemovePhoto,
                    style: 'destructive'
                },
                { text: t('cancel'), style: 'cancel' }
            ]
        );
    };

    const renderEditField = () => {
        if (!editingField) return null;

        const isDropdown = editingField === 'gender' || editingField === 'bloodGroup';

        const options = {
            gender: [t('male'), t('female'), t('other')],
            bloodGroup: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
        };

        return (
            <View style={styles.editContainer}>
                <View style={styles.editHeader}>
                    <Text style={styles.editTitle}>{t('edit')} {t(editingField as any) || editingField}</Text>
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
                    />
                )}

                <View style={styles.editButtons}>
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} disabled={saving}>
                        <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                        {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>{t('save')}</Text>}
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

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#0062FF" />
            </View>
        );
    }

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
                title={t('profile')}
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
                            {profile.photo_url && getAvatarSource(profile.photo_url) ? (
                                <Image
                                    key={profile.photo_url}
                                    source={getAvatarSource(profile.photo_url)}
                                    style={styles.avatar}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                    <Text style={styles.avatarPlaceholderText}>
                                        {(profile.name || 'U').charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={styles.editBadge}
                                onPress={showPhotoOptions}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <ProfileEditIcon size={16} color="#FFFFFF" />
                                )}
                            </TouchableOpacity>
                        </View>
                        <View style={styles.headerInfo}>
                            <Text style={styles.profileName}>{profile.name}</Text>
                            <Text style={styles.profileStats}>{profile.age} • {profile.gender}</Text>
                            <Text style={styles.profileLocation}>Pune, Maharashtra</Text>
                        </View>
                    </View>
                </LinearGradient>

                <Text style={styles.sectionTitle}>{t('my_details')}</Text>


                <View style={styles.itemsList}>
                    <ProfileItem icon={NameIcon} label={t('name')} value={profile.name} field="name" />
                    <ProfileItem icon={AgeIcon} label={t('age')} value={profile.age} field="age" />
                    <ProfileItem icon={GenderIcon} label={t('gender')} value={t(profile.gender.toLowerCase() as any) || profile.gender} field="gender" />
                    <ProfileItem icon={ContactIcon} label={t('contact_number')} value={profile.contactNumber} field="contactNumber" />
                    <ProfileItem icon={AddressIcon} label={t('address')} value={profile.address} field="address" />
                    <ProfileItem icon={BloodGroupIcon} label={t('blood_group')} value={profile.bloodGroup} field="bloodGroup" />
                    <ProfileItem icon={EmergencyContactIcon} label={t('emergency_contact')} value={profile.emergencyContact} field="emergencyContact" />
                </View>




                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Avatar Selection Modal */}
            <Modal
                visible={isAvatarModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsAvatarModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '80%' }]}>
                        <View style={styles.editHeader}>
                            <Text style={styles.modalTitle}>{t('choose_avatar')}</Text>
                            <TouchableOpacity onPress={() => setIsAvatarModalVisible(false)}>
                                <Text style={styles.closeText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>{t('pick_character')}</Text>


                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.avatarGrid}>
                                {APP_AVATARS.map((key, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.avatarOption,
                                            tempAvatar === key && styles.selectedAvatarOption
                                        ]}
                                        onPress={() => setTempAvatar(key)}
                                    >
                                        <Image source={getAvatarSource(key)} style={styles.avatarChoice} />
                                        {tempAvatar === key && (
                                            <View style={styles.selectedBadge}>
                                                <Text style={styles.checkIcon}>✓</Text>
                                            </View>
                                        )}

                                    </TouchableOpacity>
                                ))}

                            </View>
                        </ScrollView>

                        <View style={styles.avatarModalButtons}>
                            <TouchableOpacity
                                style={styles.avatarCancelButton}
                                onPress={() => setIsAvatarModalVisible(false)}
                            >
                                <Text style={styles.avatarCancelText}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.avatarDoneButton, !tempAvatar && styles.avatarDoneDisabled]}
                                onPress={() => tempAvatar && handleSelectAvatar(tempAvatar)}
                                disabled={saving}
                            >
                                {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.avatarDoneText}>{t('done')}</Text>}
                            </TouchableOpacity>
                        </View>


                    </View>
                </View>
            </Modal>

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
    avatarPlaceholder: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarPlaceholderText: {
        fontFamily: 'Judson-Bold',
        fontSize: 40,
        color: '#FFFFFF',
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
    // Modal Text Styles
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
        marginBottom: 20,
    },
    // Avatar Modal Styles
    avatarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingVertical: 10,
    },
    avatarOption: {
        width: width * 0.25,
        height: width * 0.25,
        borderRadius: 20,
        backgroundColor: '#F5F9FF',
        marginBottom: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedAvatarOption: {
        borderColor: '#0062FF',
        backgroundColor: '#E6F0FF',
    },
    avatarChoice: {
        width: '80%',
        height: '80%',
        borderRadius: 15,
    },
    selectedBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#0062FF',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    checkIcon: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    avatarModalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    avatarCancelButton: {
        flex: 1,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatarCancelText: {
        fontFamily: 'Judson-Bold',
        fontSize: 16,
        color: '#666666',
    },
    avatarDoneButton: {
        flex: 2,
        height: 50,
        backgroundColor: '#0062FF',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarDoneDisabled: {
        backgroundColor: '#CCC',
    },
    avatarDoneText: {
        fontFamily: 'Judson-Bold',
        fontSize: 16,
        color: '#FFFFFF',
    }
});


export default ProfileScreen;


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
    const { updates, userProfile, refreshData, t, colors, themeMode } = useAppContext();

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
                    <Text style={[styles.editTitle, { color: colors.text }]}>{t('edit')} {t(editingField as any) || editingField}</Text>
                    <TouchableOpacity onPress={handleCancel}>
                        <Text style={[styles.closeText, { color: colors.textSecondary }]}>✕</Text>
                    </TouchableOpacity>
                </View>

                {isDropdown ? (
                    <View style={styles.optionsContainer}>
                        {(options[editingField as keyof typeof options]).map(option => (
                            <TouchableOpacity
                                key={option}
                                style={[
                                    styles.optionItem,
                                    { backgroundColor: colors.inputBg, borderColor: tempValue === option ? colors.primary : colors.border },
                                    tempValue === option && { backgroundColor: colors.primaryLight }
                                ]}
                                onPress={() => setTempValue(option)}
                            >
                                <Text style={[
                                    styles.optionText,
                                    { color: colors.textSecondary },
                                    tempValue === option && { color: colors.primary, fontFamily: 'Judson-Bold' }
                                ]}>{option}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, borderWidth: 1 }]}
                        value={tempValue}
                        onChangeText={setTempValue}
                        autoFocus
                    />
                )}

                <View style={styles.editButtons}>
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} disabled={saving}>
                        <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>{t('cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={saving}>
                        {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>{t('save')}</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        );
    };


    const ProfileItem = ({ icon: Icon, label, value, field, colors }: { icon: any, label: string, value: string, field: keyof ProfileData, colors: any }) => (
        <TouchableOpacity
            style={[styles.profileItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => openEdit(field)}
        >
            <View style={styles.itemLeft}>
                <View style={styles.iconContainer}>
                    <Icon color={colors.primary} size={24} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.itemLabel, { color: colors.primary }]}>{label}</Text>
                    <Text style={[styles.itemValue, { color: colors.textSecondary }]}>{value}</Text>
                </View>
            </View>
            <ChevronRightIcon color={colors.primary} size={20} />
        </TouchableOpacity>
    );


    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
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
                    colors={themeMode === 'dark' ? ['#1A2A47', '#003399'] : ['#8EBDFF', '#4C8DFF']}
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
                                <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]}>
                                    <Text style={styles.avatarPlaceholderText}>
                                        {(profile.name || 'U').charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.editBadge, { backgroundColor: colors.primary }]}
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

                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('my_details')}</Text>


                <View style={styles.itemsList}>
                    <ProfileItem icon={NameIcon} label={t('name')} value={profile.name} field="name" colors={colors} />
                    <ProfileItem icon={AgeIcon} label={t('age')} value={profile.age} field="age" colors={colors} />
                    <ProfileItem icon={GenderIcon} label={t('gender')} value={t(profile.gender.toLowerCase() as any) || profile.gender} field="gender" colors={colors} />
                    <ProfileItem icon={ContactIcon} label={t('contact_number')} value={profile.contactNumber} field="contactNumber" colors={colors} />
                    <ProfileItem icon={AddressIcon} label={t('address')} value={profile.address} field="address" colors={colors} />
                    <ProfileItem icon={BloodGroupIcon} label={t('blood_group')} value={profile.bloodGroup} field="bloodGroup" colors={colors} />
                    <ProfileItem icon={EmergencyContactIcon} label={t('emergency_contact')} value={profile.emergencyContact} field="emergencyContact" colors={colors} />
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
                    <View style={[styles.modalContent, { maxHeight: '80%', backgroundColor: colors.modalBg }]}>
                        <View style={styles.editHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('choose_avatar')}</Text>
                            <TouchableOpacity onPress={() => setIsAvatarModalVisible(false)}>
                                <Text style={[styles.closeText, { color: colors.textSecondary }]}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>{t('pick_character')}</Text>


                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.avatarGrid}>
                                {APP_AVATARS.map((key, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.avatarOption,
                                            { backgroundColor: colors.card, borderColor: tempAvatar === key ? colors.primary : 'transparent', borderWidth: 2 }
                                        ]}
                                        onPress={() => setTempAvatar(key)}
                                    >
                                        <Image source={getAvatarSource(key)} style={styles.avatarChoice} />
                                        {tempAvatar === key && (
                                            <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
                                                <Text style={styles.checkIcon}>✓</Text>
                                            </View>
                                        )}

                                    </TouchableOpacity>
                                ))}

                            </View>
                        </ScrollView>

                        <View style={[styles.avatarModalButtons, { borderTopColor: colors.divider }]}>
                            <TouchableOpacity
                                style={styles.avatarCancelButton}
                                onPress={() => setIsAvatarModalVisible(false)}
                            >
                                <Text style={[styles.avatarCancelText, { color: colors.textSecondary }]}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.avatarDoneButton, (!tempAvatar || saving) && { opacity: 0.5 }, { backgroundColor: colors.primary }]}
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
                            style={[styles.modalContent, { backgroundColor: colors.modalBg }]}
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
        marginBottom: 20,
    },
    itemsList: {
        width: '100%',
    },
    profileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 20,
        padding: 16,
        marginBottom: 15,
        borderWidth: 1,
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
        marginBottom: 2,
    },
    itemValue: {
        fontFamily: 'Judson-Regular',
        fontSize: 15,
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
    },
    closeText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    input: {
        width: '100%',
        height: 55,
        borderRadius: 15,
        paddingHorizontal: 20,
        fontFamily: 'Judson-Regular',
        fontSize: 18,
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
        marginRight: 10,
        marginBottom: 10,
        borderWidth: 1,
    },
    optionText: {
        fontFamily: 'Judson-Regular',
        fontSize: 16,
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
    },
    saveButton: {
        flex: 1,
        height: 55,
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
        marginBottom: 10,
    },
    modalSubtitle: {
        fontFamily: 'Judson-Regular',
        fontSize: 15,
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
        marginBottom: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
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
    },
    avatarDoneButton: {
        flex: 1,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    avatarDoneText: {
        fontFamily: 'Judson-Bold',
        fontSize: 16,
        color: '#FFFFFF',
    }
});


export default ProfileScreen;


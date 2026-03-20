import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
    Dimensions, Platform, DeviceEventEmitter, ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView
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
import TourTarget from '../../components/tour/TourTarget';
import { useTour } from '../../context/TourContext';
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ProfileData {
    name: string;
    age: string;
    gender: string;
    contactNumber: string;
    address: string;
    bloodGroup: string;
    emergencyContact: string;
    photo_url?: string;
    has_diabetes: boolean;
    has_bp: boolean;
    has_thyroid: boolean;
}

const ProfileScreen = () => {
    const { goBack, navigate } = useNavigation();
    const { updates, userProfile, refreshData, t, colors, themeMode } = useAppContext();
    const { isTourActive, currentStep } = useTour();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    
    const [profile, setProfile] = useState<ProfileData>({
        name: 'Guest User',
        age: 'N/A',
        gender: 'N/A',
        contactNumber: 'N/A',
        address: 'N/A',
        bloodGroup: 'N/A',
        emergencyContact: 'N/A',
        has_diabetes: false,
        has_bp: false,
        has_thyroid: false
    });

    /**
     * Auto-scroll during Tour
     */
    useEffect(() => {
        if (isTourActive && scrollViewRef.current && currentStep) {
            const targetId = currentStep.targetId;
            // ONLY scroll on specific steps. For others, leave as is.
            if (targetId === 'profile_field_emergency') {
                // Scroll significantly more to lift the field above the dialogue box
                scrollViewRef.current.scrollTo({ y: 280, animated: true });
            } else if (targetId === 'profile_medical_conditions') {
                // Scroll all the way down
                scrollViewRef.current.scrollTo({ y: 650, animated: true });
            }
        }
    }, [currentStep?.targetId, isTourActive]);

    const calculateAge = (dob: string) => {
        if (!dob || dob === 'N/A') return 'N/A';
        const birthDate = new Date(dob);
        if (isNaN(birthDate.getTime())) return dob;
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age.toString();
    };

    useEffect(() => {
        if (userProfile) {
            setProfile({
                name: userProfile.full_name || 'Guest User',
                age: calculateAge(userProfile.dob) || 'N/A',
                gender: userProfile.gender || 'N/A',
                contactNumber: userProfile.phone || 'N/A',
                address: userProfile.address || 'N/A',
                bloodGroup: userProfile.blood_group || 'N/A',
                emergencyContact: userProfile.emergency_contact || 'N/A',
                photo_url: userProfile.photo_url,
                has_diabetes: userProfile.has_diabetes || false,
                has_bp: userProfile.has_bp || false,
                has_thyroid: userProfile.has_thyroid || false
            });
            setLoading(false);
        }
    }, [userProfile]);

    useEffect(() => {
        const sub = DeviceEventEmitter.addListener('CLOSE_MENU', () => {
            setIsMenuOpen(false);
        });
        return () => sub.remove();
    }, []);

    const [editingField, setEditingField] = useState<keyof ProfileData | null>(null);
    const [tempValue, setTempValue] = useState('');
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);
    const [tempAvatar, setTempAvatar] = useState<string | null>(null);

    const APP_AVATARS = APP_AVATAR_LIST;

    const openEdit = (field: keyof ProfileData) => {
        const value = profile[field];
        if (typeof value === 'boolean') return;
        setEditingField(field);
        setTempValue(value || '');
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
            await refreshData();
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

    const HealthToggle = ({ label, value, onChange }: { label: string, value: boolean, onChange: (val: boolean) => void }) => (
        <TouchableOpacity
            style={[styles.profileItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => onChange(!value)}
        >
            <View style={styles.itemLeft}>
                <View style={styles.textContainer}>
                    <Text style={[styles.itemLabel, { color: colors.primary }]}>{label}</Text>
                    <Text style={[styles.itemValue, { color: colors.textSecondary }]}>{value ? t('yes') : t('no')}</Text>
                </View>
            </View>
            <View style={[styles.toggleTrack, value ? { backgroundColor: colors.primary } : { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
                <View style={[styles.toggleThumb, value ? { transform: [{ translateX: 20 }] } : { transform: [{ translateX: 0 }] }]} />
            </View>
        </TouchableOpacity>
    );

    const updateToggle = async (field: 'has_diabetes' | 'has_bp' | 'has_thyroid', value: boolean) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('profiles')
                .update({ [field]: value })
                .eq('id', user.id);

            if (error) throw error;

            setProfile(prev => ({ ...prev, [field]: value }));
            await refreshData();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
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

            <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <TourTarget id="tour_success">
                    <LinearGradient
                        colors={themeMode === 'dark' ? ['#1A2A47', '#003399'] : ['#8EBDFF', '#4C8DFF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.profileCard}
                    >
                        <View style={styles.profileInfoRow}>
                            <TourTarget id="profile_avatar">
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
                            </TourTarget>
                            <View style={styles.headerInfo}>
                                <Text style={styles.profileName}>{profile.name}</Text>
                                <Text style={styles.profileStats}>{profile.age} • {profile.gender}</Text>
                                <Text style={styles.profileLocation}>{profile.address || 'Pune, Maharashtra'}</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </TourTarget>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('my_details')}</Text>

                <View style={styles.itemsList}>
                    <TourTarget id="profile_field_name">
                        <ProfileItem icon={NameIcon} label={t('name')} value={profile.name} field="name" colors={colors} />
                    </TourTarget>
                    <TourTarget id="profile_field_dob">
                        <ProfileItem icon={AgeIcon} label={t('age')} value={profile.age} field="age" colors={colors} />
                    </TourTarget>
                    <TourTarget id="profile_field_gender">
                        <ProfileItem icon={GenderIcon} label={t('gender')} value={t(profile.gender.toLowerCase() as any) || profile.gender} field="gender" colors={colors} />
                    </TourTarget>
                    <TourTarget id="profile_field_contact">
                        <ProfileItem icon={ContactIcon} label={t('contact_number')} value={profile.contactNumber} field="contactNumber" colors={colors} />
                    </TourTarget>
                    <TourTarget id="profile_field_address">
                        <ProfileItem icon={AddressIcon} label={t('address')} value={profile.address} field="address" colors={colors} />
                    </TourTarget>
                    <TourTarget id="profile_field_blood">
                        <ProfileItem icon={BloodGroupIcon} label={t('blood_group')} value={profile.bloodGroup} field="bloodGroup" colors={colors} />
                    </TourTarget>
                    <TourTarget id="profile_field_emergency">
                        <ProfileItem icon={EmergencyContactIcon} label={t('emergency_contact')} value={profile.emergencyContact} field="emergencyContact" colors={colors} />
                    </TourTarget>
                </View>

                <TourTarget id="profile_medical_conditions" style={{ marginTop: 25 }}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('medical_conditions')}</Text>
                    <View style={styles.itemsList}>
                        <HealthToggle
                            label={t('diabetes')}
                            value={profile.has_diabetes}
                            onChange={(val) => updateToggle('has_diabetes', val)}
                        />
                        <HealthToggle
                            label={t('hypertension_bp')}
                            value={profile.has_bp}
                            onChange={(val) => updateToggle('has_bp', val)}
                        />
                        <HealthToggle
                            label={t('thyroid')}
                            value={profile.has_thyroid}
                            onChange={(val) => updateToggle('has_thyroid', val)}
                        />
                    </View>
                </TourTarget>

                <View style={{ height: 40 }} />
            </ScrollView>

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
        paddingBottom: 100,
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
    toggleTrack: {
        width: 45,
        height: 24,
        borderRadius: 12,
        paddingHorizontal: 2,
        justifyContent: 'center',
    },
    toggleThumb: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        borderRadius: 30,
        padding: 20,
    },
    editTitle: {
        fontFamily: 'Judson-Bold',
        fontSize: 22,
    },
    closeText: {
        fontSize: 18,
    },
    input: {
        height: 50,
        borderRadius: 15,
        paddingHorizontal: 15,
        fontFamily: 'Judson-Regular',
        fontSize: 16,
        marginBottom: 20,
    },
    editButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    cancelButton: {
        marginRight: 15,
        paddingVertical: 10,
    },
    saveButton: {
        paddingHorizontal: 25,
        paddingVertical: 10,
        borderRadius: 15,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontFamily: 'Judson-Bold',
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 15,
    },
    optionItem: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        marginBottom: 10,
        borderWidth: 1,
    },
    optionText: {
        fontFamily: 'Judson-Regular',
    },
    avatarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingTop: 10,
    },
    avatarOption: {
        width: '30%',
        aspectRatio: 1,
        borderRadius: 20,
        marginBottom: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarChoice: {
        width: '80%',
        height: '80%',
        resizeMode: 'contain',
    },
    selectedBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
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
    avatarDoneButton: {
        paddingHorizontal: 30,
        paddingVertical: 10,
        borderRadius: 15,
    },
    avatarDoneText: {
        color: '#FFFFFF',
        fontFamily: 'Judson-Bold',
    },
    editHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    editContainer: {
        width: '100%',
    },
    modalTitle: {
        fontFamily: 'Judson-Bold',
        fontSize: 22,
    },
    modalSubtitle: {
        fontFamily: 'Judson-Regular',
        fontSize: 14,
        marginBottom: 15,
    },
    avatarCancelButton: {
        paddingVertical: 10,
    },
    avatarCancelText: {
        fontFamily: 'Judson-Regular',
        fontSize: 16,
    },
    keyboardView: {
        width: '100%',
    },
    cancelButtonText: {
        fontFamily: 'Judson-Regular',
        fontSize: 16,
    },
});

export default ProfileScreen;

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
    Platform,
    Modal,
    Dimensions
} from 'react-native';
import { useNavigation } from '../../context/NavigationContext';
import { useAppContext, LanguageCode, ThemeMode } from '../../context/AppContext';

import { LinearGradient } from 'expo-linear-gradient';

import AppStatusBar from '../../components/status-bar/status-bar';
import HomeHeader from '../Home/HomeHeader';
import {
    ProfileIcon,
    LockIcon,
    BellIcon,
    PaletteIcon,
    GlobeIcon,
    ShieldIcon,
    FingerprintIcon,
    ChevronRightIcon
} from './Icons';


const SettingsScreen = () => {
    const { goBack, navigate } = useNavigation();
    const { language, setLanguage, t, themeMode, setThemeMode, colors } = useAppContext();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [appLockEnabled, setAppLockEnabled] = useState(true);
    const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
    const [isThemeModalVisible, setIsThemeModalVisible] = useState(false);


    const languages: { label: string; code: LanguageCode }[] = [
        { label: 'English', code: 'en' },
        { label: 'मराठी (Marathi)', code: 'mr' },
        { label: 'हिन्दी (Hindi)', code: 'hi' },
    ];

    const currentLanguageLabel = languages.find(l => l.code === language)?.label || 'English';

    const themeOptions: { label: string; code: ThemeMode }[] = [
        { label: t('light'), code: 'light' },
        { label: t('dark'), code: 'dark' },
        { label: t('system'), code: 'system' },
    ];

    const currentThemeLabel = themeOptions.find(o => o.code === themeMode)?.label || t('system');



    const SettingItem = ({ icon: Icon, label, value, onPress, showArrow = true, children }: any) => (
        <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: colors.divider }]}
            onPress={onPress}
            disabled={!onPress}
        >
            <View style={styles.itemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
                    <Icon color={colors.primary} size={22} />
                </View>
                <Text style={[styles.itemLabel, { color: colors.text }]}>{label}</Text>
            </View>
            <View style={styles.itemRight}>
                {value && <Text style={[styles.itemValue, { color: colors.primary }]}>{value}</Text>}
                {children}
                {showArrow && <ChevronRightIcon size={18} color={colors.textSecondary} />}
            </View>
        </TouchableOpacity>

    );

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
                title={t('settings')}
            />


            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Account Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('account')}</Text>
                    <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>

                        <SettingItem
                            icon={ProfileIcon}
                            label={t('edit_profile')}
                            onPress={() => navigate('profile')}
                        />

                        <View style={styles.divider} />
                        <SettingItem
                            icon={LockIcon}
                            label={t('change_password')}
                            onPress={() => { }}
                        />

                    </View>
                </View>

                {/* Preferences Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('preferences')}</Text>
                    <View style={styles.card}>
                        <SettingItem
                            icon={BellIcon}
                            label={t('notifications')}
                            showArrow={false}
                        >
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={setNotificationsEnabled}
                                trackColor={{ false: colors.border, true: colors.primary }}
                                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : notificationsEnabled ? '#FFFFFF' : '#F4F3F4'}
                            />
                        </SettingItem>


                        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                        <SettingItem
                            icon={PaletteIcon}
                            label={t('app_theme')}
                            value={currentThemeLabel}
                            onPress={() => setIsThemeModalVisible(true)}
                        />


                        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

                        <SettingItem
                            icon={GlobeIcon}
                            label={t('language')}
                            value={currentLanguageLabel}
                            onPress={() => setIsLanguageModalVisible(true)}
                        />

                    </View>
                </View>

                {/* Language Selection Modal */}
                <Modal
                    visible={isLanguageModalVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setIsLanguageModalVisible(false)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setIsLanguageModalVisible(false)}
                    >
                        <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('choose_language')}</Text>

                            {languages.map((lang) => (
                                <TouchableOpacity
                                    key={lang.code}
                                    style={[
                                        styles.languageOption,
                                        { backgroundColor: colors.inputBg },
                                        language === lang.code && { backgroundColor: colors.primaryLight, borderColor: colors.primary, borderWidth: 1 }
                                    ]}
                                    onPress={() => {
                                        setLanguage(lang.code);
                                        setIsLanguageModalVisible(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.languageText,
                                        { color: colors.text },
                                        language === lang.code && { color: colors.primary, fontFamily: 'Judson-Bold' }
                                    ]}>
                                        {lang.label}
                                    </Text>
                                    {language === lang.code && <Text style={[styles.checkMark, { color: colors.primary }]}>✓</Text>}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* Theme Selection Modal */}
                <Modal
                    visible={isThemeModalVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setIsThemeModalVisible(false)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setIsThemeModalVisible(false)}
                    >
                        <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('choose_theme')}</Text>

                            {themeOptions.map((option) => (
                                <TouchableOpacity
                                    key={option.code}
                                    style={[
                                        styles.languageOption,
                                        { backgroundColor: colors.inputBg },
                                        themeMode === option.code && { backgroundColor: colors.primaryLight, borderColor: colors.primary, borderWidth: 1 }
                                    ]}
                                    onPress={() => {
                                        setThemeMode(option.code);
                                        setIsThemeModalVisible(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.languageText,
                                        { color: colors.text },
                                        themeMode === option.code && { color: colors.primary, fontFamily: 'Judson-Bold' }
                                    ]}>
                                        {option.label}
                                    </Text>
                                    {themeMode === option.code && <Text style={[styles.checkMark, { color: colors.primary }]}>✓</Text>}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </TouchableOpacity>
                </Modal>


                {/* Security Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('security')}</Text>
                    <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <SettingItem
                            icon={ShieldIcon}
                            label={t('app_lock')}
                            showArrow={false}
                        >
                            <Switch
                                value={appLockEnabled}
                                onValueChange={setAppLockEnabled}
                                trackColor={{ false: colors.border, true: colors.primary }}
                                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : appLockEnabled ? '#FFFFFF' : '#F4F3F4'}
                            />
                        </SettingItem>
                    </View>
                </View>





                <View style={{ height: 40 }} />
            </ScrollView>
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
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontFamily: 'Judson-Bold',
        fontSize: 18,
        color: '#000000',
        marginBottom: 12,
        marginLeft: 5,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F0F7FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    itemLabel: {
        fontFamily: 'Judson-Regular',
        fontSize: 16,
        color: '#000000',
    },
    itemRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemValue: {
        fontFamily: 'Judson-Regular',
        fontSize: 14,
        color: '#3C87FF',
        marginRight: 10,
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginLeft: 55,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        padding: 25,
        width: '100%',
        elevation: 5,
    },
    modalTitle: {
        fontFamily: 'Judson-Bold',
        fontSize: 20,
        color: '#000000',
        marginBottom: 20,
        textAlign: 'center',
    },
    languageOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 15,
        marginBottom: 10,
        backgroundColor: '#F8F9FB',
    },
    selectedLanguage: {
        backgroundColor: '#E6F0FF',
        borderWidth: 1,
        borderColor: '#0062FF',
    },
    languageText: {
        fontFamily: 'Judson-Regular',
        fontSize: 16,
        color: '#333333',
    },
    selectedLanguageText: {
        fontFamily: 'Judson-Bold',
        color: '#0062FF',
    },
    checkMark: {
        color: '#0062FF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});


export default SettingsScreen;

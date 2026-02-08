import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
    Platform
} from 'react-native';
import { useNavigation } from '../../context/NavigationContext';
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

    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [appLockEnabled, setAppLockEnabled] = useState(true);

    const SettingItem = ({ icon: Icon, label, value, onPress, showArrow = true, children }: any) => (
        <TouchableOpacity
            style={styles.settingItem}
            onPress={onPress}
            disabled={!onPress}
        >
            <View style={styles.itemLeft}>
                <View style={styles.iconContainer}>
                    <Icon color="#3C87FF" size={22} />
                </View>
                <Text style={styles.itemLabel}>{label}</Text>
            </View>
            <View style={styles.itemRight}>
                {value && <Text style={styles.itemValue}>{value}</Text>}
                {children}
                {showArrow && <ChevronRightIcon size={18} />}
            </View>
        </TouchableOpacity>
    );

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
                title="Settings"
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Account Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>
                    <View style={styles.card}>
                        <SettingItem
                            icon={ProfileIcon}
                            label="Edit Profile"
                            onPress={() => navigate('profile')}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon={LockIcon}
                            label="Change Password"
                            onPress={() => { }}
                        />
                    </View>
                </View>

                {/* Preferences Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Preferences</Text>
                    <View style={styles.card}>
                        <SettingItem
                            icon={BellIcon}
                            label="Notifications"
                            showArrow={false}
                        >
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={setNotificationsEnabled}
                                trackColor={{ false: '#D1D1D1', true: '#3C87FF' }}
                                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : notificationsEnabled ? '#FFFFFF' : '#F4F3F4'}
                            />
                        </SettingItem>
                        <View style={styles.divider} />
                        <SettingItem
                            icon={PaletteIcon}
                            label="App Theme"
                            value="Light"
                            onPress={() => { }}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon={GlobeIcon}
                            label="Language"
                            value="English"
                            onPress={() => { }}
                        />
                    </View>
                </View>

                {/* Security Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Security</Text>
                    <View style={styles.card}>
                        <SettingItem
                            icon={ShieldIcon}
                            label="App Lock"
                            showArrow={false}
                        >
                            <Switch
                                value={appLockEnabled}
                                onValueChange={setAppLockEnabled}
                                trackColor={{ false: '#D1D1D1', true: '#3C87FF' }}
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
});

export default SettingsScreen;

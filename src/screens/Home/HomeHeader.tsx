import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Platform, StatusBar, Pressable, Animated, TouchableOpacity, DeviceEventEmitter } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { MenuIcon, ProfileIcon, DropdownIcon, UploadIcon, BackIcon, CrossIcon } from './Icons';
import { useNavigation } from '../../context/NavigationContext';
import { supabase } from '../../lib/supabase';
import { useAppContext } from '../../context/AppContext';
import { getAvatarSource } from '../../lib/avatars';
import TourTarget from '../../components/tour/TourTarget';

const { width } = Dimensions.get('window');

interface HomeHeaderProps {
    onMenuPress?: () => void;
    onBackPress?: () => void;
    showActionRow?: boolean;
    showUserBlock?: boolean;
    showBackButton?: boolean;
    showCrossButton?: boolean;
    showRightIcon?: boolean;
    centerTitle?: boolean;
    title?: string;
    subtitle?: string;
}
const HomeHeader: React.FC<HomeHeaderProps> = ({
    onMenuPress,
    onBackPress,
    showActionRow = true,
    showUserBlock = true,
    showBackButton = false,
    showCrossButton = false,
    showRightIcon = true,
    centerTitle = false,
    title,
    subtitle
}) => {
    const { navigate } = useNavigation();
    const { userProfile, userEmail, t, language, colors } = useAppContext();


    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const animation = useRef(new Animated.Value(0)).current;

    // Use context profile instead of local fetch
    const profile = userProfile ? { ...userProfile, email: userEmail } : null;

    const toggleExpand = () => {
        const toValue = isExpanded ? 0 : 1;
        setIsExpanded(!isExpanded);

        Animated.spring(animation, {
            toValue,
            useNativeDriver: false,
        }).start();
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return t('good_morning');
        if (hour >= 12 && hour < 17) return t('good_afternoon');
        if (hour >= 17 && hour < 21) return t('good_evening');
        return t('good_night');
    };

    const getFormattedDate = () => {
        const date = new Date();
        const localeMapping: Record<string, string> = {
            en: 'en-US',
            mr: 'mr-IN',
            hi: 'hi-IN',
            kn: 'kn-IN',
            pa: 'pa-IN',
            ta: 'ta-IN',
            gu: 'gu-IN'
        };
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
        return date.toLocaleDateString(localeMapping[language] || 'en-US', options);
    };


    const handleUpload = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
                copyToCacheDirectory: true,
                multiple: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const uploadedAssets = result.assets.map(asset => ({
                    uri: asset.uri,
                    fileType: asset.mimeType || (asset.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')
                }));

                navigate('scan_report', { uploadedAssets });
            }
        } catch (error) {
            console.error('Error picking document:', error);
        }
    };

    const blockHeight = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [78, 160], // Expanded height to fit details
    });

    const rotate = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    useEffect(() => {
        // Listen for tour-triggered menu opening
        const sub = DeviceEventEmitter.addListener('OPEN_MENU', () => {
            if (onMenuPress) onMenuPress();
        });
        return () => sub.remove();
    }, [onMenuPress]);

    return (
        <LinearGradient
            colors={colors.headerGradient as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[
                styles.container,
                (!showActionRow && !showUserBlock) ? styles.compactContainer : styles.defaultContainer
            ]}
        >
            <View style={[styles.topRow, (showActionRow || showUserBlock) && styles.defaultTopRow]}>
                {showBackButton ? (
                    <Pressable style={styles.iconBlock} onPress={onBackPress}>
                        <BackIcon />
                    </Pressable>
                ) : (
                    <Pressable style={styles.iconBlock} onPress={onMenuPress}>
                        <TourTarget id="home_menu_btn">
                            <MenuIcon />
                        </TourTarget>
                    </Pressable>
                )}
                <View style={[styles.greetingContainer, centerTitle && styles.centerContainer]}>
                    <TourTarget id="home_overview" style={centerTitle ? { width: '100%', alignItems: 'center' } : { alignSelf: 'flex-start' }}>
                        <Text style={[styles.greetingTitle, centerTitle && styles.centerText]}>{title || getGreeting()}</Text>
                        {subtitle ? (
                            <Text style={[styles.greetingSubtitle, centerTitle && styles.centerText]}>{subtitle}</Text>
                        ) : !centerTitle ? (
                            <Text style={styles.greetingSubtitle}>{getFormattedDate()}</Text>
                        ) : null}
                    </TourTarget>
                </View>
                {showRightIcon ? (
                    <View style={styles.iconBlock}>
                        {showCrossButton ? (
                            <Pressable onPress={onBackPress}>
                                <CrossIcon />
                            </Pressable>
                        ) : (
                            <Pressable onPress={() => navigate('profile')}>
                                <TourTarget id="profile_entry">
                                    <ProfileIcon />
                                </TourTarget>
                            </Pressable>
                        )}
                    </View>
                ) : centerTitle ? (
                    /* Dynamic Spacer to ensure perfect centering when title is centered but right icon is hidden */
                    <View style={{ width: 46 }} />
                ) : null}
            </View>

            {showUserBlock && (
                <Pressable onPress={toggleExpand}>
                    <Animated.View style={[styles.userBlock, { height: blockHeight }]}>
                        <View style={styles.userMainRow}>
                            {profile?.photo_url && getAvatarSource(profile.photo_url) ? (
                                <Image
                                    source={getAvatarSource(profile.photo_url)}
                                    style={styles.userImage}
                                />
                            ) : (
                                <View style={[styles.userImage, styles.avatarPlaceholder]}>
                                    <Text style={styles.avatarPlaceholderText}>
                                        {(profile?.full_name || 'U').charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{profile?.full_name || t('loading')}</Text>
                                <Text style={styles.userDetails}>
                                    {profile?.dob ? `${new Date().getFullYear() - new Date(profile.dob).getFullYear()} ${t('years')}` : ''}
                                    {profile?.gender ? ` • ${t(profile.gender.toLowerCase() as any) || profile.gender}` : ''}
                                </Text>
                            </View>

                            <Animated.View style={{ transform: [{ rotate }] }}>
                                <DropdownIcon size={20} />
                            </Animated.View>
                        </View>

                        {isExpanded && (
                            <View style={styles.expandedDetails}>
                                <Text style={styles.detailText}>{profile?.phone || t('no_phone')}</Text>
                                <Text style={styles.detailText}>{profile?.email || ''}</Text>
                                <Text style={styles.detailText}>{profile?.address || 'India'}</Text>
                            </View>
                        )}

                    </Animated.View>
                </Pressable>
            )}


            {showActionRow && (
                <>
                    <Text style={styles.promptText}>{t('understand_report')}</Text>

                    <TourTarget id="upload_section" style={styles.actionRow}>
                        <Pressable style={styles.actionItem} onPress={() => navigate('scan_report')}>
                            <View style={styles.actionBlock}>
                                <Image
                                    source={require('../../assets/icons/home/scan.png')}
                                    style={styles.scanIcon}
                                />
                            </View>
                            <Text style={styles.actionText}>{t('scan')}{"\n"}{t('report')}</Text>
                        </Pressable>

                        <Text style={styles.orText}>{t('or')}</Text>

                        <Pressable style={styles.actionItem} onPress={handleUpload}>
                            <View style={styles.actionBlock}>
                                <UploadIcon size={35} color="#FFFFFF" />
                            </View>
                            <Text style={styles.actionText}>{t('upload')}{"\n"}{t('report')}</Text>
                        </Pressable>
                    </TourTarget>
                </>
            )}


            <View style={{ height: 20 }} />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingHorizontal: 25,
        borderBottomLeftRadius: 50,
        borderBottomRightRadius: 50,
    },
    compactContainer: {
        height: 100,
        justifyContent: 'center',
        paddingTop: Platform.OS === 'ios' ? 20 : 0,
    },
    defaultContainer: {
        paddingTop: 25,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    defaultTopRow: {
        marginBottom: 30,
    },
    iconBlock: {
        width: 46,
        height: 46,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    greetingContainer: {
        flex: 1,
        marginLeft: 20,
    },
    centerContainer: {
        marginLeft: 0,
        alignItems: 'center',
    },
    centerText: {
        textAlign: 'center',
    },
    greetingTitle: {
        fontFamily: 'Judson-Bold',
        fontSize: 21,
        color: '#FFFFFF',
    },
    greetingSubtitle: {
        fontFamily: 'Judson-Regular',
        fontSize: 14,
        color: '#FFFFFF',
        marginTop: 2,
    },
    userBlock: {
        backgroundColor: 'rgba(217, 217, 217, 0.3)',
        borderRadius: 15,
        paddingHorizontal: 15,
        paddingVertical: 14,
        marginBottom: 25,
        overflow: 'hidden',
    },
    userMainRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
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
        fontSize: 20,
        color: '#FFFFFF',
    },
    userInfo: {
        flex: 1,
        marginLeft: 12,
    },
    userName: {
        fontFamily: 'Judson-Bold',
        fontSize: 18,
        color: '#FFFFFF',
    },
    userDetails: {
        fontFamily: 'Judson-Regular',
        fontSize: 13,
        color: '#FFFFFF',
        opacity: 0.8,
    },
    expandedDetails: {
        marginTop: 10,
        marginLeft: 62, // Aligned with user info
    },
    detailText: {
        fontFamily: 'Judson-Regular',
        fontSize: 13,
        color: '#FFFFFF',
        marginBottom: 4,
    },
    promptText: {
        fontFamily: 'Judson-Regular',
        fontSize: 16,
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 20,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBlock: {
        width: 54,
        height: 57,
        backgroundColor: 'rgba(217, 217, 217, 0.3)',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    actionText: {
        fontFamily: 'Judson-Regular',
        fontSize: 14,
        color: '#FFFFFF',
    },
    scanIcon: {
        width: 35,
        height: 35,
        tintColor: '#FFFFFF',
    },
    orText: {
        fontFamily: 'Judson-Regular',
        fontSize: 14,
        color: '#FFFFFF',
        marginHorizontal: 30,
    },
});

export default HomeHeader;

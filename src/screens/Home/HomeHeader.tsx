import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Platform, StatusBar, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MenuIcon, ProfileIcon, DropdownIcon, UploadIcon, BackIcon, CrossIcon } from './Icons';
import { useNavigation } from '../../context/NavigationContext';

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
    const [isExpanded, setIsExpanded] = useState(false);
    const animation = useRef(new Animated.Value(0)).current;
    const { navigate } = useNavigation();

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
        if (hour >= 5 && hour < 12) return 'Good Morning';
        if (hour >= 12 && hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const getFormattedDate = () => {
        const date = new Date();
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
        return date.toLocaleDateString('en-US', options);
    };

    const blockHeight = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [78, 160], // Expanded height to fit details
    });

    const rotate = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    return (
        <LinearGradient
            colors={['#0055FF', '#6A9EFF']}
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
                        <MenuIcon />
                    </Pressable>
                )}
                <View style={[styles.greetingContainer, centerTitle && styles.centerContainer]}>
                    <Text style={[styles.greetingTitle, centerTitle && styles.centerText]}>{title || getGreeting()}</Text>
                    {subtitle ? (
                        <Text style={[styles.greetingSubtitle, centerTitle && styles.centerText]}>{subtitle}</Text>
                    ) : !centerTitle ? (
                        <Text style={styles.greetingSubtitle}>{getFormattedDate()}</Text>
                    ) : null}
                </View>
                {showRightIcon ? (
                    <View style={styles.iconBlock}>
                        {showCrossButton ? (
                            <Pressable onPress={onBackPress}>
                                <CrossIcon />
                            </Pressable>
                        ) : (
                            <Pressable onPress={() => navigate('profile')}>
                                <ProfileIcon />
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
                            <Image
                                source={{ uri: 'https://avatar.iran.liara.run/public/70' }}
                                style={styles.userImage}
                            />
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>Suhani Badhe</Text>
                                <Text style={styles.userDetails}>20 years • Female</Text>
                            </View>
                            <Animated.View style={{ transform: [{ rotate }] }}>
                                <DropdownIcon size={20} />
                            </Animated.View>
                        </View>

                        {isExpanded && (
                            <View style={styles.expandedDetails}>
                                <Text style={styles.detailText}>8767969148</Text>
                                <Text style={styles.detailText}>suhanibadhe@gmail.com</Text>
                                <Text style={styles.detailText}>Pune, Maharashtra</Text>
                            </View>
                        )}
                    </Animated.View>
                </Pressable>
            )}

            {showActionRow && (
                <>
                    <Text style={styles.promptText}>Want to understand you report?</Text>

                    <View style={styles.actionRow}>
                        <View style={styles.actionItem}>
                            <View style={styles.actionBlock}>
                                <Image
                                    source={require('../../assets/icons/home/scan.png')}
                                    style={styles.scanIcon}
                                />
                            </View>
                            <Text style={styles.actionText}>Scan{"\n"}report</Text>
                        </View>

                        <Text style={styles.orText}>or</Text>

                        <View style={styles.actionItem}>
                            <View style={styles.actionBlock}>
                                <UploadIcon size={35} color="#FFFFFF" />
                            </View>
                            <Text style={styles.actionText}>Upload{"\n"}report</Text>
                        </View>
                    </View>
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

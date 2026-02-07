import { View, Text, StyleSheet, Dimensions, Platform, StatusBar, Pressable, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, ScreenName } from '../../../context/NavigationContext';
import AlertBox from '../../common/alert-box';
import { useState, useEffect, useRef } from 'react';

const { width, height } = Dimensions.get('window');

interface MenuProps {
    onClose: () => void;
}

const Menu: React.FC<MenuProps> = ({ onClose }) => {
    const slideAnim = useRef(new Animated.Value(-width)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const { navigate } = useNavigation();
    const [isAlertVisible, setIsAlertVisible] = useState(false);

    useEffect(() => {
        // Slide in and Fade in
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 350,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleClose = () => {
        // Slide out and Fade out
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: -width,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onClose(); // Call the parent onClose only after animation finishes
        });
    };

    // Menu items
    const menuItems: { label: string; screen: ScreenName }[] = [
        { label: "Home", screen: "home" },
        { label: "AI Assistant", screen: "ai_assistant" },
        { label: "Contact Us", screen: "contact_us" },
        { label: "Help & Policy", screen: "help_policy" },
        { label: "Settings", screen: "settings" },
        { label: "About", screen: "about" }
    ];

    const handleNavigation = (screen: ScreenName) => {
        handleClose();
        setTimeout(() => {
            navigate(screen);
        }, 300); // Wait for menu animation to finish
    };

    const handleLogout = () => {
        setIsAlertVisible(true);
    };

    const confirmLogout = () => {
        setIsAlertVisible(false);
        handleClose();
        setTimeout(() => {
            navigate('login');
        }, 300);
    };

    return (
        <View style={styles.overlay}>
            <Animated.View
                style={[styles.backdrop, { opacity: fadeAnim }]}
            >
                <Pressable style={{ flex: 1 }} onPress={handleClose} />
            </Animated.View>

            <Animated.View
                style={[
                    styles.containerWrapper,
                    { transform: [{ translateX: slideAnim }] }
                ]}
            >
                <LinearGradient
                    colors={['#0062FF', '#5C8EDF']}
                    style={styles.container}
                >
                    <View style={styles.header}>
                        <Image
                            source={require('../../../assets/images/logo.png')}
                            style={styles.logo}
                        />
                        <View style={styles.titleContainer}>
                            <Text style={styles.title}>Carevia</Text>
                        </View>
                    </View>

                    <View style={styles.itemList}>
                        {menuItems.map((item, index) => (
                            <Pressable key={index} onPress={() => handleNavigation(item.screen)}>
                                <Text style={styles.itemText}>{item.label}</Text>
                            </Pressable>
                        ))}
                    </View>

                    <View style={styles.footer}>
                        <Pressable onPress={handleLogout}>
                            <Text style={styles.itemText}>Logout</Text>
                        </Pressable>
                    </View>
                </LinearGradient>
            </Animated.View>

            <AlertBox
                visible={isAlertVisible}
                message="Do you really want to logout?"
                onYes={confirmLogout}
                onNo={() => setIsAlertVisible(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000,
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    containerWrapper: {
        width: width * 0.72,
        height: height,
    },
    container: {
        flex: 1,
        borderTopRightRadius: 60,
        borderBottomRightRadius: 60,
        borderRightWidth: 1,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#FFFFFF',
        paddingTop: Platform.OS === 'ios' ? 70 : (StatusBar.currentHeight || 0) + 50,
        paddingBottom: Platform.OS === 'ios' ? 40 : 40,
        paddingHorizontal: 25,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 80,
    },
    logo: {
        width: 46,
        height: 46,
        borderRadius: 15,
    },
    titleContainer: {
        marginLeft: 15,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 28,
        fontFamily: 'Judson-Bold',
        letterSpacing: 0.5,
    },
    subtitle: {
        color: '#FFFFFF',
        fontSize: 13,
        fontFamily: 'Judson-Regular',
        marginTop: -2,
    },
    itemList: {
        flex: 1,
        paddingLeft: 10,
    },
    itemText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontFamily: 'Judson-Regular',
        marginBottom: 45,
    },
    footer: {
        paddingLeft: 10,
        marginBottom: Platform.OS === 'ios' ? 40 : 30,
    }
});

export default Menu;

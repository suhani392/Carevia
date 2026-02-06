import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const MenuIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M4 5h16" />
        <Path d="M4 12h16" />
        <Path d="M4 19h16" />
    </Svg>
);

const Menu = () => {
    // Menu items as shown in the UI
    const menuItems = [
        "Home",
        "AI Assistant",
        "Contact Us",
        "Help & Policy",
        "Settings",
        "About"
    ];

    return (
        <View style={styles.wrapper}>
            <LinearGradient
                colors={['#0062FF', '#5C8EDF']}
                style={styles.container}
            >
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <MenuIcon />
                    </View>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>Carevia</Text>
                        <Text style={styles.subtitle}>Wednesday, 28 January</Text>
                    </View>
                </View>

                <View style={styles.itemList}>
                    {menuItems.map((item, index) => (
                        <Text key={index} style={styles.itemText}>{item}</Text>
                    ))}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.itemText}>Logout</Text>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: '#FFFFFF', // Clean background behind the drawer
    },
    container: {
        width: width * 0.72,
        height: height,
        // Rounded corners on the right side (both top and bottom)
        borderTopRightRadius: 60,
        borderBottomRightRadius: 60,
        // White stroke weight 1
        borderRightWidth: 1,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#FFFFFF',
        // Safe area placement
        paddingTop: Platform.OS === 'ios' ? 70 : (StatusBar.currentHeight || 0) + 50,
        paddingBottom: Platform.OS === 'ios' ? 40 : 40,
        paddingHorizontal: 25,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 80,
    },
    iconContainer: {
        width: 46,
        height: 46,
        backgroundColor: 'rgba(217, 217, 217, 0.3)',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleContainer: {
        marginLeft: 15,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 26,
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
        fontSize: 20,
        fontFamily: 'Judson-Regular',
        marginBottom: 45,
    },
    footer: {
        paddingLeft: 10,
        marginBottom: Platform.OS === 'ios' ? 40 : 30, // Account for bottom navigation
    }
});

export default Menu;

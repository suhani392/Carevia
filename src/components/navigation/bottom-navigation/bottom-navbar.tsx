import React, { useState, useRef } from 'react';
import { View, StyleSheet, Pressable, Animated, Image } from 'react-native';
import { useAppContext } from '../../../context/AppContext';
import { HomeIcon } from './icons';

interface BottomNavbarProps {
    activeTab: 'home' | 'family';
    onTabChange: (tab: 'home' | 'family') => void;
}

const BottomNavbar: React.FC<BottomNavbarProps> = ({ activeTab, onTabChange }) => {
    const { colors, themeMode } = useAppContext();
    const slideAnim = useRef(new Animated.Value(activeTab === 'home' ? 0 : 1)).current;

    React.useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: activeTab === 'home' ? 0 : 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
        }).start();
    }, [activeTab]);

    const toggleTab = (tab: 'home' | 'family') => {
        onTabChange(tab);
    };

    const travelDistance = 235 - 126;

    const translateX = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, travelDistance],
    });

    const homeScale = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1.1, 1],
    });

    const familyScale = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.1],
    });

    return (
        <View style={styles.outerWrapper}>
            <View style={[styles.container, { backgroundColor: themeMode === 'dark' ? '#2A2A2A' : '#CCE0FF' }]}>
                {/* 1. Sliding Button */}
                <Animated.View
                    style={[
                        styles.slider,
                        {
                            transform: [{ translateX }],
                            backgroundColor: colors.background,
                            borderColor: themeMode === 'dark' ? '#444' : '#CCE0FF'
                        }
                    ]}
                />

                {/* 2. Interactive Content Area */}
                <View style={styles.content}>
                    <Pressable onPress={() => toggleTab('home')} style={styles.tab}>
                        <Animated.View style={{ transform: [{ scale: homeScale }], opacity: activeTab === 'home' ? 1 : 0.6 }}>
                            <HomeIcon color={colors.primary} size={25} />
                        </Animated.View>
                    </Pressable>

                    <Pressable onPress={() => toggleTab('family')} style={styles.tab}>
                        <Animated.View style={{ transform: [{ scale: familyScale }], opacity: activeTab === 'family' ? 1 : 0.6 }}>
                            <Image
                                source={require('../../../assets/icons/bottom-navbar/family.png')}
                                style={[styles.familyIcon, { tintColor: colors.primary }]}
                                resizeMode="contain"
                            />
                        </Animated.View>
                    </Pressable>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    outerWrapper: {
        position: 'absolute',
        bottom: 50,
        width: '100%',
        alignItems: 'center',
    },
    container: {
        width: 235,
        height: 60,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 0,
    },
    slider: {
        position: 'absolute',
        width: 126,
        height: 60,
        borderRadius: 30,
        borderWidth: 1,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        height: 60,
    },
    tab: {
        flex: 1,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    familyIcon: {
        width: 30,
        height: 30,
    },
});

export default BottomNavbar;

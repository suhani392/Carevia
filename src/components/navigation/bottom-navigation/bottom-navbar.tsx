import React, { useState, useRef } from 'react';
import { View, StyleSheet, Pressable, Animated, Image } from 'react-native';
import { HomeIcon } from './icons';

const BottomNavbar = () => {
    const [activeTab, setActiveTab] = useState<'home' | 'family'>('home');
    const slideAnim = useRef(new Animated.Value(0)).current;

    const toggleTab = (tab: 'home' | 'family') => {
        setActiveTab(tab);
        Animated.spring(slideAnim, {
            toValue: tab === 'home' ? 0 : 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
        }).start();
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
            <View style={styles.container}>
                {/* 1. White Sliding Button - Shadows Removed */}
                <Animated.View
                    style={[
                        styles.slider,
                        { transform: [{ translateX }] }
                    ]}
                />

                {/* 2. Interactive Content Area */}
                <View style={styles.content}>
                    <Pressable onPress={() => toggleTab('home')} style={styles.tab}>
                        <Animated.View style={{ transform: [{ scale: homeScale }], opacity: activeTab === 'home' ? 1 : 0.6 }}>
                            <HomeIcon color="#3C87FF" size={25} />
                        </Animated.View>
                    </Pressable>

                    <Pressable onPress={() => toggleTab('family')} style={styles.tab}>
                        <Animated.View style={{ transform: [{ scale: familyScale }], opacity: activeTab === 'family' ? 1 : 0.6 }}>
                            <Image
                                source={require('../../../assets/icons/bottom-navbar/family.png')}
                                style={styles.familyIcon}
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
        backgroundColor: '#CCE0FF',
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 0,
    },
    slider: {
        position: 'absolute',
        width: 126,
        height: 60,
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#CCE0FF',
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
        tintColor: '#3C87FF',
    },
});

export default BottomNavbar;

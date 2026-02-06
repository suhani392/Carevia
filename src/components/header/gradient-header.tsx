import React from 'react';
import { View, StyleSheet, Dimensions, StatusBar, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const GradientHeader = () => {
    return (
        <View style={styles.wrapper}>
            <LinearGradient
                colors={['#0055FF', '#6A9EFF']} // Slightly higher contrast for visible gradient
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.container}
            >
                <View style={styles.content}>
                    <View style={styles.block} />
                    <View style={styles.block} />
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        width: width,
        height: 150, // Reduced total height
        backgroundColor: 'white',
    },
    container: {
        width: '100%',
        height: '100%',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        alignItems: 'center',
        // Padding to keep top space consistent while reducing overall footprint
        paddingTop: Platform.OS === 'ios' ? 55 : (StatusBar.currentHeight || 0) + 20,
    },
    content: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 25,
        alignItems: 'center',
    },
    block: {
        width: 46,
        height: 46,
        backgroundColor: '#D9D9D9',
        opacity: 0.3,
        borderRadius: 15,
    },
});

export default GradientHeader;

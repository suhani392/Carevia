import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface AlertBoxProps {
    visible: boolean;
    message: string;
    onYes: () => void;
    onNo: () => void;
}

const AlertBox: React.FC<AlertBoxProps> = ({ visible, message, onYes, onNo }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const [shouldRender, setShouldRender] = useState(visible);

    useEffect(() => {
        if (visible) {
            setShouldRender(true);
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.8,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start(({ finished }) => {
                if (finished) {
                    setShouldRender(false);
                }
            });
        }
    }, [visible]);

    if (!shouldRender) return null;

    return (
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <Animated.View style={[styles.containerWrapper, { transform: [{ scale: scaleAnim }] }]}>
                <LinearGradient
                    colors={['#0062FF', '#5C8EDF']}
                    style={styles.mainBlock}
                >
                    <View style={styles.textBlock}>
                        <Text style={styles.messageText}>{message}</Text>
                    </View>

                    <View style={styles.buttonRow}>
                        <Pressable style={styles.button} onPress={onYes}>
                            <Text style={styles.buttonText}>Yess!</Text>
                        </Pressable>
                        <Pressable style={styles.button} onPress={onNo}>
                            <Text style={styles.buttonText}>Nooo</Text>
                        </Pressable>
                    </View>
                </LinearGradient>
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20000,
    },
    containerWrapper: {
        width: 326,
        height: 312,
    },
    mainBlock: {
        width: 326,
        height: 312,
        borderRadius: 50,
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textBlock: {
        width: 277,
        height: 197,
        backgroundColor: 'rgba(217, 217, 217, 0.3)',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        marginBottom: 15,
    },
    messageText: {
        fontFamily: 'Judson-Regular',
        fontSize: 18,
        color: '#FFFFFF',
        textAlign: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: 277,
    },
    button: {
        width: 130,
        height: 46,
        backgroundColor: 'rgba(217, 217, 217, 0.3)',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontFamily: 'Judson-Regular',
        fontSize: 16,
        color: '#FFFFFF',
    },
});

export default AlertBox;

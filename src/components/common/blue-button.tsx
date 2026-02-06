import React from 'react';
import { TouchableOpacity, StyleSheet, Text, ViewStyle } from 'react-native';

interface BlueButtonProps {
    title?: string;
    onPress?: () => void;
    style?: ViewStyle;
}

const BlueButton = ({ title = "Button", onPress, style }: BlueButtonProps) => {
    return (
        <TouchableOpacity
            style={[styles.button, style]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Text style={styles.text}>{title}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        width: 145,
        height: 46,
        backgroundColor: '#D9E8FF',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: '#000000',
        fontSize: 16,
        fontFamily: 'Judson-Regular',
    }
});

export default BlueButton;

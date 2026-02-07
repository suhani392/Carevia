import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '../../context/NavigationContext';

const AboutUsScreen = () => {
    const { navigate } = useNavigation();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>About Us</Text>
            <TouchableOpacity style={styles.button} onPress={() => navigate('home')}>
                <Text style={styles.buttonText}>Go Back</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    title: {
        fontSize: 24,
        fontFamily: 'Judson-Bold',
        marginBottom: 20,
    },
    button: {
        padding: 15,
        backgroundColor: '#0062FF',
        borderRadius: 10,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Judson-Bold',
    },
});

export default AboutUsScreen;

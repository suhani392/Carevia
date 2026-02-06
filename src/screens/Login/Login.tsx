import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Dimensions, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const Login = () => {
    return (
        <LinearGradient
            colors={['#0062FF', '#5C8EDF']}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>Login to your account</Text>
                    <Text style={styles.subtitle}>Enter your credentials to access you account</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email :</Text>
                        <TextInput
                            style={styles.input}
                            placeholderTextColor="rgba(0,0,0,0.5)"
                            placeholder=""
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password :</Text>
                        <TextInput
                            style={styles.input}
                            placeholderTextColor="rgba(0,0,0,0.5)"
                            secureTextEntry={true}
                            placeholder=""
                        />
                    </View>

                    <TouchableOpacity style={styles.loginBtn}>
                        <Text style={styles.loginBtnText}>Login</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.forgotBtn}>
                        <Text style={styles.forgotText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    <View style={styles.dividerContainer}>
                        <View style={styles.divider} />
                    </View>

                    <TouchableOpacity style={styles.googleBtn}>
                        <Image
                            source={require('../../assets/icons/login-signup/google.png')}
                            style={styles.googleIcon}
                            resizeMode="contain"
                        />
                        <Text style={styles.googleBtnText}>Login using Google</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Don’t have an account?</Text>
                    <TouchableOpacity>
                        <Text style={styles.createBtnText}>Create new account</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 25,
        paddingTop: Platform.OS === 'ios' ? 140 : 120, // Increased for vertical centering
        paddingBottom: 40,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 60,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 32,
        fontFamily: 'Judson-Bold',
        textAlign: 'center',
    },
    subtitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Judson-Regular',
        textAlign: 'center',
        marginTop: 20,
        width: '80%',
    },
    form: {
        width: '100%',
        alignItems: 'center',
    },
    inputGroup: {
        width: 380,
        marginBottom: 25,
    },
    label: {
        color: '#FFFFFF',
        fontSize: 18,
        fontFamily: 'Judson-Bold',
        marginBottom: 8,
    },
    input: {
        width: 380,
        height: 55,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 20,
        paddingHorizontal: 20,
        fontSize: 16,
        fontFamily: 'Judson-Regular',
        color: '#000000',
    },
    loginBtn: {
        width: 250,
        height: 50,
        backgroundColor: '#FFFFFF',
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    loginBtnText: {
        color: '#000000',
        fontSize: 20,
        fontFamily: 'Judson-Bold',
    },
    forgotBtn: {
        width: 380, // Aligns with the further increased input block width
        alignItems: 'flex-end',
        marginTop: -10,
        marginBottom: 20,
    },
    forgotText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontFamily: 'Judson-Bold',
    },
    dividerContainer: {
        width: 380,
        alignItems: 'center',
        marginVertical: 40,
    },
    divider: {
        width: 380,
        height: 1,
        backgroundColor: '#FFFFFF',
    },
    googleBtn: {
        width: 300,
        height: 70,
        backgroundColor: '#FFFFFF',
        borderRadius: 100,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    googleIcon: {
        width: 30,
        height: 30,
        marginRight: 10,
    },
    googleBtnText: {
        color: '#000000',
        fontSize: 18,
        fontFamily: 'Judson-Bold',
    },
    footer: {
        alignItems: 'center',
        marginTop: 20,
    },
    footerText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontFamily: 'Judson-Bold',
    },
    createBtnText: {
        color: '#000000',
        fontSize: 18,
        fontFamily: 'Judson-Bold',
        marginTop: 10,
    }
});

export default Login;

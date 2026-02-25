import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Dimensions, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '../../context/NavigationContext';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';


const { width } = Dimensions.get('window');

const Login = () => {
    const { navigate } = useNavigation();
    const { t } = useAppContext();
    const [email, setEmail] = useState('');

    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.session) {
                navigate('home');
            }
        } catch (error: any) {
            Alert.alert('Login Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#0062FF', '#5C8EDF']}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>{t('login_title')}</Text>
                    <Text style={styles.subtitle}>{t('login_subtitle')}</Text>
                </View>


                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('email')} :</Text>

                        <TextInput
                            style={styles.input}
                            placeholderTextColor="rgba(0,0,0,0.5)"
                            placeholder=""
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('password')} :</Text>

                        <TextInput
                            style={styles.input}
                            placeholderTextColor="rgba(0,0,0,0.5)"
                            secureTextEntry={true}
                            placeholder=""
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.loginBtn}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text style={styles.loginBtnText}>{t('login_btn')}</Text>
                        )}
                    </TouchableOpacity>


                    <TouchableOpacity style={styles.forgotBtn}>
                        <Text style={styles.forgotText}>{t('forgot_password')}</Text>
                    </TouchableOpacity>


                    <View style={styles.dividerContainer}>
                        <View style={styles.divider} />
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>{t('no_account')}</Text>
                    <TouchableOpacity onPress={() => navigate('signup')}>
                        <Text style={styles.createBtnText}>{t('create_account')}</Text>
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
        paddingTop: Platform.OS === 'ios' ? 140 : 120,
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
        width: 330,
        marginBottom: 25,
    },
    label: {
        color: '#FFFFFF',
        fontSize: 18,
        fontFamily: 'Judson-Bold',
        marginBottom: 8,
        marginLeft: 15,
    },
    input: {
        width: 330,
        height: 55,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 20,
        paddingHorizontal: 20,
        fontSize: 16,
        fontFamily: 'Judson-Regular',
        color: '#000000',
        borderWidth: 1,
        borderColor: '#FFFFFF',
    },
    loginBtn: {
        width: 200,
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
        width: 330,
        alignItems: 'flex-end',
        marginTop: -10,
        marginBottom: 20,
        paddingRight: 10,
    },
    forgotText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontFamily: 'Judson-Bold',
    },
    dividerContainer: {
        width: 330,
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 30,
    },
    divider: {
        width: 330,
        height: 1,
        backgroundColor: '#FFFFFF',
    },
    footer: {
        alignItems: 'center',
        marginTop: 10,
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


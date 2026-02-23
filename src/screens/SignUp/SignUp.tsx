import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Dimensions, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '../../context/NavigationContext';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

const SignUp = () => {
    const { navigate } = useNavigation();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [dob, setDob] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dobText, setDobText] = useState('');
    const [loading, setLoading] = useState(false);

    const onDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || dob;
        setShowDatePicker(Platform.OS === 'ios');
        setDob(currentDate);

        // Display format for UI
        let displayDate = currentDate.getDate() + '/' + (currentDate.getMonth() + 1) + '/' + currentDate.getFullYear();
        setDobText(displayDate);
    };

    const handleSignUp = async () => {
        if (!email || !password || !name || !dobText || !phone) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            // 1. Sign up the user
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (signUpError) {
                // Check if user already exists
                if (signUpError.message.includes('already registered')) {
                    Alert.alert('Note', 'This email is already registered. Try logging in.');
                    navigate('login');
                    return;
                }
                throw signUpError;
            }

            if (data.user) {
                // 2. Format date for Postgres (YYYY-MM-DD)
                const pgDate = dob.toISOString().split('T')[0];

                // 3. Insert profile row
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({ // Using upsert in case the record exists
                        id: data.user.id,
                        full_name: name,
                        email: email.toLowerCase().trim(),
                        dob: pgDate,
                        phone: phone,
                    });

                if (profileError) throw profileError;

                Alert.alert('Success', 'Account created successfully!');

                // If email confirmation is off, we might already have a session
                if (data.session) {
                    navigate('home');
                } else {
                    navigate('login');
                }
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
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
                    <Text style={styles.title}>Create your account</Text>
                    <Text style={styles.subtitle}>Enter your credentials to create an account</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Name :</Text>
                        <TextInput
                            style={styles.input}
                            placeholderTextColor="rgba(0,0,0,0.5)"
                            placeholder=""
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email :</Text>
                        <TextInput
                            style={styles.input}
                            placeholderTextColor="rgba(0,0,0,0.5)"
                            keyboardType="email-address"
                            placeholder=""
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Date of Birth :</Text>
                        <TouchableOpacity
                            style={styles.input}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={[styles.dateText, !dobText && { color: 'rgba(0,0,0,0.5)' }]}>
                                {dobText || 'Select Date (DD/MM/YYYY)'}
                            </Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={dob}
                                mode="date"
                                display="default"
                                onChange={onDateChange}
                                maximumDate={new Date()}
                            />
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number :</Text>
                        <TextInput
                            style={styles.input}
                            placeholderTextColor="rgba(0,0,0,0.5)"
                            keyboardType="phone-pad"
                            placeholder=""
                            value={phone}
                            onChangeText={setPhone}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password :</Text>
                        <TextInput
                            style={styles.input}
                            placeholderTextColor="rgba(0,0,0,0.5)"
                            secureTextEntry={true}
                            placeholder=""
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirm Password :</Text>
                        <TextInput
                            style={styles.input}
                            placeholderTextColor="rgba(0,0,0,0.5)"
                            secureTextEntry={true}
                            placeholder=""
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.signUpBtn}
                        onPress={handleSignUp}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text style={styles.signUpBtnText}>Sign Up</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.dividerContainer}>
                        <View style={styles.divider} />
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account?</Text>
                    <TouchableOpacity onPress={() => navigate('login')}>
                        <Text style={styles.loginBtnText}>Login here</Text>
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
        paddingTop: Platform.OS === 'ios' ? 80 : 60,
        paddingBottom: 40,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
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
        marginTop: 15,
        width: '80%',
    },
    form: {
        width: '100%',
        alignItems: 'center',
    },
    inputGroup: {
        width: 330,
        marginBottom: 15,
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
        justifyContent: 'center',
    },
    dateText: {
        fontSize: 16,
        fontFamily: 'Judson-Regular',
        color: '#000000',
    },
    signUpBtn: {
        width: 200,
        height: 50,
        backgroundColor: '#FFFFFF',
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 25,
        marginBottom: 10,
    },
    signUpBtnText: {
        color: '#000000',
        fontSize: 20,
        fontFamily: 'Judson-Bold',
    },
    dividerContainer: {
        width: 330,
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 20,
    },
    divider: {
        width: 330,
        height: 1,
        backgroundColor: '#FFFFFF',
    },
    footer: {
        alignItems: 'center',
        marginTop: 5,
    },
    footerText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontFamily: 'Judson-Bold',
    },
    loginBtnText: {
        color: '#000000',
        fontSize: 18,
        fontFamily: 'Judson-Bold',
        marginTop: 5,
    }
});

export default SignUp;


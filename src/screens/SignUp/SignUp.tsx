import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Dimensions, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '../../context/NavigationContext';

const { width } = Dimensions.get('window');

const SignUp = () => {
    const { navigate } = useNavigation();
    const [dob, setDob] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dobText, setDobText] = useState('');

    const onDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || dob;
        setShowDatePicker(Platform.OS === 'ios');
        setDob(currentDate);

        let tempDate = new Date(currentDate);
        let fDate = tempDate.getDate() + '/' + (tempDate.getMonth() + 1) + '/' + tempDate.getFullYear();
        setDobText(fDate);
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
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email :</Text>
                        <TextInput
                            style={styles.input}
                            placeholderTextColor="rgba(0,0,0,0.5)"
                            keyboardType="email-address"
                            placeholder=""
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
                                maximumDate={new Date()} // DOB cannot be in future
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

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirm Password :</Text>
                        <TextInput
                            style={styles.input}
                            placeholderTextColor="rgba(0,0,0,0.5)"
                            secureTextEntry={true}
                            placeholder=""
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.signUpBtn}
                        onPress={() => navigate('home')}
                    >
                        <Text style={styles.signUpBtnText}>Sign Up</Text>
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
                        <Text style={styles.googleBtnText}>Sign Up using Google</Text>
                    </TouchableOpacity>
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
        justifyContent: 'center', // Added for date text centering
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
        marginVertical: 30,
    },
    divider: {
        width: 330,
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
        marginBottom: 30,
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
        marginTop: 10,
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

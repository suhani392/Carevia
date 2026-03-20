import React, { useState } from 'react';
import { 
    View, Text, StyleSheet, TextInput, TouchableOpacity, 
    Dimensions, Platform, ScrollView, Alert, ActivityIndicator,
    KeyboardAvoidingView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '../../context/NavigationContext';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { EyeIcon, EyeClosedIcon } from '../../components/common/PasswordIcons';

const { width } = Dimensions.get('window');

type Step = 'EMAIL' | 'OTP' | 'PASSWORD';

const ForgotPasswordOTP = () => {
    const { navigate, goBack } = useNavigation();
    const { t } = useAppContext();
    
    const [step, setStep] = useState<Step>('EMAIL');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    shouldCreateUser: false, // Don't create new users if they don't exist
                }
            });

            if (error) throw error;
            
            Alert.alert('OTP Sent', 'A 6-digit verification code has been sent to your email.');
            setStep('OTP');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to send OTP. Please ensure the email is correct.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp || otp.length < 6) {
            Alert.alert('Error', 'Please enter a valid 6-digit code');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'email',
            });

            if (error) throw error;
            
            // If verified, Supabase automatically signs the user in.
            // We now move to the password reset step.
            setStep('PASSWORD');
        } catch (error: any) {
            Alert.alert('Verification Failed', 'Invalid or expired code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;
            
            Alert.alert('Success', 'Your password has been reset successfully. You are now logged in.', [
                { text: 'Okay', onPress: () => navigate('home') }
            ]);
        } catch (error: any) {
            Alert.alert('Reset Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderEmailStep = () => (
        <View style={styles.form}>
            <Text style={styles.stepTitle}>Enter Your Email</Text>
            <Text style={styles.stepSubtitle}>We'll send you a 6-digit code to reset your password.</Text>
            
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Email :</Text>
                <TextInput
                    style={styles.input}
                    placeholder="example@email.com"
                    placeholderTextColor="rgba(0,0,0,0.3)"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
            </View>

            <TouchableOpacity 
                style={styles.actionBtn} 
                onPress={handleSendOTP}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.actionBtnText}>Send Code</Text>}
            </TouchableOpacity>
        </View>
    );

    const renderOTPStep = () => (
        <View style={styles.form}>
            <Text style={styles.stepTitle}>Verify Code</Text>
            <Text style={styles.stepSubtitle}>Please enter the 6-digit code sent to {email}</Text>
            
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Verification Code :</Text>
                <TextInput
                    style={styles.input}
                    placeholder="000000"
                    placeholderTextColor="rgba(0,0,0,0.3)"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                />
            </View>

            <TouchableOpacity 
                style={styles.actionBtn} 
                onPress={handleVerifyOTP}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.actionBtnText}>Verify OTP</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep('EMAIL')} style={styles.backLink}>
                <Text style={styles.backLinkText}>Wrong email? Go back</Text>
            </TouchableOpacity>
        </View>
    );

    const renderPasswordStep = () => (
        <View style={styles.form}>
            <Text style={styles.stepTitle}>New Password</Text>
            <Text style={styles.stepSubtitle}>Create a strong new password for your account.</Text>
            
            <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password :</Text>
                <View style={styles.passwordContainer}>
                    <TextInput
                        style={styles.passwordInput}
                        secureTextEntry={!showPassword}
                        value={newPassword}
                        onChangeText={setNewPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeIcon size={20} color="#0062FF" /> : <EyeClosedIcon size={20} color="#0062FF" />}
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password :</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: 'rgba(255, 255, 255, 0.6)' }]}
                    secureTextEntry={!showPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />
            </View>

            <TouchableOpacity 
                style={styles.actionBtn} 
                onPress={handleResetPassword}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.actionBtnText}>Reset Password</Text>}
            </TouchableOpacity>
        </View>
    );

    return (
        <LinearGradient colors={['#0062FF', '#5C8EDF']} style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <TouchableOpacity style={styles.headerBack} onPress={goBack}>
                        <Text style={styles.headerBackText}>← Back to Login</Text>
                    </TouchableOpacity>

                    <Text style={styles.mainTitle}>Account Recovery</Text>

                    {step === 'EMAIL' && renderEmailStep()}
                    {step === 'OTP' && renderOTPStep()}
                    {step === 'PASSWORD' && renderPasswordStep()}
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: {
        paddingHorizontal: 25,
        paddingTop: Platform.OS === 'ios' ? 80 : 60,
        paddingBottom: 40,
        alignItems: 'center',
    },
    headerBack: {
        alignSelf: 'flex-start',
        marginBottom: 40,
    },
    headerBackText: {
        color: '#FFFFFF',
        fontFamily: 'Judson-Bold',
        fontSize: 16,
    },
    mainTitle: {
        color: '#FFFFFF',
        fontSize: 32,
        fontFamily: 'Judson-Bold',
        marginBottom: 50,
        textAlign: 'center',
    },
    form: {
        width: '100%',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 25,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    stepTitle: {
        color: '#FFFFFF',
        fontSize: 24,
        fontFamily: 'Judson-Bold',
        marginBottom: 10,
    },
    stepSubtitle: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 15,
        fontFamily: 'Judson-Regular',
        textAlign: 'center',
        marginBottom: 30,
    },
    inputGroup: {
        width: '100%',
        marginBottom: 20,
    },
    label: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Judson-Bold',
        marginBottom: 8,
        marginLeft: 10,
    },
    input: {
        width: '100%',
        height: 55,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 15,
        paddingHorizontal: 20,
        fontSize: 16,
        fontFamily: 'Judson-Regular',
        color: '#000000',
    },
    passwordContainer: {
        width: '100%',
        height: 55,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    passwordInput: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        fontFamily: 'Judson-Regular',
        color: '#000000',
    },
    actionBtn: {
        width: '100%',
        height: 55,
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    actionBtnText: {
        color: '#0062FF',
        fontSize: 18,
        fontFamily: 'Judson-Bold',
    },
    backLink: {
        marginTop: 20,
    },
    backLinkText: {
        color: '#FFFFFF',
        textDecorationLine: 'underline',
        fontFamily: 'Judson-Regular',
    }
});

export default ForgotPasswordOTP;

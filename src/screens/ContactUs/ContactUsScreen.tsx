import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    Alert
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '../../context/NavigationContext';
import AppStatusBar from '../../components/status-bar/status-bar';
import HomeHeader from '../Home/HomeHeader';
import {
    EmailSupportIcon,
    CallUsIcon,
    ChatSupportIcon,
    ChevronRightIcon
} from './Icons';

const { width } = Dimensions.get('window');

const ContactUsScreen = () => {
    const { goBack } = useNavigation();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const prefillInfo = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setEmail(user.email || '');
                const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
                if (profile) setName(profile.full_name);
            }
        };
        prefillInfo();
    }, []);

    const handleSendMessage = async () => {
        if (!name.trim() || !email.trim() || !message.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase
                .from('contact_messages')
                .insert({ name, email, message });

            if (error) throw error;
            Alert.alert('Success', 'Your message has been sent!');
            setMessage('');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to send message');
        } finally {
            setLoading(false);
        }
    };


    const SupportCard = ({ icon: Icon, title, subtitle, onPress }: any) => (
        <TouchableOpacity style={styles.supportCard} onPress={onPress}>
            <View style={styles.cardLeft}>
                <View style={styles.iconContainer}>
                    <Icon color="#3C87FF" size={24} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.cardTitle}>{title}</Text>
                    <Text style={styles.cardSubtitle}>{subtitle}</Text>
                </View>
            </View>
            <ChevronRightIcon size={20} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <AppStatusBar />

            <HomeHeader
                showBackButton={true}
                onBackPress={goBack}
                showActionRow={false}
                showUserBlock={false}
                showRightIcon={false}
                centerTitle={true}
                title="Contact Us"
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Support Options */}
                    <View style={styles.cardsContainer}>
                        <SupportCard
                            icon={EmailSupportIcon}
                            title="Email Support"
                            subtitle="support@carevia.com"
                            onPress={() => { }}
                        />
                        <SupportCard
                            icon={CallUsIcon}
                            title="Call Us"
                            subtitle="+91 XX665.XXXXX"
                            onPress={() => { }}
                        />
                        <SupportCard
                            icon={ChatSupportIcon}
                            title="Chat Support"
                            subtitle="Available 9AM - 6PM"
                            onPress={() => { }}
                        />
                    </View>

                    {/* Contact Form */}
                    <View style={styles.formSection}>
                        <Text style={styles.formHeader}>Send Us a Message</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Your Name"
                            value={name}
                            onChangeText={setName}
                            placeholderTextColor="#A0A0A0"
                            editable={!loading}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Your Email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholderTextColor="#A0A0A0"
                            editable={!loading}
                        />

                        <TextInput
                            style={[styles.input, styles.messageInput]}
                            placeholder="Your Message"
                            value={message}
                            onChangeText={setMessage}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            placeholderTextColor="#A0A0A0"
                            editable={!loading}
                        />

                        <TouchableOpacity
                            style={styles.sendButtonContainer}
                            onPress={handleSendMessage}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#8EBDFF', '#4C8DFF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.sendButton}
                            >
                                <Text style={styles.sendButtonText}>
                                    {loading ? 'Sending...' : 'Send Message'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        paddingHorizontal: 25,
        paddingTop: 30,
    },
    cardsContainer: {
        marginBottom: 35,
    },
    supportCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#E6F0FF',
        borderRadius: 20,
        padding: 18,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(60, 135, 255, 0.2)',
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        marginLeft: 15,
    },
    cardTitle: {
        fontFamily: 'Judson-Bold',
        fontSize: 18,
        color: '#333333',
        marginBottom: 2,
    },
    cardSubtitle: {
        fontFamily: 'Judson-Regular',
        fontSize: 14,
        color: '#666666',
    },
    formSection: {
        marginTop: 10,
    },
    formHeader: {
        fontFamily: 'Judson-Bold',
        fontSize: 22,
        color: '#333333',
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#F2F7FF',
        borderRadius: 15,
        paddingHorizontal: 20,
        paddingVertical: 15,
        fontFamily: 'Judson-Regular',
        fontSize: 16,
        color: '#333333',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#E1EEFF',
    },
    messageInput: {
        height: 120,
        paddingTop: 15,
    },
    sendButtonContainer: {
        marginTop: 10,
        borderRadius: 30,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#0062FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    sendButton: {
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonText: {
        fontFamily: 'Judson-Bold',
        fontSize: 18,
        color: '#FFFFFF',
    },
});

export default ContactUsScreen;

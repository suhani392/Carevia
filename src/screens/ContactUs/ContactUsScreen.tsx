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
import { useAppContext } from '../../context/AppContext';
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
    const { colors, themeMode, t } = useAppContext();

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
            Alert.alert(t('error'), t('fill_all_fields'));
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase
                .from('contact_messages')
                .insert({ name, email, message });

            if (error) throw error;
            Alert.alert(t('status'), t('msg_sent_success'));
            setMessage('');
        } catch (error: any) {
            Alert.alert(t('error'), error.message || t('status'));
        } finally {
            setLoading(false);
        }
    };


    const SupportCard = ({ icon: Icon, title, subtitle, onPress }: any) => (
        <TouchableOpacity
            style={[styles.supportCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={onPress}
        >
            <View style={styles.cardLeft}>
                <View style={styles.iconContainer}>
                    <Icon color={colors.primary} size={24} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
                    <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
                </View>
            </View>
            <ChevronRightIcon size={20} color={colors.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <AppStatusBar />

            <HomeHeader
                showBackButton={true}
                onBackPress={goBack}
                showActionRow={false}
                showUserBlock={false}
                showRightIcon={false}
                centerTitle={true}
                title={t('contact_us')}
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
                            title={t('email_support')}
                            subtitle="support@carevia.com"
                            onPress={() => { }}
                        />
                        <SupportCard
                            icon={CallUsIcon}
                            title={t('call_us')}
                            subtitle="+91 XX665.XXXXX"
                            onPress={() => { }}
                        />
                        <SupportCard
                            icon={ChatSupportIcon}
                            title={t('chat_support')}
                            subtitle="Available 9AM - 6PM"
                            onPress={() => { }}
                        />
                    </View>

                    {/* Contact Form */}
                    <View style={styles.formSection}>
                        <Text style={[styles.formHeader, { color: colors.text }]}>{t('send_message_title')}</Text>

                        <TextInput
                            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                            placeholder={t('your_name')}
                            value={name}
                            onChangeText={setName}
                            placeholderTextColor={colors.textSecondary}
                            editable={!loading}
                        />

                        <TextInput
                            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                            placeholder={t('your_email')}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholderTextColor={colors.textSecondary}
                            editable={!loading}
                        />

                        <TextInput
                            style={[styles.input, styles.messageInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                            placeholder={t('your_message')}
                            value={message}
                            onChangeText={setMessage}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            placeholderTextColor={colors.textSecondary}
                            editable={!loading}
                        />

                        <TouchableOpacity
                            style={styles.sendButtonContainer}
                            onPress={handleSendMessage}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={themeMode === 'dark' ? ['#003366', '#001A33'] : ['#8EBDFF', '#4C8DFF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.sendButton}
                            >
                                <Text style={styles.sendButtonText}>
                                    {loading ? t('sending') : t('send_message')}
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
        borderRadius: 20,
        padding: 18,
        marginBottom: 15,
        borderWidth: 1,
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
        marginBottom: 2,
    },
    cardSubtitle: {
        fontFamily: 'Judson-Regular',
        fontSize: 14,
    },
    formSection: {
        marginTop: 10,
    },
    formHeader: {
        fontFamily: 'Judson-Bold',
        fontSize: 22,
        marginBottom: 20,
    },
    input: {
        borderRadius: 15,
        paddingHorizontal: 20,
        paddingVertical: 15,
        fontFamily: 'Judson-Regular',
        fontSize: 16,
        marginBottom: 15,
        borderWidth: 1,
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

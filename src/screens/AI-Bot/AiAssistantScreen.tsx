import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Dimensions, Pressable, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '../../context/NavigationContext';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { MenuIcon, CrossIcon, AttachIcon, SendIcon, LinkIcon } from './Icons';
import Menu from '../../components/navigation/menu-drawer/menu';
import AppStatusBar from '../../components/status-bar/status-bar';

const { width, height } = Dimensions.get('window');

const AiAssistantScreen = () => {
    const { navigate } = useNavigation();
    const { reports, documents, t, language } = useAppContext();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [inputText, setInputText] = useState('');
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
    const [selectedAttachment, setSelectedAttachment] = useState<string | null>(null);
    const [profile, setProfile] = useState<any>(null);

    // Mock messages
    const [messages, setMessages] = useState([
        { id: 1, type: 'bot', text: t('bot_welcome') },
    ]);


    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
            if (data) {
                setProfile(data);
                setMessages([{ id: 1, type: 'bot', text: `${t('greetings')} ${data.full_name}! ${t('bot_welcome')}` }]);
            }
        }
    };


    const handleSend = () => {
        if (inputText.trim() || selectedAttachment) {
            const newMessage = {
                id: messages.length + 1,
                type: 'user',
                text: selectedAttachment ? `[Linked: ${selectedAttachment}] ${inputText.trim()}` : inputText.trim(),
            };
            setMessages([...messages, newMessage]);
            setInputText('');
            setSelectedAttachment(null);

            // Mock bot response
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: prev.length + 1,
                    type: 'bot',
                    text: selectedAttachment ? t('analyzing_file') : t('analyzing')
                }]);
            }, 1000);

        }
    };

    const toggleAttachmentMenu = () => {
        setIsAttachmentMenuOpen(!isAttachmentMenuOpen);
    };

    const handleSelectAttachment = (name: string) => {
        setSelectedAttachment(name);
        setIsAttachmentMenuOpen(false);
    };


    return (
        <View style={styles.container}>
            <AppStatusBar />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {/* Header */}
                <LinearGradient
                    colors={['#0062FF', '#5C8EDF']}
                    style={styles.header}
                >
                    <View style={styles.headerContent}>
                        <TouchableOpacity
                            style={styles.iconBlock}
                            onPress={() => setIsMenuOpen(true)}
                        >
                            <MenuIcon color="#FFFFFF" size={24} />
                        </TouchableOpacity>

                        <View style={styles.titleContainer}>
                            <Text style={styles.title}>{t('ai_assistant')}</Text>
                            <Text style={styles.date}>{new Date().toLocaleDateString(language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
                        </View>


                        <TouchableOpacity
                            style={styles.iconBlock}
                            onPress={() => navigate('home')}
                        >
                            <CrossIcon color="#FFFFFF" size={24} />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {/* Chat Area */}
                <ScrollView
                    style={styles.chatArea}
                    contentContainerStyle={styles.chatScrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {messages.map((msg) => (
                        <View
                            key={msg.id}
                            style={[
                                styles.messageRow,
                                msg.type === 'user' ? styles.userRow : styles.botRow
                            ]}
                        >
                            <View
                                style={[
                                    styles.bubble,
                                    msg.type === 'user' ? styles.userBubble : styles.botBubble
                                ]}
                            >
                                <Text style={styles.messageText}>{msg.text}</Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>

                {/* Input Area */}
                <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                        {selectedAttachment && (
                            <View style={styles.attachmentBadge}>
                                <LinkIcon size={14} color="#0062FF" />
                                <Text style={styles.attachmentBadgeText}>{selectedAttachment}</Text>
                                <TouchableOpacity onPress={() => setSelectedAttachment(null)}>
                                    <CrossIcon size={14} color="#0062FF" />
                                </TouchableOpacity>
                            </View>
                        )}
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.textInput}
                                placeholder={t('ask_anything')}
                                placeholderTextColor="rgba(0, 0, 0, 0.4)"

                                value={inputText}
                                onChangeText={setInputText}
                                multiline
                            />
                            <View style={styles.inputActions}>
                                <TouchableOpacity style={styles.actionButton} onPress={toggleAttachmentMenu}>
                                    <AttachIcon size={24} color="#000000" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionButton} onPress={handleSend}>
                                    <SendIcon size={24} color="#0062FF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* Attachment Menu Pop-up - Outside KeyboardAvoidingView to keep position absolute to screen */}
            {isAttachmentMenuOpen && (
                <View style={styles.attachmentOverlay}>
                    <Pressable style={styles.overlayPressable} onPress={() => setIsAttachmentMenuOpen(false)} />
                    <View style={styles.attachmentPopup}>
                        <Text style={styles.attachmentPopupTitle}>{t('link_file')}</Text>
                        <ScrollView style={{ maxHeight: 200 }}>
                            {reports.length === 0 && documents.length === 0 && (
                                <Text style={styles.noAttachmentsText}>No files found to link</Text>
                            )}

                            {reports.map((report) => (
                                <TouchableOpacity
                                    key={`report-${report.id}`}
                                    style={styles.attachmentOption}
                                    onPress={() => handleSelectAttachment(report.name)}
                                >
                                    <Text style={styles.attachmentOptionText}>{report.name} (Report)</Text>
                                </TouchableOpacity>
                            ))}
                            {documents.map((doc) => (
                                <TouchableOpacity
                                    key={`doc-${doc.id}`}
                                    style={styles.attachmentOption}
                                    onPress={() => handleSelectAttachment(doc.name)}
                                >
                                    <Text style={styles.attachmentOptionText}>{doc.name} (Document)</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            )}

            {/* Menu Drawer */}
            {isMenuOpen && <Menu onClose={() => setIsMenuOpen(false)} />}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        height: 100,
        width: '100%',
        borderBottomLeftRadius: 50,
        borderBottomRightRadius: 50,
        justifyContent: 'center',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 25,
    },
    iconBlock: {
        width: 46,
        height: 46,
        backgroundColor: 'rgba(217, 217, 217, 0.3)',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'flex-start',
        marginLeft: 15,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 20,
        fontFamily: 'Judson-Bold',
    },
    date: {
        color: '#FFFFFF',
        fontSize: 12,
        fontFamily: 'Judson-Regular',
        opacity: 0.8,
    },
    chatArea: {
        flex: 1,
        paddingHorizontal: 20,
    },
    chatScrollContent: {
        paddingVertical: 20,
    },
    messageRow: {
        marginVertical: 8,
        width: '100%',
        flexDirection: 'row',
    },
    botRow: {
        justifyContent: 'flex-start',
    },
    userRow: {
        justifyContent: 'flex-end',
    },
    bubble: {
        maxWidth: '80%',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 20,
    },
    botBubble: {
        backgroundColor: '#F5F5F5',
        borderBottomLeftRadius: 0,
    },
    userBubble: {
        backgroundColor: '#CCE0FF',
        borderBottomRightRadius: 0,
    },
    messageText: {
        fontFamily: 'Judson-Regular',
        fontSize: 15,
        color: '#333',
    },
    inputContainer: {
        paddingTop: 10,
        paddingBottom: Platform.OS === 'ios' ? 30 : 20,
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
    },
    inputWrapper: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 0.5,
        borderColor: '#000000',
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    attachmentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 98, 255, 0.08)',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 8,
    },
    attachmentBadgeText: {
        color: '#0062FF',
        fontSize: 12,
        fontFamily: 'Judson-Bold',
        marginHorizontal: 8,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    textInput: {
        flex: 1,
        fontFamily: 'Judson-Regular',
        fontSize: 16,
        color: '#000000',
        paddingTop: 0,
        paddingBottom: 0,
    },
    inputActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        padding: 5,
        marginLeft: 10,
    },
    attachmentOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    overlayPressable: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    attachmentPopup: {
        width: width * 0.85,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 100, // Position above input bar
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
        paddingVertical: 15,
    },
    attachmentPopupTitle: {
        fontFamily: 'Judson-Bold',
        fontSize: 18,
        color: '#0062FF',
        textAlign: 'center',
        marginBottom: 10,
    },
    noAttachmentsText: {
        fontFamily: 'Judson-Regular',
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        paddingVertical: 20,
    },
    attachmentOption: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    attachmentOptionText: {
        fontFamily: 'Judson-Regular',
        fontSize: 15,
        color: '#000000',
    },
});


export default AiAssistantScreen;

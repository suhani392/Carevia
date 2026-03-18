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
    const { reports, documents, t, language, colors } = useAppContext();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [inputText, setInputText] = useState('');
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
    const [selectedAttachment, setSelectedAttachment] = useState<string | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Mock messages
    const [messages, setMessages] = useState([
        { id: 1, type: 'bot', text: t('bot_welcome') },
    ]);


    useEffect(() => {
        const init = async () => {
            await fetchProfile();
            await fetchHistory();
        };
        init();
    }, []);

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
            if (data) {
                setProfile(data);
            }
        }
    };

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            setMessages([{ id: 1, type: 'bot', text: profile ? `${t('greetings')} ${profile.full_name}! ${t('bot_welcome')}` : t('bot_welcome') }]);
        } catch (err) {
            console.error("History fetch error:", err);
        } finally {
            setLoadingHistory(false);
        }
    };


    const handleSend = async () => {
        if (inputText.trim() || selectedAttachment) {
            const userMsgText = inputText.trim();
            const attachment = reports.find(r => r.name === selectedAttachment);
            const reportId = attachment?.id || null;

            const newMessage = {
                id: messages.length + 1,
                type: 'user',
                text: selectedAttachment ? `[Linked: ${selectedAttachment}] ${userMsgText}` : userMsgText,
            };

            setMessages(prev => [...prev, newMessage]);
            setInputText('');

            try {
                // Add temporary bot loading message
                const loadingId = messages.length + 2;
                setMessages(prev => [...prev, { id: loadingId, type: 'bot', text: '...' }]);

                const { data, error } = await supabase.functions.invoke('ai-chat', {
                    body: {
                        message: userMsgText,
                        report_id: reportId
                    }
                });

                if (error || !data) throw new Error(error?.message || "Function error");

                setMessages(prev => {
                    const filtered = prev.filter(m => m.id !== loadingId);
                    return [...filtered, {
                        id: loadingId,
                        type: 'bot',
                        text: data.text,
                        isEmergency: data.isEmergency
                    }];
                });

            } catch (err: any) {
                console.error("Chat Error:", err);
                setMessages(prev => [...prev, { id: prev.length + 1, type: 'bot', text: "Sorry, I had trouble connecting. Please try again." }]);
            }
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
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <AppStatusBar />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {/* Header */}
                <LinearGradient
                    colors={colors.headerGradient as any}
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
                            <Text style={styles.title}>{selectedAttachment ? "Report Mode" : t('ai_assistant')}</Text>
                            <Text style={styles.date}>{selectedAttachment ? `Analyzing: ${selectedAttachment}` : "General Health Mode"}</Text>
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
                    style={[styles.chatArea, { backgroundColor: colors.background }]}
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
                                    msg.type === 'user'
                                        ? [styles.userBubble, { backgroundColor: colors.primaryLight }]
                                        : [
                                            styles.botBubble,
                                            { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1 },
                                            (msg as any).isEmergency && { backgroundColor: '#FFEEF0', borderColor: '#FF5C5C', borderWidth: 2 }
                                        ]
                                ]}
                            >
                                {(msg as any).isEmergency && (
                                    <View style={styles.emergencyLabel}>
                                        <Text style={styles.emergencyLabelText}>EMERGENCY ALERT</Text>
                                    </View>
                                )}
                                <Text style={[
                                    styles.messageText,
                                    { color: colors.text },
                                    (msg as any).isEmergency && { color: '#D32F2F', fontFamily: 'Judson-Bold' }
                                ]}>
                                    {msg.text.split(/(\*\*.*?\*\*)/g).map((part: string, index: number) => {
                                        if (part.startsWith('**') && part.endsWith('**')) {
                                            return <Text key={index} style={{ fontFamily: 'Judson-Bold' }}>{part.slice(2, -2)}</Text>;
                                        }
                                        return part;
                                    })}
                                </Text>

                                {(msg as any).isEmergency && (
                                    <TouchableOpacity
                                        style={styles.callButton}
                                        onPress={() => alert("Calling Emergency Services (108)...")}
                                    >
                                        <Text style={styles.callButtonText}>CALL 108 NOW</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))}
                </ScrollView>

                {/* Input Area */}
                <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border, borderWidth: 1 }]}>
                        {selectedAttachment && (
                            <View style={[styles.attachmentBadge, { backgroundColor: colors.primaryLight }]}>
                                <LinkIcon size={14} color={colors.primary} />
                                <Text style={[styles.attachmentBadgeText, { color: colors.primary }]}>{selectedAttachment}</Text>
                                <TouchableOpacity onPress={() => setSelectedAttachment(null)}>
                                    <CrossIcon size={14} color={colors.primary} />
                                </TouchableOpacity>
                            </View>
                        )}
                        <View style={styles.inputRow}>
                            <TextInput
                                style={[styles.textInput, { color: colors.text }]}
                                placeholder={t('ask_anything')}
                                placeholderTextColor={colors.textSecondary}

                                value={inputText}
                                onChangeText={setInputText}
                                multiline
                            />
                            <View style={styles.inputActions}>
                                <TouchableOpacity style={styles.actionButton} onPress={toggleAttachmentMenu}>
                                    <AttachIcon size={24} color={colors.text} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionButton} onPress={handleSend}>
                                    <SendIcon size={24} color={colors.primary} />
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
                    <View style={[styles.attachmentPopup, { backgroundColor: colors.modalBg }]}>
                        <Text style={[styles.attachmentPopupTitle, { color: colors.primary }]}>{t('link_file')}</Text>
                        <ScrollView style={{ maxHeight: 200 }}>
                            {reports.length === 0 && documents.length === 0 && (
                                <Text style={[styles.noAttachmentsText, { color: colors.textSecondary }]}>No files found to link</Text>
                            )}

                            {reports.map((report) => (
                                <TouchableOpacity
                                    key={`report-${report.id}`}
                                    style={[styles.attachmentOption, { borderBottomColor: colors.divider }]}
                                    onPress={() => handleSelectAttachment(report.name)}
                                >
                                    <Text style={[styles.attachmentOptionText, { color: colors.text }]}>{report.name} (Report)</Text>
                                </TouchableOpacity>
                            ))}
                            {documents.map((doc) => (
                                <TouchableOpacity
                                    key={`doc-${doc.id}`}
                                    style={[styles.attachmentOption, { borderBottomColor: colors.divider }]}
                                    onPress={() => handleSelectAttachment(doc.name)}
                                >
                                    <Text style={[styles.attachmentOptionText, { color: colors.text }]}>{doc.name} (Document)</Text>
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
        borderBottomLeftRadius: 0,
    },
    userBubble: {
        borderBottomRightRadius: 0,
    },
    messageText: {
        fontFamily: 'Judson-Regular',
        fontSize: 15,
    },
    inputContainer: {
        paddingTop: 10,
        paddingBottom: Platform.OS === 'ios' ? 30 : 20,
        paddingHorizontal: 20,
    },
    inputWrapper: {
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    attachmentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 8,
    },
    attachmentBadgeText: {
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
        textAlign: 'center',
        marginBottom: 10,
    },
    noAttachmentsText: {
        fontFamily: 'Judson-Regular',
        fontSize: 14,
        textAlign: 'center',
        paddingVertical: 20,
    },
    attachmentOption: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 0.5,
    },
    attachmentOptionText: {
        fontFamily: 'Judson-Regular',
        fontSize: 15,
    },
    emergencyLabel: {
        backgroundColor: '#FF5C5C',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginBottom: 8,
    },
    emergencyLabelText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontFamily: 'Judson-Bold',
    },
    callButton: {
        backgroundColor: '#D32F2F',
        paddingVertical: 10,
        borderRadius: 10,
        marginTop: 12,
        alignItems: 'center',
    },
    callButtonText: {
        color: '#FFFFFF',
        fontFamily: 'Judson-Bold',
        fontSize: 14,
    },
});


export default AiAssistantScreen;

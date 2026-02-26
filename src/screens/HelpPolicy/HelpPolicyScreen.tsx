import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Animated,
    Modal,
    Platform,
    Dimensions
} from 'react-native';
import { useNavigation } from '../../context/NavigationContext';
import { useAppContext } from '../../context/AppContext';
import AppStatusBar from '../../components/status-bar/status-bar';
import HomeHeader from '../Home/HomeHeader';
import {
    UploadReportsIcon,
    AddMembersIcon,
    EmergencyAccessIcon,
    SecureDataIcon,
    TermsIcon,
    RateIcon,
    FeedbackIcon,
    PlusIcon,
    ChevronRightIcon
} from './Icons';

const { width, height } = Dimensions.get('window');

const HelpItem = ({ icon: Icon, question, answer, isExpanded, onToggle }: any) => {
    const { colors } = useAppContext();
    const animation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(animation, {
            toValue: isExpanded ? 1 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [isExpanded]);

    const rotate = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg'],
    });

    const bodyHeight = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 120], // Increased height to accommodate translated text if any
    });

    const opacity = animation.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0, 1],
    });

    return (
        <View style={styles.helpCardWrapper}>
            <TouchableOpacity
                style={[
                    styles.helpCard,
                    { backgroundColor: colors.card, borderColor: colors.cardBorder },
                    isExpanded && styles.helpCardExpanded
                ]}
                onPress={onToggle}
                activeOpacity={0.7}
            >
                <View style={styles.itemLeft}>
                    <View style={styles.iconContainer}>
                        <Icon color={colors.primary} size={24} />
                    </View>
                    <Text style={[styles.itemLabel, { color: colors.text }]}>{question}</Text>
                </View>
                <Animated.View style={{ transform: [{ rotate }] }}>
                    <PlusIcon size={18} color={colors.primary} />
                </Animated.View>
            </TouchableOpacity>

            <Animated.View style={[
                styles.answerContainer,
                { height: bodyHeight, opacity, backgroundColor: colors.card, borderColor: colors.cardBorder }
            ]}>
                <Text style={[styles.answerText, { color: colors.textSecondary }]}>{answer}</Text>
            </Animated.View>
        </View>
    );
};

const HelpPolicyScreen = () => {
    const { goBack, navigate } = useNavigation();
    const { colors, themeMode, t } = useAppContext();
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [isTermsVisible, setIsTermsVisible] = useState(false);

    const helpData = [
        {
            icon: UploadReportsIcon,
            question: t('faq_q1'),
            answer: t('faq_a1')
        },
        {
            icon: AddMembersIcon,
            question: t('faq_q2'),
            answer: t('faq_a2')
        },
        {
            icon: EmergencyAccessIcon,
            question: t('faq_q3'),
            answer: t('faq_a3')
        },
        {
            icon: SecureDataIcon,
            question: t('faq_q4'),
            answer: t('faq_a4')
        },
    ];

    const toggleExpand = (index: number) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

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
                title={t('help_policy')}
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Help Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('help')}</Text>
                    {helpData.map((item, index) => (
                        <HelpItem
                            key={index}
                            {...item}
                            isExpanded={expandedIndex === index}
                            onToggle={() => toggleExpand(index)}
                        />
                    ))}
                </View>

                {/* Policy Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('policy')}</Text>
                    <TouchableOpacity
                        style={[styles.policyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                        onPress={() => setIsTermsVisible(true)}
                    >
                        <View style={styles.itemLeft}>
                            <View style={styles.iconContainer}>
                                <TermsIcon color={colors.primary} size={24} />
                            </View>
                            <Text style={[styles.itemLabel, { color: colors.text }]}>{t('terms_conditions')}</Text>
                        </View>
                        <ChevronRightIcon size={20} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* Feedback Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('feedback')}</Text>
                    <TouchableOpacity style={[styles.policyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                        <View style={styles.itemLeft}>
                            <View style={styles.iconContainer}>
                                <RateIcon color={colors.primary} size={24} />
                            </View>
                            <Text style={[styles.itemLabel, { color: colors.text }]}>{t('rate_carevia')}</Text>
                        </View>
                        <ChevronRightIcon size={20} color={colors.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.policyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                        <View style={styles.itemLeft}>
                            <View style={styles.iconContainer}>
                                <FeedbackIcon color={colors.primary} size={24} />
                            </View>
                            <Text style={[styles.itemLabel, { color: colors.text }]}>{t('send_feedback')}</Text>
                        </View>
                        <ChevronRightIcon size={20} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Terms Modal */}
            <Modal
                visible={isTermsVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsTermsVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('terms_conditions')}</Text>
                            <TouchableOpacity onPress={() => setIsTermsVisible(false)} style={styles.closeButton}>
                                <Text style={[styles.closeIcon, { color: colors.textSecondary }]}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false} style={styles.termsScroll}>
                            <Text style={[styles.termsText, { color: colors.textSecondary }]}>
                                {t('last_updated')}: February 2026{"\n"}{"\n"}
                                1. Acceptance of Terms{"\n"}
                                By accessing or using Carevia, you agree to be bound by these Terms and Conditions and all applicable laws and regulations.{"\n"}{"\n"}
                                2. Health Data Privacy{"\n"}
                                We take your health data privacy seriously. All medical records and personal information are encrypted. You retain full ownership of your data.{"\n"}{"\n"}
                                3. Not a Medical Provider{"\n"}
                                Carevia is a management tool for medical documents and reminders. We are not medical professionals and do not provide medical advice, diagnosis, or treatment.{"\n"}{"\n"}
                                4. User Responsibilities{"\n"}
                                You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account.{"\n"}{"\n"}
                                5. Emergency Access{"\n"}
                                By enabling emergency access, you authorize your designated contacts to view specific medical information when required.{"\n"}{"\n"}
                                6. Service Availability{"\n"}
                                While we strive for 100% uptime, Carevia does not guarantee uninterrupted service and is not responsible for any data loss.{"\n"}{"\n"}
                                7. Termination{"\n"}
                                We reserve the right to terminate or suspend access to our service immediately, without prior notice, for any reason whatsoever.{"\n"}{"\n"}
                                8. Changes to Terms{"\n"}
                                We reserve the right to modify these terms at any time. We will provide notice of any significant changes.
                            </Text>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontFamily: 'Judson-Bold',
        fontSize: 20,
        marginBottom: 15,
    },
    helpCardWrapper: {
        marginBottom: 12,
    },
    helpCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 15,
        padding: 15,
        borderWidth: 1,
    },
    helpCardExpanded: {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderBottomWidth: 0,
    },
    answerContainer: {
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        paddingHorizontal: 15,
        overflow: 'hidden',
        borderWidth: 1,
        borderTopWidth: 0,
    },
    answerText: {
        fontFamily: 'Judson-Regular',
        fontSize: 14,
        lineHeight: 20,
        paddingBottom: 15,
    },
    policyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 15,
        padding: 15,
        marginBottom: 12,
        borderWidth: 1,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    itemLabel: {
        fontFamily: 'Judson-Regular',
        fontSize: 16,
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        borderRadius: 30,
        width: '100%',
        maxHeight: height * 0.8,
        padding: 25,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontFamily: 'Judson-Bold',
        fontSize: 22,
    },
    closeButton: {
        padding: 5,
    },
    closeIcon: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    termsScroll: {
        flexGrow: 0,
    },
    termsText: {
        fontFamily: 'Judson-Regular',
        fontSize: 15,
        lineHeight: 24,
    },
});

export default HelpPolicyScreen;

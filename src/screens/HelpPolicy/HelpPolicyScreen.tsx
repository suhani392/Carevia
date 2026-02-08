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
        outputRange: [0, 100], // Approximate height for answer
    });

    const opacity = animation.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0, 1],
    });

    return (
        <View style={styles.helpCardWrapper}>
            <TouchableOpacity
                style={[styles.helpCard, isExpanded && styles.helpCardExpanded]}
                onPress={onToggle}
                activeOpacity={0.7}
            >
                <View style={styles.itemLeft}>
                    <View style={styles.iconContainer}>
                        <Icon color="#3C87FF" size={24} />
                    </View>
                    <Text style={styles.itemLabel}>{question}</Text>
                </View>
                <Animated.View style={{ transform: [{ rotate }] }}>
                    <PlusIcon size={18} color="#3C87FF" />
                </Animated.View>
            </TouchableOpacity>

            <Animated.View style={[styles.answerContainer, { height: bodyHeight, opacity }]}>
                <Text style={styles.answerText}>{answer}</Text>
            </Animated.View>
        </View>
    );
};

const HelpPolicyScreen = () => {
    const { goBack, navigate } = useNavigation();
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [isTermsVisible, setIsTermsVisible] = useState(false);

    const helpData = [
        {
            icon: UploadReportsIcon,
            question: "How to upload reports?",
            answer: "Go to the Home screen, tap on 'Upload Report', select your document from the gallery or scan it using our advanced medical scanner."
        },
        {
            icon: AddMembersIcon,
            question: "How to add family members?",
            answer: "Navigate to the Family screen, tap the '+' icon or 'Add Member' button, and enter their basic details to start tracking their health."
        },
        {
            icon: EmergencyAccessIcon,
            question: "How emergency access works?",
            answer: "Emergency access allows designated contacts to view your critical medical info during an emergency, even if you can't unlock your phone."
        },
        {
            icon: SecureDataIcon,
            question: "How secure is my data?",
            answer: "Your data is encrypted using military-grade AES-256 encryption. We never share your medical records with third parties without your consent."
        },
    ];

    const toggleExpand = (index: number) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

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
                title="Help & Policy"
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Help Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Help</Text>
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
                    <Text style={styles.sectionTitle}>Policy</Text>
                    <TouchableOpacity style={styles.policyCard} onPress={() => setIsTermsVisible(true)}>
                        <View style={styles.itemLeft}>
                            <View style={styles.iconContainer}>
                                <TermsIcon color="#3C87FF" size={24} />
                            </View>
                            <Text style={styles.itemLabel}>Terms & Conditions</Text>
                        </View>
                        <ChevronRightIcon size={20} color="#3C87FF" />
                    </TouchableOpacity>
                </View>

                {/* Feedback Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Feedback</Text>
                    <TouchableOpacity style={styles.policyCard}>
                        <View style={styles.itemLeft}>
                            <View style={styles.iconContainer}>
                                <RateIcon color="#3C87FF" size={24} />
                            </View>
                            <Text style={styles.itemLabel}>Rate Carevia</Text>
                        </View>
                        <ChevronRightIcon size={20} color="#3C87FF" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.policyCard}>
                        <View style={styles.itemLeft}>
                            <View style={styles.iconContainer}>
                                <FeedbackIcon color="#3C87FF" size={24} />
                            </View>
                            <Text style={styles.itemLabel}>Send Feedback</Text>
                        </View>
                        <ChevronRightIcon size={20} color="#3C87FF" />
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
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Terms & Conditions</Text>
                            <TouchableOpacity onPress={() => setIsTermsVisible(false)} style={styles.closeButton}>
                                <Text style={styles.closeIcon}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false} style={styles.termsScroll}>
                            <Text style={styles.termsText}>
                                Last Updated: February 2026{"\n"}{"\n"}
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
        backgroundColor: '#FFFFFF',
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
        color: '#000000',
        marginBottom: 15,
    },
    helpCardWrapper: {
        marginBottom: 12,
    },
    helpCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#E6F1FF',
        borderRadius: 15,
        padding: 15,
        borderWidth: 1,
        borderColor: '#D0E5FF',
    },
    helpCardExpanded: {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderBottomWidth: 0,
    },
    answerContainer: {
        backgroundColor: '#E6F1FF',
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        paddingHorizontal: 15,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#D0E5FF',
        borderTopWidth: 0,
    },
    answerText: {
        fontFamily: 'Judson-Regular',
        fontSize: 14,
        color: '#555555',
        lineHeight: 20,
        paddingBottom: 15,
    },
    policyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#E6F1FF',
        borderRadius: 15,
        padding: 15,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#D0E5FF',
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
        color: '#000000',
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
        backgroundColor: '#FFFFFF',
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
        color: '#000000',
    },
    closeButton: {
        padding: 5,
    },
    closeIcon: {
        fontSize: 20,
        color: '#666666',
        fontWeight: 'bold',
    },
    termsScroll: {
        flexGrow: 0,
    },
    termsText: {
        fontFamily: 'Judson-Regular',
        fontSize: 15,
        color: '#444444',
        lineHeight: 24,
    },
});

export default HelpPolicyScreen;

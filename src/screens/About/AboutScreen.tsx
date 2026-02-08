import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
} from 'react-native';
import { useNavigation } from '../../context/NavigationContext';
import AppStatusBar from '../../components/status-bar/status-bar';
import HomeHeader from '../Home/HomeHeader';
import { CheckCircleIcon } from '../HelpPolicy/Icons';

const AboutScreen = () => {
    const { goBack } = useNavigation();

    const BulletPoint = ({ text }: { text: string }) => (
        <View style={styles.bulletRow}>
            <CheckCircleIcon size={20} color="#3C87FF" />
            <Text style={styles.bulletText}>{text}</Text>
        </View>
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
                title="About Carevia"
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.logoSection}>
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../../assets/images/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.brandName}>Carevia</Text>
                    <Text style={styles.tagline}>
                        Your family's health,{"\n"}organized & accessible.
                    </Text>
                </View>

                <View style={styles.infoCard}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Our Mission</Text>
                        <Text style={styles.sectionText}>
                            Carevia helps families securely store, manage, and understand medical records — anytime, anywhere.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Why Carevia</Text>
                        <BulletPoint text="Emergency access" />
                        <BulletPoint text="Family-wise health tracking" />
                        <BulletPoint text="Secure document storage" />
                    </View>

                    <View style={[styles.section, { borderBottomWidth: 0 }]}>
                        <Text style={styles.sectionTitle}>Version</Text>
                        <Text style={styles.sectionText}>App Version: 1.0.0</Text>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
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
        paddingTop: 40,
        alignItems: 'center',
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 100,
        height: 100,
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        padding: 5,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    logo: {
        width: '90%',
        height: '90%',
    },
    brandName: {
        fontFamily: 'Judson-Bold',
        fontSize: 32,
        color: '#000000',
        marginTop: 20,
    },
    tagline: {
        fontFamily: 'Judson-Regular',
        fontSize: 18,
        color: '#444444',
        textAlign: 'center',
        marginTop: 15,
        lineHeight: 24,
    },
    infoCard: {
        backgroundColor: '#F7FAFF',
        borderRadius: 30,
        width: '100%',
        padding: 25,
        borderWidth: 1,
        borderColor: '#E1EEFF',
    },
    section: {
        marginBottom: 25,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E1EEFF',
    },
    sectionTitle: {
        fontFamily: 'Judson-Bold',
        fontSize: 18,
        color: '#000000',
        marginBottom: 12,
    },
    sectionText: {
        fontFamily: 'Judson-Regular',
        fontSize: 15,
        color: '#555555',
        lineHeight: 22,
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    bulletText: {
        fontFamily: 'Judson-Regular',
        fontSize: 15,
        color: '#555555',
        marginLeft: 12,
    },
});

export default AboutScreen;

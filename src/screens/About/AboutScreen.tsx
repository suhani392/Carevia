import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
} from 'react-native';
import { useNavigation } from '../../context/NavigationContext';
import { useAppContext } from '../../context/AppContext';
import AppStatusBar from '../../components/status-bar/status-bar';
import HomeHeader from '../Home/HomeHeader';
import { CheckCircleIcon } from '../HelpPolicy/Icons';

const AboutScreen = () => {
    const { goBack } = useNavigation();
    const { colors, themeMode, t } = useAppContext();

    const BulletPoint = ({ text }: { text: string }) => (
        <View style={styles.bulletRow}>
            <CheckCircleIcon size={20} color={colors.primary} />
            <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{text}</Text>
        </View>
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
                title={t('about_carevia')}
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.logoSection}>
                    <View style={[styles.logoContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                        <Image
                            source={require('../../assets/images/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={[styles.brandName, { color: colors.text }]}>Carevia</Text>
                    <Text style={[styles.tagline, { color: colors.textSecondary }]}>
                        {t('tagline') || `Your family's health,\norganized & accessible.`}
                    </Text>
                </View>

                <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <View style={[styles.section, { borderBottomColor: colors.divider }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('our_mission')}</Text>
                        <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
                            {t('mission_text')}
                        </Text>
                    </View>

                    <View style={[styles.section, { borderBottomColor: colors.divider }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('why_carevia')}</Text>
                        <BulletPoint text={t('emergency_access_feat')} />
                        <BulletPoint text={t('family_health_tracking')} />
                        <BulletPoint text={t('secure_storage')} />
                    </View>

                    <View style={[styles.section, { borderBottomWidth: 0 }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('version')}</Text>
                        <Text style={[styles.sectionText, { color: colors.textSecondary }]}>{t('app_version')}: 1.0.0</Text>
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
    },
    logo: {
        width: '90%',
        height: '90%',
    },
    brandName: {
        fontFamily: 'Judson-Bold',
        fontSize: 32,
        marginTop: 20,
    },
    tagline: {
        fontFamily: 'Judson-Regular',
        fontSize: 18,
        textAlign: 'center',
        marginTop: 15,
        lineHeight: 24,
    },
    infoCard: {
        borderRadius: 30,
        width: '100%',
        padding: 25,
        borderWidth: 1,
    },
    section: {
        marginBottom: 25,
        paddingBottom: 20,
        borderBottomWidth: 1,
    },
    sectionTitle: {
        fontFamily: 'Judson-Bold',
        fontSize: 18,
        marginBottom: 12,
    },
    sectionText: {
        fontFamily: 'Judson-Regular',
        fontSize: 15,
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
        marginLeft: 12,
    },
});

export default AboutScreen;

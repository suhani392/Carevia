import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, Image, Pressable } from 'react-native';
import HomeHeader from './HomeHeader';
import { ReportIcon, BotIcon } from './Icons';
import AppStatusBar from '../../components/status-bar/status-bar';
import Menu from '../../components/navigation/menu-drawer/menu';
import { useNavigation } from '../../context/NavigationContext';
import { useAppContext } from '../../context/AppContext';

const HomeScreen = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { navigate } = useNavigation();
    const { updates } = useAppContext();

    return (
        <View style={styles.container}>
            <AppStatusBar />
            {isMenuOpen && <Menu onClose={() => setIsMenuOpen(false)} />}

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <HomeHeader onMenuPress={() => setIsMenuOpen(true)} />

                {/* Emergency Access Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Emergency Access</Text>
                    <View style={styles.emergencyRow}>
                        <Pressable
                            style={styles.largeCard}
                            onPress={() => navigate('documents')}
                        >
                            <Text style={styles.cardTitle}>My Documents</Text>
                            <View style={styles.docIconContainer}>
                                <Image
                                    source={require('../../assets/icons/home/documents.png')}
                                    style={styles.docIcon}
                                    resizeMode="contain"
                                />
                            </View>
                        </Pressable>
                        <View style={styles.smallCardColumn}>
                            <Pressable
                                style={styles.smallCard}
                                onPress={() => navigate('reports')}
                            >
                                <View style={styles.reportIconContainer}>
                                    <ReportIcon size={28} color="#3C87FF" />
                                </View>
                                <Text style={styles.smallCardText} numberOfLines={1}>View Reports</Text>
                            </Pressable>
                            <Pressable
                                style={styles.smallCard}
                                onPress={() => navigate('ai_assistant')}
                            >
                                <View style={styles.questionIconContainer}>
                                    <BotIcon size={28} color="#3C87FF" />
                                </View>
                                <Text style={styles.smallCardText} numberOfLines={1}>Ask Question</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>

                {/* Family Updates Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Family Updates</Text>
                    {updates.map((update, index) => (
                        <View key={update.id} style={[styles.familyCard, index > 0 && { marginTop: 15 }]}>
                            <Text style={styles.familyName}>{update.name === 'Me' ? 'You' : update.name}</Text>
                            <Text style={styles.familyText}>{update.text}</Text>
                        </View>
                    ))}
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    section: {
        paddingHorizontal: 25,
        marginTop: 30,
    },
    sectionTitle: {
        fontFamily: 'Judson-Bold',
        fontSize: 20,
        color: '#000000',
        marginBottom: 15,
    },
    emergencyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    largeCard: {
        width: '48%',
        height: 220,
        backgroundColor: '#E6F0FF',
        borderRadius: 20,
        padding: 12,
        alignItems: 'center',
    },
    cardTitle: {
        fontFamily: 'Judson-Regular',
        fontSize: 16,
        color: '#000000',
        marginBottom: 12,
        marginTop: 5,
    },
    docIconContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        width: '100%',
        borderRadius: 15,
        marginBottom: 5,
    },
    docIcon: {
        width: '70%',
        height: '70%',
    },
    smallCardColumn: {
        width: '48%',
        justifyContent: 'space-between',
    },
    smallCard: {
        height: 105,
        backgroundColor: '#E6F0FF',
        borderRadius: 20,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
    },
    smallCardText: {
        fontFamily: 'Judson-Regular',
        fontSize: 15.5,
        color: '#000000',
        marginLeft: 10,
        flex: 1,
    },
    reportIconContainer: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    questionIconContainer: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    familyCard: {
        backgroundColor: '#E1EEFF',
        borderRadius: 20,
        padding: 20,
    },
    familyName: {
        fontFamily: 'Judson-Bold',
        fontSize: 16,
        color: '#000000',
        marginBottom: 5,
    },
    familyText: {
        fontFamily: 'Judson-Regular',
        fontSize: 14,
        color: '#000000',
        lineHeight: 20,
    },
});

export default HomeScreen;

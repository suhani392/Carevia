import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, Image, Pressable, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import HomeHeader from './HomeHeader';
import { ReportIcon, BotIcon } from './Icons';
import AppStatusBar from '../../components/status-bar/status-bar';
import Menu from '../../components/navigation/menu-drawer/menu';
import { useNavigation } from '../../context/NavigationContext';
import { useAppContext } from '../../context/AppContext';
import { getAvatarSource } from '../../lib/avatars';


const HomeScreen = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { navigate } = useNavigation();
    const { updates, userProfile, familyMembers, refreshData, t, colors, themeMode } = useAppContext();
    const [refreshing, setRefreshing] = useState(false);
    const [isUpdatesExpanded, setIsUpdatesExpanded] = useState(false);


    const onRefresh = async () => {
        setRefreshing(true);
        await refreshData();
        setRefreshing(false);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <AppStatusBar />
            {isMenuOpen && <Menu onClose={() => setIsMenuOpen(false)} />}

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                <HomeHeader onMenuPress={() => setIsMenuOpen(true)} />

                {/* Emergency Access Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('emergency_access')}</Text>
                    <View style={styles.emergencyRow}>

                        <Pressable
                            style={styles.modernLargeCard}
                            onPress={() => navigate('documents')}
                        >
                            <LinearGradient
                                colors={themeMode === 'dark' ? ['#1A2A47', '#001A4D'] : ['#E6F0FF', '#C7DFFF']}
                                style={styles.cardGradient}
                            >
                                <Text style={[styles.modernCardTitle, { color: themeMode === 'dark' ? '#8AB4FF' : '#0047BA' }]}>{t('documents')}</Text>

                                <View style={[styles.modernDocIconContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                                    <Image
                                        source={require('../../assets/icons/home/documents.png')}
                                        style={styles.modernDocIcon}
                                        resizeMode="contain"
                                    />
                                </View>
                            </LinearGradient>
                        </Pressable>
                        <View style={styles.modernSmallCardColumn}>
                            <Pressable
                                style={styles.modernSmallCard}
                                onPress={() => navigate('reports')}
                            >
                                <LinearGradient
                                    colors={themeMode === 'dark' ? ['#1A1A1A', '#2A2A2A'] : ['#F0F7FF', '#D8E9FF']}
                                    style={styles.cardGradientSmall}
                                >
                                    <View style={[styles.modernIconContainer, { backgroundColor: colors.card }]}>
                                        <ReportIcon size={24} color={colors.primary} />
                                    </View>
                                    <Text style={[styles.modernSmallCardText, { color: themeMode === 'dark' ? '#8AB4FF' : '#0047BA' }]}>{t('reports')}</Text>

                                </LinearGradient>
                            </Pressable>
                            <Pressable
                                style={styles.modernSmallCard}
                                onPress={() => navigate('ai_assistant')}
                            >
                                <LinearGradient
                                    colors={themeMode === 'dark' ? ['#1A1A1A', '#2A2A2A'] : ['#F0F7FF', '#D8E9FF']}
                                    style={styles.cardGradientSmall}
                                >
                                    <View style={[styles.modernIconContainer, { backgroundColor: colors.card }]}>
                                        <BotIcon size={24} color={colors.primary} />
                                    </View>
                                    <Text style={[styles.modernSmallCardText, { color: themeMode === 'dark' ? '#8AB4FF' : '#0047BA' }]}>{t('ai_assistant')}</Text>

                                </LinearGradient>
                            </Pressable>
                        </View>
                    </View>
                </View>

                {/* Family Updates Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('family_updates')}</Text>

                    {updates.length > 0 ? (
                        <>
                            {(isUpdatesExpanded ? updates : updates.slice(0, 4)).map((update, index) => {
                                // Resolve sender's photo and name locally
                                let senderPhoto = update.photo_url;
                                let senderName = update.name;

                                if (userProfile?.id === update.user_id) {
                                    senderPhoto = userProfile.photo_url;
                                    senderName = t('you');
                                } else {
                                    const member = familyMembers.find(m => m.id === update.user_id);
                                    if (member) {
                                        senderPhoto = member.image;
                                        senderName = member.name;
                                    }
                                }

                                return (
                                    <View key={update.id} style={[styles.familyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                                        <View style={styles.updateInfoRow}>
                                            {senderPhoto && getAvatarSource(senderPhoto) ? (
                                                <Image
                                                    source={getAvatarSource(senderPhoto)}
                                                    style={styles.updateAvatar}
                                                />
                                            ) : (
                                                <View style={[styles.updateAvatar, styles.updateAvatarPlaceholder, { backgroundColor: colors.primaryLight, borderColor: colors.cardBorder }]}>
                                                    <Text style={[styles.updateAvatarPlaceholderText, { color: colors.primary }]}>
                                                        {(senderName || 'U').charAt(0).toUpperCase()}
                                                    </Text>
                                                </View>
                                            )}

                                            <View style={styles.updateMeta}>
                                                <Text style={[styles.updateName, { color: colors.text }]}>
                                                    {senderName}
                                                </Text>
                                                <Text style={[styles.updateText, { color: colors.textSecondary }]}>{update.text}</Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                            {updates.length > 4 && (
                                <Pressable
                                    style={[styles.readMoreButton, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                                    onPress={() => setIsUpdatesExpanded(!isUpdatesExpanded)}
                                >
                                    <Text style={[styles.readMoreText, { color: colors.primary }]}>
                                        {isUpdatesExpanded ? t('show_less') : t('read_more')}
                                    </Text>

                                </Pressable>
                            )}
                        </>
                    ) : (

                        <View style={[styles.emptyUpdatesCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                            <Text style={[styles.emptyUpdatesText, { color: colors.textSecondary }]}>{t('no_updates')}</Text>
                        </View>
                    )}
                </View>


                <View style={{ height: 120 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        marginBottom: 15,
    },
    emergencyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modernLargeCard: {
        width: '48%',
        height: 220,
        borderRadius: 25,
        overflow: 'hidden',
        elevation: 5,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    cardGradient: {
        flex: 1,
        padding: 18,
        alignItems: 'center',
    },
    modernCardTitle: {
        fontFamily: 'Judson-Bold',
        fontSize: 18,
        marginBottom: 15,
    },
    modernDocIconContainer: {
        flex: 1,
        width: '100%',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    modernDocIcon: {
        width: '65%',
        height: '65%',
    },
    modernSmallCardColumn: {
        width: '48%',
        justifyContent: 'space-between',
    },
    modernSmallCard: {
        height: 105,
        borderRadius: 25,
        overflow: 'hidden',
        elevation: 4,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    cardGradientSmall: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    modernIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    modernSmallCardText: {
        fontFamily: 'Judson-Bold',
        fontSize: 15,
        marginLeft: 12,
        flex: 1,
        lineHeight: 18,
    },
    familyCard: {
        borderRadius: 20,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    updateInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    updateAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    updateAvatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    updateAvatarPlaceholderText: {
        fontFamily: 'Judson-Bold',
        fontSize: 18,
    },
    updateMeta: {
        flex: 1,
    },
    updateName: {
        fontFamily: 'Judson-Bold',
        fontSize: 17,
    },
    updateText: {
        fontFamily: 'Judson-Regular',
        fontSize: 14,
        lineHeight: 18,
        marginTop: 2,
    },
    emptyUpdatesCard: {
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    emptyUpdatesText: {
        fontFamily: 'Judson-Regular',
        fontSize: 15,
    },
    readMoreButton: {
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 15,
        borderWidth: 1,
        marginTop: 5,
    },
    readMoreText: {
        fontFamily: 'Judson-Bold',
        fontSize: 14,
    },
});



export default HomeScreen;

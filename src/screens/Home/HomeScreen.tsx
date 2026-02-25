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
    const { updates, userProfile, familyMembers, refreshData, t } = useAppContext();
    const [refreshing, setRefreshing] = useState(false);
    const [isUpdatesExpanded, setIsUpdatesExpanded] = useState(false);


    const onRefresh = async () => {
        setRefreshing(true);
        await refreshData();
        setRefreshing(false);
    };

    return (
        <View style={styles.container}>
            <AppStatusBar />
            {isMenuOpen && <Menu onClose={() => setIsMenuOpen(false)} />}

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <HomeHeader onMenuPress={() => setIsMenuOpen(true)} />

                {/* Emergency Access Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('emergency_access')}</Text>
                    <View style={styles.emergencyRow}>

                        <Pressable
                            style={styles.modernLargeCard}
                            onPress={() => navigate('documents')}
                        >
                            <LinearGradient
                                colors={['#E6F0FF', '#C7DFFF']}
                                style={styles.cardGradient}
                            >
                                <Text style={styles.modernCardTitle}>{t('documents')}</Text>

                                <View style={styles.modernDocIconContainer}>
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
                                    colors={['#F0F7FF', '#D8E9FF']}
                                    style={styles.cardGradientSmall}
                                >
                                    <View style={styles.modernIconContainer}>
                                        <ReportIcon size={24} color="#0062FF" />
                                    </View>
                                    <Text style={styles.modernSmallCardText}>{t('reports')}</Text>

                                </LinearGradient>
                            </Pressable>
                            <Pressable
                                style={styles.modernSmallCard}
                                onPress={() => navigate('ai_assistant')}
                            >
                                <LinearGradient
                                    colors={['#F0F7FF', '#D8E9FF']}
                                    style={styles.cardGradientSmall}
                                >
                                    <View style={styles.modernIconContainer}>
                                        <BotIcon size={24} color="#0062FF" />
                                    </View>
                                    <Text style={styles.modernSmallCardText}>{t('ai_assistant')}</Text>

                                </LinearGradient>
                            </Pressable>
                        </View>
                    </View>
                </View>

                {/* Family Updates Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('family_updates')}</Text>

                    {updates.length > 0 ? (
                        <>
                            {(isUpdatesExpanded ? updates : updates.slice(0, 4)).map((update, index) => {
                                // Resolve sender's photo and name locally
                                let senderPhoto = update.photo_url;
                                let senderName = update.name;

                                if (userProfile?.id === update.user_id) {
                                    senderPhoto = userProfile.photo_url;
                                    senderName = 'You';
                                } else {
                                    const member = familyMembers.find(m => m.id === update.user_id);
                                    if (member) {
                                        senderPhoto = member.image;
                                        senderName = member.name;
                                    }
                                }

                                return (
                                    <View key={update.id} style={styles.familyCard}>
                                        <View style={styles.updateInfoRow}>
                                            {senderPhoto && getAvatarSource(senderPhoto) ? (
                                                <Image
                                                    source={getAvatarSource(senderPhoto)}
                                                    style={styles.updateAvatar}
                                                />
                                            ) : (
                                                <View style={[styles.updateAvatar, styles.updateAvatarPlaceholder]}>
                                                    <Text style={styles.updateAvatarPlaceholderText}>
                                                        {(senderName || 'U').charAt(0).toUpperCase()}
                                                    </Text>
                                                </View>
                                            )}

                                            <View style={styles.updateMeta}>
                                                <Text style={styles.updateName}>
                                                    {senderName}
                                                </Text>
                                                <Text style={styles.updateText}>{update.text}</Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                            {updates.length > 4 && (
                                <Pressable
                                    style={styles.readMoreButton}
                                    onPress={() => setIsUpdatesExpanded(!isUpdatesExpanded)}
                                >
                                    <Text style={styles.readMoreText}>
                                        {isUpdatesExpanded ? t('show_less') : t('read_more')}
                                    </Text>

                                </Pressable>
                            )}
                        </>
                    ) : (

                        <View style={styles.emptyUpdatesCard}>
                            <Text style={styles.emptyUpdatesText}>No recent family updates</Text>
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
    modernLargeCard: {
        width: '48%',
        height: 220,
        borderRadius: 25,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#0062FF',
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
        color: '#0047BA',
        marginBottom: 15,
    },
    modernDocIconContainer: {
        flex: 1,
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
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
        shadowColor: '#0062FF',
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
        backgroundColor: '#FFFFFF',
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
        color: '#0047BA',
        marginLeft: 12,
        flex: 1,
        lineHeight: 18,
    },
    familyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#E6F0FF',
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
        backgroundColor: '#E6F0FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#C7DFFF',
    },
    updateAvatarPlaceholderText: {
        fontFamily: 'Judson-Bold',
        fontSize: 18,
        color: '#0062FF',
    },
    updateMeta: {
        flex: 1,
    },
    updateName: {
        fontFamily: 'Judson-Bold',
        fontSize: 17,
        color: '#000000',
    },
    updateText: {
        fontFamily: 'Judson-Regular',
        fontSize: 14,
        color: '#666666',
        lineHeight: 18,
        marginTop: 2,
    },
    emptyUpdatesCard: {
        backgroundColor: '#F5F9FF',
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E1EEFF',
        borderStyle: 'dashed',
    },
    emptyUpdatesText: {
        fontFamily: 'Judson-Regular',
        fontSize: 15,
        color: 'rgba(0,0,0,0.5)',
    },
    readMoreButton: {
        alignItems: 'center',
        paddingVertical: 10,
        backgroundColor: '#F0F7FF',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#E6F0FF',
        marginTop: 5,
    },
    readMoreText: {
        fontFamily: 'Judson-Bold',
        fontSize: 14,
        color: '#0062FF',
    },
});



export default HomeScreen;

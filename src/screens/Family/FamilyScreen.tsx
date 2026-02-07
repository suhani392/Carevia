import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, Image, Dimensions, TouchableOpacity } from 'react-native';
import HomeHeader from '../Home/HomeHeader';
import AppStatusBar from '../../components/status-bar/status-bar';
import Menu from '../../components/navigation/menu-drawer/menu';
import { useNavigation } from '../../context/NavigationContext';

const { width } = Dimensions.get('window');

const FamilyScreen = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { navigate } = useNavigation();

    const familyMembers = [
        { name: "Vaibhav Badhe", image: "https://avatar.iran.liara.run/public/1" },
        { name: "Kanchan Badhe", image: "https://avatar.iran.liara.run/public/51" },
        { name: "Suhani Badhe", image: "https://avatar.iran.liara.run/public/70" },
        { name: "Avani Badhe", image: "https://avatar.iran.liara.run/public/65" },
        { name: "Ishani Badhe", image: "https://avatar.iran.liara.run/public/80" },
        { name: "Sindhu Badhe", image: "https://avatar.iran.liara.run/public/90" },
        { name: "Amol Badhe", image: "https://avatar.iran.liara.run/public/12" },
        { name: "Sitaram Badhe", image: "https://avatar.iran.liara.run/public/25" },
    ];

    return (
        <View style={styles.container}>
            <AppStatusBar />
            {isMenuOpen && <Menu onClose={() => setIsMenuOpen(false)} />}

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <HomeHeader onMenuPress={() => setIsMenuOpen(true)} showActionRow={false} />

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Family Members</Text>

                    <View style={styles.memberGrid}>
                        {familyMembers.map((member, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.memberCard}
                                onPress={() => navigate('documents', { name: member.name })}
                            >
                                <Image source={{ uri: member.image }} style={styles.memberAvatar} />
                                <Text style={styles.memberName}>{member.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
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
        paddingHorizontal: 15, // Slightly less padding to fit 177px cards
        marginTop: 30,
    },
    sectionTitle: {
        fontFamily: 'Judson-Bold',
        fontSize: 22,
        color: '#000000',
        marginBottom: 20,
        marginLeft: 10,
    },
    memberGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-evenly', // Balanced spacing
    },
    memberCard: {
        width: 177,
        height: 132,
        backgroundColor: '#D9E8FF',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    memberAvatar: {
        width: 75,
        height: 75,
        borderRadius: 37.5,
        marginBottom: 8,
        backgroundColor: '#FFFFFF',
    },
    memberName: {
        fontFamily: 'Judson-Regular',
        fontSize: 16,
        color: '#000000',
        textAlign: 'center',
    },
});

export default FamilyScreen;

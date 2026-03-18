import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { supabase } from './src/lib/supabase';

// Context
import { NavigationProvider, useNavigation, ScreenName } from './src/context/NavigationContext';
import { AppProvider, useAppContext } from './src/context/AppContext';

// Screens
import LoginScreen from './src/screens/Login/Login';
import HomeScreen from './src/screens/Home/HomeScreen';
import FamilyScreen from './src/screens/Family/FamilyScreen';
import AiAssistantScreen from './src/screens/AI-Bot/AiAssistantScreen';
import ContactUsScreen from './src/screens/ContactUs/ContactUsScreen';
import HelpPolicyScreen from './src/screens/HelpPolicy/HelpPolicyScreen';
import SettingsScreen from './src/screens/Settings/SettingsScreen';
import AboutUsScreen from './src/screens/About/AboutScreen';
import SignUpScreen from './src/screens/SignUp/SignUp';
import DocumentsScreen from './src/screens/Documents/DocumentsScreen';

import ReportsScreen from './src/screens/Reports/ReportsScreen';
import DocumentViewScreen from './src/screens/DocumentView/DocumentView';
import ProfileScreen from './src/screens/Profile';
import ScanReportScreen from './src/screens/ScanReport/ScanReportScreen';

// Components
import BottomNavbar from './src/components/navigation/bottom-navigation/bottom-navbar';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function AppContent() {
    const { currentScreen, navigate } = useNavigation();
    const { colors } = useAppContext();
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        // Check initial session
        supabase.auth.getSession().then(({ data, error }) => {
            if (error) {
                console.warn("Session check error:", error.message);
                setAuthChecked(true);
                return;
            }
            if (data?.session) {
                navigate('home');
            }
            setAuthChecked(true);
        }).catch(err => {
            console.warn("Initial session check failed:", err.message || err);
            setAuthChecked(true);
        });

        // Listen for auth changes
        const authListener = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                navigate('home');
            } else {
                navigate('login');
            }
        });

        // 🚨 GLOBAL ALERT LISTENER (Hackathon Frontend Proof)
        // This listens to the 'alerts_and_actions' table in real-time.
        // If an AI agent fires a Family Escalation or Urgent Banner, this pops up.
        const alertsSubscription = supabase
            .channel('global-alerts')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'alerts_and_actions',
                },
                async (payload) => {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;

                    // Only show alert if it's for ME or targeted to ME (as a caregiver)
                    if (payload.new.user_id === user.id || payload.new.target_user_id === user.id) {
                        const title = payload.new.action_type === 'FAMILY_ESCALATION' 
                            ? "👨‍👩‍👧 Family Emergency Alert" 
                            : "⚠️ Urgent Report Update";
                        
                        Alert.alert(
                            title,
                            payload.new.action_message,
                            [{ text: "View Details", onPress: () => navigate('reports') }, { text: "Dismiss", style: 'cancel' }]
                        );
                    }
                }
            )
            .subscribe();

        const subscription = authListener?.data?.subscription;

        return () => {
            if (subscription) subscription.unsubscribe();
            supabase.removeChannel(alertsSubscription);
        };
    }, []);

    if (!authChecked) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0062FF" />
            </View>
        );
    }

    const renderScreen = () => {
        switch (currentScreen) {
            case 'login':
                return <LoginScreen />;
            case 'signup':
                return <SignUpScreen />;
            case 'home':
                return <HomeScreen />;
            case 'family':
                return <FamilyScreen />;
            case 'ai_assistant':
                return <AiAssistantScreen />;
            case 'contact_us':
                return <ContactUsScreen />;
            case 'help_policy':
                return <HelpPolicyScreen />;
            case 'settings':
                return <SettingsScreen />;
            case 'about':
                return <AboutUsScreen />;
            case 'documents':
                return <DocumentsScreen />;
            case 'reports':
                return <ReportsScreen />;
            case 'document_view':
                return <DocumentViewScreen />;
            case 'profile':
                return <ProfileScreen />;
            case 'scan_report':
                return <ScanReportScreen />;
            default:
                return <HomeScreen />;
        }
    };

    const showNavbar = currentScreen === 'home' || currentScreen === 'family';

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style="light" translucent backgroundColor="transparent" />

            {/* Main Screen Content */}
            {renderScreen()}

            {/* Static Navigation - Only show on Home and Family */}
            {showNavbar && (
                <BottomNavbar
                    activeTab={currentScreen as 'home' | 'family'}
                    onTabChange={(tab) => navigate(tab as ScreenName)}
                />
            )}
        </View>
    );
}

export default function App() {
    const [fontsLoaded, setFontsLoaded] = useState(false);

    useEffect(() => {
        async function loadFonts() {
            try {
                await Font.loadAsync({
                    'Judson-Regular': require('./src/assets/fonts/Judson-Regular.ttf'),
                    'Judson-Bold': require('./src/assets/fonts/Judson-Bold.ttf'),
                    'Judson-Italic': require('./src/assets/fonts/Judson-Italic.ttf'),
                });
            } catch (e) {
                console.warn(e);
            } finally {
                setFontsLoaded(true);
                await SplashScreen.hideAsync();
            }
        }

        loadFonts();
    }, []);

    if (!fontsLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0062FF" />
            </View>
        );
    }

    return (
        <AppProvider>
            <NavigationProvider>
                <AppContent />
            </NavigationProvider>
        </AppProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    }
});


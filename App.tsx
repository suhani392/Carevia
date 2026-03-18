import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Modal, Text, TouchableOpacity, Vibration } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
    const { colors, themeMode } = useAppContext();
    const [authChecked, setAuthChecked] = useState(false);
    const [emergencyAlert, setEmergencyAlert] = useState<{ title: string; message: string } | null>(null);

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

        //  GLOBAL ALERT LISTENER (Hackathon Frontend Proof)
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
                    // Only show alert if it's for ME or targeted to ME
                    if (payload.new.user_id === user.id || payload.new.target_user_id === user.id) {
                        const title = payload.new.action_type === 'FAMILY_ESCALATION'
                            ? "Family Emergency"
                            : "Urgent Update";

                        let message = payload.new.action_message;

                        // Personalize msg: if report belongs to me, change name to "Your"
                        // This handles both direct alerts and potential family broadcasts where I am the patient.
                        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
                        if (profile?.full_name && message.includes(profile.full_name)) {
                            message = message.replace(profile.full_name, "Your");
                            // Fix possessive: "Your's" -> "Your"
                            message = message.replace("Your's", "Your");
                            // Handle "Emergency for Your" -> "Your Emergency" if triggered by agent
                            message = message.replace("Emergency for Your", "Your Emergency");
                        }

                        // Vibrate and show custom modal
                        Vibration.vibrate([0, 500, 200, 500]);
                        setEmergencyAlert({ title, message });
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

            {/*  PREMIUM EMERGENCY ALERT MODAL */}
            <Modal
                visible={!!emergencyAlert}
                transparent={true}
                animationType="slide"
            >
                <View style={styles.alertOverlay}>
                    <View style={styles.alertContent}>
                        <View style={styles.alertCard}>
                            <Text style={styles.alertTitle}>{emergencyAlert?.title}</Text>
                            <Text style={styles.alertMessage}>{emergencyAlert?.message}</Text>

                            <TouchableOpacity
                                style={styles.alertButton}
                                onPress={() => setEmergencyAlert(null)}
                            >
                                <Text style={styles.alertButtonText}>Okay</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    },
    alertOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 25,
    },
    alertContent: {
        width: '100%',
        backgroundColor: '#FFF5F5',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#FF4D4D',
        padding: 25,
        elevation: 10,
        shadowColor: '#FF4D4D',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    alertCard: {
        alignItems: 'center',
    },
    alertIcon: {
        fontSize: 40,
        marginBottom: 10,
    },
    alertTitle: {
        fontFamily: 'Judson-Bold',
        fontSize: 22,
        color: '#FF4D4D',
        marginBottom: 12,
        textAlign: 'center',
    },
    alertMessage: {
        fontFamily: 'Judson-Regular',
        fontSize: 16,
        color: '#333333',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 22,
    },
    alertButton: {
        backgroundColor: '#FF4D4D',
        paddingHorizontal: 40,
        paddingVertical: 12,
        borderRadius: 25,
        elevation: 3,
    },
    alertButtonText: {
        fontFamily: 'Judson-Bold',
        fontSize: 16,
        color: '#FFFFFF',
    }
});


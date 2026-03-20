import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '../context/NavigationContext';
import { useAppContext } from '../context/AppContext';

export type TourSection = 'home' | 'family' | 'menu' | 'profile_setup';

export interface TourStep {
    id: number;
    section: TourSection;
    targetId: string;
    text: string;
    action?: () => void;
    requiresInput?: string; // Field in userProfile that must be filled to go next
}

export interface TargetLayout {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface TourContextType {
    isTourActive: boolean;
    currentStepIndex: number;
    currentSection: TourSection;
    currentStep: TourStep;
    targets: { [id: string]: TargetLayout };
    registerTarget: (id: string, layout: TargetLayout) => void;
    startTour: () => void;
    nextStep: () => void;
    prevStep: () => void;
    skipSection: () => void;
    skipTour: () => void;
    completeTour: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

const TOUR_STEPS: TourStep[] = [
    // --- HOME SECTION ---
    { id: 0, section: 'home', targetId: 'home_overview', text: "Welcome to Carevia! I'm your health assistant. Let's take a quick tour!" },
    { id: 1, section: 'home', targetId: 'upload_section', text: "You can scan or upload your medical reports here for instant AI analysis." },
    { id: 2, section: 'home', targetId: 'home_docs', text: "Access all your uploaded documents safely organized in this section." },
    { id: 3, section: 'home', targetId: 'home_reports', text: "View your saved AI-analyzed reports and clinical insights here." },
    { id: 4, section: 'home', targetId: 'home_ai_bot', text: "Need help? Ask our special AI health assistant any question!" },
    { id: 5, section: 'home', targetId: 'trends_section', text: "We'll track your health trends over time. Keep uploading to see your progress!" },
    { id: 6, section: 'home', targetId: 'health_alerts', text: "Any critical findings in your reports will trigger instant health alerts here." },
    { id: 7, section: 'home', targetId: 'none', text: "Stay updated with your family's health activities right here." },
    { id: 8, section: 'home', targetId: 'bottom_nav_family', text: "Now, let's explore the Family Dashboard! Click here to see your family's health." },
    
    // --- FAMILY SECTION ---
    { id: 9, section: 'family', targetId: 'family_overview', text: "Track your family's health journey together on this screen." },
    { id: 10, section: 'family', targetId: 'add_member', text: "Add your loved ones here to securely manage their medical records too." },

    // --- MENU SECTION ---
    { id: 11, section: 'menu', targetId: 'home_menu_btn', text: "This menu hides powerful features. Let's explore them!" },
    { id: 12, section: 'menu', targetId: 'menu_item_home', text: "Go back to the Home screen anytime using this shortcut." },
    { id: 13, section: 'menu', targetId: 'menu_item_ai_assistant', text: "Talk to our advanced AI Agent for medical queries and report summaries." },
    { id: 14, section: 'menu', targetId: 'menu_item_contact_us', text: "Need help? Reach out to our support team directly from here." },
    { id: 15, section: 'menu', targetId: 'menu_item_help_policy', text: "Access our help guides and privacy policies to understand how we protect you." },
    { id: 16, section: 'menu', targetId: 'menu_item_settings', text: "Manage your account settings, themes, and notification preferences." },
    { id: 17, section: 'menu', targetId: 'menu_item_about', text: "Learn more about the vision behind Carevia and our mission." },
    { id: 18, section: 'menu', targetId: 'menu_item_logout', text: "Safely sign out of your account when you're done." },

    // --- PROFILE SETUP SECTION ---
    { id: 19, section: 'home', targetId: 'profile_entry', text: "Finally, let's complete your profile to personalize your experience!" },
    { id: 20, section: 'profile_setup', targetId: 'none', text: "Welcome to your Profile! This is where you can manage your health identity." },
    { id: 21, section: 'profile_setup', targetId: 'none', text: "Please take a moment to fill in your contact information and health details. It helps our AI give you the best advice!" },
    { id: 22, section: 'profile_setup', targetId: 'none', text: "Amazing! You've completed the tour. Feel free to explore and keep your family's health organized!" },
];

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isTourActive, setIsTourActive] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [targets, setTargets] = useState<{ [id: string]: TargetLayout }>({});
    const { navigate } = useNavigation();
    const { userProfile } = useAppContext();

    const currentStep = TOUR_STEPS[currentStepIndex];

    const registerTarget = useCallback((id: string, layout: TargetLayout) => {
        setTargets(prev => ({ ...prev, [id]: layout }));
    }, []);

    const completeTour = useCallback(async () => {
        setIsTourActive(false);
        if (userProfile?.id) {
            await AsyncStorage.setItem(`hasCompletedTour_${userProfile.id}`, 'true');
        }
        navigate('home');
    }, [navigate, userProfile]);

    const startTour = useCallback(() => {
        setCurrentStepIndex(0);
        setIsTourActive(true);
        navigate('home');
    }, [navigate]);

    const nextStep = useCallback(() => {
        if (!currentStep) return;
        
        if (currentStepIndex < TOUR_STEPS.length - 1) {
            const nextIdx = currentStepIndex + 1;
            const nextSection = TOUR_STEPS[nextIdx].section;
            
            // Handle Navigation
            if (nextSection !== currentStep.section) {
                if (nextSection === 'family') navigate('family');
                if (nextSection === 'home') navigate('home');
                if (nextSection === 'profile_setup') navigate('profile');
            }

            // Handle Menu Opening Trigger
            const isNextStepMenu = TOUR_STEPS[nextIdx].section === 'menu' || TOUR_STEPS[nextIdx].targetId.startsWith('menu_item_');
            if (isNextStepMenu) {
                DeviceEventEmitter.emit('OPEN_MENU');
            }

            // Handle Menu Closing Trigger
            const wasMenu = currentStep.section === 'menu' || currentStep.targetId.startsWith('menu_item_');
            const willBeMenu = TOUR_STEPS[nextIdx].section === 'menu' || TOUR_STEPS[nextIdx].targetId.startsWith('menu_item_');
            
            if (wasMenu && !willBeMenu) {
                DeviceEventEmitter.emit('CLOSE_MENU');
            }
            
            setCurrentStepIndex(nextIdx);
        } else {
            completeTour();
        }
    }, [currentStepIndex, currentStep, navigate, completeTour]);

    const prevStep = useCallback(() => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(currentStepIndex - 1);
        }
    }, [currentStepIndex]);

    const skipSection = useCallback(() => {
        if (!currentStep) return;
        const nextSectionIndex = TOUR_STEPS.findIndex((s, idx) => idx > currentStepIndex && s.section !== currentStep.section);
        if (nextSectionIndex !== -1) {
            const nextSection = TOUR_STEPS[nextSectionIndex].section;
            if (nextSection === 'family') navigate('family');
            if (nextSection === 'home') navigate('home');
            if (nextSection === 'profile_setup') navigate('profile');
            const isCurrentMenu = currentStep.section === 'menu' || currentStep.targetId.startsWith('menu_item_');
            if (isCurrentMenu && nextSection !== 'menu') {
                DeviceEventEmitter.emit('CLOSE_MENU');
            }
            setCurrentStepIndex(nextSectionIndex);
        } else {
            completeTour();
        }
    }, [currentStepIndex, currentStep, navigate, completeTour]);

    const skipTour = useCallback(async () => {
        setIsTourActive(false);
        if (userProfile?.id) {
            await AsyncStorage.setItem(`hasCompletedTour_${userProfile.id}`, 'true');
        }
    }, [userProfile]);

    useEffect(() => {
        const checkTourStatus = async () => {
            if (!userProfile?.id) return;
            
            // Reset to beginning for any NEW user/session
            setCurrentStepIndex(0);

            const completed = await AsyncStorage.getItem(`hasCompletedTour_${userProfile.id}`);
            if (completed !== 'true') {
                setIsTourActive(true);
            }
        };
        checkTourStatus();
    }, [userProfile?.id]); // Only re-run when ID changes

    return (
        <TourContext.Provider value={{
            isTourActive,
            currentStepIndex,
            currentSection: currentStep.section,
            currentStep,
            targets,
            registerTarget,
            startTour,
            nextStep,
            prevStep,
            skipSection,
            skipTour,
            completeTour
        }}>
            {children}
        </TourContext.Provider>
    );
};

export const useTour = () => {
    const context = useContext(TourContext);
    if (!context) throw new Error('useTour must be used within a TourProvider');
    return context;
};

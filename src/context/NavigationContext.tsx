import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { BackHandler } from 'react-native';

export type ScreenName =
    | 'login'
    | 'signup'
    | 'home'
    | 'family'
    | 'ai_assistant'
    | 'contact_us'
    | 'help_policy'
    | 'settings'
    | 'about'
    | 'documents'
    | 'reports'
    | 'document_view'
    | 'profile'
    | 'scan_report';

interface NavigationContextType {
    currentScreen: ScreenName;
    screenParams: any;
    navigate: (screen: ScreenName, params?: any, reset?: boolean) => void;
    goBack: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
    const [currentScreen, setCurrentScreen] = useState<ScreenName>('login');
    const [screenParams, setScreenParams] = useState<any>(null);
    const [history, setHistory] = useState<{ screen: ScreenName, params: any }[]>([]);

    const navigate = useCallback((screen: ScreenName, params?: any, reset?: boolean) => {
        if (reset || screen === 'home' || screen === 'login') {
            setHistory([]);
        } else {
            setHistory(prev => [...prev, { screen: currentScreen, params: screenParams }]);
        }
        setCurrentScreen(screen);
        setScreenParams(params || null);
    }, [currentScreen, screenParams]);

    const goBack = useCallback(() => {
        if (history.length > 0) {
            const lastEntry = history[history.length - 1];
            setHistory(prev => prev.slice(0, -1));
            setCurrentScreen(lastEntry.screen);
            setScreenParams(lastEntry.params);
        }
    }, [history]);


    useEffect(() => {
        const backAction = () => {
            if (history.length > 0) {
                goBack();
                return true;
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction
        );

        return () => backHandler.remove();
    }, [history, goBack]);

    return (
        <NavigationContext.Provider value={{ currentScreen, screenParams, navigate, goBack }}>
            {children}
        </NavigationContext.Provider>
    );
};

export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (context === undefined) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
};

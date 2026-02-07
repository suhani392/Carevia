import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ScreenName =
    | 'login'
    | 'home'
    | 'family'
    | 'ai_assistant'
    | 'contact_us'
    | 'help_policy'
    | 'settings'
    | 'about';

interface NavigationContextType {
    currentScreen: ScreenName;
    navigate: (screen: ScreenName) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
    const [currentScreen, setCurrentScreen] = useState<ScreenName>('login'); // Default to login

    const navigate = (screen: ScreenName) => {
        setCurrentScreen(screen);
    };

    return (
        <NavigationContext.Provider value={{ currentScreen, navigate }}>
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

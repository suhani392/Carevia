import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Update {
    id: string;
    name: string;
    text: string;
}

interface AppContextType {
    updates: Update[];
    addUpdate: (name: string, text: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [updates, setUpdates] = useState<Update[]>([
        { id: '1', name: "Avani Badhe", text: "Avani added her blood report to the documents." },
        { id: '2', name: "Rahul Badhe", text: "Rahul updated his vaccination records." },
        { id: '3', name: "Sunita Badhe", text: "Sunita scheduled a health checkup for tomorrow." }
    ]);

    const addUpdate = (name: string, text: string) => {
        const newUpdate: Update = {
            id: Date.now().toString(),
            name,
            text,
        };
        setUpdates(prev => [newUpdate, ...prev]);
    };

    return (
        <AppContext.Provider value={{ updates, addUpdate }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};

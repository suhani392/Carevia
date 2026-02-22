import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Report {
    id: string;
    name: string;
    date: string;
    timestamp: number;
    uri?: string;
}

export interface Update {
    id: string;
    name: string;
    text: string;
}

interface AppContextType {
    updates: Update[];
    reports: Report[];
    addUpdate: (name: string, text: string) => void;
    addReport: (name: string, uri: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [updates, setUpdates] = useState<Update[]>([
        { id: '1', name: "Avani Badhe", text: "Avani added her blood report to the documents." },
        { id: '2', name: "Rahul Badhe", text: "Rahul updated his vaccination records." },
        { id: '3', name: "Sunita Badhe", text: "Sunita scheduled a health checkup for tomorrow." }
    ]);

    const [reports, setReports] = useState<Report[]>([
        { id: '1', name: 'Blood Test Report', date: '28 Jan 2026', timestamp: 1738022400000 },
        { id: '2', name: 'X Ray Report', date: '28 Jan 2026', timestamp: 1738022400001 },
    ]);

    const addUpdate = (name: string, text: string) => {
        const newUpdate: Update = {
            id: Date.now().toString(),
            name,
            text,
        };
        setUpdates(prev => [newUpdate, ...prev]);
    };

    const addReport = (name: string, uri: string) => {
        const date = new Date();
        const formattedDate = date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });

        const newReport: Report = {
            id: Date.now().toString(),
            name,
            date: formattedDate,
            timestamp: Date.now(),
            uri
        };
        setReports(prev => [newReport, ...prev]);

        // Also add an update to the home screen
        addUpdate("Me", `You added a new report: ${name}`);
    };

    return (
        <AppContext.Provider value={{ updates, reports, addUpdate, addReport }}>
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

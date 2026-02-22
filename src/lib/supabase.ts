import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// In-memory fallback if AsyncStorage native module is missing (e.g. before rebuild)
const memoryStorage: Record<string, string> = {};

const safeStorage = {
    getItem: async (key: string) => {
        try {
            const value = await AsyncStorage.getItem(key);
            return value;
        } catch {
            return memoryStorage[key] || null;
        }
    },
    setItem: async (key: string, value: string) => {
        try {
            await AsyncStorage.setItem(key, value);
        } catch {
            memoryStorage[key] = value;
        }
    },
    removeItem: async (key: string) => {
        try {
            await AsyncStorage.removeItem(key);
        } catch {
            delete memoryStorage[key];
        }
    },
};

const supabaseUrl = 'https://wrionexmsvewdwpdcurc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyaW9uZXhtc3Zld2R3cGRjdXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTI1NzIsImV4cCI6MjA4NzMyODU3Mn0.UCvMdbg9uv-GgH-omeaOq9dN9oY4wVkd6Gwkx2eZ93c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: safeStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

// In-memory fallback if SecureStore native module is missing (e.g. before rebuild)
const memoryStorage: Record<string, string> = {};

const safeStorage = {
    getItem: async (key: string) => {
        try {
            const value = await SecureStore.getItemAsync(key);
            return value;
        } catch {
            return memoryStorage[key] || null;
        }
    },
    setItem: async (key: string, value: string) => {
        try {
            await SecureStore.setItemAsync(key, value);
        } catch {
            memoryStorage[key] = value;
        }
    },
    removeItem: async (key: string) => {
        try {
            await SecureStore.deleteItemAsync(key);
        } catch {
            delete memoryStorage[key];
        }
    },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: safeStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { supabase } from '../lib/supabase';

export interface Report {
    id: string;
    name: string;
    date: string;
    timestamp: number;
    uri?: string;
    analysis?: string;
}

export interface Document {
    id: string;
    name: string;
    date: string;
    timestamp: number;
    uri?: string;
}

export interface Update {
    id: string;
    user_id: string;
    name: string;
    text: string;
    photo_url?: string;
    created_at?: string;
}

export interface FamilyMember {
    id: string;
    name: string;
    image: string;
    email?: string;
}

export interface Invitation {
    id: string;
    sender_id: string;
    family_id: string;
    receiver_email: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
    sender_name?: string;
    type?: 'sent' | 'received';
}

export type LanguageCode = 'en' | 'mr' | 'hi';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
    background: string;
    text: string;
    textSecondary: string;
    card: string;
    cardBorder: string;
    border: string;
    primary: string;
    primaryLight: string;
    surface: string;
    error: string;
    inputBg: string;
    modalBg: string;
    divider: string;
    headerGradient: string[];
}


const lightColors: ThemeColors = {
    background: '#FFFFFF',
    text: '#000000',
    textSecondary: '#666666',
    card: '#F5F9FF',
    cardBorder: '#E6F0FF',
    border: '#F0F0F0',
    primary: '#0062FF',
    primaryLight: '#E6F0FF',
    surface: '#F8F9FB',
    error: '#FF4C4C',
    inputBg: '#F5F9FF',
    modalBg: '#FFFFFF',
    divider: '#F0F0F0',
    headerGradient: ['#0055FF', '#6A9EFF'],
};


const darkColors: ThemeColors = {
    background: '#121212',
    text: '#FFFFFF',
    textSecondary: '#AAAAAA',
    card: '#1E1E1E',
    cardBorder: '#333333',
    border: '#333333',
    primary: '#3C87FF',
    primaryLight: '#1A2A47',
    surface: '#1A1A1A',
    error: '#FF6B6B',
    inputBg: '#2A2A2A',
    modalBg: '#1E1E1E',
    divider: '#2A2A2A',
    headerGradient: ['#001A4D', '#003399'],
};


export const translations = {
    en: {
        // Common
        home: "Home",
        family: "Family",
        ai_assistant: "AI Assistant",
        settings: "Settings",
        profile: "Profile",
        documents: "Documents",
        reports: "Reports",
        logout: "Logout",
        save: "Save",
        cancel: "Cancel",
        done: "Done",
        edit: "Edit",
        delete: "Delete",
        share: "Share",
        rename: "Rename",
        view: "View",
        status: "Status",
        back: "Back",

        // Home
        emergency_access: "Emergency Access",
        family_updates: "Family Updates",
        read_more: "Read More...",
        show_less: "Show Less",
        no_updates: "No recent family updates",
        greetings: "Hello",
        daily_task: "Your medical tasks for today",

        // Login & SignUp
        login_title: "Login to your account",
        login_subtitle: "Enter your credentials to access your account",
        email: "Email",
        password: "Password",
        forgot_password: "Forgot Password?",
        no_account: "Don't have an account?",
        create_account: "Create new account",
        signup_title: "Create your account",
        signup_subtitle: "Enter your credentials to create an account",
        name: "Name",
        dob: "Date of Birth",
        phone: "Phone Number",
        confirm_password: "Confirm Password",
        already_account: "Already have an account?",
        login_here: "Login here",

        // Profile
        my_details: "My Details",
        age: "Age",
        gender: "Gender",
        contact_number: "Contact Number",
        address: "Address",
        blood_group: "Blood Group",
        emergency_contact: "Emergency Contact",
        choose_avatar: "Choose Avatar",
        pick_character: "Pick a character that represents you",
        select_avatar: "Select Avatar",
        remove_photo: "Remove Photo",

        // Family
        family_members: "Family Members",
        invite_friend: "Invite via Email",
        enter_email: "Enter family member's email",
        invite: "Invite",
        sent_invites: "Sent Invitations",
        received_invites: "Received Invitations",
        no_members: "No family members added yet.",
        no_invites: "No pending invitations.",
        accept: "Accept",
        reject: "Reject",
        family_invites: "Family Invites",
        sent_to: "Sent to",
        invited_you: "invited you to join their family group",
        waiting_acceptance: "Waiting for their acceptance...",
        cancel_request: "Cancel Request",
        add_member: "Add Member",
        remove_member: "Remove Family Member",
        remove_member_confirm: "Are you sure you want to remove this member?",
        no_pending_invites: "No pending family invitations",
        empty_family_msg: "You haven’t added any family members yet.",


        // Reports & Documents
        upload_report: "Upload Report",
        scan_report: "Scan Report",
        upload_doc: "Upload Document",
        no_reports: "No reports found",
        no_docs: "No documents found",
        searching: "Searching...",
        searching_results: "Search results",
        date: "Date",

        // AI Assistant
        ask_anything: "Ask anything...",
        link_file: "Link a File",
        bot_welcome: "Hello! I am your AI Assistant. How can I help you today?",
        analyzing: "I'm analyzing your request...",
        analyzing_file: "I've received the file. Let me analyze it for you...",
        reports_title_me: "Your Saved Reports",
        reports_title_other: "'s Reports",
        docs_subtitle_me: "Your uploaded medical documents",
        docs_subtitle_other: " uploaded medical documents",
        docs_title_other: "'s Documents",

        sort_newest: "Newest First",
        sort_oldest: "Oldest First",
        uploaded_on: "Uploaded on",
        empty_reports_msg: "You haven’t added any reports yet.",
        empty_docs_msg: "You haven’t added any documents yet.",
        rename_report: "Rename Report",
        delete_report: "Delete Report",
        delete_report_confirm: "Are you sure you want to delete this report?",
        rename_doc: "Rename Document",
        delete_doc: "Delete Document",
        delete_doc_confirm: "Are you sure you want to delete this document?",

        // Settings
        account: "Account",
        preferences: "Preferences",
        security: "Security",
        edit_profile: "Edit Profile",
        change_password: "Change Password",
        notifications: "Notifications",
        app_theme: "App Theme",
        language: "Language",
        choose_language: "Choose Language",
        good_morning: "Good Morning",
        good_afternoon: "Good Afternoon",
        good_evening: "Good Evening",
        good_night: "Good Night",
        years: "years",
        loading: "Loading...",
        no_phone: "No phone",
        understand_report: "Want to understand your report?",
        or: "or",
        scan: "Scan",
        male: "Male",
        female: "Female",
        other: "Other",
        good_health: "Stay Healthy!",
        login_btn: "Login",
        signup_btn: "Sign Up",
        app_lock: "App Lock",
        theme: "App Theme",
        light: "Light",
        dark: "Dark",
        system: "System Default",
        choose_theme: "Choose Theme",


    },
    mr: {
        // Common
        home: "मुख्यपृष्ठ",
        family: "कुटुंब",
        ai_assistant: "AI सहाय्यक",
        settings: "सेटिंग्ज",
        profile: "प्रोफाइल",
        documents: "दस्तऐवज",
        reports: "रिपोर्ट्स",
        logout: "बाहेर पडा",
        save: "जतन करा",
        cancel: "रद्द करा",
        done: "पूर्ण",
        edit: "संपादन",
        delete: "हटवा",
        share: "शेअर करा",
        rename: "नाव बदला",
        view: "पहा",
        status: "स्थिती",
        back: "मागे",

        // Home
        emergency_access: "तातडीचा प्रवेश",
        family_updates: "कौटुंबिक अपडेट्स",
        read_more: "अधिक वाचा...",
        show_less: "कमी दाखवा",
        no_updates: "कोणतेही नवीन अपडेट्स नाहीत",
        greetings: "नमस्कार",
        daily_task: "तुमची आजची वैद्यकीय कामे",

        // Login & SignUp
        login_title: "तुमच्या खात्यात लॉग इन करा",
        login_subtitle: "खात्यात प्रवेश करण्यासाठी तुमची माहिती भरा",
        email: "ईमेल",
        password: "पासवर्ड",
        forgot_password: "पासवर्ड विसरलात का?",
        no_account: "खाते नाही का?",
        create_account: "नवीन खाते तयार करा",
        signup_title: "तुमचे खाते तयार करा",
        signup_subtitle: "नवीन खाते तयार करण्यासाठी माहिती भरा",
        name: "नाव",
        dob: "जन्मतारीख",
        phone: "फोन नंबर",
        confirm_password: "पासवर्डची पुष्टी करा",
        already_account: "आधीच खाते आहे का?",
        login_here: "येथून लॉग इन करा",

        // Profile
        my_details: "माझा तपशील",
        age: "वय",
        gender: "लिंग",
        contact_number: "संपर्क क्रमांक",
        address: "पत्ता",
        blood_group: "रक्त गट",
        emergency_contact: "आणीबाणीचा संपर्क",
        choose_avatar: "अवतार निवडा",
        pick_character: "तुमचे प्रतिनिधित्व करणारे पात्र निवडा",
        select_avatar: "अवतार निवडा",
        remove_photo: "फोटो काढा",

        // Family
        family_members: "कुटुंब सदस्य",
        invite_friend: "ईमेलद्वारे आमंत्रित करा",
        enter_email: "सदस्याचा ईमेल प्रविष्ट करा",
        invite: "आमंत्रित करा",
        sent_invites: "पाठवलेली आमंत्रणे",
        received_invites: "मिळालेली आमंत्रणे",
        no_members: "अद्याप कोणीही सदस्य जोडलेले नाहीत.",
        no_invites: "कोणतीही प्रलंबित आमंत्रणे नाहीत.",
        accept: "स्वीकारा",
        reject: "नाकारा",
        family_invites: "कौटुंबिक आमंत्रणे",
        sent_to: "यांना पाठवले",
        invited_you: "तुम्हाला त्यांच्या ग्रुपमध्ये सामील होण्यासाठी आमंत्रित केले आहे",
        waiting_acceptance: "त्यांच्या संमतीची वाट पाहत आहे...",
        cancel_request: "विनंती रद्द करा",
        add_member: "सदस्य जोडा",
        remove_member: "सदस्य काढा",
        remove_member_confirm: "तुम्हाला नक्की हा सदस्य काढायचा आहे का?",
        no_pending_invites: "कोणतीही प्रलंबित आमंत्रणे नाहीत",
        empty_family_msg: "तुम्ही अद्याप कोणतेही कुटुंब सदस्य जोडलेले नाहीत.",


        // Reports & Documents
        upload_report: "रिपोर्ट अपलोड करा",
        scan_report: "रिपोर्ट स्कॅन करा",
        upload_doc: "दस्तऐवज अपलोड करा",
        no_reports: "कोणतेही रिपोर्ट सापडले नाहीत",
        no_docs: "कोणतेही दस्तऐवज सापडले नाहीत",
        searching: "शोधत आहे...",
        searching_results: "शोध परिणाम",
        date: "तारीख",

        // AI Assistant
        ask_anything: "काहीही विचारा...",
        link_file: "फाईल लिंक करा",
        bot_welcome: "नमस्कार! मी तुमचा AI सहाय्यक आहे. मी तुम्हाला कशी मदत करू शकतो?",
        analyzing: "मी तुमच्या विनंतीवर प्रक्रिया करत आहे...",
        analyzing_file: "मला फाईल मिळाली आहे. मला ती तपासू द्या...",
        reports_title_me: "तुमचे जतन केलेले रिपोर्ट",
        reports_title_other: "चे रिपोर्ट",
        docs_subtitle_me: "तुमचे अपलोड केलेले वैद्यकीय दस्तऐवज",
        docs_subtitle_other: " ने अपलोड केलेले वैद्यकीय दस्तऐवज",
        docs_title_other: "चे दस्तऐवज",

        sort_newest: "नवीन प्रथम",
        sort_oldest: "जुने प्रथम",
        uploaded_on: "रोजी अपलोड केले",
        empty_reports_msg: "तुम्ही अद्याप कोणतेही रिपोर्ट जोडलेले नाहीत.",
        empty_docs_msg: "तुम्ही अद्याप कोणतेही दस्तऐवज जोडलेले नाहीत.",
        rename_report: "रिपोर्टचे नाव बदला",
        delete_report: "रिपोर्ट हटवा",
        delete_report_confirm: "तुम्हाला नक्की हा रिपोर्ट हटवायचा आहे का?",
        rename_doc: "दस्तऐवजाचे नाव बदला",
        delete_doc: "दस्तऐवज हटवा",
        delete_doc_confirm: "तुम्हाला नक्की हा दस्तऐवज हटवायचा आहे का?",

        // Settings
        account: "खाते",
        preferences: "प्राधान्ये",
        security: "सुरक्षा",
        edit_profile: "प्रोफाइल संपादित करा",
        change_password: "पासवर्ड बदला",
        notifications: "सूचना",
        app_theme: "अॅप थीम",
        language: "भाषा",
        choose_language: "भाषा निवडा",
        good_morning: "शुभ प्रभात",
        good_afternoon: "शुभ दुपार",
        good_evening: "शुभ संध्याकाळ",
        good_night: "शुभ रात्री",
        years: "वर्षे",
        loading: "लोड होत आहे...",
        no_phone: "फोन नाही",
        understand_report: "तुम्हाला तुमचा रिपोर्ट समजून घ्यायचा आहे का?",
        or: "किंवा",
        scan: "स्कॅन",
        male: "पुरुष",
        female: "स्त्री",
        other: "इतर",
        good_health: "निरोगी रहा!",
        login_btn: "लॉग इन",
        signup_btn: "साइन अप करा",
        app_lock: "अॅप लॉक",
        theme: "अॅप थीम",
        light: "लाईट",
        dark: "डार्क",
        system: "सिस्टम डिफॉल्ट",
        choose_theme: "थीम निवडा",


    },
    hi: {
        // Common
        home: "होम",
        family: "परिवार",
        ai_assistant: "AI सहायक",
        settings: "सेटिंग्स",
        profile: "प्रोफाइल",
        documents: "दस्तावेज़",
        reports: "रिपोर्ट्स",
        logout: "लॉगआउट",
        save: "सहेजें",
        cancel: "रद्द करें",
        done: "पूर्ण",
        edit: "संपादित करें",
        delete: "मिटाएं",
        share: "साझा करें",
        rename: "नाम बदलें",
        view: "देखें",
        status: "स्थिति",
        back: "पीछे",

        // Home
        emergency_access: "आपातकालीन पहुंच",
        family_updates: "पारिवारिक अपडेट",
        read_more: "और पढ़ें...",
        show_less: "कम दिखाएं",
        no_updates: "कोई हालिया अपडेट नहीं",
        greetings: "नमस्ते",
        daily_task: "आज के आपके चिकित्सा कार्य",

        // Login & SignUp
        login_title: "अपने खाते में लॉग इन करें",
        login_subtitle: "प्रवेश करने के लिए अपनी साख दर्ज करें",
        email: "ईमेल",
        password: "पासवर्ड",
        forgot_password: "पासवर्ड भूल गए?",
        no_account: "खाता नहीं है?",
        create_account: "नया खाता बनाएं",
        signup_title: "अपना खाता बनाएं",
        signup_subtitle: "खाता बनाने के लिए अपनी जानकारी भरें",
        name: "नाम",
        dob: "जन्म तिथि",
        phone: "फ़ोन नंबर",
        confirm_password: "पासवर्ड की पुष्टि करें",
        already_account: "पहले से ही खाता है?",
        login_here: "यहाँ लॉग इन करें",

        // Profile
        my_details: "मेरा विवरण",
        age: "आयु",
        gender: "लिंग",
        contact_number: "संपर्क नंबर",
        address: "पता",
        blood_group: "रक्त समूह",
        emergency_contact: "आपातकालीन संपर्क",
        choose_avatar: "अवतार चुनें",
        pick_character: "वह पात्र चुनें जो आपका प्रतिनिधित्व करता है",
        select_avatar: "अवतार चुनें",
        remove_photo: "फोटो हटाएं",

        // Family
        family_members: "परिवार के सदस्य",
        invite_friend: "ईमेल के माध्यम से आमंत्रित करें",
        enter_email: "सदस्य का ईमेल दर्ज करें",
        invite: "आमंत्रित करें",
        sent_invites: "भेजे गए आमंत्रण",
        received_invites: "प्राप्त आमंत्रण",
        no_members: "अभी तक कोई परिवार सदस्य नहीं जोड़ा गया है।",
        no_invites: "कोई लंबित आमंत्रण नहीं।",
        accept: "स्वीकार करें",
        reject: "अस्वीकार करें",
        family_invites: "पारिवारिक आमंत्रण",
        sent_to: "को भेजा गया",
        invited_you: "ने आपको अपने समूह में शामिल होने के लिए आमंत्रित किया है",
        waiting_acceptance: "उनकी स्वीकृति की प्रतीक्षा है...",
        cancel_request: "अनुरोध रद्द करें",
        add_member: "सदस्य जोड़ें",
        remove_member: "सदस्य निकालें",
        remove_member_confirm: "क्या आप वाकई इस सदस्य को निकालना चाहते हैं?",
        no_pending_invites: "कोई लंबित पारिवारिक आमंत्रण नहीं",
        empty_family_msg: "आपने अभी तक कोई परिवार सदस्य नहीं जोड़ा है।",


        // Reports & Documents
        upload_report: "रिपोर्ट अपलोड करें",
        scan_report: "रिपोर्ट स्कैन करें",
        upload_doc: "दस्तावेज़ अपलोड करें",
        no_reports: "कोई रिपोर्ट नहीं मिली",
        no_docs: "कोई दस्तावेज़ नहीं मिला",
        searching: "खोज रहे हैं...",
        searching_results: "खोज परिणाम",
        date: "तारीख",

        // AI Assistant
        ask_anything: "कुछ भी पूछें...",
        link_file: "फ़ाइल लिंक करें",
        bot_welcome: "नमस्ते! मैं आपका AI सहायक हूँ। मैं आपकी कैसे मदद कर सकता हूँ?",
        analyzing: "मैं आपके अनुरोध पर कार्रवाई कर रहा हूँ...",
        analyzing_file: "मुझे फ़ाइल मिल गई है। मुझे इसका विश्लेषण करने दें...",
        reports_title_me: "आपके द्वारा सहेजी गई रिपोर्ट",
        reports_title_other: " की रिपोर्ट",
        docs_subtitle_me: "आपके अपलोड किए गए चिकित्सा दस्तावेज़",
        docs_subtitle_other: " के अपलोड किए गए चिकित्सा दस्तावेज़",
        docs_title_other: " के दस्तावेज़",

        sort_newest: "नवीनतम पहले",
        sort_oldest: "सबसे पुराने पहले",
        uploaded_on: "को अपलोड किया गया",
        empty_reports_msg: "आपने अभी तक कोई रिपोर्ट नहीं जोड़ी है।",
        empty_docs_msg: "आपने अभी तक कोई दस्तावेज़ नहीं जोड़ा है।",
        rename_report: "रिपोर्ट का नाम बदलें",
        delete_report: "रिपोर्ट हटाएं",
        delete_report_confirm: "क्या आप वाकई इस रिपोर्ट को हटाना चाहते हैं?",
        rename_doc: "दस्तावेज़ का नाम बदलें",
        delete_doc: "दस्तावेज़ हटाएं",
        delete_doc_confirm: "क्या आप वाकई इस दस्तावेज़ को हटाना चाहते हैं?",

        // Settings
        account: "खाता",
        preferences: "प्राथमिकताएं",
        security: "सुरक्षा",
        edit_profile: "प्रोफ़ाइल संपादित करें",
        change_password: "पासवर्ड बदलें",
        notifications: "सूचनाएं",
        app_theme: "ऐप थीम",
        language: "भाषा",
        choose_language: "भाषा चुनें",
        good_morning: "सुप्रभात",
        good_afternoon: "शाम बख़ैर",
        good_evening: "शुभ संध्या",
        good_night: "शुभ रात्रि",
        years: "साल",
        loading: "लोड हो रहा है...",
        no_phone: "कोई फोन नहीं",
        understand_report: "क्या आप अपनी रिपोर्ट समझना चाहते हैं?",
        or: "या",
        scan: "स्कैन",
        male: "पुरुष",
        female: "महिला",
        other: "अन्य",
        good_health: "स्वस्थ रहें!",
        login_btn: "लॉग इन",
        signup_btn: "साइन अप करें",
        app_lock: "ऐप लॉक",
        theme: "ऐप थीम",
        light: "लाइट",
        dark: "डार्क",
        system: "सिस्टम डिफॉल्ट",
        choose_theme: "थीम चुनें",


    }
};


interface AppContextType {

    updates: Update[];
    reports: Report[];
    documents: Document[];
    familyMembers: FamilyMember[];
    invitations: Invitation[];
    userProfile: any | null;
    userEmail: string | null;
    invitationError: boolean;
    loading: boolean;
    refreshData: () => Promise<void>;
    addUpdate: (name: string, text: string) => Promise<void>;
    addReport: (name: string, uri: string, analysis?: string) => Promise<void>;
    addDocument: (name: string, uri: string) => Promise<void>;
    updateReport: (id: string, name: string) => Promise<void>;
    deleteReport: (id: string) => Promise<void>;
    updateDocument: (id: string, name: string) => Promise<void>;
    deleteDocument: (id: string) => Promise<void>;
    sendInvitation: (email: string) => Promise<void>;
    acceptInvitation: (invitationId: string) => Promise<void>;
    rejectInvitation: (invitationId: string) => Promise<void>;
    cancelInvitation: (invitationId: string) => Promise<void>;
    removeFamilyMember: (memberId: string) => Promise<void>;
    familyId: string | null;
    language: LanguageCode;
    setLanguage: (lang: LanguageCode) => void;
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;
    colors: ThemeColors;
    t: (key: string) => string;
}



const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [updates, setUpdates] = useState<Update[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [userProfile, setUserProfile] = useState<any | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [invitationError, setInvitationError] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentFamilyId, setCurrentFamilyId] = useState<string | null>(null);
    const [language, setLanguage] = useState<LanguageCode>('en');
    const [themeMode, setThemeMode] = useState<ThemeMode>('system');
    const systemColorScheme = useColorScheme();

    const colors = useMemo(() => {
        if (themeMode === 'system') {
            return systemColorScheme === 'dark' ? darkColors : lightColors;
        }
        return themeMode === 'dark' ? darkColors : lightColors;
    }, [themeMode, systemColorScheme]);

    const t = useMemo(() => (key: string): string => {
        const langDict = translations[language] as any;
        const enDict = translations.en as any;
        return langDict[key] || enDict[key] || key;
    }, [language]);



    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const { data, error: userError } = await supabase.auth.getUser();
            const user = data?.user;

            if (userError || !user) {
                console.warn("User fetch error or no user:", userError?.message);
                setLoading(false);
                return;
            }
            setUserEmail(user.email || null);

            // 1. Fetch profile to get family_id
            let profile = null;
            try {
                const { data, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profileError) throw profileError;
                profile = data;

                if (profile) {
                    setUserProfile(profile);
                    // Aggressively sync email to ensure discoverability
                    if (user.email && profile.email !== user.email.toLowerCase().trim()) {
                        await supabase.from('profiles').update({ email: user.email.toLowerCase().trim() }).eq('id', user.id);
                    }
                }
            } catch (err) {
                console.warn("Profile fetch error:", err);
            }

            const familyId = profile?.family_id || user.id;
            setCurrentFamilyId(familyId);

            // Self-healing: If family_id is missing in DB, set it to their own ID
            if (profile && !profile.family_id) {
                await supabase.from('profiles').update({ family_id: user.id }).eq('id', user.id);
            }

            // 2. Fetch reports (always private)
            try {
                const { data: reportsData } = await supabase
                    .from('reports')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (reportsData) {
                    setReports(reportsData.map(r => ({
                        id: r.id,
                        name: r.name,
                        date: new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                        timestamp: new Date(r.created_at).getTime(),
                        uri: r.uri,
                        analysis: r.analysis
                    })));
                }
            } catch (err) {
                console.warn("Reports fetch error:", err);
            }

            // 3. Fetch documents
            try {
                const { data: docsData } = await supabase
                    .from('documents')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('uploaded_at', { ascending: false });

                if (docsData) {
                    setDocuments(docsData.map(d => ({
                        id: d.id,
                        name: d.original_name,
                        date: new Date(d.uploaded_at || d.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                        timestamp: new Date(d.uploaded_at || d.created_at).getTime(),
                        uri: d.file_path
                    })));
                }
            } catch (err) {
                console.warn("Documents fetch error:", err);
            }

            // 4. Fetch updates (family-wide) - Only last 24 hours
            const activeFamilyId = profile?.family_id || user.id;

            const fetchUpdatesFromServer = async () => {
                try {
                    // Fetch updates without the join to avoid schema relationship errors
                    const { data: updatesData, error: fetchErr } = await supabase
                        .from('family_updates')
                        .select('*')
                        .or(`family_id.eq.${activeFamilyId},user_id.eq.${user.id}`)
                        .order('created_at', { ascending: false })
                        .limit(20);

                    if (fetchErr) {
                        console.warn("Updates fetch from server error:", fetchErr);
                        return;
                    }

                    if (updatesData) {
                        setUpdates(updatesData);
                    }
                } catch (err) {
                    console.warn("Updates fetch error:", err);
                }
            };

            await fetchUpdatesFromServer();

            // Set up Realtime subscription for family updates
            supabase
                .channel(`family_updates_${activeFamilyId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'family_updates',
                        filter: `family_id=eq.${activeFamilyId}`
                    },
                    () => fetchUpdatesFromServer()
                )
                .subscribe();

            // Background cleanup
            const cleanup = async () => {
                try {
                    await supabase.from('family_updates')
                        .delete()
                        .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
                } catch (err) {
                    console.warn("Cleanup error:", err);
                }
            };
            cleanup();

            // 5. Fetch family members (family-wide)
            try {
                if (activeFamilyId) {
                    const { data: familyProfiles, error: famError } = await supabase
                        .from('profiles')
                        .select('id, full_name, photo_url, email')
                        .or(`family_id.eq.${activeFamilyId},id.eq.${activeFamilyId}`);

                    if (famError) {
                        console.warn("Family members fetch from server error:", famError);
                        return;
                    }

                    if (familyProfiles) {
                        setFamilyMembers(familyProfiles.map(p => ({
                            id: p.id,
                            name: p.full_name || p.email?.split('@')[0] || 'Unknown',
                            image: p.photo_url || '',
                            email: p.email
                        })).filter(p => p.id !== user.id));
                    }
                }
            } catch (err) {
                console.warn("Family members fetch error:", err);
            }

            // 6. Fetch invitations
            if (user.email) {
                try {
                    const [{ data: receivedData }, { data: sentData }] = await Promise.all([
                        supabase.from('invitations').select('*').ilike('receiver_email', user.email.trim()).eq('status', 'pending'),
                        supabase.from('invitations').select('*').eq('sender_id', user.id).eq('status', 'pending')
                    ]);

                    const allInvites: Invitation[] = [];
                    if (receivedData) {
                        const receivedWithNames = await Promise.all(receivedData.map(async (inv) => {
                            const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', inv.sender_id).single();
                            return { ...inv, sender_name: profile?.full_name || 'Someone', type: 'received' as const };
                        }));
                        allInvites.push(...receivedWithNames);
                    }
                    if (sentData) {
                        allInvites.push(...sentData.map(inv => ({ ...inv, type: 'sent' as const })));
                    }
                    setInvitations(allInvites);
                } catch (err) {
                    console.warn("Invitations fetch error:", err);
                    setInvitationError(true);
                }
            }
        } catch (error) {
            console.error('Critical data fetch error:', error);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchInitialData();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN') fetchInitialData();
            if (event === 'SIGNED_OUT') {
                setReports([]);
                setDocuments([]);
                setUpdates([]);
                setFamilyMembers([]);
                setInvitations([]);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const addUpdate = async (text: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch the most up-to-date name and family_id from the profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, family_id')
                .eq('id', user.id)
                .single();

            const family_id = profile?.family_id || user.id;
            const senderName = profile?.full_name || user.email?.split('@')[0] || 'A family member';

            const { error } = await supabase
                .from('family_updates')
                .insert({
                    user_id: user.id,
                    family_id,
                    name: senderName,
                    text
                });

            if (error) throw error;
            // Force a refresh to ensure immediate visibility
            await fetchInitialData();
        } catch (error) {
            console.error('Error adding update:', error);
        }
    };

    const addReport = async (name: string, uri: string, analysis?: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('reports')
                .insert({
                    user_id: user.id,
                    name,
                    uri,
                    analysis: analysis || 'No analysis available'
                })
                .select()
                .single();

            if (error) throw error;

            const newReport: Report = {
                id: data.id,
                name: data.name,
                date: new Date(data.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                timestamp: new Date(data.created_at).getTime(),
                uri: data.uri,
                analysis: data.analysis
            };

            setReports(prev => [newReport, ...prev]);
            await addUpdate(`Added a new report: ${name}`);
        } catch (error) {
            console.error('Error adding report:', error);
        }
    };

    const addDocument = async (name: string, uri: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('documents')
                .insert({
                    user_id: user.id,
                    original_name: name,
                    file_path: uri,
                    file_type: name.split('.').pop() || 'unknown'
                })
                .select()
                .single();

            if (error) throw error;

            const newDoc: Document = {
                id: data.id,
                name: data.original_name,
                date: new Date(data.created_at || data.uploaded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                timestamp: new Date(data.created_at || data.uploaded_at).getTime(),
                uri: data.file_path
            };

            setDocuments(prev => [newDoc, ...prev]);
            await addUpdate(`Uploaded a document: ${name}`);
        } catch (error) {
            console.error('Error adding document:', error);
            throw error;
        }
    };


    const updateReport = async (id: string, name: string) => {
        try {
            const { error } = await supabase
                .from('reports')
                .update({ name })
                .eq('id', id);

            if (error) throw error;
            setReports(prev => prev.map(r => r.id === id ? { ...r, name } : r));
        } catch (error) {
            console.error('Error updating report:', error);
        }
    };

    const deleteReport = async (id: string) => {
        try {
            const { error } = await supabase
                .from('reports')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setReports(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error('Error deleting report:', error);
        }
    };

    const updateDocument = async (id: string, name: string) => {
        try {
            const { error } = await supabase
                .from('documents')
                .update({ name })
                .eq('id', id);

            if (error) throw error;
            setDocuments(prev => prev.map(d => d.id === id ? { ...d, name } : d));
        } catch (error) {
            console.error('Error updating document:', error);
        }
    };

    const deleteDocument = async (id: string) => {
        try {
            const { error } = await supabase
                .from('documents')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setDocuments(prev => prev.filter(d => d.id !== id));
        } catch (error) {
            console.error('Error deleting document:', error);
        }
    };

    const sendInvitation = async (email: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const targetEmail = email.toLowerCase().trim();

            // Check if the user exists in profiles first
            let targetProfile = null;
            console.log(`Checking for Carevia user with email: "${targetEmail}"`);

            try {
                const { data: profiles, error: profileError } = await supabase
                    .from('profiles')
                    .select('id')
                    .ilike('email', targetEmail);

                if (profileError) {
                    console.warn("Database check failed:", profileError.message);
                }

                if (profiles && profiles.length > 0) {
                    targetProfile = profiles[0];
                    console.log("User found!");
                }
            } catch (e) {
                console.error("Profile check exception:", e);
            }

            if (!targetProfile) {
                throw new Error('This user does not have a Carevia account, or they need to log in once to sync their profile.');
            }

            const { data: myProfile } = await supabase.from('profiles').select('family_id').eq('id', user.id).single();
            const family_id = myProfile?.family_id || user.id;

            // Update my profile with family_id if it's currently null
            if (!myProfile?.family_id) {
                await supabase.from('profiles').update({ family_id }).eq('id', user.id);
            }

            const { error: inviteError } = await supabase
                .from('invitations')
                .insert({
                    sender_id: user.id,
                    family_id,
                    receiver_email: targetEmail,
                    status: 'pending'
                });

            if (inviteError) throw inviteError;

            await addUpdate(`Sent a family invitation to ${email}`);
        } catch (error) {
            console.error('Error sending invitation:', error);
            throw error;
        }
    };

    const acceptInvitation = async (invitationId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const invite = invitations.find(i => i.id === invitationId);
            if (!invite) return;

            // Use the invitation's family_id. This effectively joins the receiver (current user)
            // to the sender's family group.
            const family_id = invite.family_id;

            // 1. Update receiver's profile with family_id
            await supabase.from('profiles').update({ family_id }).eq('id', user.id);

            // 2. Update invitation status
            await supabase.from('invitations').update({ status: 'accepted' }).eq('id', invitationId);

            // 3. Clear invitations and refresh
            setInvitations(prev => prev.filter(i => i.id !== invitationId));
            await fetchInitialData();
            await addUpdate(`Joined a new family!`);
        } catch (error) {
            console.error('Error accepting invitation:', error);
            throw error;
        }
    };

    const rejectInvitation = async (invitationId: string) => {
        try {
            const { error } = await supabase
                .from('invitations')
                .update({ status: 'rejected' })
                .eq('id', invitationId);

            if (error) throw error;
            setInvitations(prev => prev.filter(i => i.id !== invitationId));
        } catch (error) {
            console.error('Error rejecting invitation:', error);
            throw error;
        }
    };

    const cancelInvitation = async (invitationId: string) => {
        try {
            const { error } = await supabase
                .from('invitations')
                .update({ status: 'rejected' })
                .eq('id', invitationId);

            if (error) throw error;
            setInvitations(prev => prev.filter(i => i.id !== invitationId));
            await addUpdate("Cancelled a sent invitation.");
        } catch (error) {
            console.error('Error cancelling invitation:', error);
            throw error;
        }
    };

    const removeFamilyMember = async (memberId: string) => {
        try {
            // Setting family_id to their own ID makes them part of a single-person family (private)
            const { error } = await supabase
                .from('profiles')
                .update({ family_id: memberId })
                .eq('id', memberId);

            if (error) throw error;

            const removedMember = familyMembers.find(m => m.id === memberId);
            setFamilyMembers(prev => prev.filter(m => m.id !== memberId));

            if (removedMember) {
                await addUpdate(`Removed ${removedMember.name} from the family.`);
            }
        } catch (error) {
            console.error('Error removing family member:', error);
            throw error;
        }
    };

    return (
        <AppContext.Provider value={{
            updates,
            reports,
            documents,
            familyMembers,
            invitations,
            loading,
            userProfile,
            userEmail,
            invitationError,
            refreshData: fetchInitialData,
            addUpdate,
            addReport,
            addDocument,
            updateReport,
            deleteReport,
            updateDocument,
            deleteDocument,
            sendInvitation,
            acceptInvitation,
            rejectInvitation,
            cancelInvitation,
            removeFamilyMember,
            familyId: currentFamilyId,
            language,
            setLanguage,
            themeMode,
            setThemeMode,
            colors,
            t
        }}>


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

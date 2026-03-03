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
    raw_text?: string;
}

export interface LabTest {
    test_name: string;
    value: string | number;
    unit: string | null;
    normal_min: number | null;
    normal_max: number | null;
    status: 'Normal' | 'High' | 'Low' | 'Borderline' | 'Abnormal' | 'Unknown';
}

export interface StructuredReport {
    id: string;
    report_id: string;
    user_id: string;
    parsed_json: {
        patient_info: {
            age: number | null;
            gender: string | null;
            blood_group: string | null;
        };
        lab_tests: LabTest[];
        doctor_notes: string | null;
    };
    explanation_json?: {
        summary: string;
        detailed_explanation: string;
        disclaimer: string;
    };
    created_at: string;
}

export interface TrendData {
    id: string;
    report_id: string;
    test_name: string;
    previous_value: number;
    current_value: number;
    trend_status: 'Increased' | 'Decreased' | 'Stable';
    percentage_change: number;
    created_at: string;
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

export type LanguageCode = 'en' | 'mr' | 'hi' | 'kn' | 'pa' | 'ta' | 'gu';
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
    success: string;
    warning: string;
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
    success: '#4CAF50',
    warning: '#FFC107',
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
    success: '#81C784',
    warning: '#FFD54F',
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
        you: "You",
        error: "Error",
        success: "Success",
        upload_error: "Upload Error",

        // Home
        emergency_access: "Emergency Access",
        family_updates: "Family Updates",
        read_more: "Read More...",
        show_less: "Show Less",
        no_updates: "No recent family updates",
        greetings: "Hello",
        daily_task: "Your medical tasks for today",
        tagline: "Your family's health,\norganized & accessible.",

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
        report: "Report",
        no_reports: "No reports found",
        no_docs: "No documents found",
        searching: "Searching...",
        searching_results: "Search results",
        date: "Date",
        permission_camera: "We need your permission to show the camera",
        grant_permission: "Grant Permission",
        report_analysis: "Your Report Analysis",
        report_summary: "Overall Report Summary",
        ai_suggestions: "AI Suggestions",
        save_report: "Save Report",
        enter_report_name: "Please enter a name for your report to stay organized.",
        report_name_placeholder: "e.g. Blood Test - Jan",
        uploading: "Uploading...",
        save_now: "Save Now",
        capture_instruction: "Make sure to capture a clear picture of report",
        finish: "Finish",

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
        docs_title_me: "My Documents",

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
        upload: "Upload",
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

        // Contact Us
        about: "About",
        contact_us: "Contact Us",
        email_support: "Email Support",
        call_us: "Call Us",
        chat_support: "Chat Support",
        send_message_title: "Send Us a Message",
        your_name: "Your Name",
        your_email: "Your Email",
        your_message: "Your Message",
        send_message: "Send Message",
        sending: "Sending...",
        msg_sent_success: "Your message has been sent!",
        fill_all_fields: "Please fill in all fields",

        // Help & Policy
        help_policy: "Help & Policy",
        help: "Help",
        policy: "Policy",
        terms_conditions: "Terms & Conditions",
        feedback: "Feedback",
        rate_carevia: "Rate Carevia",
        send_feedback: "Send Feedback",
        last_updated: "Last Updated",

        // About
        about_carevia: "About Carevia",
        our_mission: "Our Mission",
        mission_text: "Carevia helps families securely store, manage, and understand medical records — anytime, anywhere.",
        why_carevia: "Why Carevia",
        emergency_access_feat: "Emergency access",
        family_health_tracking: "Family-wise health tracking",
        secure_storage: "Secure document storage",
        version: "Version",
        app_version: "App Version",

        // FAQs
        faq_q1: "How to upload reports?",
        faq_a1: "Go to the Home screen, tap on 'Upload Report', select your document from the gallery or scan it using our advanced medical scanner.",
        faq_q2: "How to add family members?",
        faq_a2: "Navigate to the Family screen, tap the '+' icon or 'Add Member' button, and enter their basic details to start tracking their health.",
        faq_q3: "How emergency access works?",
        faq_a3: "Emergency access allows designated contacts to view your critical medical info during an emergency, even if you can't unlock your phone.",
        faq_q4: "How secure is my data?",
        faq_a4: "Your data is encrypted using military-grade AES-256 encryption. We never share your medical records with third parties without your consent.",
    },
    mr: {
        // Common
        home: "मुख्यपृष्ठ",
        family: "कुटुंब",
        ai_assistant: "एआय सहाय्यक",
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
        you: "तुम्ही",
        error: "त्रुटी",
        success: "यश",
        upload_error: "अपलोड त्रुटी",

        // Home
        emergency_access: "तातडीचा प्रवेश",
        family_updates: "कौटुंबिक अपडेट्स",
        read_more: "अधिक वाचा...",
        show_less: "कमी दाखवा",
        no_updates: "कोणतेही नवीन अपडेट्स नाहीत",
        greetings: "नमस्कार",
        daily_task: "तुमची आजची वैद्यकीय कामे",
        tagline: "तुमच्या कुटुंबाचे आरोग्य,\nसुव्यवस्थित आणि सुलभ.",

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
        report: "रिपोर्ट",
        no_reports: "कोणतेही रिपोर्ट सापडले नाहीत",
        no_docs: "कोणतेही दस्तऐवज सापडले नाहीत",
        searching: "शोधत आहे...",
        searching_results: "शोध परिणाम",
        date: "तारीख",
        permission_camera: "आम्हाला कॅमेरा वापरण्यासाठी तुमची परवानगी हवी आहे",
        grant_permission: "परवानगी द्या",
        report_analysis: "तुमच्या रिपोर्टचे विश्लेषण",
        report_summary: "रिपोर्टचा सारांश",
        ai_suggestions: "एआय सूचना",
        save_report: "रिपोर्ट जतन करा",
        enter_report_name: "कृपया तुमच्या रिपोर्टसाठी एक नाव द्या.",
        report_name_placeholder: "उदा. ब्लड टेस्ट - जाने",
        uploading: "अपलोड होत आहे...",
        save_now: "आता जतन करा",
        capture_instruction: "रिपोर्टचे स्पष्ट चित्र टिपल्याची खात्री करा",
        finish: "पूर्ण",

        // AI Assistant
        ask_anything: "काहीही विचारा...",
        link_file: "फाईल लिंक करा",
        bot_welcome: "नमस्कार! मी तुमचा एआय सहाय्यक आहे. मी तुम्हाला कशी मदत करू शकतो?",
        analyzing: "मी तुमच्या विनंतीवर प्रक्रिया करत आहे...",
        analyzing_file: "मला फाईल मिळाली आहे. मला ती तपासू द्या...",
        reports_title_me: "तुमचे जतन केलेले रिपोर्ट",
        reports_title_other: "चे रिपोर्ट",
        docs_subtitle_me: "तुमचे अपलोड केलेले वैद्यकीय दस्तऐवज",
        docs_subtitle_other: " ने अपलोड केलेले वैद्यकीय दस्तऐवज",
        docs_title_other: "चे दस्तऐवज",
        docs_title_me: "माझे दस्तऐवज",

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
        upload: "अपलोड",
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

        // Contact Us
        about: "आमच्याबद्दल",
        contact_us: "आमच्याशी संपर्क साधा",
        email_support: "ईमेल सपोर्ट",
        call_us: "आम्हाला कॉल करा",
        chat_support: "चॅट सपोर्ट",
        send_message_title: "आम्हाला संदेश पाठवा",
        your_name: "तुमचे नाव",
        your_email: "तुमचा ईमेल",
        your_message: "तुमचा संदेश",
        send_message: "संदेश पाठवा",
        sending: "पाठवत आहे...",
        msg_sent_success: "तुमचा संदेश पाठवला गेला आहे!",
        fill_all_fields: "कृपया सर्व माहिती भरा",

        // Help & Policy
        help_policy: "मदत आणि धोरण",
        help: "मदत",
        policy: "धोरण",
        terms_conditions: "नियम आणि अटी",
        feedback: "अभिप्राय",
        rate_carevia: "केअरव्हियाला रेट करा",
        send_feedback: "अभिप्राय पाठवा",
        last_updated: "शेवटचे अपडेट",

        // About
        about_carevia: "केअरव्हियाबद्दल",
        our_mission: "आमचे ध्येय",
        mission_text: "केअरव्हिया कुटुंबांना वैद्यकीय रेकॉर्ड सुरक्षितपणे जतन करण्यास, व्यवस्थापित करण्यास आणि समजून घेण्यास मदत करते — केव्हाही, कोठेही.",
        why_carevia: "केअरव्हिया का?",
        emergency_access_feat: "तातडीचा प्रवेश",
        family_health_tracking: "कौटुंबिक आरोग्य ट्रॅकिंग",
        secure_storage: "सुरक्षित दस्तऐवज संचयन",
        version: "आवृत्ती",
        app_version: "अॅप आवृत्ती",

        // FAQs
        faq_q1: "रिपोर्ट कसे अपलोड करायचे?",
        faq_a1: "मुख्यपृष्ठावर जा, 'रिपोर्ट अपलोड करा' वर टॅप करा, तुमच्या गॅलरीतून दस्तऐवज निवडा किंवा स्कॅनर वापरून स्कॅन करा.",
        faq_q2: "कुटुंब सदस्य कसे जोडायचे?",
        faq_a2: "कुटुंब स्क्रीनवर जा, '+' आयकॉन किंवा 'सदस्य जोडा' बटणावर टॅप करा आणि त्यांची माहिती भरा.",
        faq_q3: "तातडीचा प्रवेश (Emergency Access) कसा कार्य करतो?",
        faq_a3: "तातडीचा प्रवेश नियुक्त संपर्कांना आणीबाणीच्या वेळी तुमची महत्त्वाची वैद्यकीय माहिती पाहण्याची परवानगी देतो.",
        faq_q4: "माझा डेटा किती सुरक्षित आहे?",
        faq_a4: "तुमचा डेटा AES-256 एन्क्रिप्शनसह सुरक्षित आहे. आम्ही तुमची माहिती तुमच्या संमतीशिवाय कोणाशीही शेअर करत नाही.",
    },
    hi: {
        // Common
        home: "होम",
        family: "परिवार",
        ai_assistant: "एआई सहायक",
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
        you: "आप",
        error: "त्रुटि",
        success: "सफलता",
        upload_error: "अपलोड त्रुटि",

        // Home
        emergency_access: "आपातकालीन पहुंच",
        family_updates: "पारिवारिक अपडेट",
        read_more: "और पढ़ें...",
        show_less: "कम दिखाएं",
        no_updates: "कोई हालिया अपडेट नहीं",
        greetings: "नमस्ते",
        daily_task: "आज के आपके चिकित्सा कार्य",
        tagline: "आपके परिवार का स्वास्थ्य,\nव्यवस्थित और सुलभ।",

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
        report: "रिपोर्ट",
        no_reports: "कोई रिपोर्ट नहीं मिली",
        no_docs: "कोई दस्तावेज़ नहीं मिला",
        searching: "खोज रहे हैं...",
        searching_results: "खोज परिणाम",
        date: "तारीख",
        permission_camera: "हमें कैमरा दिखाने के लिए आपकी अनुमति चाहिए",
        grant_permission: "अनुमति दें",
        report_analysis: "आपकी रिपोर्ट का विश्लेषण",
        report_summary: "रिपोर्ट का सारांश",
        ai_suggestions: "एआई सुझाव",
        save_report: "रिपोर्ट सहेजें",
        enter_report_name: "कृपया अपने रिपोर्ट के लिए एक नाम दर्ज करें।",
        report_name_placeholder: "जैसे: ब्लड टेस्ट - जन",
        uploading: "अपलोड हो रहा है...",
        save_now: "अभी सहेजें",
        capture_instruction: "सुनिश्चित करें कि रिपोर्ट की तस्वीर स्पष्ट है",
        finish: "समाप्त",

        // AI Assistant
        ask_anything: "कुछ भी पूछें...",
        link_file: "फ़ाइल लिंक करें",
        bot_welcome: "नमस्ते! मैं आपका एआई सहायक हूँ। मैं आपकी कैसे मदद कर सकता हूँ?",
        analyzing: "मैं आपके अनुरोध पर कार्रवाई कर रहा हूँ...",
        analyzing_file: "मुझे फ़ाइल मिल गई है। मुझे इसका विश्लेषण करने दें...",
        reports_title_me: "आपके द्वारा सहेजी गई रिपोर्ट",
        reports_title_other: " की रिपोर्ट",
        docs_subtitle_me: "आपके अपलोड किए गए चिकित्सा दस्तावेज़",
        docs_subtitle_other: " के अपलोड किए गए चिकित्सा दस्तावेज़",
        docs_title_other: " के दस्तावेज़",
        docs_title_me: "मेरे दस्तावेज़",

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
        good_afternoon: "दोपहर",
        good_evening: "शुभ संध्या",
        good_night: "शुभ रात्रि",
        years: "साल",
        loading: "लोड हो रहा है...",
        no_phone: "कोई फोन नहीं",
        understand_report: "क्या आप अपनी रिपोर्ट समझना चाहते हैं?",
        or: "या",
        scan: "स्कैन",
        upload: "अपलोड",
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

        // Contact Us
        about: "हमारे बारे में",
        contact_us: "संपर्क करें",
        email_support: "ईमेल सपोर्ट",
        call_us: "हमें कॉल करें",
        chat_support: "चैट सपोर्ट",
        send_message_title: "हमें संदेश भेजें",
        your_name: "आपका नाम",
        your_email: "आपका ईमेल",
        your_message: "आपका संदेश",
        send_message: "संदेश भेजें",
        sending: "भेज रहा है...",
        msg_sent_success: "आपका संदेश भेज दिया गया है!",
        fill_all_fields: "कृपया सभी फ़ील्ड भरें",

        // Help & Policy
        help_policy: "मदद और नीति",
        help: "मदद",
        policy: "नीति",
        terms_conditions: "नियम और शर्तें",
        feedback: "प्रतिक्रिया",
        rate_carevia: "केयरव्हिया रेट करें",
        send_feedback: "प्रतिक्रिया भेजें",
        last_updated: "आखिरी अपडेट",

        // About
        about_carevia: "केयरव्हिया के बारे में",
        our_mission: "हमारा लक्ष्य",
        mission_text: "केयरव्हिया परिवारों को मेडिकल रिकॉर्ड सुरक्षित रूप से स्टोर, मैनेज और समझने में मदद करता है — कभी भी, कहीं भी।",
        why_carevia: "केयरव्हिया क्यों",
        emergency_access_feat: "आपातकालीन पहुंच",
        family_health_tracking: "परिवार-वार स्वास्थ्य ट्रैकिंग",
        secure_storage: "सुरक्षित दस्तावेज़ भंडारण",
        version: "वर्जन",
        app_version: "ऐप वर्जन",

        // FAQs
        faq_q1: "रिपोर्ट कैसे अपलोड करें?",
        faq_a1: "होम स्क्रीन पर जाएं, 'रिपोर्ट अपलोड करें' पर टैप करें, अपनी गैलरी से दस्तावेज़ चुनें या स्कैनर का उपयोग करके स्कैन करें.",
        faq_q2: "परिवार के सदस्यों को कैसे जोड़ें?",
        faq_a2: "परिवार स्क्रीन पर जाएं, '+' आइकन या 'सदस्य जोड़ें' बटन पर टैप करें और उनकी बुनियादी जानकारी दर्ज करें.",
        faq_q3: "आपातकालीन पहुंच (Emergency Access) कैसे काम करती है?",
        faq_a3: "आपातकालीन पहुंच आपके द्वारा चुने गए संपर्कों को आपात स्थिति के दौरान आपकी चिकित्सा जानकारी देखने की अनुमति देती है.",
        faq_q4: "मेरा डेटा कितना सुरक्षित है?",
        faq_a4: "आपका डेटा AES-256 एन्क्रिप्शन के साथ सुरक्षित है. हम आपकी अनुमति के बिना आपकी जानकारी किसी तीसरे पक्ष के साथ साझा नहीं करते हैं.",
    },
    kn: {
        // Common
        home: "ಮನೆ",
        family: "ಕುಟುಂಬ",
        ai_assistant: "ಎಐ ಸಹಾಯಕ",
        settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
        profile: "ಪ್ರೊಫೈಲ್",
        documents: "ದಾಖಲೆಗಳು",
        reports: "ವರದಿಗಳು",
        logout: "ಲಾಗ್‌ಔಟ್",
        save: "ಉಳಿಸಿ",
        cancel: "ರದ್ದುಮಾಡಿ",
        done: "ಮುಗಿದಿದೆ",
        edit: "ಸಂಪಾದಿಸಿ",
        delete: "ಅಳಿಸಿ",
        share: "ಹಂಚಿಕೊಳ್ಳಿ",
        rename: "ಮರುಹೆಸರಿಸಿ",
        view: "ವೀಕ್ಷಿಸಿ",
        status: "ಸ್ಥಿತಿ",
        back: "ಹಿಂದೆ",
        you: "ನೀವು",
        error: "ದೋಷ",
        success: "ಯಶಸ್ಸು",
        upload_error: "ಅಪ್‌ಲೋಡ್ ದೋಷ",

        // Home
        emergency_access: "ತುರ್ತು ಪ್ರವೇಶ",
        family_updates: "ಕುಟುಂಬ ನವೀಕರಣಗಳು",
        read_more: "ಮತ್ತಷ್ಟು ಓದಿ...",
        show_less: "ಕಡಿಮೆ ತೋರಿಸಿ",
        no_updates: "ಇತ್ತೀಚಿನ ಯಾವುದೇ ನವೀಕರಣಗಳಿಲ್ಲ",
        greetings: "ನಮಸ್ಕಾರ",
        daily_task: "ನಿಮ್ಮ ಇಂದಿನ ವೈದ್ಯಕೀಯ ಕಾರ್ಯಗಳು",
        tagline: "ನಿಮ್ಮ ಕುಟುಂಬದ ಆರೋಗ್ಯ,\nಸಂಘಟಿತ ಮತ್ತು ಪ್ರವೇಶಿಸಬಹುದು.",

        // Login & SignUp
        login_title: "ನಿಮ್ಮ ಖಾತೆಗೆ ಲಾಗಿನ್ ಮಾಡಿ",
        login_subtitle: "ನಿಮ್ಮ ಖಾತೆಯನ್ನು ಪ್ರವೇಶಿಸಲು ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ",
        email: "ಇಮೇಲ್",
        password: "ಪಾಸ್‌ವರ್ಡ್",
        forgot_password: "ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿದ್ದೀರಾ?",
        no_account: "ಖಾತೆ ಇಲ್ಲವೇ?",
        create_account: "ಹೊಸ ಖಾತೆ ರಚಿಸಿ",
        signup_title: "ನಿಮ್ಮ ಖಾತೆಯನ್ನು ರಚಿಸಿ",
        signup_subtitle: "ಖಾತೆಯನ್ನು ರಚಿಸಲು ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ",
        name: "ಹೆಸರು",
        dob: "ಹುಟ್ಟಿದ ದಿನಾಂಕ",
        phone: "ಫೋನ್ ಸಂಖ್ಯೆ",
        confirm_password: "ಪಾಸ್‌ವರ್ಡ್ ಖಚಿತಪಡಿಸಿ",
        already_account: "ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ?",
        login_here: "ಇಲ್ಲಿ ಲಾಗಿನ್ ಮಾಡಿ",

        // Profile
        my_details: "ನನ್ನ ವಿವರಗಳು",
        age: "ವಯಸ್ಸು",
        gender: "ಲಿಂಗ",
        contact_number: "ಸಂಪರ್ಕ ಸಂಖ್ಯೆ",
        address: "ವಿಳಾಸ",
        blood_group: "ರಕ್ತ ಗುಂಪು",
        emergency_contact: "ತುರ್ತು ಸಂಪರ್ಕ",
        choose_avatar: "ಅವತಾರವನ್ನು ಆರಿಸಿ",
        pick_character: "ನಿಮ್ಮನ್ನು ಪ್ರತಿನಿಧಿಸುವ ಪಾತ್ರವನ್ನು ಆರಿಸಿ",
        select_avatar: "ಅವತಾರವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
        remove_photo: "ಫೋಟೋ ತೆಗೆದುಹಾಕಿ",

        // Family
        family_members: "ಕುಟುಂಬದ ಸದಸ್ಯರು",
        invite_friend: "ಇಮೇಲ್ ಮೂಲಕ ಆಹ್ವಾನಿಸಿ",
        enter_email: "ಕುಟುಂಬದ ಸದಸ್ಯರ ಇಮೇಲ್ ನಮೂದಿಸಿ",
        invite: "ಆಹ್ವಾನಿಸಿ",
        sent_invites: "ಕಳುಹಿಸಲಾದ ಆಹ್ವಾನಗಳು",
        received_invites: "ಸ್ವೀಕರಿಸಿದ ಆಹ್ವಾನಗಳು",
        no_members: "ಇನ್ನೂ ಯಾವುದೇ ಕುಟುಂಬ ಸದಸ್ಯರನ್ನು ಸೇರಿಸಿಲ್ಲ.",
        no_invites: "ಯಾವುದೇ ಬಾಕಿ ಇರುವ ಆಹ್ವಾನಗಳಿಲ್ಲ.",
        accept: "ಸ್ವೀಕರಿಸಿ",
        reject: "ತಿರಸ್ಕರಿಸಿ",
        family_invites: "ಕುಟುಂಬದ ಆಹ್ವಾನಗಳು",
        sent_to: "ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ",
        invited_you: "ತಮ್ಮ ಕುಟುಂಬ ಗುಂಪಿಗೆ ಸೇರಲು ನಿಮ್ಮನ್ನು ಆಹ್ವಾನಿಸಿದ್ದಾರೆ",
        waiting_acceptance: "ಅವರ ಸ್ವೀಕಾರಕ್ಕಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ...",
        cancel_request: "ವಿನಂತಿಯನ್ನು ರದ್ದುಮಾಡಿ",
        add_member: "ಸದಸ್ಯರನ್ನು ಸೇರಿಸಿ",
        remove_member: "ಕುಟುಂಬದ ಸದಸ್ಯರನ್ನು ತೆಗೆದುಹಾಕಿ",
        remove_member_confirm: "ಈ ಸದಸ್ಯರನ್ನು ತೆಗೆದುಹಾಕಲು ನೀವು ಖಚಿತವಾಗಿರುವಿರಾ?",
        no_pending_invites: "ಯಾವುದೇ ಬಾಕಿ ಇರುವ ಕುಟುಂಬ ಆಹ್ವಾನಗಳಿಲ್ಲ",
        empty_family_msg: "ನೀವು ಇನ್ನೂ ಯಾವುದೇ ಕುಟುಂಬ ಸದಸ್ಯರನ್ನು ಸೇರಿಸಿಲ್ಲ.",


        // Reports & Documents
        upload_report: "ವರದಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
        scan_report: "ವರದಿ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ",
        upload_doc: "ದಾಖಲೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
        report: "ವರದಿ",
        no_reports: "ಯಾವುದೇ ವರದಿಗಳು ಕಂಡುಬಂದಿಲ್ಲ",
        no_docs: "ಯಾವುದೇ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ",
        searching: "ಹುಡುಕಲಾಗುತ್ತಿದೆ...",
        searching_results: "ಹುಡುಕಾಟದ ಫಲಿತಾಂಶಗಳು",
        date: "ದಿನಾಂಕ",
        permission_camera: "ಕ್ಯಾಮೆರಾ ತೋರಿಸಲು ನಮಗೆ ನಿಮ್ಮ ಅನುಮತಿ ಬೇಕು",
        grant_permission: "ಅನುಮತಿ ನೀಡಿ",
        report_analysis: "ನಿಮ್ಮ ವರದಿ ವಿಶ್ಲೇಷಣೆ",
        report_summary: "ಒಟ್ಟಾರೆ ವರದಿ ಸಾರಾಂಶ",
        ai_suggestions: "ಎಐ ಸಲಹೆಗಳು",
        save_report: "ವರದಿ ಉಳಿಸಿ",
        enter_report_name: "ಸಂಘಟಿತವಾಗಿರಲು ದಯವಿಟ್ಟು ನಿಮ್ಮ ವರದಿಗೆ ಹೆಸರನ್ನು ನಮೂದಿಸಿ.",
        report_name_placeholder: "ಉದಾ. ರಕ್ತ ಪರೀಕ್ಷೆ - ಜನವರಿ",
        uploading: "ಅಪ್‌ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
        save_now: "ಈಗ ಉಳಿಸಿ",
        capture_instruction: "ವರದಿಯ ಸ್ಪಷ್ಟ ಚಿತ್ರವನ್ನು ಸೆರೆಹಿಡಿಯುವುದನ್ನು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ",
        finish: "ಮುಗಿಸಿ",

        // AI Assistant
        ask_anything: "ಏನನ್ನಾದರೂ ಕೇಳಿ...",
        link_file: "ಫೈಲ್ ಲಿಂಕ್ ಮಾಡಿ",
        bot_welcome: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಎಐ ಸಹಾಯಕ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
        analyzing: "ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...",
        analyzing_file: "ಫೈಲ್ ಸ್ವೀಕರಿಸಲಾಗಿದೆ. ನಿಮಗಾಗಿ ವಿಶ್ಲೇಷಿಸಲು ನನಗೆ ಅವಕಾಶ ನೀಡಿ...",
        reports_title_me: "ನಿಮ್ಮ ಉಳಿಸಿದ ವರದಿಗಳು",
        reports_title_other: " ರ ವರದಿಗಳು",
        docs_subtitle_me: "ನಿಮ್ಮ ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾದ ವೈದ್ಯಕೀಯ ದಾಖಲೆಗಳು",
        docs_subtitle_other: " ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾದ ವೈದ್ಯಕೀಯ ದಾಖಲೆಗಳು",
        docs_title_other: " ರ ದಾಖಲೆಗಳು",
        docs_title_me: "ನನ್ನ ದಾಖಲೆಗಳು",

        sort_newest: "ಇತ್ತೀಚಿನವು ಮೊದಲು",
        sort_oldest: "ಹಳೆಯವು ಮೊದಲು",
        uploaded_on: "ಅಂದು ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾಗಿದೆ",
        empty_reports_msg: "ನೀವು ಇನ್ನೂ ಯಾವುದೇ ವರದಿಗಳನ್ನು ಸೇರಿಸಿಲ್ಲ.",
        empty_docs_msg: "ನೀವು ಇನ್ನೂ ಯಾವುದೇ ದಾಖಲೆಗಳನ್ನು ಸೇರಿಸಿಲ್ಲ.",
        rename_report: "ವರದಿ ಮರುಹೆಸರಿಸಿ",
        delete_report: "ವರದಿ ಅಳಿಸಿ",
        delete_report_confirm: "ಈ ವರದಿಯನ್ನು ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿರುವಿರಾ?",
        rename_doc: "ದಾಖಲೆ ಮರುಹೆಸರಿಸಿ",
        delete_doc: "ದಾಖಲೆ ಅಳಿಸಿ",
        delete_doc_confirm: "ಈ ದಾಖಲೆಯನ್ನು ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿರುವಿರಾ?",

        // Settings
        account: "ಖಾತೆ",
        preferences: "ಆದ್ಯತೆಗಳು",
        security: "ಭದ್ರತೆ",
        edit_profile: "ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ",
        change_password: "ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಯಿಸಿ",
        notifications: "ಅಧಿಸೂಚನೆಗಳು",
        app_theme: "ಅಪ್ಲಿಕೇಶನ್ ಥೀಮ್",
        language: "ಭಾಷೆ",
        choose_language: "ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
        good_morning: "ಶುಭೋದಯ",
        good_afternoon: "ಶುಭ ಮಧ್ಯಾಹ್ನ",
        good_evening: "ಶುಭ ಸಂಜೆ",
        good_night: "ಶುಭ ರಾತ್ರಿ",
        years: "ವರ್ಷಗಳು",
        loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
        no_phone: "ಫೋನ್ ಇಲ್ಲ",
        understand_report: "ನಿಮ್ಮ ವರದಿಯನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಬಯಸುವಿರಾ?",
        or: "ಅಥವಾ",
        scan: "ಸ್ಕ್ಯಾನ್",
        upload: "ಅಪ್‌ಲೋಡ್",
        male: "ಪುರುಷ",
        female: "ಮಹಿಳೆ",
        other: "ಇತರ",
        good_health: "ಆರೋಗ್ಯವಾಗಿರಿ!",
        login_btn: "ಲಾಗಿನ್",
        signup_btn: "ಸೈನ್ ಅಪ್",
        app_lock: "ಅಪ್ಲಿಕೇಶನ್ ಲಾಕ್",
        theme: "ಅಪ್ಲಿಕೇಶನ್ ಥೀಮ್",
        light: "ಲೈಟ್",
        dark: "ಡಾರ್ಕ್",
        system: "ಸಿಸ್ಟಮ್ ಡಿಫಾಲ್ಟ್",
        choose_theme: "ಥೀಮ್ ಆರಿಸಿ",

        // Contact Us
        about: "ಬಗ್ಗೆ",
        contact_us: "ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ",
        email_support: "ಇಮೇಲ್ ಬೆಂಬಲ",
        call_us: "ನಮಗೆ ಕರೆ ಮಾಡಿ",
        chat_support: "ಚಾಟ್ ಬೆಂಬಲ",
        send_message_title: "ನಮಗೆ ಸಂದೇಶ ಕಳುಹಿಸಿ",
        your_name: "ನಿಮ್ಮ ಹೆಸರು",
        your_email: "ನಿಮ್ಮ ಇಮೇಲ್",
        your_message: "ನಿಮ್ಮ ಸಂದೇಶ",
        send_message: "ಸಂದೇಶ ಕಳುಹಿಸಿ",
        sending: "ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...",
        msg_sent_success: "ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಕಳುಹಿಸಲಾಗಿದೆ!",
        fill_all_fields: "ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಫೀಲ್ಡ್‌ಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ",

        // Help & Policy
        help_policy: "ಸಹಾಯ ಮತ್ತು ನೀತಿ",
        help: "ಸಹಾಯ",
        policy: "ನೀತಿ",
        terms_conditions: "ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳು",
        feedback: "ಪ್ರತಿಕ್ರಿಯೆ",
        rate_carevia: "ಕೇರ್‌ವಿಯಾವನ್ನು ರೇಟ್ ಮಾಡಿ",
        send_feedback: "ಪ್ರತಿಕ್ರಿಯೆ ಕಳುಹಿಸಿ",
        last_updated: "ಕೊನೆಯದಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ",

        // About
        about_carevia: "ಕೇರ್‌ವಿಯಾ ಬಗ್ಗೆ",
        our_mission: "ನಮ್ಮ ಉದ್ದೇಶ",
        mission_text: "ಕೇರ್‌ವಿಯಾ ಕುಟುಂಬಗಳಿಗೆ ವೈದ್ಯಕೀಯ ದಾಖಲೆಗಳನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಸಂಗ್ರಹಿಸಲು, ನಿರ್ವಹಿಸಲು ಮತ್ತು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ — ಎಲ್ಲಿಯಾದರೂ, ಯಾವಾಗಲಾದರೂ.",
        why_carevia: "ಕೇರ್‌ವಿಯ ಏಕೆ",
        emergency_access_feat: "ತುರ್ತು ಪ್ರವೇಶ",
        family_health_tracking: "ಕುಟುಂಬ-ವಾರು ಆರೋಗ್ಯ ಟ್ರ್ಯಾಕಿಂಗ್",
        secure_storage: "ಸುರಕ್ಷಿತ ದಾಖಲೆ ಸಂಗ್ರಹಣೆ",
        version: "ಆವೃತ್ತಿ",
        app_version: "ಅಪ್ಲಿಕೇಶನ್ ಆವೃತ್ತಿ",

        // FAQs
        faq_q1: "ವರದಿಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡುವುದು ಹೇಗೆ?",
        faq_a1: "ಹೋಮ್ ಸ್ಕ್ರೀನ್‌ಗೆ ಹೋಗಿ, 'ವರದಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ' ಮೇಲೆ ಟ್ಯಾಪ್ ಮಾಡಿ, ಗ್ಯಾಲರಿಯಿಂದ ನಿಮ್ಮ ದಾಖಲೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ ನಮ್ಮ ಸ್ಕ್ಯಾನರ್ ಬಳಸಿ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ.",
        faq_q2: "ಕುಟುಂಬದ ಸದಸ್ಯರನ್ನು ಸೇರಿಸುವುದು ಹೇಗೆ?",
        faq_a2: "ಕುಟುಂಬ ಸ್ಕ್ರೀನ್‌ಗೆ ಹೋಗಿ, '+' ಐಕಾನ್ ಅಥವಾ 'ಸದಸ್ಯರನ್ನು ಸೇರಿಸಿ' ಬಟನ್ ಮೇಲೆ ಟ್ಯಾಪ್ ಮಾಡಿ ಮತ್ತು ಅವರ ಮೂಲ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ.",
        faq_q3: "ತುರ್ತು ಪ್ರವೇಶ ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ?",
        faq_a3: "ತುರ್ತು ಪ್ರವೇಶವು ತುರ್ತು ಸಂದರ್ಭದಲ್ಲಿ ನಿಮ್ಮ ಫೋನ್ ಅನ್ನು ಅನ್ಲಾಕ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗದಿದ್ದರೂ ಸಹ ನಿಮ್ಮ ಪ್ರಮುಖ ವೈದ್ಯಕೀಯ ಮಾಹಿತಿಯನ್ನು ನೋಡಲು ನಿಯೋಜಿತ ಸಂಪರ್ಕಗಳಿಗೆ ಅನುಮತಿಸುತ್ತದೆ.",
        faq_q4: "ನನ್ನ ಡೇಟಾ ಎಷ್ಟು ಸುರಕ್ಷಿತವಾಗಿದೆ?",
        faq_a4: "ನಿಮ್ಮ ಡೇಟಾವನ್ನು ಸುಧಾರಿತ ಎನ್‌ಕ್ರಿಪ್ಶನ್‌ನೊಂದಿಗೆ ಸುರಕ್ಷಿತಗೊಳಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ಅನುಮತಿಯಿಲ್ಲದೆ ನಾವು ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ಯಾವುದೇ ಮೂರನೇ ವ್ಯಕ್ತಿಯೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳುವುದಿಲ್ಲ.",
    },
    pa: {
        // Common
        home: "ਹੋਮ",
        family: "ਪਰਿਵਾਰ",
        ai_assistant: "ਏਆਈ ਸਹਾਇਕ",
        settings: "ਸੈਟਿੰਗਾਂ",
        profile: "ਪ੍ਰੋਫਾਈਲ",
        documents: "ਦਸਤਾਵੇਜ਼",
        reports: "ਰਿਪੋਰਟਾਂ",
        logout: "ਲੌਗਆਉਟ",
        save: "ਸੇਵ ਕਰੋ",
        cancel: "ਰੱਦ ਕਰੋ",
        done: "ਹੋ ਗਿਆ",
        edit: "ਸੰਪਾਦਿਤ ਕਰੋ",
        delete: "ਮਿਟਾਓ",
        share: "ਸਾਂਝਾ ਕਰੋ",
        rename: "ਨਾਂ ਬਦਲੋ",
        view: "ਵੇਖੋ",
        status: "ਸਥਿਤੀ",
        back: "ਪਿੱਛੇ",
        you: "ਤੁਸੀਂ",
        error: "ਗਲਤੀ",
        success: "ਸਫਲਤਾ",
        upload_error: "ਅਪਲੋਡ ਗਲਤੀ",

        // Home
        emergency_access: "ਐਮਰਜੈਂਸੀ ਪਹੁੰਚ",
        family_updates: "ਪਰਿਵਾਰਕ ਅਪਡੇਟਸ",
        read_more: "ਹੋਰ ਪੜ੍ਹੋ...",
        show_less: "ਘੱਟ ਦਿਖਾਓ",
        no_updates: "ਕੋਈ ਤਾਜ਼ਾ ਪਰਿਵਾਰਕ ਅਪਡੇਟ ਨਹੀਂ",
        greetings: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ",
        daily_task: "ਅੱਜ ਦੇ ਤੁਹਾਡੇ ਡਾਕਟਰੀ ਕੰਮ",
        tagline: "ਤੁਹਾਡੇ ਪਰਿਵਾਰ ਦੀ ਸਿਹਤ,\nਸੰਗਠਿਤ ਅਤੇ ਪਹੁੰਚਯੋਗ।",

        // Login & SignUp
        login_title: "ਆਪਣੇ ਖਾਤੇ ਵਿੱਚ ਲੋਗਇਨ ਕਰੋ",
        login_subtitle: "ਆਪਣੇ ਖਾਤੇ ਤੱਕ ਪਹੁੰਚਣ ਲਈ ਵੇਰਵੇ ਦਰਜ ਕਰੋ",
        email: "ਈਮੇਲ",
        password: "ਪਾਸਵਰਡ",
        forgot_password: "ਪਾਸਵਰਡ ਭੁੱਲ ਗਏ?",
        no_account: "ਖਾਤਾ ਨਹੀਂ ਹੈ?",
        create_account: "ਨਵਾਂ ਖਾਤਾ ਬਣਾਓ",
        signup_title: "ਆਪਣਾ ਖਾਤਾ ਬਣਾਓ",
        signup_subtitle: "ਖਾਤਾ ਬਣਾਉਣ ਲਈ ਵੇਰਵੇ ਦਰਜ ਕਰੋ",
        name: "ਨਾਂ",
        dob: "ਜਨਮ ਮਿਤੀ",
        phone: "ਫੋਨ ਨੰਬਰ",
        confirm_password: "ਪਾਸਵਰਡ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ",
        already_account: "ਪਹਿਲਾਂ ਹੀ ਖਾਤਾ ਹੈ?",
        login_here: "ਇੱਥੇ ਲੋਗਇਨ ਕਰੋ",

        // Profile
        my_details: "ਮੇਰੇ ਵੇਰਵੇ",
        age: "ਉਮਰ",
        gender: "ਲਿੰਗ",
        contact_number: "ਸੰਪਰਕ ਨੰਬਰ",
        address: "ਪਤਾ",
        blood_group: "ਬਲੱਡ ਗਰੁੱਪ",
        emergency_contact: "ਐਮਰਜੈਂਸੀ ਸੰਪਰਕ",
        choose_avatar: "ਅਵਤਾਰ ਚੁਣੋ",
        pick_character: "ਇੱਕ ਅਜਿਹਾ ਪਾਤਰ ਚੁਣੋ ਜੋ ਤੁਹਾਡੀ ਪ੍ਰਤੀਨਿਧਤਾ ਕਰਦਾ ਹੋਵੇ",
        select_avatar: "ਅਵਤਾਰ ਚੁਣੋ",
        remove_photo: "ਫੋਟੋ ਹਟਾਓ",

        // Family
        family_members: "ਪਰਿਵਾਰ ਦੇ ਮੈਂਬਰ",
        invite_friend: "ਈਮੇਲ ਰਾਹੀਂ ਸੱਦਾ ਭੇਜੋ",
        enter_email: "ਪਰਿਵਾਰਕ ਮੈਂਬਰ ਦੀ ਈਮੇਲ ਦਰਜ ਕਰੋ",
        invite: "ਸੱਦਾ ਦਿਓ",
        sent_invites: "ਭੇਜੇ ਗਏ ਸੱਦੇ",
        received_invites: "ਪ੍ਰਾਪਤ ਹੋਏ ਸੱਦੇ",
        no_members: "ਅਜੇ ਤੱਕ ਕੋਈ ਪਰਿਵਾਰਕ ਮੈਂਬਰ ਨਹੀਂ ਜੋੜਿਆ ਗਿਆ।",
        no_invites: "ਕੋਈ ਲੰਬਿਤ ਸੱਦਾ ਨਹੀਂ।",
        accept: "ਸਵੀਕਾਰ ਕਰੋ",
        reject: "ਰੱਦ ਕਰੋ",
        family_invites: "ਪਰਿਵਾਰਕ ਸੱਦੇ",
        sent_to: "ਨੂੰ ਭੇਜਿਆ ਗਿਆ",
        invited_you: "ਨੇ ਤੁਹਾਨੂੰ ਆਪਣੇ ਪਰਿਵਾਰਕ ਸਮੂਹ ਵਿੱਚ ਸ਼ਾਮਲ ਹੋਣ ਲਈ ਸੱਦਾ ਦਿੱਤਾ ਹੈ",
        waiting_acceptance: "ਉਨ੍ਹਾਂ ਦੀ ਸਵੀਕ੍ਰਿਤੀ ਦੀ ਉਡੀਕ ਕੀਤੀ ਜਾ ਰਹੀ ਹੈ...",
        cancel_request: "ਬੇਨਤੀ ਰੱਦ ਕਰੋ",
        add_member: "ਮੈਂਬਰ ਜੋੜੋ",
        remove_member: "ਪਰਿਵਾਰਕ ਮੈਂਬਰ ਹਟਾਓ",
        remove_member_confirm: "ਕੀ ਤੁਸੀਂ ਯਕੀਨੀ ਤੌਰ 'ਤੇ ਇਸ ਮੈਂਬਰ ਨੂੰ ਹਟਾਉਣਾ ਚਾਹੁੰਦੇ ਹੋ?",
        no_pending_invites: "ਕੋਈ ਲੰਬਿਤ ਪਰਿਵਾਰਕ ਸੱਦਾ ਨਹੀਂ",
        empty_family_msg: "ਤੁਸੀਂ ਅਜੇ ਤੱਕ ਕੋਈ ਪਰਿਵਾਰਕ ਮੈਂਬਰ ਨਹੀਂ ਜੋੜਿਆ ਹੈ।",


        // Reports & Documents
        upload_report: "ਰਿਪੋਰਟ ਅਪਲੋਡ ਕਰੋ",
        scan_report: "ਰਿਪੋਰਟ ਸਕੈਨ ਕਰੋ",
        upload_doc: "ਦਸਤਾਵੇਜ਼ ਅਪਲੋਡ ਕਰੋ",
        report: "ਰਿਪੋਰਟ",
        no_reports: "ਕੋਈ ਰਿਪੋਰਟ ਨਹੀਂ ਮਿਲੀ",
        no_docs: "ਕੋਈ ਦਸਤਾਵੇਜ਼ ਨਹੀਂ ਮਿਲਿਆ",
        searching: "ਖੋਜ ਕੀਤੀ ਜਾ ਰਹੀ ਹੈ...",
        searching_results: "ਖੋਜ ਨਤੀਜੇ",
        date: "ਮਿਤੀ",
        permission_camera: "ਸਾਨੂੰ ਕੈਮਰਾ ਦਿਖਾਉਣ ਲਈ ਤੁਹਾਡੀ ਇਜਾਜ਼ਤ ਚਾਹੀਦੀ ਹੈ",
        grant_permission: "ਇਜਾਜ਼ਤ ਦਿਓ",
        report_analysis: "ਤੁਹਾਡੀ ਰਿਪੋਰਟ ਦਾ ਵਿਸ਼ਲੇਸ਼ਣ",
        report_summary: "ਸਮੁੱਚੀ ਰਿਪੋਰਟ ਦਾ ਸਾਰ",
        ai_suggestions: "ਏਆਈ ਸੁਝਾਅ",
        save_report: "ਰਿਪੋਰਟ ਸੇਵ ਕਰੋ",
        enter_report_name: "ਸੰਗਠਿਤ ਰਹਿਣ ਲਈ ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ ਰਿਪੋਰਟ ਲਈ ਇੱਕ ਨਾਂ ਦਰਜ ਕਰੋ।",
        report_name_placeholder: "ਉਦਾਹਰਨ ਲਈ: ਬਲੱਡ ਟੈਸਟ - ਜਨਵਰੀ",
        uploading: "ਅਪਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...",
        save_now: "ਹੁਣੇ ਸੇਵ ਕਰੋ",
        capture_instruction: "ਯਕੀਨੀ ਬਣਾਓ ਕਿ ਰਿਪੋਰਟ ਦੀ ਸਾਫ਼ ਤਸਵੀਰ ਲਈ ਗਈ ਹੈ",
        finish: "ਸਮਾਪਤ",

        // AI Assistant
        ask_anything: "ਕੁਝ ਵੀ ਪੁੱਛੋ...",
        link_file: "ਫਾਈਲ ਲਿੰਕ ਕਰੋ",
        bot_welcome: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ ਏਆਈ ਸਹਾਇਕ ਹਾਂ। ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?",
        analyzing: "ਮੈਂ ਤੁਹਾਡੀ ਬੇਨਤੀ ਦਾ ਵਿਸ਼ਲੇਸ਼ਣ ਕਰ ਰਿਹਾ ਹਾਂ...",
        analyzing_file: "ਮੈਨੂੰ ਫਾਈਲ ਮਿਲ ਗਈ ਹੈ। ਮੈਨੂੰ ਤੁਹਾਡੇ ਲਈ ਇਸਦਾ ਵਿਸ਼ਲੇਸ਼ਣ ਕਰਨ ਦਿਓ...",
        reports_title_me: "ਤੁਹਾਡੀਆਂ ਸੇਵ ਕੀਤੀਆਂ ਰਿਪੋਰਟਾਂ",
        reports_title_other: " ਦੀਆਂ ਰਿਪੋਰਟਾਂ",
        docs_subtitle_me: "ਤੁਹਾਡੇ ਅਪਲੋਡ ਕੀਤੇ ਡਾਕਟਰੀ ਦਸਤਾਵੇਜ਼",
        docs_subtitle_other: " ਅਪਲੋਡ ਕੀਤੇ ਡਾਕਟਰੀ ਦਸਤਾਵੇਜ਼",
        docs_title_other: " ਦੇ ਦਸਤਾਵੇਜ਼",
        docs_title_me: "ਮੇਰੇ ਦਸਤਾਵੇਜ਼",

        sort_newest: "ਸਭ ਤੋਂ ਨਵੇਂ ਪਹਿਲਾਂ",
        sort_oldest: "ਸਭ ਤੋਂ ਪੁਰਾਣੇ ਪਹਿਲਾਂ",
        uploaded_on: "ਨੂੰ ਅਪਲੋਡ ਕੀਤਾ ਗਿਆ",
        empty_reports_msg: "ਤੁਸੀਂ ਅਜੇ ਤੱਕ ਕੋਈ ਰਿਪੋਰਟ ਨਹੀਂ ਜੋੜੀ ਹੈ।",
        empty_docs_msg: "ਤੁਸੀਂ ਅਜੇ ਤੱਕ ਕੋਈ ਦਸਤਾਵੇਜ਼ ਨਹੀਂ ਜੋੜਿਆ ਹੈ।",
        rename_report: "ਰਿਪੋਰਟ ਦਾ ਨਾਂ ਬਦਲੋ",
        delete_report: "ਰਿਪੋਰਟ ਮਿਟਾਓ",
        delete_report_confirm: "ਕੀ ਤੁਸੀਂ ਯਕੀਨੀ ਤੌਰ 'ਤੇ ਇਸ ਰਿਪੋਰਟ ਨੂੰ ਮਿਟਾਉਣਾ ਚਾਹੁੰਦੇ ਹੋ?",
        rename_doc: "ਦਸਤਾਵੇਜ਼ ਦਾ ਨਾਂ ਬਦਲੋ",
        delete_doc: "ਦਸਤਾਵੇਜ਼ ਮਿਟਾਓ",
        delete_doc_confirm: "ਕੀ ਤੁਸੀਂ ਯਕੀਨੀ ਤੌਰ 'ਤੇ ਇਸ ਦਸਤਾਵੇਜ਼ ਨੂੰ ਮਿਟਾਉਣਾ ਚਾਹੁੰਦੇ ਹੋ?",

        // Settings
        account: "ਖਾਤਾ",
        preferences: "ਤਰਜੀਹਾਂ",
        security: "ਸੁਰੱਖਿਆ",
        edit_profile: "ਪ੍ਰੋਫਾਈਲ ਸੰਪਾਦਿਤ ਕਰੋ",
        change_password: "ਪਾਸਵਰਡ ਬਦਲੋ",
        notifications: "ਸੂਚਨਾਵਾਂ",
        app_theme: "ਐਪ ਥੀਮ",
        language: "ਭਾਸ਼ਾ",
        choose_language: "ਭਾਸ਼ਾ ਚੁਣੋ",
        good_morning: "ਸ਼ੁਭ ਸਵੇਰ",
        good_afternoon: "ਸ਼ੁਭ ਦੁਪਹਿਰ",
        good_evening: "ਸ਼ੁਭ ਸ਼ਾਮ",
        good_night: "ਸ਼ੁਭ ਰਾਤ",
        years: "ਸਾਲ",
        loading: "ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...",
        no_phone: "ਕੋਈ ਫੋਨ ਨਹੀਂ",
        understand_report: "ਕੀ ਤੁਸੀਂ ਆਪਣੀ ਰਿਪੋਰਟ ਨੂੰ ਸਮਝਣਾ ਚਾਹੁੰਦੇ ਹੋ?",
        or: "ਜਾਂ",
        scan: "ਸਕੈਨ",
        upload: "ਅਪਲੋਡ",
        male: "ਮਰਦ",
        female: "ਔਰਤ",
        other: "ਹੋਰ",
        good_health: "ਸਿਹਤਮੰਦ ਰਹੋ!",
        login_btn: "ਲੋਗਇਨ",
        signup_btn: "ਸਾਈਨ ਅਪ",
        app_lock: "ਐਪ ਲੌਕ",
        theme: "ਐਪ ਥੀਮ",
        light: "ਲਾਈਟ",
        dark: "ਡਾਰਕ",
        system: "ਸਿਸਟਮ ਡਿਫਾਲਟ",
        choose_theme: "ਥੀਮ ਚੁਣੋ",

        // Contact Us
        about: "ਬਾਰੇ",
        contact_us: "ਸਾਡੇ ਨਾਲ ਸੰਪਰਕ ਕਰੋ",
        email_support: "ਈਮੇਲ ਸਹਾਇਤਾ",
        call_us: "ਸਾਨੂੰ ਕਾਲ ਕਰੋ",
        chat_support: "ਚੈਟ ਸਹਾਇਤਾ",
        send_message_title: "ਸਾਨੂੰ ਸੁਨੇਹਾ ਭੇਜੋ",
        your_name: "ਤੁਹਾਡਾ ਨਾਂ",
        your_email: "ਤੁਹਾਡੀ ਈਮੇਲ",
        your_message: "ਤੁਹਾਡਾ ਸੁਨੇਹਾ",
        send_message: "ਸੁਨੇਹਾ ਭੇਜੋ",
        sending: "ਭੇਜਿਆ ਜਾ ਰਹਾ ਹੈ...",
        msg_sent_success: "ਤੁਹਾਡਾ ਸੁਨੇਹਾ ਭੇਜਿਆ ਗਿਆ ਹੈ!",
        fill_all_fields: "ਕਿਰਪਾ ਕਰਕੇ ਸਾਰੇ ਖੇਤਰ ਭਰੋ",

        // Help & Policy
        help_policy: "ਸਹਾਇਤਾ ਅਤੇ ਨੀਤੀ",
        help: "ਸਹਾਇਤਾ",
        policy: "ਨੀਤੀ",
        terms_conditions: "ਨਿਯਮ ਅਤੇ ਸ਼ਰਤਾਂ",
        feedback: "ਫੀਡਬੈਕ",
        rate_carevia: "ਕੀਅਰਵਧੀਆ (Carevia) ਨੂੰ ਰੇਟ ਕਰੋ",
        send_feedback: "ਫੀਡਬੈਕ ਭੇਜੋ",
        last_updated: "ਆਖਰੀ ਵਾਰ ਅਪਡੇਟ ਕੀਤਾ ਗਿਆ",

        // About
        about_carevia: "ਕੀਅਰਵਧੀਆ (Carevia) ਬਾਰੇ",
        our_mission: "ਸਾਡਾ ਉਦੇਸ਼",
        mission_text: "ਕੀਅਰਵਧੀਆ ਪਰਿਵਾਰਾਂ ਨੂੰ ਡਾਕਟਰੀ ਰਿਕਾਰਡ ਸੁਰੱਖਿਅਤ ਢੰਗ ਨਾਲ ਸਟੋਰ ਕਰਨ, ਪ੍ਰਬੰਧਿਤ ਕਰਨ ਅਤੇ ਸਮਝਣ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ — ਕਦੇ ਵੀ, ਕਿਤੇ ਵੀ।",
        why_carevia: "ਕੀਅਰਵਧੀਆ ਕਿਉਂ",
        emergency_access_feat: "ਐਮਰਜੈਂਸੀ ਪਹੁੰਚ",
        family_health_tracking: "ਪਰਿਵਾਰ ਅਨੁਸਾਰ ਸਿਹਤ ਟ੍ਰੈਕਿੰਗ",
        secure_storage: "ਸੁਰੱਖਿਅਤ ਦਸਤਾਵੇਜ਼ ਸਟੋਰੇਜ",
        version: "ਵਰਜ਼ਨ",
        app_version: "ਐਪ ਵਰਜ਼ਨ",

        // FAQs
        faq_q1: "ਰਿਪੋਰਟਾਂ ਨੂੰ ਕਿਵੇਂ ਅਪਲੋਡ ਕਰਨਾ ਹੈ?",
        faq_a1: "ਹੋਮ ਸਕ੍ਰੀਨ 'ਤੇ ਜਾਓ, 'ਰਿਪੋਰਟ ਅਪਲੋਡ ਕਰੋ' 'ਤੇ ਟੈਪ ਕਰੋ, ਆਪਣੀ ਗੈਲਰੀ ਤੋਂ ਆਪਣੇ ਦਸਤਾਵੇਜ਼ ਦੀ ਚੋਣ ਕਰੋ ਜਾਂ ਸਾਡੇ ਮੈਡੀਕਲ ਸਕੈਨਰ ਦੀ ਵਰਤੋਂ ਕਰਕੇ ਇਸਨੂੰ ਸਕੈਨ ਕਰੋ।",
        faq_q2: "ਪਰਿਵਾਰਕ ਮੈਂਬਰਾਂ ਨੂੰ ਕਿਵੇਂ ਜੋੜਨਾ ਹੈ?",
        faq_a2: "ਪਰਿਵਾਰਕ ਸਕ੍ਰੀਨ 'ਤੇ ਜਾਓ, '+' ਆਈਕਨ ਜਾਂ 'ਮੈਂਬਰ ਜੋੜੋ' ਬਟਨ 'ਤੇ ਟੈਪ ਕਰੋ, ਅਤੇ ਟ੍ਰੈਕਿੰਗ ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਉਨ੍ਹਾਂ ਦੇ ਬੁਨਿਆਦੀ ਵੇਰਵੇ ਦਰਜ ਕਰੋ।",
        faq_q3: "ਐਮਰਜੈਂਸੀ ਪਹੁੰਚ ਕਿਵੇਂ ਕੰਮ ਕਰਦੀ ਹੈ?",
        faq_a3: "ਐਮਰਜੈਂਸੀ ਪਹੁੰਚ ਨਿਰਧਾਰਤ ਸੰਪਰਕਾਂ ਨੂੰ ਐਮਰਜੈਂਸੀ ਦੌਰਾਨ ਤੁਹਾਡੀ ਮਹੱਤਵਪੂਰਣ ਡਾਕਟਰੀ ਜਾਣਕਾਰੀ ਵੇਖਣ ਦੀ ਆਗਿਆ ਦਿੰਦੀ ਹੈ, ਭਾਵੇਂ ਤੁਸੀਂ ਆਪਣਾ ਫੋਨ ਅਨਲੌਕ ਨਾ ਕਰ ਸਕੋ।",
        faq_q4: "ਮੇਰਾ ਡੇਟਾ ਕਿੰਨਾ ਸੁਰੱਖਿਅਤ ਹੈ?",
        faq_a4: "ਤੁਹਾਡਾ ਡੇਟਾ ਐਡਵਾਂਸਡ ਐਨਕ੍ਰਿਪਸ਼ਨ ਨਾਲ ਸੁਰੱਖਿਅਤ ਹੈ। ਅਸੀਂ ਤੁਹਾਡੀ ਇਜਾਜ਼ਤ ਤੋਂ ਬਿਨਾਂ ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ ਕਿਸੇ ਤੀਜੀ ਧਿਰ ਨਾਲ ਸਾਂਝੀ ਨਹੀਂ ਕਰਦੇ।",
    },
    ta: {
        // Common
        home: "முகப்பு",
        family: "குடும்பம்",
        ai_assistant: "AI உதவியாளர்",
        settings: "அமைப்புகள்",
        profile: "சுயவிவரம்",
        documents: "ஆவணங்கள்",
        reports: "அறிக்கைகள்",
        logout: "வெளியேறு",
        save: "சேமி",
        cancel: "ரத்து செய்",
        done: "முடிந்தது",
        edit: "திருத்து",
        delete: "நீக்கு",
        share: "பகிர்",
        rename: "பெயர் மாற்று",
        view: "காண்",
        status: "நிலை",
        back: "பின்னால்",
        you: "நீங்கள்",
        error: "பிழை",
        success: "வெற்றி",
        upload_error: "பதிவேற்ற பிழை",

        // Home
        emergency_access: "அவசரக்கால அணுகல்",
        family_updates: "குடும்பத் தகவல்கள்",
        read_more: "மேலும் படிக்க...",
        show_less: "குறைவாகக் காட்டு",
        no_updates: "சமீபத்திய புதுப்பிப்புகள் எதுவுமில்லை",
        greetings: "வணக்கம்",
        daily_task: "இன்று நீங்கள் செய்ய வேண்டிய மருத்துவப் பணிகள்",
        tagline: "உங்கள் குடும்பத்தின் ஆரோக்கியம்,\nஒழுங்கமைக்கப்பட்டது மற்றும் எளிதில் அணுகக்கூடியது.",

        // Login & SignUp
        login_title: "உங்கள் கணக்கில் நுழையுங்கள்",
        login_subtitle: "உங்கள் கணக்கை அணுக விவரங்களை உள்ளிடவும்",
        email: "மின்னஞ்சல்",
        password: "கடவுச்சொல்",
        forgot_password: "கடவுச்சொல்லை மறந்துவிட்டீர்களா?",
        no_account: "கணக்கு இல்லையா?",
        create_account: "புதிய கணக்கை உருவாக்கு",
        signup_title: "உங்கள் கணக்கை உருவாக்குங்கள்",
        signup_subtitle: "கணக்கை உருவாக்க விவரங்களை உள்ளிடவும்",
        name: "பெயர்",
        dob: "பிறந்த தேதி",
        phone: "தொலைபேசி எண்",
        confirm_password: "கடவுச்சொல்லை உறுதிப்படுத்தவும்",
        already_account: "ஏற்கனவே கணக்கு உள்ளதா?",
        login_here: "இங்கே நுழையவும்",

        // Profile
        my_details: "எனது விவரங்கள்",
        age: "வயது",
        gender: "பாலினம்",
        contact_number: "தொடர்பு எண்",
        address: "முகவரி",
        blood_group: "இரத்த வகை",
        emergency_contact: "அவசரக்கால தொடர்பு",
        choose_avatar: "அவதாரைத் தேர்ந்தெடுக்கவும்",
        pick_character: "உங்களைப் பிரதிபலிக்கும் ஒரு கதாபாத்திரத்தைத் தேர்ந்தெடுக்கவும்",
        select_avatar: "அவதாரைத் தேர்ந்தெடு",
        remove_photo: "புகைப்படத்தை நீக்கு",

        // Family
        family_members: "குடும்ப உறுப்பினர்கள்",
        invite_friend: "மின்னஞ்சல் மூலம் அழைக்கவும்",
        enter_email: "குடும்ப உறுப்பினரின் மின்னஞ்சலை உள்ளிடவும்",
        invite: "அழைப்பு விடு",
        sent_invites: "அனுப்பப்பட்ட அழைப்புகள்",
        received_invites: "பெறப்பட்ட அழைப்புகள்",
        no_members: "இன்னும் குடும்ப உறுப்பினர்கள் யாரும் சேர்க்கப்படவில்லை.",
        no_invites: "நிலுவையில் உள்ள அழைப்புகள் எதுவுமில்லை.",
        accept: "ஏற்றுக்கொள்",
        reject: "நிராகரி",
        family_invites: "குடும்ப அழைப்புகள்",
        sent_to: "க்கு அனுப்பப்பட்டது",
        invited_you: "தங்கள் குடும்பக் குழுவில் சேர உங்களை அழைத்துள்ளார்",
        waiting_acceptance: "அவர்களின் ஏற்புக்காகக் காத்திருக்கிறது...",
        cancel_request: "கோரிக்கையை ரத்து செய்",
        add_member: "உறுப்பினரைச் சேர்",
        remove_member: "குடும்ப உறுப்பினரை நீக்கு",
        remove_member_confirm: "நிச்சயமாக இந்த உறுப்பினரை நீக்க விரும்புகிறீர்களா?",
        no_pending_invites: "நிலுவையில் உள்ள குடும்ப அழைப்புகள் எதுவுமில்லை",
        empty_family_msg: "நீங்கள் இன்னும் குடும்ப உறுப்பினர்கள் யாரையும் சேர்க்கவில்லை.",


        // Reports & Documents
        upload_report: "அறிக்கையைப் பதிவேற்று",
        scan_report: "அறிக்கையை ஸ்கேன் செய்",
        upload_doc: "ஆவணத்தைப் பதிவேற்று",
        report: "அறிக்கை",
        no_reports: "அறிக்கைகள் எதுவும் இல்லை",
        no_docs: "ஆவணங்கள் எதுவும் இல்லை",
        searching: "தேடுகிறது...",
        searching_results: "தேடல் முடிவுகள்",
        date: "தேதி",
        permission_camera: "கேமராவைப் பயன்படுத்த உங்கள் அனுமதி தேவை",
        grant_permission: "அனுமதி வழங்கு",
        report_analysis: "உங்கள் அறிக்கை பகுப்பாய்வு",
        report_summary: "ஒட்டுமொத்த அறிக்கை சுருக்கம்",
        ai_suggestions: "AI பரிந்துரைகள்",
        save_report: "அறிக்கையைச் சேமி",
        enter_report_name: "ஒழுங்காக இருக்க உங்கள் அறிக்கைக்கு ஒரு பெயரை உள்ளிடவும்.",
        report_name_placeholder: "எ.கா. இரத்தப் பரிசோதனை - ஜனவரி",
        uploading: "பதிவேற்றப்படுகிறது...",
        save_now: "இப்போது சேமி",
        capture_instruction: "அறிக்கையின் தெளிவான படத்தைப் எடுப்பதை உறுதி செய்யவும்",
        finish: "முடி",

        // AI Assistant
        ask_anything: "எது வேண்டுமானாலும் கேளுங்கள்...",
        link_file: "கோப்பை இணைக்கவும்",
        bot_welcome: "வணக்கம்! நான் உங்கள் AI உதவியாளர். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?",
        analyzing: "உங்கள் கோரிக்கையைப் பகுப்பாய்வு செய்கிறேன்...",
        analyzing_file: "கோப்பு பெறப்பட்டது. உங்களுக்காக அதைப் பகுப்பாய்வு செய்ய அனுமதிக்கவும்...",
        reports_title_me: "உங்கள் சேமிக்கப்பட்ட அறிக்கைகள்",
        reports_title_other: " இன் அறிக்கைகள்",
        docs_subtitle_me: "நீங்கள் பதிவேற்றிய மருத்துவ ஆவணங்கள்",
        docs_subtitle_other: " பதிவேற்றிய மருத்துவ ஆவணங்கள்",
        docs_title_other: " இன் ஆவணங்கள்",
        docs_title_me: "எனது ஆவணங்கள்",

        sort_newest: "புதியவை முதலில்",
        sort_oldest: "பழையவை முதலில்",
        uploaded_on: "அன்று பதிவேற்றப்பட்டது",
        empty_reports_msg: "நீங்கள் இன்னும் எந்த அறிக்கையையும் சேர்க்கவில்லை.",
        empty_docs_msg: "நீங்கள் இன்னும் எந்த ஆவணத்தையும் சேர்க்கவில்லை.",
        rename_report: "அறிக்கையின் பெயரை மாற்றவும்",
        delete_report: "அறிக்கையை நீக்கவும்",
        delete_report_confirm: "நிச்சயமாக இந்த அறிக்கையை நீக்க விரும்புகிறீர்களா?",
        rename_doc: "ஆவணத்தின் பெயரை மாற்றவும்",
        delete_doc: "ஆவணத்தை நீக்கவும்",
        delete_doc_confirm: "நிச்சயமாக இந்த ஆவணத்தை நீக்க விரும்புகிறீர்களா?",

        // Settings
        account: "கணக்கு",
        preferences: "விருப்பங்கள்",
        security: "பாதுகாப்பு",
        edit_profile: "சுயவிவரத்தைத் திருத்து",
        change_password: "கடவுச்சொல்லை மாற்று",
        notifications: "அறிவிப்புகள்",
        app_theme: "பயன்பாட்டு தீம்",
        language: "மொழி",
        choose_language: "மொழியைத் தேர்ந்தெடுக்கவும்",
        good_morning: "காலை வணக்கம்",
        good_afternoon: "மதிய வணக்கம்",
        good_evening: "மாலை வணக்கம்",
        good_night: "இனிய இரவு",
        years: "ஆண்டுகள்",
        loading: "ஏற்றப்படுகிறது...",
        no_phone: "தொலைபேசி எண் இல்லை",
        understand_report: "உங்கள் அறிக்கையைப் புரிந்துகொள்ள வேண்டுமா?",
        or: "அல்லது",
        scan: "ஸ்கேன்",
        upload: "பதிவேற்று",
        male: "ஆண்",
        female: "பெண்",
        other: "மற்றவை",
        good_health: "ஆரோக்கியமாக இருங்கள்!",
        login_btn: "நுழையவும்",
        signup_btn: "பதிவு செய்யவும்",
        app_lock: "ஆப் லாக்",
        theme: "பயன்பாட்டு தீம்",
        light: "லைட்",
        dark: "டார்க்",
        system: "கணினி இயல்புநிலை",
        choose_theme: "தீமைத் தேர்ந்தெடுக்கவும்",

        // Contact Us
        about: "பற்றி",
        contact_us: "எங்களைத் தொடர்பு கொள்ளவும்",
        email_support: "மின்னஞ்சல் ஆதரவு",
        call_us: "எங்களை அழைக்கவும்",
        chat_support: "சாட் ஆதரவு",
        send_message_title: "எங்களுக்குச் செய்தி அனுப்புங்கள்",
        your_name: "உங்கள் பெயர்",
        your_email: "உங்கள் மின்னஞ்சல்",
        your_message: "உங்கள் செய்தி",
        send_message: "செய்தி அனுப்பு",
        sending: "அனுப்பப்படுகிறது...",
        msg_sent_success: "உங்கள் செய்தி அனுப்பப்பட்டது!",
        fill_all_fields: "தயவுசெய்து அனைத்து விவரங்களையும் நிரப்பவும்",

        // Help & Policy
        help_policy: "உதவி மற்றும் கொள்கை",
        help: "உதவி",
        policy: "கொள்கை",
        terms_conditions: "விதிமுறைகள் மற்றும் நிபந்தனைகள்",
        feedback: "கருத்து",
        rate_carevia: "கேர்வியாவை (Carevia) மதிப்பிடவும்",
        send_feedback: "கருத்துக்களை அனுப்பவும்",
        last_updated: "கடைசியாக புதுப்பிக்கப்பட்டது",

        // About
        about_carevia: "கேர்வியா (Carevia) பற்றி",
        our_mission: "எங்கள் நோக்கம்",
        mission_text: "கேர்வியா குடும்பங்கள் மருத்துவப் பதிவுகளை பாதுகாப்பாகச் சேமிக்கவும், நிர்வகிக்கவும் மற்றும் புரிந்துகொள்ளவும் உதவுகிறது — எப்போது வேண்டுமானாலும், எங்கிருந்தும்.",
        why_carevia: "ஏன் கேர்வியா",
        emergency_access_feat: "அவசரக்கால அணுகல்",
        family_health_tracking: "குடும்பம் வாரியான ஆரோக்கியக் கண்காணிப்பு",
        secure_storage: "பாதுகாப்பான ஆவணச் சேமிப்பு",
        version: "பதிப்பு",
        app_version: "பயன்பாட்டு பதிப்பு",

        // FAQs
        faq_q1: "அறிக்கைகளை எவ்வாறு பதிவேற்றுவது?",
        faq_a1: "முகப்புத் திரைக்குச் சென்று, 'அறிக்கையைப் பதிவேற்று' என்பதைத் தட்டவும், உங்கள் கேலரியில் இருந்து ஆவணத்தைத் தேர்ந்தெடுக்கவும் அல்லது ஸ்கேனரைப் பயன்படுத்தி ஸ்கேன் செய்யவும்.",
        faq_q2: "குடும்ப உறுப்பினர்களை எவ்வாறு சேர்ப்பது?",
        faq_a2: "குடும்பத் திரைக்குச் சென்று, '+' ஐகான் அல்லது 'உறுப்பினரைச் சேர்' பொத்தானைத் தட்டி, அவர்களின் அடிப்படை விவரங்களை உள்ளிடவும்.",
        faq_q3: "அவசரக்கால அணுகல் எவ்வாறு செயல்படுகிறது?",
        faq_a3: "அவசரக்கால அணுகல், அவசர காலங்களில் உங்கள் போனைத் திறக்க முடியாவிட்டாலும், உங்கள் முக்கியமான மருத்துவத் தகவல்களைப் பார்க்க நியமிக்கப்பட்ட நபர்களுக்கு அனுமதி அளிக்கிறது.",
        faq_q4: "எனது தரவு எவ்வளவு பாதுகாப்பானது?",
        faq_a4: "உங்கள் தரவு மேம்பட்ட குறியாக்கத்துடன் (encryption) பாதுகாக்கப்படுகிறது. உங்கள் அனுமதியின்றி நாங்கள் உங்கள் தகவல்களை யாருடனும் பகிர்ந்து கொள்வதில்லை.",
    },
    gu: {
        // Common
        home: "હોમ",
        family: "પરિવાર",
        ai_assistant: "AI સહાયક",
        settings: "સેટિંગ્સ",
        profile: "પ્રોફાઇલ",
        documents: "દસ્તાવેજો",
        reports: "રિપોર્ટ્સ",
        logout: "લોગઆઉટ",
        save: "સાચવો",
        cancel: "રદ કરો",
        done: "થઈ ગયું",
        edit: "ફેરફાર કરો",
        delete: "કાઢી નાખો",
        share: "શેર કરો",
        rename: "નામ બદલો",
        view: "જુઓ",
        status: "સ્થિતિ",
        back: "પાછા",
        you: "તમે",
        error: "ભૂલ",
        success: "સફળતા",
        upload_error: "અપલોડ ભૂલ",

        // Home
        emergency_access: "ઇમરજન્સી એક્સેસ",
        family_updates: "ફેમિલી અપડેટ્સ",
        read_more: "વધુ વાંચો...",
        show_less: "ઓછું બતાવો",
        no_updates: "કોઈ તાજેતરના ફેમિલી અપડેટ્સ નથી",
        greetings: "નમસ્તે",
        daily_task: "તમારા આજના તબીબી કાર્યો",
        tagline: "તમારા પરિવારનું સ્વાસ્થ્ય,\nવ્યવસ્થિત અને સુલભ.",

        // Login & SignUp
        login_title: "તમારા ખાતામાં લોગિન કરો",
        login_subtitle: "તમારા ખાતામાં પ્રવેશવા માટે વિગતો દાખલ કરો",
        email: "ઈમેલ",
        password: "પાસવર્ડ",
        forgot_password: "પાસવર્ડ ભૂલી ગયા છો?",
        no_account: "ખાતું નથી?",
        create_account: "નવું ખાતું બનાવો",
        signup_title: "તમારું ખાતું બનાવો",
        signup_subtitle: "ખાતું બનાવવા માટે વિગતો દાખલ કરો",
        name: "નામ",
        dob: "જન્મ તારીખ",
        phone: "ફોન નંબર",
        confirm_password: "પાસવર્ડની પુષ્ટિ કરો",
        already_account: "પહેલેથી ખાતું છે?",
        login_here: "અહીં લોગિન કરો",

        // Profile
        my_details: "મારી વિગતો",
        age: "ઉંમર",
        gender: "જાતિ",
        contact_number: "સંપર્ક નંબર",
        address: "સરનામું",
        blood_group: "બ્લડ ગ્રુપ",
        emergency_contact: "ઇમરજન્સી સંપર્ક",
        choose_avatar: "અવતાર પસંદ કરો",
        pick_character: "તમારું પ્રતિનિધિત્વ કરતું પાત્ર પસંદ કરો",
        select_avatar: "અવતાર પસંદ કરો",
        remove_photo: "ફોટો કાઢી નાખો",

        // Family
        family_members: "પરિવારના સભ્યો",
        invite_friend: "ઈમેલ દ્વારા આમંત્રિત કરો",
        enter_email: "પરિવારના સભ્યનો ઈમેલ દાખલ કરો",
        invite: "આમંત્રિત કરો",
        sent_invites: "મોકલેલા આમંત્રણો",
        received_invites: "મળેલા આમંત્રણો",
        no_members: "હજી સુધી કોઈ સભ્ય ઉમેરવામાં આવ્યો નથી.",
        no_invites: "કોઈ બાકી આમંત્રણો નથી.",
        accept: "સ્વીકારો",
        reject: "નકારો",
        family_invites: "ફેમિલી આમંત્રણો",
        sent_to: "ને મોકલવામાં આવ્યું",
        invited_you: "તમને તેમના ફેમિલી ગ્રુપમાં જોડાવા માટે આમંત્રિત કર્યા છે",
        waiting_acceptance: "તેમની સ્વીકૃતિની રાહ જોવાઈ રહી છે...",
        cancel_request: "વિનંતી રદ કરો",
        add_member: "સભ્ય ઉમેરો",
        remove_member: "પરિવારના સભ્યને દૂર કરો",
        remove_member_confirm: "શું તમે ખરેખર આ સભ્યને દૂર કરવા માંગો છો?",
        no_pending_invites: "કોઈ બાકી ફેમિલી આમંત્રણો નથી",
        empty_family_msg: "તમે હજી સુધી પરિવારના કોઈ સભ્યને ઉમેર્યા નથી.",


        // Reports & Documents
        upload_report: "રિપોર્ટ અપલોડ કરો",
        scan_report: "રિપોર્ટ સ્કેન કરો",
        upload_doc: "દસ્તાવેજ અપલોડ કરો",
        report: "રિપોર્ટ",
        no_reports: "કોઈ રિપોર્ટ્સ મળ્યા નથી",
        no_docs: "કોઈ દસ્તાવેજો મળ્યા નથી",
        searching: "શોધાઈ રહ્યું છે...",
        searching_results: "શોધ પરિણામો",
        date: "તારીખ",
        permission_camera: "કૅમેરો બતાવવા માટે અમને તમારી પરવાનગીની જરૂર છે",
        grant_permission: "પરવાનગી આપો",
        report_analysis: "તમારા રિપોર્ટનું વિશ્લેષણ",
        report_summary: "સમગ્ર રિપોર્ટનો સારાંશ",
        ai_suggestions: "AI સૂચનો",
        save_report: "રિપોર્ટ સાચવો",
        enter_report_name: "વ્યવસ્થિત રહેવા માટે કૃપા કરીને તમારા રિપોર્ટનું નામ દાખલ કરો.",
        report_name_placeholder: "દા.ત. બ્લડ ટેસ્ટ - જાન્યુઆરી",
        uploading: "અપલોડ થઈ રહ્યું છે...",
        save_now: "હમણાં સાચવો",
        capture_instruction: "રિપોર્ટની સ્પષ્ટ તસવીર લેવાની ખાતરી કરો",
        finish: "સમાપ્ત",

        // AI Assistant
        ask_anything: "કંઈપણ પૂછો...",
        link_file: "ફાઇલ લિંક કરો",
        bot_welcome: "નમસ્તે! હું તમારો AI સહાયક છું. આજે હું તમને કેવી રીતે મદદ કરી શકું?",
        analyzing: "હું તમારી વિનંતીનું વિશ્લેષણ કરી રહ્યો છું...",
        analyzing_file: "મને ફાઇલ મળી છે. મને તમારા માટે તેનું વિશ્લેષણ કરવા દો...",
        reports_title_me: "તમારા સાચવેલા રિપોર્ટ્સ",
        reports_title_other: " ના રિપોર્ટ્સ",
        docs_subtitle_me: "તમારા અપલોડ કરેલા તબીબી દસ્તાવેજો",
        docs_subtitle_other: " અપલોડ કરેલા તબીબી દસ્તાવેજો",
        docs_title_other: " ના દસ્તાવેજો",
        docs_title_me: "મારા દસ્તાવેજો",

        sort_newest: "નવા રિપોર્ટ્સ પહેલા",
        sort_oldest: "જૂના રિપોર્ટ્સ પહેલા",
        uploaded_on: "ના રોજ અપલોડ કરવામાં આવ્યું",
        empty_reports_msg: "તમે હજી સુધી કોઈ રિપોર્ટ્સ ઉમેર્યા નથી.",
        empty_docs_msg: "તમે હજી સુધી કોઈ દસ્તાવેજો ઉમેર્યા નથી.",
        rename_report: "રિપોર્ટનું નામ બદલો",
        delete_report: "રિપોર્ટ કાઢી નાખો",
        delete_report_confirm: "શું તમે ખરેખર આ રિપોર્ટ કાઢી નાખવા માંગો છો?",
        rename_doc: "દસ્તાવેજનું નામ બદલો",
        delete_doc: "દસ્તાવેજ કાઢી નાખો",
        delete_doc_confirm: "શું તમે ખરેખર આ દસ્તાવેજ કાઢી નાખવા માંગો છો?",

        // Settings
        account: "ખાતું",
        preferences: "પસંદગીઓ",
        security: "સુરક્ષા",
        edit_profile: "પ્રોફાઇલ સંપાદિત કરો",
        change_password: "પાસવર્ડ બદલો",
        notifications: "સૂચનાઓ",
        app_theme: "એપ થીમ",
        language: "ભાષા",
        choose_language: "ભાષા પસંદ કરો",
        good_morning: "શુભ સવાર",
        good_afternoon: "શુભ બપોર",
        good_evening: "શુભ સાંજ",
        good_night: "શુભ રાત્રિ",
        years: "વર્ષ",
        loading: "લોડ થઈ રહ્યું છે...",
        no_phone: "કોઈ ફોન નથી",
        understand_report: "તમારા રિપોર્ટને સમજવા માંગો છો?",
        or: "અથવા",
        scan: "સ્કેન",
        upload: "અપલોડ",
        male: "પુરુષ",
        female: "સ્ત્રી",
        other: "અન્ય",
        good_health: "સ્વસ્થ રહો!",
        login_btn: "લોગિન",
        signup_btn: "સાઇન અપ",
        app_lock: "એપ લોક",
        theme: "એપ થીમ",
        light: "લાઇટ",
        dark: "ડાર્ક",
        system: "સિસ્ટમ ડિફોલ્ટ",
        choose_theme: "થીમ પસંદ કરો",

        // Contact Us
        about: "વિશે",
        contact_us: "અમારો સંપર્ક કરો",
        email_support: "ઈમેલ સપોર્ટ",
        call_us: "અમને કોલ કરો",
        chat_support: "ચેટ સપોર્ટ",
        send_message_title: "અમને સંદેશ મોકલો",
        your_name: "તમારું નામ",
        your_email: "તમારો ઈમેલ",
        your_message: "તમારો સંદેશ",
        send_message: "સંદેશ મોકલો",
        sending: "મોકલી રહ્યું છે...",
        msg_sent_success: "તમારો સંદેશ મોકલી દેવામાં આવ્યો છે!",
        fill_all_fields: "કૃપા કરીને બધી વિગતો ભરો",

        // Help & Policy
        help_policy: "મદદ અને નીતિ",
        help: "મદદ",
        policy: "નીતિ",
        terms_conditions: "નિયમો અને શરતો",
        feedback: "પ્રતિસાદ",
        rate_carevia: "કેરવિયા (Carevia) ને રેટ કરો",
        send_feedback: "પ્રતિસાદ મોકલો",
        last_updated: "છેલ્લે અપડેટ કરેલ",

        // About
        about_carevia: "કેરવિયા (Carevia) વિશે",
        our_mission: "અમારું લક્ષ્ય",
        mission_text: "કેરવિયા પરિવારોને તબીબી રેકોર્ડ્સ સુરક્ષિત રીતે સંગ્રહિત કરવા, સંચાલિત કરવા અને સમજવામાં મદદ કરે છે — ગમે ત્યારે, ગમે ત્યાં.",
        why_carevia: "શા માટે કેરવિયા",
        emergency_access_feat: "ઇમરજન્સી એક્સેસ",
        family_health_tracking: "પરિવાર મુજબ હેલ્થ ટ્રેકિંગ",
        secure_storage: "સુરક્ષિત દસ્તાવેજ સંગ્રહ",
        version: "આવૃત્તિ",
        app_version: "એપ આવૃત્તિ",

        // FAQs
        faq_q1: "રિપોર્ટ્સ કેવી રીતે અપલોડ કરવા?",
        faq_a1: "હોમ સ્ક્રીન પર જાઓ, 'રિપોર્ટ અપલોડ કરો' પર ટેપ કરો, તમારી ગેલેરીમાંથી તમારા દસ્તાવેજ પસંદ કરો અથવા અમારા સ્કેનરનો ઉપયોગ કરીને તેને સ્કેન કરો.",
        faq_q2: "પરિવારના સભ્યોને કેવી રીતે ઉમેરવા?",
        faq_a2: "ફેમિલી સ્ક્રીન પર જાઓ, '+' આઇકોન અથવા 'સભ્ય ઉમેરો' બટન પર ટેપ કરો અને તેમની મૂળભૂત વિગતો દાખલ કરો.",
        faq_q3: "ઇમરજન્સી એક્સેસ કેવી રીતે કામ કરે છે?",
        faq_a3: "ઇમરજન્સી એક્સેસ નિયુક્ત સંપર્કોને ઇમરજન્સી દરમિયાન તમારી મહત્વપૂર્ણ તબીબી માહિતી જોવાની મંજૂરી આપે છે, ભલે તમે તમારો ફોન અનલોક ન કરી શકો.",
        faq_q4: "મારો ડેટા કેટલો સુરક્ષિત છે?",
        faq_a4: "તમારો ડેટા અદ્યતન એન્ક્રિપ્શન સાથે સુરક્ષિત છે. અમે તમારી પરવાનગી વિના તમારી માહિતી કોઈ ત્રીજા પક્ષ સાથે શેર કરતા નથી.",
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
        const langDict = (translations as any)[language];
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
                    .eq('is_saved', true)
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
                    analysis: analysis || 'No analysis available',
                    is_saved: true
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

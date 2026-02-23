import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
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
    name: string;
    text: string;
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
}

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

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserEmail(user.email || null);

            // Fetch profile to get family_id
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profile) {
                setUserProfile(profile);
                // Aggressively sync email to ensure discoverability
                if (user.email && profile.email !== user.email.toLowerCase().trim()) {
                    try {
                        await supabase.from('profiles').update({ email: user.email.toLowerCase().trim() }).eq('id', user.id);
                        console.log("Profile email synced successfully.");
                    } catch (syncError) {
                        console.warn("Failed to sync email to profile. The 'email' column might be missing from the 'profiles' table.", syncError);
                    }
                }
            }

            const familyId = profile?.family_id || user.id;

            // Fetch reports (always private)
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

            // Fetch documents
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


            // Fetch updates (family-wide)
            const { data: updatesData } = await supabase
                .from('family_updates')
                .select('*')
                .or(`user_id.eq.${user.id},family_id.eq.${familyId}`)
                .order('created_at', { ascending: false });

            if (updatesData) {
                setUpdates(updatesData);
            } else {
                setUpdates([]);
            }

            // Fetch family members (family-wide)
            if (familyId) {
                const { data: familyProfiles, error: famError } = await supabase
                    .from('profiles')
                    .select('id, full_name, photo_url, email')
                    .eq('family_id', familyId);

                if (famError) console.error("Error fetching family members:", famError.message);
                console.log("Current familyId:", familyId);
                console.log("Family profiles found:", familyProfiles?.length || 0);

                if (familyProfiles) {
                    setFamilyMembers(familyProfiles.map(p => ({
                        id: p.id,
                        name: p.full_name || p.email?.split('@')[0] || 'Unknown',
                        image: p.photo_url || `https://avatar.iran.liara.run/public/${Math.floor(Math.random() * 100)}`,
                        email: p.email
                    })).filter(p => p.id !== user.id)); // Don't show myself in family list
                }
            } else {
                setFamilyMembers([]);
            }

            // Fetch pending invitations for this user (by email)
            if (user.email) {
                const { data: invitationsData, error: invError } = await supabase
                    .from('invitations')
                    .select('*')
                    .ilike('receiver_email', user.email.trim())
                    .eq('status', 'pending');

                if (invError) {
                    console.error('Error fetching invitations:', invError);
                    setInvitationError(true);
                } else {
                    setInvitationError(false);
                }

                if (invitationsData && invitationsData.length > 0) {
                    // Fetch sender names separately to be more robust
                    const invitesWithNames = await Promise.all(invitationsData.map(async (inv) => {
                        try {
                            const { data: profile } = await supabase
                                .from('profiles')
                                .select('full_name')
                                .eq('id', inv.sender_id)
                                .single();

                            return {
                                ...inv,
                                sender_name: profile?.full_name || 'Someone'
                            };
                        } catch (e) {
                            return { ...inv, sender_name: 'Someone' };
                        }
                    }));
                    setInvitations(invitesWithNames);
                } else {
                    setInvitations([]);
                }
            }
        } catch (error) {
            console.error('Error fetching initial data:', error);
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

    const addUpdate = async (name: string, text: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase.from('profiles').select('family_id').eq('id', user.id).single();
            const family_id = profile?.family_id || user.id;

            const { data, error } = await supabase
                .from('family_updates')
                .insert({ user_id: user.id, family_id, name, text })
                .select()
                .single();

            if (error) throw error;
            setUpdates(prev => [data, ...prev]);
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
            await addUpdate("Me", `You added a new report: ${name}`);
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
            await addUpdate("Me", `You added a new document: ${name}`);
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

            await addUpdate("Me", `You sent a family invitation to ${email}`);
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
            await addUpdate("Me", `You joined a new family!`);
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
            rejectInvitation
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

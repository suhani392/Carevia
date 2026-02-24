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
            familyId: currentFamilyId
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

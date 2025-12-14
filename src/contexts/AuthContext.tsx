// Auth Context Provider for ImagePro
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, signOut as supabaseSignOut } from '@/lib/supabase';

interface UserProfile {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    created_at: string;
    updated_at: string;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: UserProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch user profile from database
    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                // Profile might not exist yet (first login)
                if (error.code === 'PGRST116') {
                    console.log('Profile not found, will be created by trigger');
                    return null;
                }
                console.error('Error fetching profile:', error);
                return null;
            }

            return data as UserProfile;
        } catch (error) {
            console.error('Error in fetchProfile:', error);
            return null;
        }
    }, []);

    // Refresh profile data
    const refreshProfile = useCallback(async () => {
        if (user?.id) {
            const profileData = await fetchProfile(user.id);
            setProfile(profileData);
        }
    }, [user?.id, fetchProfile]);

    // Handle sign out
    const handleSignOut = async () => {
        try {
            await supabaseSignOut();
            setUser(null);
            setSession(null);
            setProfile(null);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    // Initialize auth state
    useEffect(() => {
        // Get initial session
        const initializeAuth = async () => {
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession();

                if (initialSession) {
                    setSession(initialSession);
                    setUser(initialSession.user);

                    // Fetch profile
                    const profileData = await fetchProfile(initialSession.user.id);
                    setProfile(profileData);
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, currentSession: Session | null) => {
                console.log('Auth state changed:', event);

                setSession(currentSession);
                setUser(currentSession?.user ?? null);

                if (currentSession?.user) {
                    // Slight delay to allow database trigger to create profile
                    setTimeout(async () => {
                        const profileData = await fetchProfile(currentSession.user.id);
                        setProfile(profileData);
                    }, 500);
                } else {
                    setProfile(null);
                }

                setLoading(false);
            }
        );

        // Cleanup subscription
        return () => {
            subscription.unsubscribe();
        };
    }, [fetchProfile]);

    const value: AuthContextType = {
        user,
        session,
        profile,
        loading,
        signOut: handleSignOut,
        refreshProfile,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;

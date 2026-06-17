"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    signOut: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    profileName: string;
    school: string;
    fontPreference: string;
    loading: boolean;
    refreshProfile: () => Promise<void>;
    isSilmodan: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [profileName, setProfileName] = useState("");
    const [school, setSchool] = useState("");
    const [fontPreference, setFontPreference] = useState("default");
    const [isSilmodan, setIsSilmodan] = useState(false);

    useEffect(() => {
        if (typeof document !== 'undefined') {
            if (fontPreference === 'neurimbo') {
                document.body.classList.add('font-theme-neurimbo');
            } else {
                document.body.classList.remove('font-theme-neurimbo');
            }
        }
    }, [fontPreference]);

    useEffect(() => {
        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                fetchProfile(currentUser.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for changes on auth state (logged in, out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                fetchProfile(currentUser.id);
            } else {
                setProfileName("");
                setSchool("");
                setFontPreference("default");
                setIsSilmodan(false);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            let data: any = null;
            let error: any = null;

            try {
                const res = await supabase
                    .from('profiles')
                    .select('display_name, font_preference, is_silmodan, school')
                    .eq('id', userId)
                    .single();
                data = res.data;
                error = res.error;
            } catch (e) {
                // school column might not exist yet
                const res = await supabase
                    .from('profiles')
                    .select('display_name, font_preference, is_silmodan')
                    .eq('id', userId)
                    .single();
                data = res.data ? { ...res.data, school: '' } : null;
                error = res.error;
            }

            if (error && error.code === 'PGRST116') {
                // Profile doesn't exist, create one
                const defaultName = user?.email?.split('@')[0] || "User";
                const { data: newProfile, error: createError } = await supabase
                    .from('profiles')
                    .insert([{ id: userId, display_name: defaultName }])
                    .select()
                    .single();

                if (!createError && newProfile) {
                    setProfileName(newProfile.display_name);
                    setSchool(newProfile.school || "");
                    setFontPreference(newProfile.font_preference || "default");
                    setIsSilmodan(newProfile.is_silmodan === 1);
                }
            } else if (!error && data) {
                setProfileName(data.display_name);
                setSchool(data.school || "");
                setFontPreference(data.font_preference || "default");
                setIsSilmodan(data.is_silmodan === 1);
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
        } finally {
            setLoading(false);
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    };

    const signUp = async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, signOut, signIn, signUp, profileName, school, fontPreference, loading, refreshProfile, isSilmodan }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

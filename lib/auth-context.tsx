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
    fontPreference: string;
    loading: boolean;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [profileName, setProfileName] = useState("");
    const [fontPreference, setFontPreference] = useState("default");

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
                setFontPreference("default");
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('display_name, font_preference')
                .eq('id', userId)
                .single();

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
                    setFontPreference(newProfile.font_preference || "default");
                }
            } else if (!error && data) {
                setProfileName(data.display_name);
                setFontPreference(data.font_preference || "default");
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
        <AuthContext.Provider value={{ user, signOut, signIn, signUp, profileName, fontPreference, loading, refreshProfile }}>
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

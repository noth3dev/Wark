"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth-context";
import { supabase } from "../../lib/supabase";
import { User, Check, Loader2, Shield, Mail, BadgeCheck, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfilePage() {
    const { user, profileName, school, fontPreference, refreshProfile, loading: authLoading } = useAuth();
    const [newName, setNewName] = useState("");
    const [newSchool, setNewSchool] = useState("");
    const [newFontPreference, setNewFontPreference] = useState("default");
    const [isUpdating, setIsUpdating] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        if (profileName) {
            setNewName(profileName);
        }
        if (school) {
            setNewSchool(school);
        }
        if (fontPreference) {
            setNewFontPreference(fontPreference);
        }
    }, [profileName, school, fontPreference]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newName.trim()) return;

        setIsUpdating(true);
        setStatus(null);

        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    display_name: newName.trim(),
                    school: newSchool.trim(),
                    font_preference: newFontPreference,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            await refreshProfile();
            setStatus({ type: 'success', message: 'Identity updated successfully.' });
        } catch (error: any) {
            console.error(error);
            setStatus({ type: 'error', message: error.message || 'Failed to update identity.' });
        } finally {
            setIsUpdating(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white/20" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center space-y-4">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                    <h1 className="text-xl font-bold">Unauthorized</h1>
                    <p className="text-neutral-500">Please sign in to access your profile.</p>
                </div>
            </div>
        );
    }



    return (
        <main className="min-h-screen bg-black text-white selection:bg-white/10 selection:text-white">
            <div className="max-w-4xl mx-auto px-6 py-24 space-y-24">
                {/* Header */}
                <header className="space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10"
                    >
                        <Shield className="w-3 h-3 text-cyan-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/80">User Protocol</span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-6xl md:text-8xl font-extralight tracking-tighter"
                    >
                        Profile Settings
                    </motion.h1>
                </header>

                <div className="grid md:grid-cols-3 gap-12">
                    {/* Left Column: Account Info */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-8"
                    >
                        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-6">
                            <div className="relative w-20 h-20 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center group overflow-hidden">
                                <User className="w-8 h-8 text-neutral-600 group-hover:text-white transition-colors" />
                                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-sm font-bold tracking-tight">{profileName}</h3>
                                {school && (
                                    <div className="text-xs text-indigo-400 font-semibold font-suit">
                                        🏫 {school}
                                    </div>
                                )}
                                <div className="flex items-center space-x-2 text-[11px] text-neutral-500">
                                    <Mail className="w-3 h-3" />
                                    <span>{user.email}</span>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/5 space-y-4">

                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">ID Status</span>
                                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column: Edit Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="md:col-span-2 space-y-12"
                    >
                        <form onSubmit={handleUpdateProfile} className="space-y-8">
                            <div className="space-y-4">
                                <label className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 px-1">Display Identity</label>
                                <input
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Enter your name..."
                                    className="w-full bg-transparent border-b border-white/10 py-4 text-2xl font-light focus:outline-none focus:border-white transition-colors placeholder-white/5"
                                />
                                <p className="text-[10px] text-neutral-600 px-1">This name will be visible across the platform in sessions and reports.</p>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 px-1">School (학교 대항전용)</label>
                                <input
                                    value={newSchool}
                                    onChange={(e) => setNewSchool(e.target.value)}
                                    placeholder="예: 서울고등학교, 과학고..."
                                    className="w-full bg-transparent border-b border-white/10 py-4 text-2xl font-light focus:outline-none focus:border-white transition-colors placeholder-white/5"
                                />
                                <p className="text-[10px] text-neutral-600 px-1">학교 대항전에 참가하기 위해 본인의 학교 이름을 입력해주세요.</p>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 px-1">Tag Font Preference</label>
                                <div className="flex gap-4 px-1">
                                    <button
                                        type="button"
                                        onClick={() => setNewFontPreference("default")}
                                        className={`px-6 py-3 rounded-xl border ${newFontPreference === 'default' ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-white/10 text-neutral-400 hover:bg-white/5'} transition-all`}
                                    >
                                        <span className="font-semibold text-sm">Default Font</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewFontPreference("neurimbo")}
                                        className={`px-6 py-3 rounded-xl border ${newFontPreference === 'neurimbo' ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-white/10 text-neutral-400 hover:bg-white/5'} transition-all`}
                                    >
                                        <span className="font-neurimbo text-sm">Neurimbo Font</span>
                                    </button>
                                </div>
                                <p className="text-[10px] text-neutral-600 px-1">Choose the font used for displaying tag names.</p>
                            </div>

                            <div className="flex items-center justify-between pt-4">
                                {status && (
                                    <motion.span
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={`text-[11px] font-medium ${status.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}
                                    >
                                        {status.message}
                                    </motion.span>
                                )}
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="px-8 py-3 bg-white text-black text-xs font-bold rounded-full hover:bg-neutral-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center space-x-2"
                                >
                                    {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                    <span>Sync Identity</span>
                                </button>
                            </div>
                        </form>

                        <div className="p-8 rounded-3xl bg-neutral-900/50 border border-white/5 space-y-4">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-700">Protocol Information</h4>
                            <p className="text-xs leading-relaxed text-neutral-500">
                                Your profile data is stored securely. Identity updates are synchronized across the development environment to maintain consistent reporting.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}

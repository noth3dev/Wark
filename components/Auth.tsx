"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import { LogIn, UserPlus, Mail, Lock } from "lucide-react";

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLogin, setIsLogin] = useState(true);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            if (!isLogin) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage({ type: "success", text: "가입 확인 이메일을 확인해주세요" });
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (error: any) {
            setMessage({ type: "error", text: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 pb-24">
            <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="mb-12 flex justify-center">
                    <img src="/wark.svg" alt="WArk" className="h-6 w-auto" />
                </div>

                <div className="glass border border-white/10 rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                    <div className="flex mb-10 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                        <button
                            type="button"
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all duration-500 ${isLogin ? "bg-white text-black shadow-lg" : "text-neutral-500 hover:text-neutral-300"
                                }`}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all duration-500 ${!isLogin ? "bg-white text-black shadow-lg" : "text-neutral-500 hover:text-neutral-300"
                                }`}
                        >
                            Register
                        </button>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-white transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:ring-1 focus:ring-white/20 focus:bg-white/[0.06] transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-white transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:ring-1 focus:ring-white/20 focus:bg-white/[0.06] transition-all"
                                />
                            </div>
                        </div>

                        <div className="min-h-[20px]">
                            {message && (
                                <p className={`text-[10px] font-bold flex items-center gap-2 animate-in slide-in-from-left-2 ${message.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {message.text}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-16 flex items-center justify-center gap-3 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-2xl hover:bg-neutral-200 transition-all shadow-xl active:scale-95 disabled:opacity-50 mt-4"
                        >
                            {loading ? (
                                "Processing..."
                            ) : isLogin ? (
                                <>
                                    <LogIn className="w-4 h-4" />
                                    <span>Initiate Login</span>
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-4 h-4" />
                                    <span>Create Account</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            <style jsx global>{`
        .glass { background: rgba(255, 255, 255, 0.01); backdrop-filter: blur(40px); }
      `}</style>
        </div>
    );
}

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Dna, 
  Mail, 
  Lock, 
  User, 
  Building2, 
  Globe2, 
  ArrowRight, 
  Sparkles, 
  ShieldAlert,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AuthScreen() {
  const { login, signup, loginWithGoogle, loginAsGuest, resetPassword } = useAuth();
  
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [institution, setInstitution] = useState('');
  const [country, setCountry] = useState('');

  const handleResetForm = () => {
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      setError('Name, Email, and Password are required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signup(email, password, fullName, institution, country);
    } catch (err: any) {
      setError(err.message || 'Registration failed. The email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      await resetPassword(email);
      setView('login');
    } catch (err: any) {
      setError(err.message || 'Error occurred while resetting password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      // Handled in context toast, but let's clear loading
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginAsGuest();
    } catch (err: any) {
      setError('Failed to enter Guest Sandbox Mode.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 select-none transition-colors duration-200">
      
      {/* Background Decorative Bio-grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(20,184,166,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(20,184,166,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      
      <div className="w-full max-w-md relative">
        {/* Glow Effects */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-teal-500/10 dark:teal-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-500/10 dark:indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 text-center relative z-10">
          <div className="bg-gradient-to-tr from-teal-500 to-emerald-400 p-3 rounded-2xl text-white shadow-lg shadow-teal-500/25 mb-4 animate-pulse">
            <Dna className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight font-display">
            Pharma<span className="text-teal-600 dark:text-teal-400">Genie</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1.5 max-w-[280px]">
            SaaS Pharmacogenomics reference platform & secure clinical decision engine.
          </p>
        </div>

        {/* Dynamic Card Container */}
        <motion.div 
          layout
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-xl overflow-hidden relative z-10"
        >
          {/* Top visual accent */}
          <div className="h-1.5 bg-gradient-to-r from-teal-500 via-emerald-400 to-indigo-500" />
          
          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {view === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.15 }}
                >
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-display">
                    Welcome Back Officer
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Sign in to sync your saved patient records & analytics.
                  </p>

                  <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="physician@hospital.org"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:border-teal-500 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Password</label>
                        <button
                          type="button"
                          onClick={() => { setView('forgot'); handleResetForm(); }}
                          className="text-[10px] font-black text-teal-600 dark:text-teal-400 hover:underline"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:border-teal-500 transition-all"
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 rounded-xl text-[11px] font-semibold flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-850 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/10 transition-all flex items-center justify-center gap-2 cursor-pointer border border-transparent"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>Login Securely</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {view === 'register' && (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.15 }}
                >
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-display">
                    Create Clinical Account
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    SaaS client database mapping and persistent records logs.
                  </p>

                  <form onSubmit={handleRegister} className="mt-5 flex flex-col gap-3.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Dr. Sophia Carter"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:border-teal-500 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Email Address *</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="sophia.carter@mayoclinic.org"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:border-teal-500 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="•••••••• (min 6 chars)"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:border-teal-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Institution</label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={institution}
                            onChange={(e) => setInstitution(e.target.value)}
                            placeholder="Mayo Clinic"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8.5 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:border-teal-500 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Country</label>
                        <div className="relative">
                          <Globe2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            placeholder="United States"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8.5 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:border-teal-500 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 rounded-xl text-[11px] font-semibold flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-850 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/10 transition-all flex items-center justify-center gap-2 cursor-pointer border border-transparent"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <span>Create Secure Account</span>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {view === 'forgot' && (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.15 }}
                >
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-display">
                    Recover Credentials
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    We'll email you a secure link to reset your clinical account password.
                  </p>

                  <form onSubmit={handleForgot} className="mt-6 flex flex-col gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Registered Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="physician@hospital.org"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:border-teal-500 transition-all"
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 rounded-xl text-[11px] font-semibold flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-850 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/10 transition-all flex items-center justify-center gap-2 cursor-pointer border border-transparent"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <span>Send Recovery Email</span>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Separator / Social Login */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-4">
              <div className="relative flex justify-center text-[10px] font-black uppercase text-slate-400 tracking-wider">
                <span className="bg-white dark:bg-slate-900 px-3 z-10">Or Connect via</span>
              </div>

              {/* Federated Login row */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-3xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" width="24" height="24">
                    <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.64l3.15-3.15C17.45 1.68 14.93 1 12 1 7.37 1 3.4 3.66 1.45 7.55l3.8 2.95C6.15 7.5 8.85 5.04 12 5.04z"/>
                    <path fill="#4285F4" d="M23.45 12.3c0-.82-.07-1.6-.22-2.3H12v4.4h6.42c-.28 1.44-1.1 2.66-2.33 3.48l3.63 2.82c2.13-1.97 3.36-4.87 3.36-8.4z"/>
                    <path fill="#FBBC05" d="M5.25 14.5c-.25-.75-.38-1.55-.38-2.5s.13-1.75.38-2.5L1.45 6.55C.52 8.4 0 10.15 0 12s.52 3.6 1.45 5.45l3.8-2.95z"/>
                    <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.95-2.92l-3.63-2.82c-1.02.68-2.33 1.1-4.32 1.1-3.15 0-5.85-2.46-6.8-5.46L1.45 15.85C3.4 19.74 7.37 23 12 23z"/>
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={handleGuestSignIn}
                  disabled={loading}
                  className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-750 dark:text-slate-300 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-3xs"
                  title="Enter offline sandbox mode instantly"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                  <span>Sandbox Guest</span>
                </button>
              </div>

              {/* View Switch Link */}
              <div className="text-center text-xs mt-2 text-slate-500 dark:text-slate-400 font-semibold">
                {view === 'login' ? (
                  <span>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setView('register'); handleResetForm(); }}
                      className="text-teal-600 dark:text-teal-400 font-black hover:underline cursor-pointer"
                    >
                      Register here
                    </button>
                  </span>
                ) : (
                  <span>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setView('login'); handleResetForm(); }}
                      className="text-teal-600 dark:text-teal-400 font-black hover:underline cursor-pointer"
                    >
                      Log in here
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

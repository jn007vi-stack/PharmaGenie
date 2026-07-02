import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Building2, 
  Globe2, 
  Lock, 
  Check, 
  Camera, 
  Sun, 
  Moon, 
  Save, 
  ShieldCheck, 
  Loader2, 
  Sparkles,
  UserCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { useToast } from './Toast';

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=doctor1',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=doctor2',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=doctor3',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=doctor4',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=doctor5',
  'https://api.dicebear.com/7.x/bottts/svg?seed=lab1',
  'https://api.dicebear.com/7.x/bottts/svg?seed=lab2',
  'https://api.dicebear.com/7.x/bottts/svg?seed=lab3',
];

export default function UserProfilePage() {
  const { userProfile, updateProfile, changePassword, isGuest, role, subscriptionTier, setUpgradeModalOpen, downgradeToFree } = useAuth();
  const { success, warning } = useToast();

  const [fullName, setFullName] = useState(userProfile?.fullName || '');
  const [institution, setInstitution] = useState(userProfile?.institution || '');
  const [country, setCountry] = useState(userProfile?.country || '');
  const [profilePhoto, setProfilePhoto] = useState(userProfile?.profilePhoto || PRESET_AVATARS[0]);
  const [themePreference, setThemePreference] = useState<'light' | 'dark'>(userProfile?.themePreference || 'light');
  
  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      warning('Guest profiles are temporary and cannot be saved.');
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile({
        fullName,
        institution,
        country,
        profilePhoto,
        themePreference,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      warning('Password changes are not permitted for Guest accounts.');
      return;
    }
    if (!newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      warning('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      warning('Password must be at least 6 characters long.');
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      warning(err.message || 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAvatarSelect = (url: string) => {
    setProfilePhoto(url);
  };

  const generateRandomAvatar = () => {
    const seed = Math.random().toString(36).substring(2, 10);
    setProfilePhoto(`https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`);
    success('Generated new creative clinical avatar!');
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto p-2" id="user-profile-settings-page">
      
      {/* Page Header */}
      <div className="flex items-center gap-3 border-b border-slate-200/60 dark:border-slate-800 pb-4">
        <div className="bg-teal-50 dark:bg-teal-950/40 p-2.5 rounded-xl text-teal-600 dark:text-teal-400 shadow-3xs">
          <UserCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-extrabold text-slate-900 dark:text-white text-lg font-display">User Account Profile</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
            Manage your personal clinical workspace details, medical institution records, and secure password credentials.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (Avatar & Theme Selection) */}
        <div className="md:col-span-4 flex flex-col gap-6">
          
          {/* Avatar Settings Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-3xs flex flex-col items-center">
            <span className="text-[10px] self-start font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Medical Identity</span>
            
            {/* Avatar Display */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-3 border-teal-500 bg-slate-50 dark:bg-slate-950 overflow-hidden shadow-md flex items-center justify-center p-1">
                <img referrerPolicy="no-referrer" src={profilePhoto} alt="User Avatar" className="w-full h-full object-cover rounded-full" />
              </div>
              <button
                type="button"
                onClick={generateRandomAvatar}
                className="absolute bottom-0 right-0 p-1.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-full shadow-md hover:scale-105 active:scale-95 cursor-pointer transition-all border border-slate-800/20"
                title="Generate custom visual seed"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>

            <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-3 font-display">
              {fullName || 'PharmaGenie Specialist'}
            </span>
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
              <span className="text-[10px] font-black bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-200/40 dark:border-teal-900/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {role} Account
              </span>
              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                subscriptionTier === 'enterprise'
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200/40 dark:border-indigo-900/40 shadow-3xs'
                  : subscriptionTier === 'pro'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/40 dark:border-amber-900/40 shadow-3xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-750'
              }`} id="profile-card-subscription-badge">
                {subscriptionTier === 'enterprise' ? 'ENTERPRISE' : subscriptionTier === 'pro' ? 'PRO' : 'FREE'}
              </span>
            </div>

            {/* Presets Grid */}
            <div className="mt-5 w-full">
              <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5 text-center">Select Identity Avatar</span>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_AVATARS.map((url) => {
                  const isSelected = profilePhoto === url;
                  return (
                    <button
                      key={url}
                      type="button"
                      onClick={() => handleAvatarSelect(url)}
                      className={`w-9 h-9 rounded-lg border overflow-hidden p-0.5 cursor-pointer transition-all bg-slate-50 dark:bg-slate-950 relative flex items-center justify-center ${
                        isSelected 
                          ? 'border-teal-500 ring-2 ring-teal-500/20 scale-105 shadow-3xs' 
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700'
                      }`}
                    >
                      <img referrerPolicy="no-referrer" src={url} alt="preset-avatar" className="w-full h-full object-cover rounded" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-teal-500/10 flex items-center justify-center">
                          <Check className="w-3 h-3 text-teal-600 font-extrabold" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Theme Preferences Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-3xs">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5 block">Theme Preference</span>
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200/50 dark:border-slate-850">
              <div className="p-2 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-lg">
                <Moon className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">Sophisticated Clinical Slate</span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed mt-0.5">
                  An eye-safe dark theme meticulously calibrated for optimal data density, reading comfort, and visual precision in clinical environments.
                </span>
              </div>
            </div>
          </div>

          {/* Subscription Plan Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-3xs flex flex-col gap-3">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Workspace Subscription</span>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Active Plan</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-405 font-semibold block leading-tight mt-0.5">
                  {subscriptionTier === 'enterprise' 
                    ? 'Unlimited PGx & Institutional Tools' 
                    : subscriptionTier === 'pro' 
                    ? 'Unlimited PGx assessments' 
                    : 'Limited to 10 reports/month'}
                </span>
              </div>
              
              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border shrink-0 ${
                subscriptionTier === 'enterprise'
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                  : subscriptionTier === 'pro'
                  ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-750'
              }`}>
                {subscriptionTier === 'enterprise' ? 'ENTERPRISE' : subscriptionTier === 'pro' ? 'PRO' : 'FREE'}
              </span>
            </div>

            {subscriptionTier !== 'free' ? (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={downgradeToFree}
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 border border-rose-200/50 dark:border-rose-900/40 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 cursor-pointer transition-all shadow-3xs"
                >
                  Demote to Free (for testing)
                </button>
                {subscriptionTier === 'pro' && (
                  <button
                    type="button"
                    onClick={() => setUpgradeModalOpen(true)}
                    className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-900/40 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer transition-all shadow-3xs"
                  >
                    Upgrade to Enterprise
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setUpgradeModalOpen(true)}
                className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-150" />
                <span>Upgrade to Pro Suite</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column (Forms) */}
        <div className="md:col-span-8 flex flex-col gap-6">
          
          {/* Form 1: General Details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-3xs">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 block">General Medical Details</span>
            
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-1.5">Full Professional Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:border-teal-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-1.5">Registered Email</label>
                  <input
                    type="text"
                    disabled
                    value={userProfile?.email || 'guest@pharmagenie.local'}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-400 dark:text-slate-500 font-semibold cursor-not-allowed"
                    title="Registered email cannot be modified"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-1.5">Affiliated Institution</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="e.g. Mayo Clinic"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:border-teal-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-1.5">Country / Jurisdiction</label>
                  <div className="relative">
                    <Globe2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g. United States"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:border-teal-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {isGuest && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 rounded-xl text-[11px] font-semibold">
                  Note: You are currently signed in as a Guest. Guest accounts are transient and details cannot be synced to the persistent database.
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingProfile || isGuest}
                  className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800/40 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {savingProfile ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Sync Profile Details</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Form 2: Password Update */}
          {!isGuest && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-3xs">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-4 block">Security & Credentials</span>
              
              <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-1.5">New Secure Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:border-teal-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:border-teal-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingPassword || !newPassword || !confirmPassword}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800/40 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {savingPassword ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Update Password Credentials</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

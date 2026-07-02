import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebase/config';
import { 
  signUpWithEmail, 
  signInWithEmail, 
  signInWithGoogle, 
  signInAsGuest, 
  forgotPassword, 
  logOutUser,
  updateUserPassword
} from '../firebase/auth';
import { getUserProfile, updateUserProfile, UserProfile } from '../firebase/firestore';
import { useToast } from '../components/Toast';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isGuest: boolean;
  role: 'Student' | 'Researcher' | 'Clinician' | 'Administrator';
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  upgradeToPro: () => Promise<void>;
  upgradeToEnterprise: () => Promise<void>;
  downgradeToFree: () => Promise<void>;
  startProTrial: () => Promise<void>;
  simulatePaymentSuccess: () => void;
  simulatePaymentFailure: () => void;
  simulatePlanRenewal: () => void;
  simulatePlanExpiration: () => void;
  simulateTrialEndingSoon: () => void;
  simulateMonthlyLimitReached: () => void;
  trialUsed: boolean;
  trialExpiresAt?: string;
  subscriptionExpiresAt?: string;
  isUpgradeModalOpen: boolean;
  setUpgradeModalOpen: (open: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string, institution: string, country: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  changePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { success, warning, info } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        try {
          let profile = await getUserProfile(user.uid);
          if (!profile) {
            if (user.isAnonymous) {
              profile = {
                uid: user.uid,
                fullName: 'Guest Clinical Officer',
                email: 'guest@pharmagenie.local',
                role: 'Student',
                institution: 'Temporary Session Workspace',
                country: 'Local Sandbox',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                profilePhoto: `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
                themePreference: 'dark'
              };
            } else {
              // Create default fallback
              profile = {
                uid: user.uid,
                fullName: user.displayName || 'PharmaGenie User',
                email: user.email || '',
                role: 'Student',
                institution: 'None',
                country: 'None',
                profilePhoto: user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.uid}`,
                themePreference: 'dark',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
              };
            }
          }
          setCurrentUser(user);
          setUserProfile(profile);

          // Configure visual theme: sophisticated clinical dark mode is standard
          document.documentElement.classList.add('dark');
          localStorage.setItem('pharmagenie_dark_mode', 'true');

        } catch (err) {
          console.error('Error synchronizing authenticated profile:', err);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Login handler
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const profile = await signInWithEmail(email, password);
      setUserProfile(profile);
      success(`Welcome back, ${profile.fullName}! Login Successful.`);
    } catch (err: any) {
      warning(err.message || 'Invalid credentials. Please verify and try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Signup handler
  const signup = async (
    email: string, 
    password: string, 
    fullName: string, 
    institution: string, 
    country: string
  ) => {
    try {
      setLoading(true);
      const profile = await signUpWithEmail(email, password, fullName, institution, country);
      setUserProfile(profile);
      success('Account Created! Welcome to PharmaGenie.');
    } catch (err: any) {
      warning(err.message || 'Sign up failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In
  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const profile = await signInWithGoogle();
      setUserProfile(profile);
      success(`Authenticated via Google. Welcome, ${profile.fullName}!`);
    } catch (err: any) {
      warning(err.message || 'Google Authentication cancelled or failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Guest login
  const loginAsGuest = async () => {
    try {
      setLoading(true);
      const profile = await signInAsGuest();
      setUserProfile(profile);
      info('Entered Guest Sandbox Mode. Data will be cached locally.');
    } catch (err: any) {
      warning(err.message || 'Failed to authenticate guest account.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setLoading(true);
      await logOutUser();
      setUserProfile(null);
      setCurrentUser(null);
      success('Logged Out successfully. See you next time!');
    } catch (err: any) {
      warning('Logout failed.');
    } finally {
      setLoading(false);
    }
  };

  // Reset Password
  const resetPassword = async (email: string) => {
    try {
      await forgotPassword(email);
      success(`Password reset link dispatched to ${email}. Check spam/junk folders.`);
    } catch (err: any) {
      warning(err.message || 'Error executing password reset request.');
      throw err;
    }
  };

  // Update profile attributes in state and database
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) throw new Error('No active user to update.');
    try {
      await updateUserProfile(currentUser.uid, data);
      setUserProfile((prev) => prev ? { ...prev, ...data } : null);
      
      // Keep clinical dark mode active permanently
      document.documentElement.classList.add('dark');
      localStorage.setItem('pharmagenie_dark_mode', 'true');
      success('Profile updated and synced successfully.');
    } catch (err: any) {
      warning('Failed to update profile settings.');
      throw err;
    }
  };

  // Change password credentials
  const changePassword = async (password: string) => {
    try {
      await updateUserPassword(password);
      success('Password credentials updated successfully.');
    } catch (err: any) {
      warning(err.message || 'Failed to update user password.');
      throw err;
    }
  };

  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [guestTier, setGuestTier] = useState<'free' | 'pro' | 'enterprise'>('free');
  const [guestTrialUsed, setGuestTrialUsed] = useState<boolean>(false);
  const [guestTrialExpiresAt, setGuestTrialExpiresAt] = useState<string | undefined>(undefined);
  const [guestSubscriptionExpiresAt, setGuestSubscriptionExpiresAt] = useState<string | undefined>(undefined);

  const isGuest = currentUser?.isAnonymous || false;
  const role = userProfile?.role || 'Student';

  const subscriptionTier = isGuest
    ? guestTier
    : (userProfile?.subscriptionTier || 'free');

  const trialUsed = isGuest ? guestTrialUsed : !!userProfile?.trialUsed;
  const trialExpiresAt = isGuest ? guestTrialExpiresAt : userProfile?.trialExpiresAt;
  const subscriptionExpiresAt = isGuest ? guestSubscriptionExpiresAt : userProfile?.subscriptionExpiresAt;

  const upgradeToPro = async () => {
    if (isGuest) {
      setGuestTier('pro');
      setGuestSubscriptionExpiresAt(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
      success('Successfully upgraded guest session to Pro! Enjoy unlimited clinical reports and unlocked advanced features.');
    } else {
      await updateProfile({ 
        subscriptionTier: 'pro',
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
      success('Successfully upgraded to Pro! Enjoy unlimited clinical reports and unlocked advanced features.');
    }
  };

  const upgradeToEnterprise = async () => {
    if (isGuest) {
      setGuestTier('enterprise');
      setGuestSubscriptionExpiresAt(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
      success('Successfully upgraded guest session to Enterprise! Enjoy institutional-grade HIPAA-ready tools.');
    } else {
      await updateProfile({ 
        subscriptionTier: 'enterprise',
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
      success('Successfully upgraded to Enterprise! Enjoy institutional-grade HIPAA-ready tools.');
    }
  };

  const downgradeToFree = async () => {
    if (isGuest) {
      setGuestTier('free');
      setGuestTrialExpiresAt(undefined);
      setGuestSubscriptionExpiresAt(undefined);
      info('Reverted guest session to Free Plan limits.');
    } else {
      await updateProfile({ 
        subscriptionTier: 'free',
        trialExpiresAt: undefined,
        subscriptionExpiresAt: undefined
      });
      info('Reverted profile to Free Plan limits.');
    }
  };

  const startProTrial = async () => {
    if (trialUsed) {
      warning('One trial per account limit enforced. You have already consumed your 14-day Pro trial.');
      return;
    }
    const expiryDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    if (isGuest) {
      setGuestTier('pro');
      setGuestTrialUsed(true);
      setGuestTrialExpiresAt(expiryDate);
    } else {
      await updateProfile({
        subscriptionTier: 'pro',
        trialUsed: true,
        trialExpiresAt: expiryDate
      });
    }
    info('🎉 Subscription Activated! Your 14-day Pro Trial has commenced. Enjoy full professional capabilities.');
  };

  // Automated Expiry & Demotion daemon
  useEffect(() => {
    if (subscriptionTier === 'free') return;

    const daemonCheck = () => {
      const now = new Date();
      
      // Check Pro trial limits
      if (trialExpiresAt) {
        const expiry = new Date(trialExpiresAt);
        if (now > expiry) {
          downgradeToFree();
          warning('⏳ Plan Expired: Your 14-day Pro Trial has expired. Workspace limits have reverted to Free, but all saved reports remain secure.');
        }
      }

      // Check main subscription limits
      if (subscriptionExpiresAt) {
        const expiry = new Date(subscriptionExpiresAt);
        if (now > expiry) {
          downgradeToFree();
          warning('⚠️ Plan Expired: Your active premium subscription has expired. Reverting to Free Plan limits. All saved reports remain secure.');
        }
      }
    };

    daemonCheck();
    const intervalId = setInterval(daemonCheck, 5000); // Poll every 5s for demo responsiveness
    return () => clearInterval(intervalId);
  }, [subscriptionTier, trialExpiresAt, subscriptionExpiresAt]);

  // Billing & SaaS Event Simulators
  const simulatePaymentSuccess = () => {
    success('💳 Payment Successful! Real-time credit transaction validated. Receipt sent to workspace inbox.');
  };

  const simulatePaymentFailure = () => {
    warning('❌ Payment Failed: Transaction authorization declined by bank. Please verify billing credentials.');
  };

  const simulatePlanRenewal = () => {
    success('🔄 Plan Renewed! Automated subscription cycle renewal for the next period processed successfully.');
  };

  const simulatePlanExpiration = () => {
    if (isGuest) {
      setGuestTier('free');
      setGuestTrialExpiresAt(undefined);
      setGuestSubscriptionExpiresAt(undefined);
    } else {
      // Direct offline demotion
      updateProfile({
        subscriptionTier: 'free',
        trialExpiresAt: undefined,
        subscriptionExpiresAt: undefined
      }).catch(console.error);
    }
    warning('⚠️ Plan Expired: Premium subscription credentials revoked. Reverted to Free Plan limits. All clinical records left intact.');
  };

  const simulateTrialEndingSoon = () => {
    warning('⏳ Trial Ending Soon: Your 14-day Pro Trial will conclude in 2 days. Upgrade to Pro/Enterprise to lock in your workspace.');
  };

  const simulateMonthlyLimitReached = () => {
    warning('⚠️ Monthly Limit Reached: You have processed 10 out of 10 clinical reports. Upgrade to bypass limits.');
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      loading,
      isGuest,
      role,
      subscriptionTier,
      upgradeToPro,
      upgradeToEnterprise,
      downgradeToFree,
      startProTrial,
      simulatePaymentSuccess,
      simulatePaymentFailure,
      simulatePlanRenewal,
      simulatePlanExpiration,
      simulateTrialEndingSoon,
      simulateMonthlyLimitReached,
      trialUsed,
      trialExpiresAt,
      subscriptionExpiresAt,
      isUpgradeModalOpen,
      setUpgradeModalOpen,
      login,
      signup,
      loginWithGoogle,
      loginAsGuest,
      logout,
      resetPassword,
      updateProfile,
      changePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be invoked within an AuthProvider scope.');
  }
  return context;
}

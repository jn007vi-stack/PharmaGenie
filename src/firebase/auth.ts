import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  signInWithPopup,
  signInAnonymously,
  updatePassword,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider, db } from './config';
import { setDoc, doc } from 'firebase/firestore';
import { createUserProfile, getUserProfile, updateUserProfile, UserProfile } from './firestore';

// --- AUTHENTICATION ACTIONS ---

// Sign Up with Email and Password
export async function signUpWithEmail(
  email: string, 
  password: string, 
  fullName: string, 
  institution: string, 
  country: string
): Promise<UserProfile> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Set displayName on Firebase User Profile
  await updateProfile(user, { displayName: fullName });

  // Create default User Profile in Firestore with 'Student' role
  const profile = await createUserProfile(user.uid, {
    fullName,
    email,
    role: 'Student',
    institution: institution || 'None',
    country: country || 'None',
    profilePhoto: user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.uid}`,
    themePreference: 'light'
  });

  return profile;
}

// Sign In with Email and Password
export async function signInWithEmail(email: string, password: string): Promise<UserProfile> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Retrieve Firestore Profile
  let profile = await getUserProfile(user.uid);
  const now = new Date().toISOString();

  if (!profile) {
    // If auth exists but no profile (e.g. legacy/sync error), build a standard profile
    profile = await createUserProfile(user.uid, {
      fullName: user.displayName || 'PharmaGenie User',
      email: user.email || email,
      role: 'Student',
      institution: 'None',
      country: 'None',
      profilePhoto: user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.uid}`,
      themePreference: 'light'
    });
  } else {
    // Update lastLogin timestamp
    await updateUserProfile(user.uid, { lastLogin: now });
    profile.lastLogin = now;
  }

  return profile;
}

// Google Sign-In
export async function signInWithGoogle(): Promise<UserProfile> {
  const userCredential = await signInWithPopup(auth, googleProvider);
  const user = userCredential.user;

  let profile = await getUserProfile(user.uid);
  const now = new Date().toISOString();

  if (!profile) {
    // If new user via Google, register them with 'Student' role
    profile = await createUserProfile(user.uid, {
      fullName: user.displayName || 'Google User',
      email: user.email || '',
      role: 'Student',
      institution: 'None',
      country: 'None',
      profilePhoto: user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.uid}`,
      themePreference: 'light'
    });
  } else {
    // Update last login
    await updateUserProfile(user.uid, { lastLogin: now });
    profile.lastLogin = now;
  }

  return profile;
}

// Guest Login (Anonymous mode)
export async function signInAsGuest(): Promise<UserProfile> {
  const userCredential = await signInAnonymously(auth);
  const user = userCredential.user;

  const anonymousProfile: UserProfile = {
    uid: user.uid,
    fullName: 'Guest Clinical Officer',
    email: 'guest@pharmagenie.local',
    role: 'Student', // Guests act with default Student permissions
    institution: 'Temporary Session Workspace',
    country: 'Local Sandbox',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    profilePhoto: `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
    themePreference: 'light'
  };

  // We do not strictly need to write guest accounts to users collection immediately
  // but let's register it to be safe for offline sync profiles.
  try {
    await setDoc(doc(db, 'users', user.uid), anonymousProfile, { merge: true });
  } catch (err) {
    console.warn('Silent fallback for anonymous guest doc setting (likely offline/permissions).');
  }

  return anonymousProfile;
}

// Forgot Password / Recovery email
export async function forgotPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// Log Out
export async function logOutUser(): Promise<void> {
  await signOut(auth);
}

// Update Active Password
export async function updateUserPassword(newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user is currently authenticated.');
  }
  await updatePassword(user, newPassword);
}

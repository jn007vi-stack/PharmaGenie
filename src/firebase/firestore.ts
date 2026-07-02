import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp, 
  increment 
} from 'firebase/firestore';
import { db } from './config';
import { GeneType, PhenotypeType, RiskLevel, AgeGroupType, GuidelineStatus } from '../types';

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  role: 'Student' | 'Researcher' | 'Clinician' | 'Administrator';
  institution: string;
  country: string;
  createdAt: string;
  lastLogin: string;
  profilePhoto: string;
  themePreference: 'light' | 'dark';
  subscriptionTier?: 'free' | 'pro' | 'enterprise';
  trialUsed?: boolean;
  trialExpiresAt?: string;
  subscriptionExpiresAt?: string;
}

export interface CloudReport {
  id?: string;
  reportId?: string; // mapped to Firestore document ID
  userId: string; // auth uid or 'guest'
  sessionId?: string; // fallback session ID
  patientId: string;
  gene: GeneType;
  phenotype: PhenotypeType;
  drug: string;
  riskLevel: RiskLevel;
  guidelineStatus: GuidelineStatus;
  evidenceLevel: string;
  suggestedAlternative: string; // mapped to alternativeDrugs
  explanation: string; // mapped to interpretation/recommendation
  ageGroup: AgeGroupType;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

const USERS_COLLECTION = 'users';
const REPORTS_COLLECTION = 'reports';

// --- USER PROFILES SERVICES ---

export async function createUserProfile(uid: string, profile: Omit<UserProfile, 'uid' | 'createdAt' | 'lastLogin'>) {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const now = new Date().toISOString();
  const newProfile: UserProfile = {
    uid,
    ...profile,
    createdAt: now,
    lastLogin: now,
  };
  await setDoc(userRef, newProfile, { merge: true });
  return newProfile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
  }
  return null;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  const userRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userRef, {
    ...data,
  });
}

export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const q = query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const users: UserProfile[] = [];
    snapshot.forEach((doc) => {
      users.push(doc.data() as UserProfile);
    });
    return users;
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
}

export async function updateUserRole(uid: string, role: UserProfile['role']) {
  const userRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userRef, { role });
}

export async function deleteUserAccount(uid: string) {
  const userRef = doc(db, USERS_COLLECTION, uid);
  await deleteDoc(userRef);
}

// --- REPORTS DB SERVICES ---

export async function saveUserReport(report: Omit<CloudReport, 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date().toISOString();
  const reportsCol = collection(db, REPORTS_COLLECTION);
  
  const reportData = {
    ...report,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(reportsCol, reportData);
  await updateDoc(docRef, { reportId: docRef.id });
  return docRef.id;
}

export async function updateUserReport(reportId: string, data: Partial<CloudReport>): Promise<void> {
  const reportRef = doc(db, REPORTS_COLLECTION, reportId);
  const now = new Date().toISOString();
  await updateDoc(reportRef, {
    ...data,
    updatedAt: now,
  });
}

export async function deleteUserReport(reportId: string): Promise<void> {
  const reportRef = doc(db, REPORTS_COLLECTION, reportId);
  await deleteDoc(reportRef);
}

export async function getUserReports(userId: string, sessionId: string): Promise<CloudReport[]> {
  try {
    const reportsCol = collection(db, REPORTS_COLLECTION);
    let q;

    if (userId && userId !== 'guest') {
      // If logged in, fetch by user ID
      q = query(
        reportsCol,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
    } else {
      // Otherwise fallback to session ID
      q = query(
        reportsCol,
        where('sessionId', '==', sessionId),
        orderBy('createdAt', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    const reports: CloudReport[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as Record<string, any>;
      reports.push({
        id: doc.id,
        reportId: doc.id,
        ...data,
      } as unknown as CloudReport);
    });
    return reports;
  } catch (error) {
    console.error('Error fetching user reports from Firestore:', error);
    return [];
  }
}

// --- ADMIN STATISTICS & ANALYTICS ---

export interface AdminStats {
  totalUsers: number;
  totalReports: number;
  activeUsers: number; // calculated loosely from login recency
  drugQueries: { name: string; count: number }[];
  geneQueries: { name: string; count: number }[];
  recentUsers: UserProfile[];
  recentReports: CloudReport[];
}

export async function getAdminStatistics(): Promise<AdminStats> {
  try {
    // 1. Fetch Users
    const usersCol = collection(db, USERS_COLLECTION);
    const usersSnap = await getDocs(usersCol);
    const totalUsers = usersSnap.size;

    const usersList: UserProfile[] = [];
    let activeCount = 0;
    const standardLimitDate = new Date();
    standardLimitDate.setDate(standardLimitDate.getDate() - 30); // 30 days active limit

    usersSnap.forEach((doc) => {
      const u = doc.data() as UserProfile;
      usersList.push(u);
      if (new Date(u.lastLogin) >= standardLimitDate) {
        activeCount++;
      }
    });

    // 2. Fetch Reports
    const reportsCol = collection(db, REPORTS_COLLECTION);
    const reportsSnap = await getDocs(reportsCol);
    const totalReports = reportsSnap.size;

    const reportsList: CloudReport[] = [];
    const drugCountMap: Record<string, number> = {};
    const geneCountMap: Record<string, number> = {};

    reportsSnap.forEach((doc) => {
      const r = doc.data() as CloudReport;
      reportsList.push({ id: doc.id, ...r } as CloudReport);

      // Map drug queries
      const dName = (r.drug || '').trim();
      if (dName) {
        drugCountMap[dName] = (drugCountMap[dName] || 0) + 1;
      }

      // Map gene queries
      const gName = (r.gene || '').trim();
      if (gName) {
        geneCountMap[gName] = (geneCountMap[gName] || 0) + 1;
      }
    });

    // Sort drugs queried
    const drugQueries = Object.entries(drugCountMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Sort genes queried
    const geneQueries = Object.entries(geneCountMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Sort recents
    const recentUsers = [...usersList]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    const recentReports = [...reportsList]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      totalUsers,
      totalReports,
      activeUsers: activeCount || totalUsers,
      drugQueries,
      geneQueries,
      recentUsers,
      recentReports,
    };
  } catch (error) {
    console.error('Error compiling admin statistics:', error);
    return {
      totalUsers: 0,
      totalReports: 0,
      activeUsers: 0,
      drugQueries: [],
      geneQueries: [],
      recentUsers: [],
      recentReports: [],
    };
  }
}

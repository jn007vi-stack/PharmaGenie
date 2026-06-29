import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, limit } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0955761372",
  appId: "1:451398243071:web:c9894c683af306f0d532ca",
  apiKey: "AIzaSyBip9egS-39aJIfhipusEL7yjmMhNif5lE",
  authDomain: "gen-lang-client-0955761372.firebaseapp.com",
  storageBucket: "gen-lang-client-0955761372.firebasestorage.app",
  messagingSenderId: "451398243071"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export interface SavedReport {
  id?: string;
  gene: string;
  phenotype: string;
  drug: string;
  riskLevel: string;
  guidelineStatus: string;
  evidenceLevel: string;
  suggestedAlternative?: string;
  explanation: string;
  timestamp: any;
  sessionId: string;
  ageGroup?: string;
}

const REPORTS_COLLECTION = 'reports';

// Save a generated clinical report to Firestore
export async function saveReport(report: Omit<SavedReport, 'timestamp'>) {
  try {
    const docRef = await addDoc(collection(db, REPORTS_COLLECTION), {
      ...report,
      timestamp: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving report to Firestore:', error);
    throw error;
  }
}

// Retrieve recent reports for the current guest session from Firestore
export async function getSavedReports(sessionId: string): Promise<SavedReport[]> {
  try {
    const q = query(
      collection(db, REPORTS_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    const querySnapshot = await getDocs(q);
    const reports: SavedReport[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Filter by sessionId to make sure users only see their own history in the browser
      if (data.sessionId === sessionId) {
        reports.push({
          id: doc.id,
          gene: data.gene,
          phenotype: data.phenotype,
          drug: data.drug,
          riskLevel: data.riskLevel,
          guidelineStatus: data.guidelineStatus,
          evidenceLevel: data.evidenceLevel,
          suggestedAlternative: data.suggestedAlternative,
          explanation: data.explanation,
          timestamp: data.timestamp,
          sessionId: data.sessionId,
          ageGroup: data.ageGroup
        });
      }
    });
    return reports;
  } catch (error) {
    console.error('Error fetching reports from Firestore:', error);
    // Return empty array as fallback
    return [];
  }
}

// Delete a saved clinical report from history
export async function deleteSavedReport(id: string) {
  try {
    const docRef = doc(db, REPORTS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting report from Firestore:', error);
    throw error;
  }
}

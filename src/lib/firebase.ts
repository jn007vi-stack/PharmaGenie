import { db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';



export interface SavedReport {
  id?: string;
  patientId: string;
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
  userId?: string;
}

const REPORTS_COLLECTION = 'reports';
const LOCAL_STORAGE_KEY = 'pharmagenie_local_reports';

// Helper to get local storage reports
function getLocalReports(): SavedReport[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
}

// Helper to save local storage reports
function saveLocalReports(reports: SavedReport[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reports));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
}

// Save a generated clinical report to Firestore (with localStorage fallback)
export async function saveReport(report: Omit<SavedReport, 'timestamp'>) {
  const localId = 'report_' + Math.random().toString(36).substring(2, 15);
  const newReport: SavedReport = {
    ...report,
    id: localId,
    timestamp: new Date().toISOString()
  };

  // 1. Save to localStorage immediately for instant offline feedback
  const localReports = getLocalReports();
  saveLocalReports([newReport, ...localReports]);

  // 2. Try to save to Firestore
  try {
    const docRef = await addDoc(collection(db, REPORTS_COLLECTION), {
      ...report,
      timestamp: new Date().toISOString()
    });
    
    // Update local report ID with real Firestore ID if successful
    const updatedLocalReports = getLocalReports().map(r => 
      r.id === localId ? { ...r, id: docRef.id } : r
    );
    saveLocalReports(updatedLocalReports);
    
    return docRef.id;
  } catch (error) {
    console.warn('Firestore offline or unreachable. Saving locally instead:', error);
    // Return localId as fallback so the app continues working flawlessly
    return localId;
  }
}

// Retrieve recent reports for the current guest session (with merge and fallback)
export async function getSavedReports(sessionId: string, userId?: string): Promise<SavedReport[]> {
  let firestoreReports: SavedReport[] = [];
  let fetchFailed = false;

  try {
    // Get last 150 documents to filter in memory to prevent complex index errors
    const q = query(
      collection(db, REPORTS_COLLECTION),
      limit(150)
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const isUserMatch = userId && userId !== 'guest' && data.userId === userId;
      const isSessionMatch = data.sessionId === sessionId;

      if (isUserMatch || isSessionMatch) {
        firestoreReports.push({
          id: doc.id,
          patientId: data.patientId || `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
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
          ageGroup: data.ageGroup,
          userId: data.userId
        });
      }
    });
  } catch (error) {
    console.warn('Failed to retrieve reports from Firestore, using local cache:', error);
    fetchFailed = true;
  }

  // Get current localStorage reports
  const localReports = getLocalReports().filter(r => {
    const isUserMatch = userId && userId !== 'guest' && r.userId === userId;
    const isSessionMatch = r.sessionId === sessionId;
    return isUserMatch || isSessionMatch;
  });

  if (fetchFailed) {
    // If firestore failed, return local storage reports
    return localReports;
  }

  // If firestore succeeded, sync local storage with firestore results to avoid duplicate/missing entries
  // Merge firestore results and local storage reports based on unique values
  const mergedMap = new Map<string, SavedReport>();
  
  // Add firestore reports first (these are official)
  firestoreReports.forEach(r => {
    if (r.id) mergedMap.set(r.id, r);
  });

  // Add local reports if they don't exist in firestore list (e.g. created while offline)
  localReports.forEach(r => {
    // Try to find matching record by drug, gene, phenotype to prevent duplicates of unsynced items
    const isDuplicate = firestoreReports.some(fr => 
      fr.drug.toLowerCase() === r.drug.toLowerCase() &&
      fr.gene === r.gene &&
      fr.phenotype === r.phenotype &&
      fr.patientId === r.patientId
    );
    if (r.id && !mergedMap.has(r.id) && !isDuplicate) {
      mergedMap.set(r.id, r);
    }
  });

  const mergedList = Array.from(mergedMap.values()).sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA;
  });

  // Save the synchronized/merged state back to localStorage
  const allLocalReports = getLocalReports().filter(r => {
    const isUserMatch = userId && userId !== 'guest' && r.userId === userId;
    const isSessionMatch = r.sessionId === sessionId;
    return !(isUserMatch || isSessionMatch);
  });
  saveLocalReports([...mergedList, ...allLocalReports]);

  return mergedList;
}

// Delete a saved clinical report from history (with localStorage fallback)
export async function deleteSavedReport(id: string) {
  // 1. Delete from local storage immediately for responsive UI
  const localReports = getLocalReports();
  saveLocalReports(localReports.filter(r => r.id !== id));

  // 2. Try to delete from Firestore
  try {
    const docRef = doc(db, REPORTS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Failed to delete report from Firestore, removed from local cache:', error);
    // Do not throw so that the application remains functional
  }
}

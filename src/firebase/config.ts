import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: "gen-lang-client-0955761372",
  appId: "1:451398243071:web:c9894c683af306f0d532ca",
  apiKey: "AIzaSyBip9egS-39aJIfhipusEL7yjmMhNif5lE",
  authDomain: "gen-lang-client-0955761372.firebaseapp.com",
  storageBucket: "gen-lang-client-0955761372.firebasestorage.app",
  messagingSenderId: "451398243071"
};

// Initialize Firebase once
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with explicit offline multi-tab persistence
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, "ai-studio-pharmagenie-0d6f3253-5cbc-4b63-ae09-5e5d0ad84d04");

export const storage = getStorage(app);

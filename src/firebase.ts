import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const isNonEmpty = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const requiredFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const firebaseConfig: FirebaseOptions = {
  ...requiredFirebaseConfig,
  storageBucket: isNonEmpty(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET)
    ? import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
    : undefined,
  messagingSenderId: isNonEmpty(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID)
    ? import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID
    : undefined,
};

const hasFirebaseConfig = Object.values(requiredFirebaseConfig).every(isNonEmpty);

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firebaseDb: Firestore | null = null;

if (hasFirebaseConfig) {
  firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  firebaseAuth = getAuth(firebaseApp);
  firebaseDb = getFirestore(firebaseApp);
} else {
  console.warn('Firebase is not configured. Add VITE_FIREBASE_* values to enable it.');
}

export { firebaseApp, firebaseAuth, firebaseDb, hasFirebaseConfig };

export const firebaseStatusMessage = hasFirebaseConfig
  ? 'Firebase connected in this app.'
  : 'Firebase is not configured yet. Add VITE_FIREBASE_* values to enable it.';

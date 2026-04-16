import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const isNonEmpty = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const fallbackFirebaseConfig = {
  apiKey: 'AIzaSyChMJT2kqmpULyeWNq3gkGAjh8vl3kAg34',
  authDomain: 'choose-your-adventure-b8818.firebaseapp.com',
  projectId: 'choose-your-adventure-b8818',
  appId: '1:726368152254:web:464e79b2ae6f51e7c68cef',
  storageBucket: 'choose-your-adventure-b8818.firebasestorage.app',
  messagingSenderId: '726368152254',
};

const readConfig = (envValue: unknown, fallbackValue: string): string =>
  isNonEmpty(envValue) ? envValue : fallbackValue;

const requiredFirebaseConfig = {
  apiKey: readConfig(import.meta.env.VITE_FIREBASE_API_KEY, fallbackFirebaseConfig.apiKey),
  authDomain: readConfig(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, fallbackFirebaseConfig.authDomain),
  projectId: readConfig(import.meta.env.VITE_FIREBASE_PROJECT_ID, fallbackFirebaseConfig.projectId),
  appId: readConfig(import.meta.env.VITE_FIREBASE_APP_ID, fallbackFirebaseConfig.appId),
};

const firebaseConfig: FirebaseOptions = {
  ...requiredFirebaseConfig,
  storageBucket: readConfig(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, fallbackFirebaseConfig.storageBucket),
  messagingSenderId: readConfig(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, fallbackFirebaseConfig.messagingSenderId),
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

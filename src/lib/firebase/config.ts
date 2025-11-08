// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// Helper to safely get environment variable (prevents undefined from being passed to Firebase)
function getEnvVar(key: string): string {
  const value = process.env[key];
  // Return empty string if undefined/null, but this will cause Firebase to fail with a clear error
  // Better than passing undefined which causes "Failed to construct Headers" error
  return value || '';
}

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: getEnvVar('NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getEnvVar('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('NEXT_PUBLIC_FIREBASE_APP_ID'),
  // measurementId is optional - only include if it exists and is not empty
  ...(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim() && {
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  }),
};

// Validate that required config values are present (for better error messages)
if (typeof window !== 'undefined') {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'] as const;
  const missingFields = requiredFields.filter(field => !firebaseConfig[field] || firebaseConfig[field].trim() === '');
  
  if (missingFields.length > 0) {
    console.error(
      `Firebase configuration error: Missing or empty required fields: ${missingFields.join(', ')}. ` +
      `Please check that all Firebase environment variables are set in Firebase App Hosting secrets.`
    );
  }
}

// Initialize Firebase - works in both browser and server environments
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Analytics (client-side only)
let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((error) => {
    console.warn('Analytics initialization failed:', error);
  });
}

// Initialize App Check for client-side environments (optional - app works without it)
if (typeof window !== 'undefined') {
  // Only initialize App Check if explicitly enabled and configured
  const enableAppCheck = process.env.NEXT_PUBLIC_ENABLE_APP_CHECK === 'true';
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  
  if (enableAppCheck && recaptchaSiteKey) {
    try {
      if (process.env.NODE_ENV === 'development') {
        // Set debug token BEFORE initializing App Check
        // @ts-ignore
        window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
        // @ts-ignore  
        self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
        console.log('App Check: Debug token set for development');
      }
      
      const appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true
      });
      console.log('App Check: Initialized successfully');
    } catch (error) {
      // Silently fail - App Check is optional
      console.warn('App Check initialization failed - app will continue without it:', error);
    }
  } else {
    // App Check disabled or not configured - this is fine
    console.log('App Check: Not enabled or not configured - app will work without it');
  }
}

export { app, auth, db, analytics };
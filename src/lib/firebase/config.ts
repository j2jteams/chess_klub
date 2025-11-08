// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

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
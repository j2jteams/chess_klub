// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

// Debug: Log what values we're getting
console.log('[Firebase Config] API Key:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'SET' : 'MISSING');
console.log('[Firebase Config] Auth Domain:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'SET' : 'MISSING');
console.log('[Firebase Config] Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'SET' : 'MISSING');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

console.log('[Firebase Config] Full config:', firebaseConfig);

// Initialize Firebase - works in both browser and server environments
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize App Check for client-side environments
if (typeof window !== 'undefined') {
  try {
    if (process.env.NODE_ENV === 'development') {
      // Set debug token BEFORE initializing App Check
      // @ts-ignore
      window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      // @ts-ignore  
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      
      console.log('App Check: Debug token set for development');
    }
    
    // Initialize App Check with better error handling
    if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && process.env.NODE_ENV === 'production') {
      // Production with reCAPTCHA - only if we have a valid key
      try {
        const appCheck = initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY),
          isTokenAutoRefreshEnabled: true
        });
        console.log('App Check: Initialized with reCAPTCHA for production');
      } catch (recaptchaError) {
        console.error('App Check reCAPTCHA initialization failed:', recaptchaError);
        // Don't throw - allow app to continue without App Check
      }
    } else if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
      // Development with test site key
      const appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true
      });
      console.log('App Check: Initialized for development with debug mode');
    }
  } catch (error) {
    console.warn('App Check initialization failed - continuing without App Check:', error);
    // Don't throw - allow app to work without App Check
  }
}

export { app, auth, db };
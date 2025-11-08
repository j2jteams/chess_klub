'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User as FirebaseUser,
  UserCredential,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  applyActionCode
} from 'firebase/auth';

import { auth, db } from '../firebase/config';
import { User } from '../models/user';
import { UserRepository } from '../firebase/repositories';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  updateUserLocation: (location: string) => Promise<void>;

  signUpWithEmail: (
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<any>;
  verifyEmailOobCode: (oobCode: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  error: null,
  logout: async () => {
    throw new Error('AuthContext not initialized');
  },
  updateUserLocation: async () => {
    throw new Error('AuthContext not initialized');
  },
  signUpWithEmail: async () => { throw new Error('AuthContext not initialized'); },
  loginWithEmail: async () => { throw new Error('AuthContext not initialized'); },
  verifyEmailOobCode: async () => { throw new Error('AuthContext not initialized'); },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle user profile in Firestore
  const handleUserProfile = async (firebaseUser: FirebaseUser) => {
    if (!db) return;
    
    try {
      // Try to get existing user profile
      const existingUser = await UserRepository.getUserById(firebaseUser.uid);
      
      if (existingUser) {
        // Load existing user profile
        setUser(existingUser);
      } else {
        // Create a new user profile if it doesn't exist
        const newUser = await UserRepository.createUser({
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
        setUser(newUser);
      }
    } catch (error) {
      console.error('Error handling user profile:', error);
    }
  };

  // Update user location
  const updateUserLocation = useCallback(async (location: string) => {
    if (!user || !firebaseUser) return;
    
    try {
      const updatedPreferences = {
        notificationMethods: [],
        emailNotifications: false,
        smsNotifications: false,
        whatsappNotifications: false,
        ...user.preferences,
        location
      };
      
      await UserRepository.updateUserPreferences(firebaseUser.uid, updatedPreferences);
      
      // Update local user state
      setUser({
        ...user,
        preferences: updatedPreferences
      });
    } catch (error) {
      console.error('Error updating user location:', error);
      throw error;
    }
  }, [user, firebaseUser]);


  // Sign out
  const logout = async (): Promise<void> => {
    if (!auth) throw new Error('Firebase not initialized');
    
    try {
      setError(null);
      await signOut(auth);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    }
  };


  // Listen to authentication state changes
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        // Load user profile from Firestore
        await handleUserProfile(firebaseUser);
      } else {
        // Clear user profile when signed out
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  const signUpWithEmail = async (firstName: string, lastName: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: `${firstName} ${lastName}` });
    await UserRepository.createUser({
      id: cred.user.uid,
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: `${firstName} ${lastName}`,
      photoURL: cred.user.photoURL,
    });
    // Email verification removed - not required for admin sign-ups
  };
  
  const loginWithEmail = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    // Email verification check removed - not required
    await handleUserProfile(cred.user);
    return cred;
  };
  
  const verifyEmailOobCode = async (oobCode: string) => {
    await applyActionCode(auth, oobCode);
    if (auth.currentUser) {
      await auth.currentUser.reload();
      await handleUserProfile(auth.currentUser);
    }
  };
  
  const value = {
    user,
    firebaseUser,
    loading,
    error,
    logout,
    updateUserLocation,
    signUpWithEmail,
    loginWithEmail,
    verifyEmailOobCode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
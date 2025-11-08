'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { UserRepository } from '@/lib/firebase/repositories';
import { CachedLocationData } from '@/lib/models';
import { Timestamp } from 'firebase/firestore';

interface LocationState {
  location: string;
  loading: boolean;
  error: string | null;
  isFromCache: boolean;
  cachedData: CachedLocationData | null;
}

interface LocationContextType extends LocationState {
  refetch: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const LOCATION_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<LocationState>({
    location: '',
    loading: true,
    error: null,
    isFromCache: false,
    cachedData: null,
  });
  const [locationInitialized, setLocationInitialized] = useState(false);

  const isLocationCacheValid = (cachedLocation: CachedLocationData): boolean => {
    const now = Date.now();
    const lastUpdated = cachedLocation.lastUpdated instanceof Timestamp 
      ? cachedLocation.lastUpdated.toMillis() 
      : new Date(cachedLocation.lastUpdated).getTime();
    
    return (now - lastUpdated) < LOCATION_CACHE_DURATION;
  };

  const fetchAndCacheLocation = async (): Promise<void> => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Geolocation is not supported by this browser',
      }));
      return;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Use reverse geocoding to get city, state from coordinates
            const response = await fetch(
              `/api/geocode?latitude=${latitude}&longitude=${longitude}`
            );
            
            if (response.ok) {
              const data = await response.json();
              const city = data.city || data.locality || '';
              const state = data.principalSubdivision || '';
              const formattedLocation = city && state ? `${city}, ${state}` : city || 'Current Location';
              
              const cachedLocationData: CachedLocationData = {
                latitude,
                longitude,
                city,
                state,
                country: data.country,
                locality: data.locality,
                principalSubdivision: data.principalSubdivision,
                formattedLocation,
                lastUpdated: Timestamp.now(),
              };

              setState({
                location: formattedLocation,
                loading: false,
                error: null,
                isFromCache: false,
                cachedData: cachedLocationData,
              });

              // Cache the location data if user is authenticated
              if (user?.uid) {
                try {
                  await UserRepository.updateCachedLocation(user.uid, cachedLocationData);
                } catch (error) {
                  console.error('Failed to cache location:', error);
                }
              }
            } else {
              throw new Error('Failed to get location name');
            }
          } catch (error) {
            // Fallback to coordinates if reverse geocoding fails
            console.error('Reverse geocoding failed:', error);
            const fallbackLocation = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
            
            setState({
              location: fallbackLocation,
              loading: false,
              error: null,
              isFromCache: false,
              cachedData: null,
            });
          }
          resolve();
        },
        (err) => {
          let errorMessage = 'Failed to get location';
          
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = 'Location access denied';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case err.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          
          setState(prev => ({
            ...prev,
            loading: false,
            error: errorMessage,
          }));
          resolve();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  };

  const loadLocation = async () => {
    // Only initialize location once
    if (locationInitialized) {
      return;
    }

    setLocationInitialized(true);

    if (!user?.uid) {
      // User not authenticated, fetch location normally
      await fetchAndCacheLocation();
      return;
    }

    try {
      // Check for cached location first
      const cachedLocation = await UserRepository.getCachedLocation(user.uid);
      
      if (cachedLocation && isLocationCacheValid(cachedLocation)) {
        // Use cached location
        setState({
          location: cachedLocation.formattedLocation,
          loading: false,
          error: null,
          isFromCache: true,
          cachedData: cachedLocation,
        });
      } else {
        // Cache is invalid or doesn't exist, fetch new location
        await fetchAndCacheLocation();
      }
    } catch (error) {
      console.error('Failed to load cached location:', error);
      // Fallback to fetching location normally
      await fetchAndCacheLocation();
    }
  };

  const refetch = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    await fetchAndCacheLocation();
  };

  useEffect(() => {
    // Reset location when user changes (login/logout)
    if (user === null || user === undefined) {
      setLocationInitialized(false);
      setState({
        location: '',
        loading: true,
        error: null,
        isFromCache: false,
        cachedData: null,
      });
    }
    
    loadLocation();
  }, [user?.uid]);

  const value: LocationContextType = {
    ...state,
    refetch,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
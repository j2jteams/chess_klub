'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { UserRole } from '@/lib/models';

export function useProtectedRoute() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Must be authenticated
      if (!user) {
        router.push('/login');
        return;
      }
      
      // Must have admin or owner role
      if (!user.role || (user.role !== UserRole.OWNER && user.role !== UserRole.ADMIN)) {
        // Don't redirect, let the component show the pending message
        // The dashboard page will handle showing the appropriate message
      }
    }
  }, [user, loading, router]);

  return { user, loading };
}
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import LogoutButton from './LogoutButton';

export default function UserProfile() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <Link 
        href="/login" 
        className="text-sm text-primary hover:underline"
      >
        Admin Login
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col">
        <span className="text-sm font-medium">{user.displayName}</span>
        <span className="text-xs text-muted-foreground">{user.email}</span>
      </div>
      {user.photoURL && (
        <div className="relative w-8 h-8 rounded-full overflow-hidden">
          <Image
            src={user.photoURL}
            alt={user.displayName || 'User'}
            fill
            className="object-cover"
          />
        </div>
      )}
      <LogoutButton />
    </div>
  );
}
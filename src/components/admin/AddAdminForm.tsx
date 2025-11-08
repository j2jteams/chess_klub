'use client';

import { useState } from 'react';
import { User } from '@/lib/models';
import { UserRepository } from '@/lib/firebase/repositories/user-repository';
import { Search, UserPlus, Loader2 } from 'lucide-react';
import { useNotifications } from '@/components/ui/notification';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AddAdminFormProps {
  onAdminAdded?: () => void;
}

export default function AddAdminForm({ onAdminAdded }: AddAdminFormProps) {
  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [promoting, setPromoting] = useState(false);
  const { showSuccess, showError } = useNotifications();

  const handleSearch = async () => {
    if (!email.trim()) {
      showError('Please enter an email address');
      return;
    }

    try {
      setSearching(true);
      setFoundUser(null);
      const user = await UserRepository.getUserByEmail(email.trim());
      
      if (!user) {
        showError('No user found with this email address');
        return;
      }

      if (user.role === 'admin') {
        showError('This user is already an admin');
        return;
      }

      if (user.role === 'owner') {
        showError('This user is the owner');
        return;
      }

      setFoundUser(user);
    } catch (error) {
      console.error('Error searching for user:', error);
      showError('Failed to search for user');
    } finally {
      setSearching(false);
    }
  };

  const handlePromote = async () => {
    if (!foundUser) return;

    try {
      setPromoting(true);
      await UserRepository.promoteToAdmin(foundUser.id);
      showSuccess(`${foundUser.displayName || foundUser.email} has been promoted to admin`);
      setEmail('');
      setFoundUser(null);
      onAdminAdded?.();
    } catch (error) {
      console.error('Error promoting user:', error);
      showError('Failed to promote user to admin');
    } finally {
      setPromoting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Search by email address..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={searching || !email.trim()}
          className="flex items-center gap-2"
        >
          {searching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Search
            </>
          )}
        </Button>
      </div>

      {foundUser && (
        <div className="p-4 bg-muted border rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">
                {foundUser.displayName || 'No name'}
              </div>
              <div className="text-sm text-muted-foreground">
                {foundUser.email || 'No email'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Current role: {foundUser.role || 'No role (pending)'}
              </div>
            </div>
            <Button
              onClick={handlePromote}
              disabled={promoting}
              className="flex items-center gap-2"
            >
              {promoting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Promoting...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Promote to Admin
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


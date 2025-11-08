'use client';

import { useState, useEffect } from 'react';
import { User } from '@/lib/models';
import { UserRepository } from '@/lib/firebase/repositories/user-repository';
import { Trash2, Users } from 'lucide-react';
import { useNotifications } from '@/components/ui/notification';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface AdminListProps {
  onAdminRemoved?: () => void;
}

export default function AdminList({ onAdminRemoved }: AdminListProps) {
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingAdminId, setRemovingAdminId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [adminToRemove, setAdminToRemove] = useState<User | null>(null);
  const { showSuccess, showError } = useNotifications();

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const adminUsers = await UserRepository.getAllAdmins();
      setAdmins(adminUsers);
    } catch (error) {
      console.error('Error loading admins:', error);
      showError('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveClick = (admin: User) => {
    setAdminToRemove(admin);
    setShowConfirmDialog(true);
  };

  const handleConfirmRemove = async () => {
    if (!adminToRemove) return;

    try {
      setRemovingAdminId(adminToRemove.id);
      await UserRepository.demoteFromAdmin(adminToRemove.id);
      showSuccess(`${adminToRemove.displayName || adminToRemove.email} has been removed as admin`);
      setShowConfirmDialog(false);
      setAdminToRemove(null);
      await loadAdmins();
      onAdminRemoved?.();
    } catch (error) {
      console.error('Error removing admin:', error);
      showError('Failed to remove admin');
    } finally {
      setRemovingAdminId(null);
    }
  };

  const formatDate = (date: string | { toDate?: () => Date } | undefined) => {
    if (!date) return 'N/A';
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString();
    }
    if (date && typeof date === 'object' && 'toDate' in date) {
      return date.toDate().toLocaleDateString();
    }
    return 'N/A';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-20 bg-gray-100 rounded animate-pulse" />
        <div className="h-20 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  if (admins.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No admins found</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {admins.map((admin) => (
          <div
            key={admin.id}
            className="flex items-center justify-between p-4 bg-background border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1">
              <div className="font-semibold">
                {admin.displayName || 'No name'}
              </div>
              <div className="text-sm text-muted-foreground">
                {admin.email || 'No email'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Joined: {formatDate(admin.createdAt as string)}
              </div>
            </div>
            <button
              onClick={() => handleRemoveClick(admin)}
              disabled={removingAdminId === admin.id}
              className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Remove admin access"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmRemove}
        title="Remove Admin Access"
        message={
          adminToRemove
            ? `Are you sure you want to remove admin access from ${adminToRemove.displayName || adminToRemove.email}? They will no longer be able to create or manage events.`
            : 'Are you sure you want to remove admin access?'
        }
        confirmText="Remove Admin"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
}


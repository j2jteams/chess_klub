'use client';

import { useState, useEffect } from 'react';
import { User } from '@/lib/models';
import { UserRepository } from '@/lib/firebase/repositories/user-repository';
import { UserPlus, X, Clock, RefreshCw } from 'lucide-react';
import { useNotifications } from '@/components/ui/notification';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface PendingAdminsProps {
  onAdminPromoted?: () => void;
}

export default function PendingAdmins({ onAdminPromoted }: PendingAdminsProps) {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [promotingUserId, setPromotingUserId] = useState<string | null>(null);
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [userToReject, setUserToReject] = useState<User | null>(null);
  const { showSuccess, showError } = useNotifications();

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      console.log('Loading pending admins...');
      const pending = await UserRepository.getPendingAdmins();
      console.log('Pending admins loaded:', pending.length, pending);
      setPendingUsers(pending);
    } catch (error: any) {
      console.error('Error loading pending users:', error);
      // Log all possible error properties
      const errorDetails: Record<string, any> = {};
      if (error?.code) errorDetails.code = error.code;
      if (error?.message) errorDetails.message = error.message;
      if (error?.stack) errorDetails.stack = error.stack;
      if (error?.toString) errorDetails.toString = error.toString();
      // Log all enumerable properties
      for (const key in error) {
        if (error.hasOwnProperty(key)) {
          errorDetails[key] = error[key];
        }
      }
      console.error('Full error details:', errorDetails);
      showError(`Failed to load pending admin requests: ${error?.message || error?.toString() || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async (user: User) => {
    try {
      setPromotingUserId(user.id);
      await UserRepository.promoteToAdmin(user.id);
      showSuccess(`${user.displayName || user.email} has been promoted to admin`);
      await loadPendingUsers();
      onAdminPromoted?.();
    } catch (error) {
      console.error('Error promoting user:', error);
      showError('Failed to promote user to admin');
    } finally {
      setPromotingUserId(null);
    }
  };

  const handleRejectClick = (user: User) => {
    setUserToReject(user);
    setShowRejectDialog(true);
  };

  const handleConfirmReject = async () => {
    if (!userToReject) return;

    try {
      setRejectingUserId(userToReject.id);
      // Delete the user account
      // Note: In production, you might want to mark them as rejected instead of deleting
      await UserRepository.deleteUser(userToReject.id);
      showSuccess(`Admin request from ${userToReject.displayName || userToReject.email} has been rejected`);
      setShowRejectDialog(false);
      setUserToReject(null);
      await loadPendingUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
      showError('Failed to reject admin request');
    } finally {
      setRejectingUserId(null);
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

  if (pendingUsers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No pending admin requests</p>
        <p className="text-sm mt-2">Users who sign up will appear here for approval</p>
        <button
          onClick={loadPendingUsers}
          disabled={loading}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium flex items-center gap-2 mx-auto hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          onClick={loadPendingUsers}
          disabled={loading}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh pending requests"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      <div className="space-y-3">
        {pendingUsers.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
          >
            <div className="flex-1">
              <div className="font-semibold text-yellow-900">
                {user.displayName || 'No name'}
              </div>
              <div className="text-sm text-yellow-800">
                {user.email || 'No email'}
              </div>
              <div className="text-xs text-yellow-700 mt-1">
                Signed up: {formatDate(user.createdAt as string)}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePromote(user)}
                disabled={promotingUserId === user.id}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus className="w-4 h-4" />
                {promotingUserId === user.id ? 'Promoting...' : 'Promote'}
              </button>
              <button
                onClick={() => handleRejectClick(user)}
                disabled={rejectingUserId === user.id}
                className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Reject admin request"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmationDialog
        isOpen={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        onConfirm={handleConfirmReject}
        title="Reject Admin Request"
        message={
          userToReject
            ? `Are you sure you want to reject the admin request from ${userToReject.displayName || userToReject.email}?`
            : 'Are you sure you want to reject this admin request?'
        }
        confirmText="Reject"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
}


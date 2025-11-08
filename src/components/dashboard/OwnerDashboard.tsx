'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import AdminManagement from '@/components/admin/AdminManagement';
import DashboardStats from './DashboardStats';
import UserEventsList from '@/components/events/UserEventsList';
import { useNotifications } from '@/components/ui/notification';
import { Plus, Settings, Users, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface OwnerDashboardProps {
  searchTerm?: string;
  selectedCategory?: string | null;
}

export default function OwnerDashboard({ searchTerm, selectedCategory }: OwnerDashboardProps) {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.displayName || 'Owner'}!</h2>
        <p className="text-muted-foreground">
          Manage your chess club admins, events, and registrations from this dashboard.
        </p>
      </div>

      {/* Statistics */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Overview Statistics</h3>
        <DashboardStats isOwner={true} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/dashboard/event/new"
          className="flex flex-col items-center justify-center p-6 bg-primary/10 hover:bg-primary/20 rounded-lg border border-primary/20 transition-colors"
        >
          <Plus className="w-8 h-8 text-primary mb-2" />
          <span className="font-semibold text-primary">Create Event</span>
        </Link>
        
        <Link
          href="/dashboard#admin-management"
          className="flex flex-col items-center justify-center p-6 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors"
        >
          <Users className="w-8 h-8 text-teal-600 mb-2" />
          <span className="font-semibold text-teal-700">Manage Admins</span>
        </Link>
        
        <Link
          href="/dashboard#events"
          className="flex flex-col items-center justify-center p-6 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
        >
          <Calendar className="w-8 h-8 text-purple-600 mb-2" />
          <span className="font-semibold text-purple-700">View Events</span>
        </Link>
        
        <Link
          href="/dashboard"
          className="flex flex-col items-center justify-center p-6 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
        >
          <Settings className="w-8 h-8 text-gray-600 mb-2" />
          <span className="font-semibold text-gray-700">Settings</span>
        </Link>
      </div>

      {/* Admin Management Section */}
      <div id="admin-management">
        <AdminManagement />
      </div>

      {/* Events Section */}
      <div id="events">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Your Events</h3>
          <Link href="/dashboard/event/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Event
            </Button>
          </Link>
        </div>
        {user && (
          <UserEventsList
            userId={user.uid}
            showSuccess={showSuccess}
            showError={showError}
            searchTerm={searchTerm}
            selectedCategory={selectedCategory}
          />
        )}
      </div>
    </div>
  );
}


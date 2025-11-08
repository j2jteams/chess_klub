'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import DashboardStats from './DashboardStats';
import UserEventsList from '@/components/events/UserEventsList';
import { useNotifications } from '@/components/ui/notification';
import { Plus, Calendar, Users, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface AdminDashboardProps {
  searchTerm?: string;
  selectedCategory?: string | null;
}

export default function AdminDashboard({ searchTerm, selectedCategory }: AdminDashboardProps) {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.displayName || 'Admin'}!</h2>
        <p className="text-muted-foreground">
          Manage your chess club events and view registrations from this dashboard.
        </p>
      </div>

      {/* Statistics */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Your Event Statistics</h3>
        <DashboardStats userId={user?.uid} isOwner={false} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/dashboard/event/new"
          className="flex flex-col items-center justify-center p-6 bg-primary/10 hover:bg-primary/20 rounded-lg border border-primary/20 transition-colors"
        >
          <Plus className="w-8 h-8 text-primary mb-2" />
          <span className="font-semibold text-primary">Create Event</span>
          <span className="text-sm text-muted-foreground mt-1">Add a new chess event</span>
        </Link>
        
        <Link
          href="/dashboard#events"
          className="flex flex-col items-center justify-center p-6 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
        >
          <Calendar className="w-8 h-8 text-purple-600 mb-2" />
          <span className="font-semibold text-purple-700">My Events</span>
          <span className="text-sm text-muted-foreground mt-1">View all your events</span>
        </Link>
        
        <Link
          href="/dashboard#registrations"
          className="flex flex-col items-center justify-center p-6 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
        >
          <Users className="w-8 h-8 text-indigo-600 mb-2" />
          <span className="font-semibold text-indigo-700">Registrations</span>
          <span className="text-sm text-muted-foreground mt-1">Manage event registrations</span>
        </Link>
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


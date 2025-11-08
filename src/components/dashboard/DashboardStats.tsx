'use client';

import { useState, useEffect } from 'react';
import { Event, EventStatus } from '@/lib/models';
import { EventRepository } from '@/lib/firebase/repositories/event-repository';
import { RegistrationRepository } from '@/lib/firebase/repositories/registration-repository';
import { UserRepository } from '@/lib/firebase/repositories/user-repository';
import { Calendar, Users, CheckCircle, Clock, TrendingUp, FileText } from 'lucide-react';

interface DashboardStatsProps {
  userId?: string; // If provided, only show stats for this user's events
  isOwner?: boolean; // If true, show admin-related stats
}

interface Stats {
  totalEvents: number;
  publishedEvents: number;
  upcomingEvents: number;
  totalRegistrations: number;
  pendingRegistrations: number;
  totalAdmins?: number;
  pendingAdmins?: number;
}

export default function DashboardStats({ userId, isOwner = false }: DashboardStatsProps) {
  const [stats, setStats] = useState<Stats>({
    totalEvents: 0,
    publishedEvents: 0,
    upcomingEvents: 0,
    totalRegistrations: 0,
    pendingRegistrations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [userId, isOwner]);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Get all events (or user's events if userId provided)
      const eventsResult = userId
        ? await EventRepository.getEventsByOrganizerId(userId)
        : await EventRepository.getAllEvents();
      
      const allEvents = eventsResult.documents;
      const now = new Date();
      
      // Calculate event stats
      const publishedEvents = allEvents.filter(e => e.published && e.status === EventStatus.PUBLISHED);
      const upcomingEvents = publishedEvents.filter(e => {
        const startDate = typeof e.startDate === 'string' 
          ? new Date(e.startDate) 
          : (e.startDate as any)?.toDate?.() || new Date();
        return startDate > now;
      });

      // Get registration stats for all events
      let totalRegistrations = 0;
      let pendingRegistrations = 0;

      for (const event of publishedEvents) {
        try {
          const regStats = await RegistrationRepository.getRegistrationStats(event.id);
          totalRegistrations += regStats.total;
          pendingRegistrations += regStats.pending;
        } catch (error) {
          console.error(`Error getting stats for event ${event.id}:`, error);
        }
      }

      const statsData: Stats = {
        totalEvents: allEvents.length,
        publishedEvents: publishedEvents.length,
        upcomingEvents: upcomingEvents.length,
        totalRegistrations,
        pendingRegistrations,
      };

      // Add admin stats if owner
      if (isOwner) {
        try {
          const [admins, pending] = await Promise.all([
            UserRepository.getAllAdmins(),
            UserRepository.getPendingAdmins(),
          ]);
          statsData.totalAdmins = admins.length;
          statsData.pendingAdmins = pending.length;
        } catch (error) {
          console.error('Error loading admin stats:', error);
        }
      }

      setStats(statsData);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Events',
      value: stats.totalEvents,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Published Events',
      value: stats.publishedEvents,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Upcoming Events',
      value: stats.upcomingEvents,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Total Registrations',
      value: stats.totalRegistrations,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Pending Registrations',
      value: stats.pendingRegistrations,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Active Admins',
      value: stats.totalAdmins ?? 0,
      icon: TrendingUp,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      show: isOwner,
    },
    {
      title: 'Pending Admin Requests',
      value: stats.pendingAdmins ?? 0,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      show: isOwner,
    },
  ].filter(card => card.show !== false);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`${card.bgColor} p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {card.title}
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {card.value}
                </p>
              </div>
              <div className={`${card.color} bg-white/50 p-3 rounded-full`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


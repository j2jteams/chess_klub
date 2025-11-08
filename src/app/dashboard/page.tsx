'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ActiveFilters } from '@/components/events';
import { Header, Footer } from '@/components/layout';
import { useNotifications, NotificationContainer } from '@/components/ui/notification';
import { UserRole } from '@/lib/models';
import { OwnerDashboard, AdminDashboard } from '@/components/dashboard';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { notifications, removeNotification, showSuccess, showError } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Handle search from header
  const handleSearch = (searchTerm: string, location: string) => {
    setSearchTerm(searchTerm);
    // Ignore location parameter for filtering
  };
  
  // Handle category filter from header
  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/dashboard');
    }
  }, [loading, user, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Must be authenticated
  if (!user) {
    return null; // Will redirect via useEffect
  }

  // Check if user has admin or owner role
  if (!user.role || (user.role !== UserRole.OWNER && user.role !== UserRole.ADMIN)) {
    return (
      <div className="min-h-screen">
        <Header 
          activePage="dashboard" 
          onSearch={handleSearch}
          initialLocation={location}
          initialSearchTerm={searchTerm}
          onCategorySelect={handleCategorySelect}
          selectedCategory={selectedCategory}
        />
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-yellow-900 mb-4">Access Pending Approval</h1>
            <p className="text-yellow-800 mb-2">
              Your account has been created, but admin access is pending approval.
            </p>
            <p className="text-sm text-yellow-700">
              The owner will review your request and grant admin access. You'll be able to access the dashboard once approved.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <Header 
        activePage="dashboard" 
        onSearch={handleSearch}
        initialLocation={location}
        initialSearchTerm={searchTerm}
        onCategorySelect={handleCategorySelect}
        selectedCategory={selectedCategory}
      />
      
      {/* Active Filters */}
      {(searchTerm || (selectedCategory && selectedCategory !== 'all')) && (
        <section className="border-b bg-gray-50">
          <div className="container mx-auto px-4 max-w-7xl py-4">
            <ActiveFilters
              searchTerm={searchTerm}
              selectedCategory={selectedCategory}
              onClearSearch={() => setSearchTerm('')}
              onClearCategory={() => setSelectedCategory(null)}
              onClearAll={() => {
                setSearchTerm('');
                setSelectedCategory(null);
              }}
            />
          </div>
        </section>
      )}
      
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {user?.role === UserRole.OWNER ? (
          <OwnerDashboard 
            searchTerm={searchTerm}
            selectedCategory={selectedCategory}
          />
        ) : (
          <AdminDashboard 
            searchTerm={searchTerm}
            selectedCategory={selectedCategory}
          />
        )}
      </div>
      <Footer />
      
      {/* Notification Container */}
      <NotificationContainer 
        notifications={notifications}
        onDismiss={removeNotification}
        position="top-right"
      />
    </ProtectedRoute>
  );
}
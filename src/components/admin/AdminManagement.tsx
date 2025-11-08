'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminList from './AdminList';
import PendingAdmins from './PendingAdmins';
import { Users, Clock } from 'lucide-react';

export default function AdminManagement() {
  const [activeTab, setActiveTab] = useState('pending');

  const handleAdminPromoted = () => {
    // Refresh the admin list when a new admin is promoted
    setActiveTab('admins');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Admin Management</h2>
        <p className="text-muted-foreground">
          Manage admin access and approve new admin requests
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending Requests
          </TabsTrigger>
          <TabsTrigger value="admins" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Current Admins
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <div className="bg-background p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Pending Admin Requests</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Users who have signed up and are waiting for admin approval
            </p>
            <PendingAdmins onAdminPromoted={handleAdminPromoted} />
          </div>
        </TabsContent>

        <TabsContent value="admins" className="mt-6">
          <div className="bg-background p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Current Admins</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Users with admin access who can create and manage events
            </p>
            <AdminList onAdminRemoved={handleAdminPromoted} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


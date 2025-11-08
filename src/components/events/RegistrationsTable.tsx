'use client';

import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Search, 
  Filter,
  Check,
  X,
  Clock,
  AlertCircle,
  ChevronDown,
  Mail,
  User,
  Calendar,
  Eye
} from 'lucide-react';
import {
  EventRegistration,
  RegistrationStatus,
  RegistrationFilter,
  RegistrationStats
} from '@/lib/models/registration';
import { RegistrationRepository } from '@/lib/firebase/repositories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNotifications } from '@/components/ui/notification';
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { cn } from '@/lib/utils';

interface RegistrationsTableProps {
  eventId: string;
  eventTitle: string;
  isEventOwner: boolean;
}

const STATUS_CONFIG = {
  [RegistrationStatus.PENDING]: {
    label: 'Pending',
    icon: Clock,
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-600'
  },
  [RegistrationStatus.APPROVED]: {
    label: 'Approved',
    icon: Check,
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    iconColor: 'text-green-600'
  },
  [RegistrationStatus.REJECTED]: {
    label: 'Rejected',
    icon: X,
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    iconColor: 'text-red-600'
  },
  [RegistrationStatus.WAITLISTED]: {
    label: 'Waitlisted',
    icon: Clock,
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-600'
  },
  [RegistrationStatus.CANCELLED]: {
    label: 'Cancelled',
    icon: X,
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    iconColor: 'text-gray-600'
  }
};

export default function RegistrationsTable({ 
  eventId, 
  eventTitle, 
  isEventOwner 
}: RegistrationsTableProps) {
  const { showSuccess, showError } = useNotifications();
  const { dialog, showConfirmation } = useConfirmationDialog();
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [stats, setStats] = useState<RegistrationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RegistrationFilter>({});
  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<EventRegistration | null>(null);

  // Fetch registrations
  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const [regResult, statsResult] = await Promise.all([
        RegistrationRepository.getEventRegistrations(eventId, filter, { limit: 1000 }),
        RegistrationRepository.getRegistrationStats(eventId)
      ]);
      
      setRegistrations(regResult.documents);
      setStats(statsResult);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      showError('Failed to load registrations', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [eventId, filter]);

  // Update registration status
  const updateStatus = async (registrationId: string, status: RegistrationStatus) => {
    if (!isEventOwner) {
      showError('You do not have permission to update registrations', 'Access Denied');
      return;
    }

    try {
      await RegistrationRepository.updateRegistrationStatus(eventId, registrationId, status);
      await fetchRegistrations(); // Refresh data
      showSuccess(`Registration ${status.toLowerCase()} successfully`, 'Status Updated');
    } catch (error) {
      console.error('Error updating registration status:', error);
      showError('Failed to update registration status', 'Error');
    }
  };

  // Bulk update statuses
  const bulkUpdateStatus = async (status: RegistrationStatus) => {
    if (!isEventOwner || selectedRegistrations.length === 0) return;

    showConfirmation(
      `Are you sure you want to ${status.toLowerCase()} ${selectedRegistrations.length} registrations?`,
      async () => {
        try {
          await RegistrationRepository.bulkUpdateRegistrations(eventId, selectedRegistrations, status);
          await fetchRegistrations();
          setSelectedRegistrations([]);
          showSuccess(`${selectedRegistrations.length} registrations updated successfully`, 'Bulk Update Complete');
        } catch (error) {
          console.error('Error bulk updating registrations:', error);
          showError('Failed to update registrations', 'Error');
        }
      },
      { 
        title: 'Confirm Bulk Update',
        confirmText: `${status.charAt(0).toUpperCase() + status.slice(1)} Selected`,
        variant: status === RegistrationStatus.REJECTED ? 'danger' : 'warning'
      }
    );
  };

  // Export registrations
  const exportData = async () => {
    try {
      const exportData = await RegistrationRepository.exportRegistrations(eventId, filter);
      
      // Convert to CSV
      if (exportData.length === 0) {
        showError('No registrations to export', 'Export Error');
        return;
      }

      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = (row as any)[header];
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return String(value || '');
          }).join(',')
        )
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${eventTitle.replace(/[^a-z0-9]/gi, '_')}_registrations.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showSuccess('Registration data exported successfully', 'Export Complete');
    } catch (error) {
      console.error('Error exporting registrations:', error);
      showError('Failed to export registration data', 'Export Error');
    }
  };

  // Format date for display
  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' 
      ? new Date(date) 
      : (date as any)?.toDate?.() || new Date((date as any)?.seconds * 1000 || Date.now());
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  // Toggle selection
  const toggleSelection = (registrationId: string) => {
    setSelectedRegistrations(prev => 
      prev.includes(registrationId) 
        ? prev.filter(id => id !== registrationId)
        : [...prev, registrationId]
    );
  };

  // Select all/none
  const toggleSelectAll = () => {
    setSelectedRegistrations(prev => 
      prev.length === registrations.length ? [] : registrations.map(r => r.id)
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-muted rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
            <div className="text-sm text-blue-600">Total</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-700">{stats.approved}</div>
            <div className="text-sm text-green-600">Approved</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
            <div className="text-sm text-yellow-600">Pending</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">{stats.waitlisted}</div>
            <div className="text-sm text-blue-600">Waitlisted</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
            <div className="text-sm text-red-600">Rejected</div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={filter.search || ''}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10 w-full md:w-64"
            />
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            <ChevronDown className={cn("h-4 w-4 ml-2 transition-transform", showFilters && "rotate-180")} />
          </Button>
        </div>

        <div className="flex gap-2">
          {selectedRegistrations.length > 0 && isEventOwner && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => bulkUpdateStatus(RegistrationStatus.APPROVED)}
              >
                Approve Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => bulkUpdateStatus(RegistrationStatus.REJECTED)}
              >
                Reject Selected
              </Button>
            </>
          )}
          
          <Button
            variant="outline"
            onClick={exportData}
            disabled={registrations.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-muted p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <select
                id="status-filter"
                value={Array.isArray(filter.status) ? '' : filter.status || ''}
                onChange={(e) => setFilter(prev => ({ 
                  ...prev, 
                  status: e.target.value ? e.target.value as RegistrationStatus : undefined 
                }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">All Statuses</option>
                {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                  <option key={status} value={status}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="date-from">From Date</Label>
              <Input
                id="date-from"
                type="date"
                value={filter.dateFrom ? filter.dateFrom.toISOString().split('T')[0] : ''}
                onChange={(e) => setFilter(prev => ({ 
                  ...prev, 
                  dateFrom: e.target.value ? new Date(e.target.value) : undefined 
                }))}
              />
            </div>
            
            <div>
              <Label htmlFor="date-to">To Date</Label>
              <Input
                id="date-to"
                type="date"
                value={filter.dateTo ? filter.dateTo.toISOString().split('T')[0] : ''}
                onChange={(e) => setFilter(prev => ({ 
                  ...prev, 
                  dateTo: e.target.value ? new Date(e.target.value) : undefined 
                }))}
              />
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilter({})}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Registrations Table */}
      {registrations.length === 0 ? (
        <div className="text-center py-12">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Registrations Yet</h3>
          <p className="text-muted-foreground">
            When people register for your event, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedRegistrations.length === registrations.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4"
                    />
                  </th>
                  <th className="p-4 text-left">Name</th>
                  <th className="p-4 text-left">Email</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Registered</th>
                  <th className="p-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((registration) => {
                  const StatusIcon = STATUS_CONFIG[registration.status].icon;
                  return (
                    <tr key={registration.id} className="border-t hover:bg-muted/50">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedRegistrations.includes(registration.id)}
                          onChange={() => toggleSelection(registration.id)}
                          className="h-4 w-4"
                        />
                      </td>
                      <td className="p-4">
                        <div className="font-medium">
                          {registration.firstName} {registration.lastName}
                        </div>
                      </td>
                      <td className="p-4">
                        <a 
                          href={`mailto:${registration.email}`}
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <Mail className="h-3 w-3" />
                          {registration.email}
                        </a>
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                          STATUS_CONFIG[registration.status].bgColor,
                          STATUS_CONFIG[registration.status].textColor
                        )}>
                          <StatusIcon className={cn("h-3 w-3", STATUS_CONFIG[registration.status].iconColor)} />
                          {STATUS_CONFIG[registration.status].label}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(registration.submittedAt)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedRegistration(registration)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {isEventOwner && (
                            <>
                              {registration.status === RegistrationStatus.PENDING && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateStatus(registration.id, RegistrationStatus.APPROVED)}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateStatus(registration.id, RegistrationStatus.REJECTED)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Registration Detail Modal */}
      {selectedRegistration && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Registration Details</h2>
                <button
                  onClick={() => setSelectedRegistration(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <div className="font-medium">
                        {selectedRegistration.firstName} {selectedRegistration.lastName}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <div className="font-medium">{selectedRegistration.email}</div>
                    </div>
                  </div>
                </div>

                {Object.keys(selectedRegistration.formData).length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Additional Information</h3>
                    <div className="space-y-2 text-sm">
                      {Object.entries(selectedRegistration.formData).map(([key, value]) => (
                        <div key={key}>
                          <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
                          <div className="font-medium">
                            {Array.isArray(value) ? value.join(', ') : String(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2">Registration Status</h3>
                  <div className="flex items-center gap-2">
                    {React.createElement(STATUS_CONFIG[selectedRegistration.status].icon, {
                      className: cn("h-4 w-4", STATUS_CONFIG[selectedRegistration.status].iconColor)
                    })}
                    <span className={STATUS_CONFIG[selectedRegistration.status].textColor}>
                      {STATUS_CONFIG[selectedRegistration.status].label}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Timeline</h3>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="text-muted-foreground">Submitted:</span>
                      <span className="ml-2">{formatDate(selectedRegistration.submittedAt)}</span>
                    </div>
                    {selectedRegistration.approvedAt && (
                      <div>
                        <span className="text-muted-foreground">Approved:</span>
                        <span className="ml-2">{formatDate(selectedRegistration.approvedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {dialog}
    </div>
  );
}
'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';

interface NGOProfile {
  _id: string;
  name: string;
  subtype: string;
  city: string;
  categories: string[];
  contactPersonName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  registrationNumber: string;
  establishedYear: number;
  website: string;
  description: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  status: string;
  tags: string[];
  maxParticipants?: number;
  currentParticipants: number;
  contactEmail?: string;
  contactPhone?: string;
  imageUrl?: string;
}

interface EventStats {
  totalEvents: number;
  statusBreakdown: {
    upcoming?: number;
    ongoing?: number;
    completed?: number;
    cancelled?: number;
  };
}

interface NgoEmployee {
  _id: string;
  ngoName: string;
  name: string;
  position: string;
  mobileNo: string;
  userType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function NgoDashboard() {
  const [profile, setProfile] = useState<NGOProfile | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventStats, setEventStats] = useState<EventStats | null>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [employees, setEmployees] = useState<NgoEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatuses, setUpdatingStatuses] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'events' | 'complaints' | 'manage-employees'>('profile');
  const [showEventForm, setShowEventForm] = useState(false);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState<Partial<NGOProfile>>({});
  const [eventFormData, setEventFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    maxParticipants: '',
    contactEmail: '',
    contactPhone: '',
    tags: ''
  });
  const [employeeFormData, setEmployeeFormData] = useState({
    name: '',
    position: '',
    mobileNo: '',
    password: ''
  });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [assigningComplaint, setAssigningComplaint] = useState(false);
  const { isLoggedIn } = useAuth();

  const fetchProfile = async () => {
    try {
      const data = await apiFetch('/orgs/my-profile');
      setProfile(data);
      setProfileFormData(data);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError('Failed to fetch profile data');
    }
  };

  const fetchEvents = async () => {
    try {
      const [eventsData, statsData] = await Promise.all([
        apiFetch('/events/my-events'),
        apiFetch('/events/my-stats')
      ]);
      setEvents(eventsData);
      setEventStats(statsData);
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setError('Failed to fetch events data');
    }
  };

  const fetchEmployees = async () => {
    try {
      const employeesData = await apiFetch('/ngo-users/my-employees');
      setEmployees(employeesData);
    } catch (err: any) {
      console.error('Error fetching employees:', err);
      setError('Failed to fetch employees data');
    }
  };

  const fetchComplaints = async () => {
    try {
      const complaintsData = await apiFetch('/complaints');
      setComplaints(complaintsData);
    } catch (err: any) {
      console.error('Error fetching complaints:', err);
      setError('Failed to fetch complaints data');
    }
  };

  const handleAssignComplaint = async (employeeId: string) => {
    if (!selectedComplaint) return;
    try {
      setAssigningComplaint(true);
      await apiFetch(`/complaints/${selectedComplaint._id}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ assignedTo: employeeId })
      });
      await fetchComplaints();
      setShowAssignModal(false);
      setSelectedComplaint(null);
      setError(null);
    } catch (err: any) {
      console.error('Error assigning complaint:', err);
      setError('Failed to assign complaint');
    } finally {
      setAssigningComplaint(false);
    }
  };

  const openAssignModal = (complaint: any) => {
    setSelectedComplaint(complaint);
    setShowAssignModal(true);
  };

  const triggerEventStatusUpdate = async () => {
    try {
      setUpdatingStatuses(true);
      await apiFetch('/events/update-statuses', {
        method: 'POST'
      });
      // Refresh events and stats after status update
      await Promise.all([fetchEvents()]);
    } catch (err: any) {
      console.error('Error updating event statuses:', err);
    } finally {
      setUpdatingStatuses(false);
    }
  };

  // Auto-refresh events every 5 minutes to check for status changes
  useEffect(() => {
    if (!isLoggedIn) return;

    const interval = setInterval(() => {
      triggerEventStatusUpdate();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Trigger status update when events tab becomes active
  useEffect(() => {
    if (activeTab === 'events' && isLoggedIn) {
      triggerEventStatusUpdate();
    }
  }, [activeTab, isLoggedIn]);

  // Add visibility change listener to update when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isLoggedIn) {
        triggerEventStatusUpdate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      Promise.all([fetchProfile(), fetchEvents(), fetchEmployees(), fetchComplaints()])
        .finally(() => setLoading(false));
    }
  }, [isLoggedIn]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedProfile = await apiFetch('/orgs/my-profile', {
        method: 'PUT',
        body: JSON.stringify(profileFormData)
      });
      setProfile(updatedProfile);
      setEditingProfile(false);
      setError(null);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    }
  };

  const handleEventCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const eventData = {
        ...eventFormData,
        maxParticipants: eventFormData.maxParticipants ? parseInt(eventFormData.maxParticipants) : undefined,
        tags: eventFormData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      await apiFetch('/events', {
        method: 'POST',
        body: JSON.stringify(eventData)
      });

      // Reset form and refresh events
      setEventFormData({
        title: '',
        description: '',
        date: '',
        location: '',
        maxParticipants: '',
        contactEmail: '',
        contactPhone: '',
        tags: ''
      });
      setShowEventForm(false);
      await fetchEvents();
      setError(null);
    } catch (err: any) {
      console.error('Error creating event:', err);
      setError('Failed to create event');
    }
  };

  const handleEmployeeCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const employeeData = {
        ...employeeFormData,
        ngoName: profile?.name
      };

      await apiFetch('/auth/register-ngo-user', {
        method: 'POST',
        body: JSON.stringify(employeeData)
      });

      // Reset form and refresh employees
      setEmployeeFormData({
        name: '',
        position: '',
        mobileNo: '',
        password: ''
      });
      setShowEmployeeForm(false);
      await fetchEmployees();
      setError(null);
    } catch (err: any) {
      console.error('Error creating employee:', err);
      setError('Failed to create employee');
    }
  };

  const handleEmployeeRemove = async (employeeId: string) => {
    if (!confirm('Are you sure you want to remove this employee?')) {
      return;
    }

    try {
      await apiFetch(`/ngo-users/${employeeId}`, {
        method: 'DELETE'
      });

      await fetchEmployees();
      setError(null);
    } catch (err: any) {
      console.error('Error removing employee:', err);
      setError('Failed to remove employee');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'ongoing': return 'bg-green-100 text-green-800 border border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming': return '📅';
      case 'ongoing': return '🟢';
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      default: return '❓';
    }
  };

  const isEventExpired = (eventDate: string) => {
    return new Date(eventDate) < new Date();
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Please log in to access your NGO dashboard.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">NGO Dashboard</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Welcome back, {profile?.contactPersonName || 'NGO User'}
          </p>
        </motion.div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-3 rounded text-sm sm:text-base">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 sm:ml-4 text-red-700 hover:text-red-900 font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Stats Cards */}
        {/* <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-3 sm:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-semibold text-xs sm:text-sm">C</span>
                  </div>
                </div>
                <div className="ml-3 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Complaints</dt>
                    <dd className="text-sm sm:text-lg font-medium text-gray-900">{eventStats?.statusBreakdown?.complaints || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-3 sm:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-semibold text-xs sm:text-sm">U</span>
                  </div>
                </div>
                <div className="ml-3 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Upcoming Events</dt>
                    <dd className="text-sm sm:text-lg font-medium text-gray-900">{eventStats?.statusBreakdown?.upcoming || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-3 sm:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-semibold text-xs sm:text-sm">✅</span>
                  </div>
                </div>
                <div className="ml-3 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Completed Events</dt>
                    <dd className="text-sm sm:text-lg font-medium text-gray-900">{eventStats?.statusBreakdown?.completed || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-3 sm:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-semibold text-xs sm:text-sm">TE</span>
                  </div>
                </div>
                <div className="ml-3 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total Events</dt>
                    <dd className="text-sm sm:text-lg font-medium text-gray-900">{eventStats?.totalEvents || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-3 sm:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-semibold text-xs sm:text-sm">🧑‍🏭</span>
                  </div>
                </div>
                <div className="ml-3 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Employees</dt>
                    <dd className="text-sm sm:text-lg font-medium text-gray-900">{employees.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white overflow-hidden shadow rounded-lg col-span-2 sm:col-span-1"
          >
            <div className="p-3 sm:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-md flex items-center justify-center ${profile?.isVerified ? 'bg-green-500' : 'bg-yellow-500'
                    }`}>
                    <span className="text-white font-semibold text-xs sm:text-sm">V</span>
                  </div>
                </div>
                <div className="ml-3 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Status</dt>
                    <dd className="text-sm sm:text-lg font-medium text-gray-900">
                      {profile?.isVerified ? 'Verified' : 'Pending'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>
        </div> */}

        {/* Tab Navigation */}
        <div className="mb-6 overflow-x-auto">
          <nav className="flex space-x-4 sm:space-x-8 min-w-max">
            <button
              onClick={() => setActiveTab('complaints')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'complaints'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Complaints ({complaints.length})
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'events'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Events ({events.length})
            </button>
            <button
              onClick={() => setActiveTab('manage-employees')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'manage-employees'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Employees ({employees.length})
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'profile'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Profile
            </button>
          </nav>
        </div>


        {/* Complaints Tab */}
        {activeTab === 'complaints' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Assigned Complaints</h2>
              <button
                onClick={fetchComplaints}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
              >
                Refresh
              </button>
            </div>
            
            {complaints.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
                No complaints assigned yet.
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg overflow-hidden overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Priority</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Assigned To</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Created</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {complaints.map((complaint) => {
                      const assignedEmployee = employees.find(e => e._id === complaint.assignedTo);
                      return (
                        <tr key={complaint._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-800">
                            {complaint.category}
                            {complaint.subcategory && (
                              <span className="text-gray-500 text-xs ml-1">/ {complaint.subcategory}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                            {complaint.description || 'No description'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              complaint.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                              complaint.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                              complaint.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                              complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {complaint.status?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              complaint.priority === 'high' ? 'bg-red-100 text-red-800' :
                              complaint.priority === 'med' ? 'bg-orange-100 text-orange-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {complaint.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {assignedEmployee ? (
                              <span className="text-blue-600 font-medium">{assignedEmployee.name}</span>
                            ) : (
                              <span className="text-gray-400">Unassigned</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(complaint.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => openAssignModal(complaint)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs transition-colors"
                            >
                              {complaint.assignedTo ? 'Reassign' : 'Assign'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* Assign Complaint Modal */}
        {showAssignModal && selectedComplaint && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Assign Complaint</h2>
              <p className="text-sm text-gray-600 mb-4">
                Assign <strong>{selectedComplaint.category}</strong> complaint to an employee
              </p>
              
              {employees.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No employees available. Add employees first.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {employees.map((employee) => (
                    <button
                      key={employee._id}
                      onClick={() => handleAssignComplaint(employee._id)}
                      disabled={assigningComplaint}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedComplaint.assignedTo === employee._id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                      } ${assigningComplaint ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{employee.name}</p>
                          <p className="text-sm text-gray-500">{employee.position}</p>
                        </div>
                        {selectedComplaint.assignedTo === employee._id && (
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">Current</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedComplaint(null);
                  }}
                  className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Create Event Button */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-medium text-gray-900">My Events</h2>
                {updatingStatuses && (
                  <div className="flex items-center text-sm text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Updating statuses...
                  </div>
                )}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={triggerEventStatusUpdate}
                  disabled={updatingStatuses}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-2 rounded text-sm transition-colors flex-1 sm:flex-none"
                >
                  {updatingStatuses ? 'Updating...' : '🔄 Refresh Status'}
                </button>
                <button
                  onClick={() => setShowEventForm(!showEventForm)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm transition-colors flex-1 sm:flex-none"
                >
                  {showEventForm ? 'Cancel' : 'Create Event'}
                </button>
              </div>
            </div>

            {/* Event Creation Form */}
            {showEventForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-white shadow rounded-lg p-4 sm:p-6"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Event</h3>
                <form onSubmit={handleEventCreate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Event Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={eventFormData.title}
                        onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={eventFormData.date}
                        onChange={(e) => setEventFormData({ ...eventFormData, date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location *
                      </label>
                      <input
                        type="text"
                        required
                        value={eventFormData.location}
                        onChange={(e) => setEventFormData({ ...eventFormData, location: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Participants
                      </label>
                      <input
                        type="number"
                        value={eventFormData.maxParticipants}
                        onChange={(e) => setEventFormData({ ...eventFormData, maxParticipants: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={eventFormData.contactEmail}
                        onChange={(e) => setEventFormData({ ...eventFormData, contactEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={eventFormData.contactPhone}
                        onChange={(e) => setEventFormData({ ...eventFormData, contactPhone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      placeholder="Provide a detailed description, like - 5hrs program on health awareness, free medical checkup, location details, etc."
                      required
                      value={eventFormData.description}
                      onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={eventFormData.tags}
                      onChange={(e) => setEventFormData({ ...eventFormData, tags: e.target.value })}
                      placeholder="e.g., health, education, community"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row justify-end space-y-reverse space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowEventForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    >
                      Create Event
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Events List */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <h3 className="text-lg font-medium text-gray-900">Events ({events.length})</h3>
                  <div className="bg-blue-50 px-3 py-1 rounded-full text-xs text-blue-700 border border-blue-200">
                    🤖 Events auto-update to "completed" when date passes
                  </div>
                </div>
              </div>
              {events.length === 0 ? (
                <div className="p-4 sm:p-6 text-center text-gray-500 text-sm sm:text-base">
                  No events created yet. Create your first event to get started!
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {events.map((event, index) => (
                    <motion.div
                      key={event._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 sm:p-6 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                            <h4 className="text-lg font-medium text-gray-900">{event.title}</h4>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full self-start ${getStatusColor(event.status)}`}>
                                {getStatusIcon(event.status)} {event.status}
                              </span>
                              {isEventExpired(event.date) && event.status !== 'completed' && (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                                  ⏰ Auto-updating
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-600 mb-3 text-sm sm:text-base">{event.description}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-500 mb-3">
                            <div className="flex items-center">📅 {formatDate(event.date)}</div>
                            <div className="flex items-center">📍 {event.location}</div>
                            {event.maxParticipants && (
                              <div className="flex items-center">👥 {event.currentParticipants}/{event.maxParticipants} participants</div>
                            )}
                            {event.contactEmail && (
                              <div className="flex items-center break-all">📧 {event.contactEmail}</div>
                            )}
                          </div>
                          {event.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {event.tags.map((tag, tagIndex) => (
                                <span
                                  key={tagIndex}
                                  className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Manage Employees Tab */}
        {activeTab === 'manage-employees' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Add Employee Button */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
              <h2 className="text-lg font-medium text-gray-900">Manage Employees</h2>
              <button
                onClick={() => setShowEmployeeForm(!showEmployeeForm)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm transition-colors w-full sm:w-auto"
              >
                {showEmployeeForm ? 'Cancel' : 'Add Employee'}
              </button>
            </div>

            {/* Employee Creation Form */}
            {showEmployeeForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-white shadow rounded-lg p-4 sm:p-6"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Employee</h3>
                <form onSubmit={handleEmployeeCreate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Employee Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={employeeFormData.name}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Position *
                      </label>
                      <input
                        type="text"
                        required
                        value={employeeFormData.position}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, position: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={employeeFormData.mobileNo}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, mobileNo: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={employeeFormData.password}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      />
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-700">
                      <strong>NGO:</strong> {profile?.name || 'Loading...'}
                    </p>
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row justify-end space-y-reverse space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowEmployeeForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    >
                      Add Employee
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Employees List */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Employees ({employees.length}) - {profile?.name}
                </h3>
              </div>
              {employees.length === 0 ? (
                <div className="p-4 sm:p-6 text-center text-gray-500 text-sm sm:text-base">
                  No employees added yet. Add your first employee to get started!
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {employees.map((employee, index) => (
                    <motion.div
                      key={employee._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 sm:p-6 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                            <h4 className="text-lg font-medium text-gray-900">{employee.name}</h4>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${employee.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                                }`}>
                                {employee.isActive ? 'Active' : 'Inactive'}
                              </span>
                              <button
                                onClick={() => handleEmployeeRemove(employee._id)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs sm:text-sm text-gray-600 mb-3">
                            <div>
                              <span className="font-medium">Position:</span> {employee.position}
                            </div>
                            <div>
                              <span className="font-medium">Mobile:</span> {employee.mobileNo}
                            </div>
                            <div className="col-span-1 sm:col-span-2 lg:col-span-1">
                              <span className="font-medium">NGO:</span> {employee.ngoName}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            Added on: {new Date(employee.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white shadow rounded-lg"
          >
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h2 className="text-lg font-medium text-gray-900">NGO Profile</h2>
              <button
          onClick={() => setEditingProfile(!editingProfile)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm transition-colors"
              >
          {editingProfile ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {editingProfile ? (
              <form onSubmit={handleProfileUpdate} className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name
              </label>
              <input
                type="text"
                value={profileFormData.name || ''}
                onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={profileFormData.contactPersonName || ''}
                onChange={(e) => setProfileFormData({ ...profileFormData, contactPersonName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={profileFormData.contactEmail || ''}
                onChange={(e) => setProfileFormData({ ...profileFormData, contactEmail: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={profileFormData.contactPhone || ''}
                onChange={(e) => setProfileFormData({ ...profileFormData, contactPhone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={profileFormData.city || ''}
                onChange={(e) => setProfileFormData({ ...profileFormData, city: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                value={profileFormData.website || ''}
                onChange={(e) => setProfileFormData({ ...profileFormData, website: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              value={profileFormData.address || ''}
              onChange={(e) => setProfileFormData({ ...profileFormData, address: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={profileFormData.description || ''}
              onChange={(e) => setProfileFormData({ ...profileFormData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end space-y-reverse space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setEditingProfile(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
            >
              Save Changes
            </button>
          </div>
              </form>
            ) : (
              <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-indigo-600 uppercase tracking-wide mb-3">
                Basic Information
              </h3>
              <dl className="space-y-3">
                <div>
            <dt className="text-xs text-gray-500">Organization</dt>
            <dd className="text-sm text-gray-900">{profile?.name}</dd>
                </div>
                <div>
            <dt className="text-xs text-gray-500">Type</dt>
            <dd className="text-sm text-gray-900">{profile?.subtype || 'NGO'}</dd>
                </div>
                <div>
            <dt className="text-xs text-gray-500">City</dt>
            <dd className="text-sm text-gray-900">{profile?.city}</dd>
                </div>
                <div>
            <dt className="text-xs text-gray-500">Established</dt>
            <dd className="text-sm text-gray-900">{profile?.establishedYear}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-sm font-medium text-indigo-600 uppercase tracking-wide mb-3">
                Contact Information
              </h3>
              <dl className="space-y-3">
                <div>
            <dt className="text-xs text-gray-500">Contact Person</dt>
            <dd className="text-sm text-gray-900">{profile?.contactPersonName}</dd>
                </div>
                <div>
            <dt className="text-xs text-gray-500">Email</dt>
            <dd className="text-sm text-gray-900 break-all">{profile?.contactEmail}</dd>
                </div>
                <div>
            <dt className="text-xs text-gray-500">Phone</dt>
            <dd className="text-sm text-gray-900">{profile?.contactPhone}</dd>
                </div>
                <div>
            <dt className="text-xs text-gray-500">Website</dt>
            <dd className="text-sm">
              {profile?.website ? (
                <a href={profile.website} target="_blank" rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline break-all">
                  {profile.website}
                </a>
              ) : (
                <span className="text-gray-400">Not provided</span>
              )}
            </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-indigo-600 uppercase tracking-wide mb-3">
              Address
            </h3>
            <p className="text-sm text-gray-700">{profile?.address || 'Not provided'}</p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-indigo-600 uppercase tracking-wide mb-3">
              Description
            </h3>
            <p className="text-sm text-gray-700">{profile?.description || 'No description provided'}</p>
          </div>

          {profile?.categories && profile.categories.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-indigo-600 uppercase tracking-wide mb-3">
                Working Areas
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.categories.map((category, index) => (
            <span
              key={index}
              className="inline-block bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full"
            >
              {category}
            </span>
                ))}
              </div>
            </div>
          )}
              </div>
            )}
          </motion.div>
        )}

      </div>
    </div>
  );
}
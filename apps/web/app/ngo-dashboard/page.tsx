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
      await Promise.all([fetchEvents()]);
    } catch (err: any) {
      console.error('Error updating event statuses:', err);
    } finally {
      setUpdatingStatuses(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(() => {
      triggerEventStatusUpdate();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  useEffect(() => {
    if (activeTab === 'events' && isLoggedIn) {
      triggerEventStatusUpdate();
    }
  }, [activeTab, isLoggedIn]);

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
    if (!confirm('Are you sure you want to remove this employee?')) return;
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
      case 'upcoming': return 'bg-sky-50 text-sky-700';
      case 'ongoing': return 'bg-emerald-50 text-emerald-700';
      case 'completed': return 'bg-slate-100 text-slate-600';
      case 'cancelled': return 'bg-rose-50 text-rose-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const isEventExpired = (eventDate: string) => {
    return new Date(eventDate) < new Date();
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-amber-50 text-amber-800 px-6 py-4 rounded-lg text-center">
          Please log in to access your NGO dashboard.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-teal-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Welcome, {profile?.contactPersonName || 'NGO User'}
          </p>
        </motion.div>

        {error && (
          <div className="mb-4 bg-rose-50 text-rose-700 px-4 py-3 rounded-lg text-sm flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-rose-800 hover:underline text-xs">
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-slate-200">
          <nav className="flex gap-6 overflow-x-auto">
            {[
              { key: 'complaints', label: 'Complaints', count: complaints.length },
              { key: 'events', label: 'Events', count: events.length },
              { key: 'manage-employees', label: 'Employees', count: employees.length },
              { key: 'profile', label: 'Profile' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'text-teal-600 border-b-2 border-teal-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label} {tab.count !== undefined && `(${tab.count})`}
              </button>
            ))}
          </nav>
        </div>

        {/* Complaints Tab */}
        {activeTab === 'complaints' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-slate-800">Complaints</h2>
              <button
                onClick={fetchComplaints}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                Refresh
              </button>
            </div>

            {complaints.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center text-slate-500">
                No complaints assigned yet.
              </div>
            ) : (
              <div className="grid gap-4">
                {complaints.map((complaint) => {
                  const assignedEmployee = employees.find(e => e._id === complaint.assignedTo);
                  return (
                    <div key={complaint._id} className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-slate-800">{complaint.category}</span>
                            {complaint.subcategory && (
                              <span className="text-slate-400 text-sm">/ {complaint.subcategory}</span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mb-3">{complaint.description || 'No description'}</p>
                          <div className="flex flex-wrap gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              complaint.status === 'open' ? 'bg-amber-50 text-amber-700' :
                              complaint.status === 'assigned' ? 'bg-sky-50 text-sky-700' :
                              complaint.status === 'in_progress' ? 'bg-violet-50 text-violet-700' :
                              complaint.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {complaint.status?.replace('_', ' ')}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              complaint.priority === 'high' ? 'bg-rose-50 text-rose-700' :
                              complaint.priority === 'med' ? 'bg-orange-50 text-orange-700' :
                              'bg-emerald-50 text-emerald-700'
                            }`}>
                              {complaint.priority}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Assigned to</p>
                            <p className="text-sm font-medium text-slate-700">
                              {assignedEmployee?.name || 'Unassigned'}
                            </p>
                          </div>
                          <button
                            onClick={() => openAssignModal(complaint)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm"
                          >
                            {complaint.assignedTo ? 'Reassign' : 'Assign'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Assign Modal */}
        {showAssignModal && selectedComplaint && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Assign Complaint</h2>
              {employees.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No employees available.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {employees.map((employee) => (
                    <button
                      key={employee._id}
                      onClick={() => handleAssignComplaint(employee._id)}
                      disabled={assigningComplaint}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedComplaint.assignedTo === employee._id
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-slate-200 hover:border-teal-300'
                      } ${assigningComplaint ? 'opacity-50' : ''}`}
                    >
                      <p className="font-medium text-slate-800">{employee.name}</p>
                      <p className="text-sm text-slate-500">{employee.position}</p>
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => { setShowAssignModal(false); setSelectedComplaint(null); }}
                className="mt-4 w-full py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-slate-800">Events</h2>
              <div className="flex gap-2">
                <button
                  onClick={triggerEventStatusUpdate}
                  disabled={updatingStatuses}
                  className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  {updatingStatuses ? 'Updating...' : 'Refresh'}
                </button>
                <button
                  onClick={() => setShowEventForm(!showEventForm)}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  {showEventForm ? 'Cancel' : 'New Event'}
                </button>
              </div>
            </div>

            {showEventForm && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-medium text-slate-800 mb-4">Create Event</h3>
                <form onSubmit={handleEventCreate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      required
                      placeholder="Event Title"
                      value={eventFormData.title}
                      onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <input
                      type="datetime-local"
                      required
                      value={eventFormData.date}
                      onChange={(e) => setEventFormData({ ...eventFormData, date: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Location"
                      value={eventFormData.location}
                      onChange={(e) => setEventFormData({ ...eventFormData, location: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <input
                      type="number"
                      placeholder="Max Participants"
                      value={eventFormData.maxParticipants}
                      onChange={(e) => setEventFormData({ ...eventFormData, maxParticipants: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <textarea
                    required
                    placeholder="Description"
                    value={eventFormData.description}
                    onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <input
                    type="text"
                    placeholder="Tags (comma-separated)"
                    value={eventFormData.tags}
                    onChange={(e) => setEventFormData({ ...eventFormData, tags: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowEventForm(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm">
                      Create
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {events.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center text-slate-500">
                No events yet. Create your first event!
              </div>
            ) : (
              <div className="grid gap-4">
                {events.map((event) => (
                  <div key={event._id} className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-slate-800">{event.title}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{event.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                      <span>📅 {formatDate(event.date)}</span>
                      <span>📍 {event.location}</span>
                      {event.maxParticipants && (
                        <span>👥 {event.currentParticipants}/{event.maxParticipants}</span>
                      )}
                    </div>
                    {event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {event.tags.map((tag, i) => (
                          <span key={i} className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Employees Tab */}
        {activeTab === 'manage-employees' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-slate-800">Employees</h2>
              <button
                onClick={() => setShowEmployeeForm(!showEmployeeForm)}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                {showEmployeeForm ? 'Cancel' : 'Add Employee'}
              </button>
            </div>

            {showEmployeeForm && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-medium text-slate-800 mb-4">Add Employee</h3>
                <form onSubmit={handleEmployeeCreate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      required
                      placeholder="Name"
                      value={employeeFormData.name}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Position"
                      value={employeeFormData.position}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, position: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="Mobile Number"
                      value={employeeFormData.mobileNo}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, mobileNo: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <input
                      type="password"
                      required
                      placeholder="Password"
                      value={employeeFormData.password}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, password: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowEmployeeForm(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm">
                      Add
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {employees.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center text-slate-500">
                No employees yet. Add your first employee!
              </div>
            ) : (
              <div className="grid gap-4">
                {employees.map((employee) => (
                  <div key={employee._id} className="bg-white rounded-lg p-4 shadow-sm flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-slate-800">{employee.name}</h4>
                      <p className="text-sm text-slate-500">{employee.position} • {employee.mobileNo}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${employee.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {employee.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button onClick={() => handleEmployeeRemove(employee._id)} className="text-rose-600 hover:text-rose-700 text-sm">
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-medium text-slate-800">Profile</h2>
              <button
                onClick={() => setEditingProfile(!editingProfile)}
                className="text-teal-600 hover:text-teal-700 text-sm font-medium"
              >
                {editingProfile ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {editingProfile ? (
              <form onSubmit={handleProfileUpdate} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Organization Name</label>
                    <input
                      type="text"
                      value={profileFormData.name || ''}
                      onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={profileFormData.contactPersonName || ''}
                      onChange={(e) => setProfileFormData({ ...profileFormData, contactPersonName: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={profileFormData.contactEmail || ''}
                      onChange={(e) => setProfileFormData({ ...profileFormData, contactEmail: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={profileFormData.contactPhone || ''}
                      onChange={(e) => setProfileFormData({ ...profileFormData, contactPhone: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">City</label>
                    <input
                      type="text"
                      value={profileFormData.city || ''}
                      onChange={(e) => setProfileFormData({ ...profileFormData, city: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Website</label>
                    <input
                      type="url"
                      value={profileFormData.website || ''}
                      onChange={(e) => setProfileFormData({ ...profileFormData, website: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Address</label>
                  <textarea
                    value={profileFormData.address || ''}
                    onChange={(e) => setProfileFormData({ ...profileFormData, address: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Description</label>
                  <textarea
                    value={profileFormData.description || ''}
                    onChange={(e) => setProfileFormData({ ...profileFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setEditingProfile(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm">
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-3">Basic Info</h3>
                    <div className="space-y-2">
                      <p className="text-sm"><span className="text-slate-500">Organization:</span> <span className="text-slate-800">{profile?.name}</span></p>
                      <p className="text-sm"><span className="text-slate-500">Type:</span> <span className="text-slate-800">{profile?.subtype || 'NGO'}</span></p>
                      <p className="text-sm"><span className="text-slate-500">City:</span> <span className="text-slate-800">{profile?.city}</span></p>
                      <p className="text-sm"><span className="text-slate-500">Established:</span> <span className="text-slate-800">{profile?.establishedYear}</span></p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-3">Contact</h3>
                    <div className="space-y-2">
                      <p className="text-sm"><span className="text-slate-500">Person:</span> <span className="text-slate-800">{profile?.contactPersonName}</span></p>
                      <p className="text-sm"><span className="text-slate-500">Email:</span> <span className="text-slate-800">{profile?.contactEmail}</span></p>
                      <p className="text-sm"><span className="text-slate-500">Phone:</span> <span className="text-slate-800">{profile?.contactPhone}</span></p>
                      <p className="text-sm"><span className="text-slate-500">Website:</span> {profile?.website ? (
                        <a href={profile.website} className="text-teal-600 hover:underline">{profile.website}</a>
                      ) : <span className="text-slate-400">Not provided</span>}</p>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-2">Address</h3>
                  <p className="text-sm text-slate-700">{profile?.address || 'Not provided'}</p>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-2">Description</h3>
                  <p className="text-sm text-slate-700">{profile?.description || 'No description'}</p>
                </div>
                {profile?.categories && profile.categories.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-2">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.categories.map((cat, i) => (
                        <span key={i} className="bg-teal-50 text-teal-700 text-xs px-2 py-1 rounded">{cat}</span>
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

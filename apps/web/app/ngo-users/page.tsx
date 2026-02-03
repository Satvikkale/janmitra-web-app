'use client';
import React, { useEffect, useState, useRef } from 'react';
import { apiFetch } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';

interface NgoUserData {
  _id: string;
  ngoName: string;
  name: string;
  position: string;
  mobileNo: string;
  userType: string;
  isActive: boolean;
  profilePhoto: string;
  createdAt: string;
  updatedAt: string;
}

interface Complaint {
  _id: string;
  category: string;
  subcategory?: string;
  description?: string;
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'med' | 'high';
  assignedTo?: string;
  createdAt: string;
}

export default function NGOUsers() {
  const [userData, setUserData] = useState<NgoUserData | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    mobileNo: '',
    isActive: true,
    profilePhoto: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const data = await apiFetch('/ngo-users/me');
        setUserData(data);
        setEditForm({
          name: data.name,
          mobileNo: data.mobileNo,
          isActive: data.isActive,
          profilePhoto: data.profilePhoto || ''
        });
        // Fetch complaints assigned to this user
        const complaintsData = await apiFetch(`/complaints?assignedTo=${data._id}`);
        setComplaints(complaintsData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user data');
      } finally {
        setLoading(false);
      }
    };

    if (isLoggedIn) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const fetchComplaints = async () => {
    if (!userData) return;
    try {
      const complaintsData = await apiFetch(`/complaints?assignedTo=${userData._id}`);
      setComplaints(complaintsData);
    } catch (err) {
      console.error('Error fetching complaints:', err);
    }
  };

  const handleStatusUpdate = async (complaintId: string, newStatus: string) => {
    try {
      setUpdatingStatus(complaintId);
      await apiFetch(`/complaints/${complaintId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      await fetchComplaints();
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update complaint status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleEditClick = () => {
    if (userData) {
      setEditForm({
        name: userData.name,
        mobileNo: userData.mobileNo,
        isActive: userData.isActive,
        profilePhoto: userData.profilePhoto || ''
      });
      setIsEditing(true);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const updatedData = await apiFetch('/ngo-users/me', {
        method: 'PATCH',
        body: JSON.stringify(editForm)
      });
      setUserData(updatedData);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const compressImage = (file: File, maxWidth: number = 300, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedImage = await compressImage(file);
        setEditForm(prev => ({ ...prev, profilePhoto: compressedImage }));
      } catch (err) {
        console.error('Error compressing image:', err);
        setError('Failed to process image');
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">NGO Users Dashboard</h1>
        <p className="text-red-600 text-lg">Please log in to view your dashboard.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">NGO Users Dashboard</h1>
        <p className="text-red-600 text-lg">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Welcome back!</p>
          </div>
          {userData && (
            <button
              onClick={handleEditClick}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Edit Profile
            </button>
          )}
        </div>

        {userData && (
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-6 mb-8">
                {userData.profilePhoto ? (
                  <img
                    src={userData.profilePhoto}
                    alt={userData.name}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-3xl font-bold">
                    {userData.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{userData.name}</h2>
                  <p className="text-gray-600 text-sm mb-3">{userData.position}</p>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    userData.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {userData.isActive ? '● Active' : '● Inactive'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">NGO</p>
                  <p className="text-base font-medium text-gray-900">{userData.ngoName}</p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Mobile</p>
                  <p className="text-base font-medium text-gray-900">{userData.mobileNo}</p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">User Type</p>
                  <p className="text-base font-medium text-gray-900 capitalize">{userData.userType}</p>
                </div>

                <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-100">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Member Since</p>
                  <p className="text-base font-medium text-gray-900">
                    {new Date(userData.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                <div className="bg-pink-50 p-4 rounded-lg border border-pink-100">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Total Complaints</p>
                  <p className="text-base font-medium text-gray-900">{complaints.length}</p>
                </div>

                <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Position</p>
                  <p className="text-base font-medium text-gray-900">{userData.position}</p>
                </div>
              </div>
            </div>

            {/* Complaints Section */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-1">Assigned Complaints</h3>
              <p className="text-gray-600 text-sm mb-6">Track and manage your complaints</p>

              {complaints.length === 0 ? (
                <div className="bg-gray-100 p-8 rounded-lg text-center">
                  <p className="text-gray-500">No complaints assigned yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {complaints.map((complaint) => (
                    <div key={complaint._id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{complaint.category}</h4>
                          {complaint.subcategory && (
                            <p className="text-xs text-gray-500 mt-1">{complaint.subcategory}</p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                            complaint.status === 'open' ? 'bg-yellow-100 text-yellow-700' :
                            complaint.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                            complaint.status === 'in_progress' ? 'bg-purple-100 text-purple-700' :
                            complaint.status === 'resolved' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {complaint.status?.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                            complaint.priority === 'high' ? 'bg-red-100 text-red-700' :
                            complaint.priority === 'med' ? 'bg-orange-100 text-orange-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {complaint.priority}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        {complaint.description || 'No description'}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex gap-2">
                          {complaint.status !== 'in_progress' && complaint.status !== 'resolved' && complaint.status !== 'closed' && (
                            <button
                              onClick={() => handleStatusUpdate(complaint._id, 'in_progress')}
                              disabled={updatingStatus === complaint._id}
                              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              {updatingStatus === complaint._id ? 'Updating...' : 'Start'}
                            </button>
                          )}
                          {complaint.status === 'in_progress' && (
                            <button
                              onClick={() => handleStatusUpdate(complaint._id, 'resolved')}
                              disabled={updatingStatus === complaint._id}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              {updatingStatus === complaint._id ? 'Updating...' : 'Resolve'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h2>

              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  {editForm.profilePhoto ? (
                    <img
                      src={editForm.profilePhoto}
                      alt="Profile"
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-2xl font-bold">
                      {editForm.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile</label>
                <input
                  type="tel"
                  value={editForm.mobileNo}
                  onChange={(e) => setEditForm(prev => ({ ...prev, mobileNo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <button
                  type="button"
                  onClick={() => setEditForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    editForm.isActive ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    editForm.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
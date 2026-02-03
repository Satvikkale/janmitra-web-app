'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface NGO {
  _id: string;
  ngoName: string;
  isVerified: boolean;
  categories: string[];
  city: string;
  createdAt: string;
}

interface Society {
  _id: string;
  name: string;
  createdAt: string;
}

interface Complaint {
  _id: string;
  category: string;
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'med' | 'high';
  createdAt: string;
  societyId: string;
}

interface AnalyticsData {
  ngos: { pending: NGO[]; verified: NGO[] };
  societies: Society[];
  complaints: Complaint[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
const STATUS_COLORS: Record<string, string> = {
  open: '#F59E0B',
  assigned: '#3B82F6',
  in_progress: '#8B5CF6',
  resolved: '#10B981',
  closed: '#6B7280'
};
const PRIORITY_COLORS: Record<string, string> = {
  high: '#EF4444',
  med: '#F59E0B',
  low: '#10B981'
};

export default function NGOAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { isLoggedIn } = useAuth();

  const fetchAllData = useCallback(async () => {
    try {
      const [ngosData, societiesData, complaintsData] = await Promise.all([
        apiFetch('/orgs/ngos'),
        apiFetch('/societies'),
        apiFetch('/complaints')
      ]);

      setData({
        ngos: ngosData,
        societies: societiesData,
        complaints: complaintsData
      });
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchAllData();
    }
  }, [isLoggedIn, fetchAllData]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!isLoggedIn || !autoRefresh) return;

    const interval = setInterval(() => {
      fetchAllData();
    }, 10000);

    return () => clearInterval(interval);
  }, [isLoggedIn, autoRefresh, fetchAllData]);

  if (!isLoggedIn) {
    return <div className="p-8">Please log in to view analytics.</div>;
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {error}</div>;
  }

  if (!data) return null;

  // Calculate statistics
  const totalNGOs = (data.ngos.pending?.length || 0) + (data.ngos.verified?.length || 0);
  const verifiedNGOs = data.ngos.verified?.length || 0;
  const pendingNGOs = data.ngos.pending?.length || 0;
  const totalSocieties = data.societies.length;
  const totalComplaints = data.complaints.length;

  // Complaint status distribution
  const complaintStatusData = Object.entries(
    data.complaints.reduce((acc: Record<string, number>, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name: name.replace('_', ' '), value, fill: STATUS_COLORS[name] }));

  // Complaint priority distribution
  const complaintPriorityData = Object.entries(
    data.complaints.reduce((acc: Record<string, number>, c) => {
      acc[c.priority] = (acc[c.priority] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value, fill: PRIORITY_COLORS[name] }));

  // Complaints by category
  const complaintsByCategoryData = Object.entries(
    data.complaints.reduce((acc: Record<string, number>, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1;
      return acc;
    }, {})
  ).map(([category, count]) => ({ category, count })).slice(0, 8);

  // NGO verification status
  const ngoVerificationData = [
    { name: 'Verified', value: verifiedNGOs, fill: '#10B981' },
    { name: 'Pending', value: pendingNGOs, fill: '#F59E0B' }
  ];

  // Monthly trend data (last 6 months simulation based on createdAt)
  const getMonthlyTrend = () => {
    const months: Record<string, { ngos: number; societies: number; complaints: number }> = {};
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      months[key] = { ngos: 0, societies: 0, complaints: 0 };
    }

    [...(data.ngos.pending || []), ...(data.ngos.verified || [])].forEach((ngo) => {
      const date = new Date(ngo.createdAt);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (months[key]) months[key].ngos++;
    });

    data.societies.forEach((society) => {
      const date = new Date(society.createdAt);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (months[key]) months[key].societies++;
    });

    data.complaints.forEach((complaint) => {
      const date = new Date(complaint.createdAt);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (months[key]) months[key].complaints++;
    });

    return Object.entries(months).map(([month, values]) => ({ month, ...values }));
  };

  const monthlyTrendData = getMonthlyTrend();

  // Resolution rate
  const resolvedComplaints = data.complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length;
  const resolutionRate = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0;

  // Open complaints rate
  const openComplaints = data.complaints.filter(c => c.status === 'open').length;
  const inProgressComplaints = data.complaints.filter(c => c.status === 'in_progress').length;
  const assignedComplaints = data.complaints.filter(c => c.status === 'assigned').length;

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">NGO Analytics Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh (10s)
          </label>
          <button
            onClick={fetchAllData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
          <p className="text-sm text-gray-500 font-medium">Total NGOs</p>
          <p className="text-3xl font-bold text-gray-900">{totalNGOs}</p>
          <div className="flex gap-2 mt-2">
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{verifiedNGOs} verified</span>
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">{pendingNGOs} pending</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
          <p className="text-sm text-gray-500 font-medium">Total Societies</p>
          <p className="text-3xl font-bold text-gray-900">{totalSocieties}</p>
          <p className="text-xs text-gray-400 mt-2">Registered communities</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
          <p className="text-sm text-gray-500 font-medium">Total Complaints</p>
          <p className="text-3xl font-bold text-gray-900">{totalComplaints}</p>
          <div className="flex gap-2 mt-2">
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">{openComplaints} open</span>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">{inProgressComplaints} in progress</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
          <p className="text-sm text-gray-500 font-medium">Resolution Rate</p>
          <p className="text-3xl font-bold text-gray-900">{resolutionRate}%</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${resolutionRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Trend Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="complaints" stackId="1" stroke="#F59E0B" fill="#FEF3C7" name="Complaints" />
              <Area type="monotone" dataKey="societies" stackId="2" stroke="#8B5CF6" fill="#EDE9FE" name="Societies" />
              <Area type="monotone" dataKey="ngos" stackId="3" stroke="#3B82F6" fill="#DBEAFE" name="NGOs" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Complaints by Category */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Complaints by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={complaintsByCategoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="category" type="category" width={100} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Complaint Status Pie */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Complaint Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={complaintStatusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {complaintStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Complaint Priority Pie */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Complaint Priority</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={complaintPriorityData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {complaintPriorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* NGO Verification Status */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">NGO Verification</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={ngoVerificationData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {ngoVerificationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Progress Bars Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Complaint Status Progress */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Complaint Status Breakdown</h3>
          <div className="space-y-4">
            {[
              { label: 'Open', count: openComplaints, color: 'bg-yellow-500' },
              { label: 'Assigned', count: assignedComplaints, color: 'bg-blue-500' },
              { label: 'In Progress', count: inProgressComplaints, color: 'bg-purple-500' },
              { label: 'Resolved', count: data.complaints.filter(c => c.status === 'resolved').length, color: 'bg-green-500' },
              { label: 'Closed', count: data.complaints.filter(c => c.status === 'closed').length, color: 'bg-gray-500' }
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium">{item.count} ({totalComplaints > 0 ? Math.round((item.count / totalComplaints) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`${item.color} h-3 rounded-full transition-all duration-500`}
                    style={{ width: `${totalComplaints > 0 ? (item.count / totalComplaints) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Activity Feed */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {[...data.complaints]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 10)
              .map((complaint) => (
                <div key={complaint._id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    complaint.status === 'open' ? 'bg-yellow-500' :
                    complaint.status === 'assigned' ? 'bg-blue-500' :
                    complaint.status === 'in_progress' ? 'bg-purple-500' :
                    complaint.status === 'resolved' ? 'bg-green-500' : 'bg-gray-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{complaint.category}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(complaint.createdAt).toLocaleString()} • 
                      <span className={`ml-1 ${
                        complaint.priority === 'high' ? 'text-red-600' :
                        complaint.priority === 'med' ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {complaint.priority} priority
                      </span>
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    complaint.status === 'open' ? 'bg-yellow-100 text-yellow-700' :
                    complaint.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                    complaint.status === 'in_progress' ? 'bg-purple-100 text-purple-700' :
                    complaint.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {complaint.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
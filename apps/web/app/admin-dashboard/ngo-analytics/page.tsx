'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  Area,
  RadialBarChart,
  RadialBar
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  isVerified?: boolean;
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
  societies: { pending: Society[]; verified: Society[] };
  complaints: Complaint[];
}

interface FilterState {
  dateFrom: string;
  dateTo: string;
  status: string;
  priority: string;
  category: string;
  ngoVerification: string;
  reportType: 'complaints' | 'ngos' | 'societies' | 'summary';
}

const PASTEL_COLORS = ['#93C5FD', '#86EFAC', '#FCD34D', '#FCA5A5', '#C4B5FD', '#F9A8D4'];
const STATUS_COLORS: Record<string, string> = {
  open: '#FBBF24',
  assigned: '#60A5FA',
  in_progress: '#A78BFA',
  resolved: '#34D399',
  closed: '#9CA3AF'
};
const PRIORITY_COLORS: Record<string, string> = {
  high: '#F87171',
  med: '#FBBF24',
  low: '#34D399'
};

export default function NGOAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: '',
    dateTo: '',
    status: '',
    priority: '',
    category: '',
    ngoVerification: '',
    reportType: 'summary'
  });
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

  useEffect(() => {
    if (!isLoggedIn || !autoRefresh) return;

    const interval = setInterval(() => {
      fetchAllData();
    }, 10000);

    return () => clearInterval(interval);
  }, [isLoggedIn, autoRefresh, fetchAllData]);

  // Filter data based on filter state
  const filteredData = useMemo(() => {
    if (!data) return null;

    let filteredComplaints = [...data.complaints];
    let filteredNGOs = [...(data.ngos.pending || []), ...(data.ngos.verified || [])];
    let filteredSocieties = [...(data.societies.pending || []), ...(data.societies.verified || [])];

    // Date filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filteredComplaints = filteredComplaints.filter(c => new Date(c.createdAt) >= fromDate);
      filteredNGOs = filteredNGOs.filter(n => new Date(n.createdAt) >= fromDate);
      filteredSocieties = filteredSocieties.filter(s => new Date(s.createdAt) >= fromDate);
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filteredComplaints = filteredComplaints.filter(c => new Date(c.createdAt) <= toDate);
      filteredNGOs = filteredNGOs.filter(n => new Date(n.createdAt) <= toDate);
      filteredSocieties = filteredSocieties.filter(s => new Date(s.createdAt) <= toDate);
    }

    // Status filter (complaints only)
    if (filters.status) {
      filteredComplaints = filteredComplaints.filter(c => c.status === filters.status);
    }

    // Priority filter (complaints only)
    if (filters.priority) {
      filteredComplaints = filteredComplaints.filter(c => c.priority === filters.priority);
    }

    // Category filter (complaints only)
    if (filters.category) {
      filteredComplaints = filteredComplaints.filter(c => c.category === filters.category);
    }

    // NGO verification filter
    if (filters.ngoVerification) {
      filteredNGOs = filteredNGOs.filter(n => 
        filters.ngoVerification === 'verified' ? n.isVerified : !n.isVerified
      );
    }

    return {
      complaints: filteredComplaints,
      ngos: filteredNGOs,
      societies: filteredSocieties
    };
  }, [data, filters]);

  // Get unique categories from complaints
  const categories = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.complaints.map(c => c.category))];
  }, [data]);

  // Export to Excel
  const exportToExcel = () => {
    if (!filteredData) return;

    const workbook = XLSX.utils.book_new();

    if (filters.reportType === 'complaints' || filters.reportType === 'summary') {
      const complaintsData = filteredData.complaints.map(c => ({
        'ID': c._id,
        'Category': c.category,
        'Status': c.status,
        'Priority': c.priority,
        'Created At': new Date(c.createdAt).toLocaleString(),
        'Society ID': c.societyId
      }));
      const wsComplaints = XLSX.utils.json_to_sheet(complaintsData);
      XLSX.utils.book_append_sheet(workbook, wsComplaints, 'Complaints');
    }

    if (filters.reportType === 'ngos' || filters.reportType === 'summary') {
      const ngosData = filteredData.ngos.map(n => ({
        'ID': n._id,
        'NGO Name': n.ngoName,
        'City': n.city,
        'Categories': n.categories?.join(', ') || '',
        'Verified': n.isVerified ? 'Yes' : 'No',
        'Created At': new Date(n.createdAt).toLocaleString()
      }));
      const wsNGOs = XLSX.utils.json_to_sheet(ngosData);
      XLSX.utils.book_append_sheet(workbook, wsNGOs, 'NGOs');
    }

    if (filters.reportType === 'societies' || filters.reportType === 'summary') {
      const societiesData = filteredData.societies.map(s => ({
        'ID': s._id,
        'Name': s.name,
        'Created At': new Date(s.createdAt).toLocaleString()
      }));
      const wsSocieties = XLSX.utils.json_to_sheet(societiesData);
      XLSX.utils.book_append_sheet(workbook, wsSocieties, 'Societies');
    }

    // Add summary sheet
    if (filters.reportType === 'summary') {
      const summaryData = [
        { 'Metric': 'Total Complaints', 'Value': filteredData.complaints.length },
        { 'Metric': 'Open Complaints', 'Value': filteredData.complaints.filter(c => c.status === 'open').length },
        { 'Metric': 'In Progress', 'Value': filteredData.complaints.filter(c => c.status === 'in_progress').length },
        { 'Metric': 'Resolved', 'Value': filteredData.complaints.filter(c => c.status === 'resolved').length },
        { 'Metric': 'Total NGOs', 'Value': filteredData.ngos.length },
        { 'Metric': 'Verified NGOs', 'Value': filteredData.ngos.filter(n => n.isVerified).length },
        { 'Metric': 'Pending NGOs', 'Value': filteredData.ngos.filter(n => !n.isVerified).length },
        { 'Metric': 'Total Societies', 'Value': filteredData.societies.length }
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, wsSummary, 'Summary');
    }

    const fileName = `NGO_Analytics_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    setShowExportModal(false);
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!filteredData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246);
    doc.text('NGO Analytics Report', pageWidth / 2, 20, { align: 'center' });
    
    // Date
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 28, { align: 'center' });

    // Filter info
    let filterText = 'Filters Applied: ';
    if (filters.dateFrom || filters.dateTo) {
      filterText += `Date: ${filters.dateFrom || 'Start'} to ${filters.dateTo || 'End'}, `;
    }
    if (filters.status) filterText += `Status: ${filters.status}, `;
    if (filters.priority) filterText += `Priority: ${filters.priority}, `;
    if (filters.category) filterText += `Category: ${filters.category}, `;
    if (filterText === 'Filters Applied: ') filterText += 'None';
    doc.setFontSize(8);
    doc.text(filterText, 14, 35);

    let yPos = 45;

    // Summary section
    if (filters.reportType === 'summary' || filters.reportType === 'complaints') {
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text('Summary Statistics', 14, yPos);
      yPos += 8;

      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: [
          ['Total Complaints', filteredData.complaints.length.toString()],
          ['Open', filteredData.complaints.filter(c => c.status === 'open').length.toString()],
          ['Assigned', filteredData.complaints.filter(c => c.status === 'assigned').length.toString()],
          ['In Progress', filteredData.complaints.filter(c => c.status === 'in_progress').length.toString()],
          ['Resolved', filteredData.complaints.filter(c => c.status === 'resolved').length.toString()],
          ['Closed', filteredData.complaints.filter(c => c.status === 'closed').length.toString()],
        ],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14 },
        tableWidth: 80
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Complaints table
    if (filters.reportType === 'complaints' || filters.reportType === 'summary') {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text('Complaints Details', 14, yPos);
      yPos += 8;

      const complaintsRows = filteredData.complaints.slice(0, 50).map(c => [
        c.category,
        c.status,
        c.priority,
        new Date(c.createdAt).toLocaleDateString()
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Category', 'Status', 'Priority', 'Date']],
        body: complaintsRows,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // NGOs table
    if (filters.reportType === 'ngos' || filters.reportType === 'summary') {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text('NGOs Details', 14, yPos);
      yPos += 8;

      const ngosRows = filteredData.ngos.slice(0, 30).map(n => [
        n.ngoName,
        n.city || 'N/A',
        n.isVerified ? 'Yes' : 'No',
        new Date(n.createdAt).toLocaleDateString()
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['NGO Name', 'City', 'Verified', 'Date']],
        body: ngosRows,
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94] },
        styles: { fontSize: 8 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Societies table
    if (filters.reportType === 'societies' || filters.reportType === 'summary') {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text('Societies Details', 14, yPos);
      yPos += 8;

      const societiesRows = filteredData.societies.slice(0, 30).map(s => [
        s.name,
        new Date(s.createdAt).toLocaleDateString()
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Society Name', 'Created Date']],
        body: societiesRows,
        theme: 'striped',
        headStyles: { fillColor: [168, 85, 247] },
        styles: { fontSize: 8 }
      });
    }

    const fileName = `NGO_Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    setShowExportModal(false);
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      status: '',
      priority: '',
      category: '',
      ngoVerification: '',
      reportType: 'summary'
    });
  };

  if (!isLoggedIn) {
    return <div className="p-8 text-slate-700">Please log in to view analytics.</div>;
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-500"></div>
          <p className="text-slate-500 animate-pulse">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-xl m-8">
        <p className="text-red-600 font-medium">Error: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  // Use filtered data for display when filters are active
  const displayComplaints = filteredData?.complaints || data.complaints;
  const displayNGOs = filteredData?.ngos || [...(data.ngos.pending || []), ...(data.ngos.verified || [])];
  const displaySocieties = filteredData?.societies || [...(data.societies.pending || []), ...(data.societies.verified || [])];

  const totalNGOs = displayNGOs.length;
  const verifiedNGOs = displayNGOs.filter(n => n.isVerified).length;
  const pendingNGOs = displayNGOs.filter(n => !n.isVerified).length;
  const totalSocieties = displaySocieties.length;
  const totalComplaints = displayComplaints.length;

  const complaintStatusData = Object.entries(
    displayComplaints.reduce((acc: Record<string, number>, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name: name.replace('_', ' '), value, fill: STATUS_COLORS[name] }));

  const complaintPriorityData = Object.entries(
    displayComplaints.reduce((acc: Record<string, number>, c) => {
      acc[c.priority] = (acc[c.priority] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value, fill: PRIORITY_COLORS[name] }));

  const complaintsByCategoryData = Object.entries(
    displayComplaints.reduce((acc: Record<string, number>, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1;
      return acc;
    }, {})
  ).map(([category, count]) => ({ category, count })).slice(0, 8);

  const ngoVerificationData = [
    { name: 'Verified', value: verifiedNGOs, fill: '#86EFAC' },
    { name: 'Pending', value: pendingNGOs, fill: '#FCD34D' }
  ];

  const getMonthlyTrend = () => {
    const months: Record<string, { ngos: number; societies: number; complaints: number }> = {};
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      months[key] = { ngos: 0, societies: 0, complaints: 0 };
    }

    displayNGOs.forEach((ngo) => {
      const date = new Date(ngo.createdAt);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (months[key]) months[key].ngos++;
    });

    displaySocieties.forEach((society) => {
      const date = new Date(society.createdAt);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (months[key]) months[key].societies++;
    });

    displayComplaints.forEach((complaint) => {
      const date = new Date(complaint.createdAt);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (months[key]) months[key].complaints++;
    });

    return Object.entries(months).map(([month, values]) => ({ month, ...values }));
  };

  const monthlyTrendData = getMonthlyTrend();

  const resolvedComplaints = displayComplaints.filter(c => c.status === 'resolved' || c.status === 'closed').length;
  const resolutionRate = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0;

  const openComplaints = displayComplaints.filter(c => c.status === 'open').length;
  const inProgressComplaints = displayComplaints.filter(c => c.status === 'in_progress').length;
  const assignedComplaints = displayComplaints.filter(c => c.status === 'assigned').length;

  const radialData = [
    { name: 'Resolution', value: resolutionRate, fill: '#34D399' }
  ];

  return (
    <div className="p-4 sm:p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            NGO Analytics Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-slate-600 bg-white/70 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-200">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-slate-300 text-blue-500 focus:ring-blue-400"
            />
            Auto-refresh
          </label>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              showFilters ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-white/70 text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Report
          </button>
          <button
            onClick={fetchAllData}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm p-6 border border-slate-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Filter Data</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Complaint Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
              >
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="med">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">NGO Verification</label>
              <select
                value={filters.ngoVerification}
                onChange={(e) => setFilters(prev => ({ ...prev, ngoVerification: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
              >
                <option value="">All NGOs</option>
                <option value="verified">Verified Only</option>
                <option value="pending">Pending Only</option>
              </select>
            </div>
          </div>
          {/* Active Filters Summary */}
          {(filters.dateFrom || filters.dateTo || filters.status || filters.priority || filters.category || filters.ngoVerification) && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-slate-500">Active filters:</span>
                {filters.dateFrom && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">From: {filters.dateFrom}</span>
                )}
                {filters.dateTo && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">To: {filters.dateTo}</span>
                )}
                {filters.status && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Status: {filters.status}</span>
                )}
                {filters.priority && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Priority: {filters.priority}</span>
                )}
                {filters.category && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Category: {filters.category}</span>
                )}
                {filters.ngoVerification && (
                  <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full">NGO: {filters.ngoVerification}</span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Showing {filteredData?.complaints.length || 0} complaints, {filteredData?.ngos.length || 0} NGOs, {filteredData?.societies.length || 0} societies
              </p>
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 border border-blue-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-sm text-slate-500 font-medium">Total NGOs</p>
          </div>
          <p className="text-3xl font-bold text-slate-800">{totalNGOs}</p>
          <div className="flex gap-2 mt-3">
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">{verifiedNGOs} verified</span>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">{pendingNGOs} pending</span>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 border border-purple-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-sm text-slate-500 font-medium">Total Societies</p>
          </div>
          <p className="text-3xl font-bold text-slate-800">{totalSocieties}</p>
          <p className="text-xs text-slate-400 mt-3">Registered communities</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 border border-amber-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm text-slate-500 font-medium">Total Complaints</p>
          </div>
          <p className="text-3xl font-bold text-slate-800">{totalComplaints}</p>
          <div className="flex gap-2 mt-3">
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">{openComplaints} open</span>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">{inProgressComplaints} active</span>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 border border-green-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-slate-500 font-medium">Resolution Rate</p>
          </div>
          <p className="text-3xl font-bold text-slate-800">{resolutionRate}%</p>
          <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-400 to-emerald-500 h-2.5 rounded-full transition-all duration-700"
              style={{ width: `${resolutionRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Trend Chart */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></span>
            Monthly Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255,255,255,0.95)', 
                  borderRadius: '12px', 
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <Legend />
              <Line type="monotone" dataKey="complaints" stroke="#F59E0B" strokeWidth={3} dot={{ fill: '#F59E0B', r: 4 }} name="Complaints" />
              <Line type="monotone" dataKey="societies" stroke="#8B5CF6" strokeWidth={3} dot={{ fill: '#8B5CF6', r: 4 }} name="Societies" />
              <Line type="monotone" dataKey="ngos" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', r: 4 }} name="NGOs" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Complaints by Category */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full"></span>
            Complaints by Category
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={complaintsByCategoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis type="number" tick={{ fill: '#64748B', fontSize: 12 }} />
              <YAxis dataKey="category" type="category" width={100} tick={{ fill: '#64748B', fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255,255,255,0.95)', 
                  borderRadius: '12px', 
                  border: '1px solid #E2E8F0' 
                }} 
              />
              <Bar dataKey="count" fill="url(#colorGradient)" radius={[0, 8, 8, 0]} />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#60A5FA" />
                  <stop offset="100%" stopColor="#818CF8" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Complaint Status */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></span>
            Complaint Status
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={complaintStatusData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {complaintStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} stroke="white" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255,255,255,0.95)', 
                  borderRadius: '12px', 
                  border: '1px solid #E2E8F0' 
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {complaintStatusData.map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill }}></span>
                <span className="text-slate-600 capitalize">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Complaint Priority */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-gradient-to-b from-red-500 to-amber-500 rounded-full"></span>
            Priority Levels
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={complaintPriorityData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {complaintPriorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} stroke="white" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255,255,255,0.95)', 
                  borderRadius: '12px', 
                  border: '1px solid #E2E8F0' 
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {complaintPriorityData.map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill }}></span>
                <span className="text-slate-600 capitalize">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* NGO Verification */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></span>
            NGO Verification
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={ngoVerificationData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {ngoVerificationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} stroke="white" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255,255,255,0.95)', 
                  borderRadius: '12px', 
                  border: '1px solid #E2E8F0' 
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {ngoVerificationData.map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill }}></span>
                <span className="text-slate-600">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2">
            <span className="w-1 h-5 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></span>
            Status Breakdown
          </h3>
          <div className="space-y-5">
            {[
              { label: 'Open', count: openComplaints, gradient: 'from-amber-400 to-yellow-500', bg: 'bg-amber-50' },
              { label: 'Assigned', count: assignedComplaints, gradient: 'from-blue-400 to-blue-500', bg: 'bg-blue-50' },
              { label: 'In Progress', count: inProgressComplaints, gradient: 'from-purple-400 to-violet-500', bg: 'bg-purple-50' },
              { label: 'Resolved', count: displayComplaints.filter(c => c.status === 'resolved').length, gradient: 'from-green-400 to-emerald-500', bg: 'bg-green-50' },
              { label: 'Closed', count: displayComplaints.filter(c => c.status === 'closed').length, gradient: 'from-slate-400 to-slate-500', bg: 'bg-slate-50' }
            ].map((item) => (
              <div key={item.label} className={`p-3 rounded-xl ${item.bg}`}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-700 font-medium">{item.label}</span>
                  <span className="font-semibold text-slate-800">{item.count} <span className="font-normal text-slate-500">({totalComplaints > 0 ? Math.round((item.count / totalComplaints) * 100) : 0}%)</span></span>
                </div>
                <div className="w-full bg-white/80 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`bg-gradient-to-r ${item.gradient} h-2.5 rounded-full transition-all duration-700`}
                    style={{ width: `${totalComplaints > 0 ? (item.count / totalComplaints) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2">
            <span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full"></span>
            Recent Activity
          </h3>
          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-2">
            {[...displayComplaints]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 10)
              .map((complaint) => (
                <div key={complaint._id} className="flex items-start gap-3 p-3 bg-slate-50/80 rounded-xl hover:bg-slate-100/80 transition-colors">
                  <div className={`w-3 h-3 rounded-full mt-1.5 ring-4 ${
                    complaint.status === 'open' ? 'bg-amber-400 ring-amber-100' :
                    complaint.status === 'assigned' ? 'bg-blue-400 ring-blue-100' :
                    complaint.status === 'in_progress' ? 'bg-purple-400 ring-purple-100' :
                    complaint.status === 'resolved' ? 'bg-green-400 ring-green-100' : 'bg-slate-400 ring-slate-100'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{complaint.category}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(complaint.createdAt).toLocaleString()} • 
                      <span className={`ml-1 font-medium ${
                        complaint.priority === 'high' ? 'text-red-500' :
                        complaint.priority === 'med' ? 'text-amber-500' : 'text-green-500'
                      }`}>
                        {complaint.priority} priority
                      </span>
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${
                    complaint.status === 'open' ? 'bg-amber-100 text-amber-700' :
                    complaint.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                    complaint.status === 'in_progress' ? 'bg-purple-100 text-purple-700' :
                    complaint.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {complaint.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">Download Report</h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Report Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'summary', label: 'Full Summary', icon: '📊' },
                  { value: 'complaints', label: 'Complaints', icon: '📋' },
                  { value: 'ngos', label: 'NGOs', icon: '🏢' },
                  { value: 'societies', label: 'Societies', icon: '👥' }
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setFilters(prev => ({ ...prev, reportType: type.value as FilterState['reportType'] }))}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      filters.reportType === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xl mb-1 block">{type.icon}</span>
                    <span className="text-sm font-medium text-slate-700">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Data Preview */}
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-slate-600 mb-2">Data to be exported:</p>
              <div className="space-y-1 text-sm text-slate-500">
                {(filters.reportType === 'complaints' || filters.reportType === 'summary') && (
                  <p>• {filteredData?.complaints.length || 0} Complaints</p>
                )}
                {(filters.reportType === 'ngos' || filters.reportType === 'summary') && (
                  <p>• {filteredData?.ngos.length || 0} NGOs</p>
                )}
                {(filters.reportType === 'societies' || filters.reportType === 'summary') && (
                  <p>• {filteredData?.societies.length || 0} Societies</p>
                )}
              </div>
              {(filters.dateFrom || filters.dateTo || filters.status || filters.priority || filters.category) && (
                <p className="text-xs text-blue-600 mt-2">* Filters are applied</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={exportToExcel}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 rounded-xl font-medium transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Excel (.xlsx)
              </button>
              <button
                onClick={exportToPDF}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white py-3 rounded-xl font-medium transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
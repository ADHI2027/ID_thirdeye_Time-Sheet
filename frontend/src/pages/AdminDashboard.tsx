import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Users, UserCheck, Clock, CheckCircle, AlertTriangle, 
  Calendar, Award, Moon, Sun, LogOut, Key,
  Search, Plus, Edit, Trash, Lock, ToggleLeft, 
  ToggleRight, Download, Settings, Trash2
} from 'lucide-react';
import axios from 'axios';
import {
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Active Tab state: 'overview' | 'employees' | 'attendance' | 'claims' | 'settings'
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'attendance' | 'claims' | 'settings'>('overview');

  // Stats / Overview data
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Employees tab data
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeesPage, setEmployeesPage] = useState(0);
  const [employeesTotalPages, setEmployeesTotalPages] = useState(0);
  const [empSearch, setEmpSearch] = useState('');
  const [empDeptFilter, setEmpDeptFilter] = useState('');
  const [empStatusFilter, setEmpStatusFilter] = useState('');
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Attendance tab data
  const [attendance, setAttendance] = useState<any[]>([]);
  const [attendancePage, setAttendancePage] = useState(0);
  const [attendanceTotalPages, setAttendanceTotalPages] = useState(0);
  const [attSearchId, setAttSearchId] = useState('');
  const [attStatusFilter, setAttStatusFilter] = useState('');
  const [attStartDate, setAttStartDate] = useState('');
  const [attEndDate, setAttEndDate] = useState('');
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Comp-off claims
  const [pendingClaims, setPendingClaims] = useState<any[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(false);

  // Holidays and Settings
  const [holidays, setHolidays] = useState<any[]>([]);
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [weekendSat, setWeekendSat] = useState(true);
  const [weekendSun, setWeekendSun] = useState(true);
  const [minHoursSetting, setMinHoursSetting] = useState('6.0');
  const [loadingSettings, setLoadingSettings] = useState(false);

  // Employee CRUD Modals
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [showEditEmpModal, setShowEditEmpModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [empId, setEmpId] = useState('');
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empDept, setEmpDept] = useState('Engineering');
  const [empDesg, setEmpDesg] = useState('');
  const [empPass, setEmpPass] = useState('');
  const [empRole, setEmpRole] = useState<'EMPLOYEE' | 'ADMIN'>('EMPLOYEE');
  const [empCrudError, setEmpCrudError] = useState<string | null>(null);

  // Password Override Modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmpId, setResetEmpId] = useState('');
  const [newPassOverride, setNewPassOverride] = useState('');
  const [overrideError, setOverrideError] = useState<string | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  // Admin Password Change Modal
  const [showAdminPassModal, setShowAdminPassModal] = useState(false);
  const [adminOldPass, setAdminOldPass] = useState('');
  const [adminNewPass, setAdminNewPass] = useState('');
  const [adminConfirmPass, setAdminConfirmPass] = useState('');
  const [adminPassError, setAdminPassError] = useState<string | null>(null);
  const [adminPassSuccess, setAdminPassSuccess] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Admin Change Password handler
  const handleAdminPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPassError(null);
    setAdminPassSuccess(null);

    if (adminNewPass !== adminConfirmPass) {
      setAdminPassError('New passwords do not match.');
      return;
    }
    if (adminNewPass.length < 6) {
      setAdminPassError('Password must be at least 6 characters.');
      return;
    }

    try {
      await axios.post('/api/auth/change-password', {
        currentPassword: adminOldPass,
        newPassword: adminNewPass
      });
      setAdminPassSuccess('Password changed successfully!');
      setAdminOldPass('');
      setAdminNewPass('');
      setAdminConfirmPass('');
      showToast('Admin password changed successfully.', 'success');
      setTimeout(() => setShowAdminPassModal(false), 2000);
    } catch (err: any) {
      setAdminPassError(err.response?.data?.message || 'Failed to change password.');
    }
  };

  // Fetch functions
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await axios.get('/api/admin/stats');
      setStats(res.data);
    } catch (e) {
      showToast('Failed to load dashboard statistics.', 'error');
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const res = await axios.get('/api/admin/employees', {
        params: {
          search: empSearch,
          department: empDeptFilter,
          status: empStatusFilter,
          page: employeesPage,
          size: 10
        }
      });
      setEmployees(res.data.content || []);
      setEmployeesTotalPages(res.data.totalPages || 0);
    } catch (e) {
      showToast('Failed to load employee list.', 'error');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoadingAttendance(true);
      const res = await axios.get('/api/admin/attendance', {
        params: {
          employeeId: attSearchId || null,
          startDate: attStartDate || null,
          endDate: attEndDate || null,
          status: attStatusFilter || null,
          page: attendancePage,
          size: 15
        }
      });
      setAttendance(res.data.content || []);
      setAttendanceTotalPages(res.data.totalPages || 0);
    } catch (e) {
      showToast('Failed to load attendance logs.', 'error');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const fetchClaims = async () => {
    try {
      setLoadingClaims(true);
      const res = await axios.get('/api/claims/pending');
      setPendingClaims(res.data || []);
    } catch (e) {
      showToast('Failed to load pending comp-off claims.', 'error');
    } finally {
      setLoadingClaims(false);
    }
  };

  const fetchSettingsAndHolidays = async () => {
    try {
      setLoadingSettings(true);
      const [holidaysRes, settingsRes] = await Promise.all([
        axios.get('/api/admin/holidays'),
        axios.get('/api/admin/settings')
      ]);
      setHolidays(holidaysRes.data || []);
      
      const settings = settingsRes.data || [];
      const weekendDaysSetting = settings.find((s: any) => s.settingKey === 'weekend_days')?.settingValue || '';
      setWeekendSat(weekendDaysSetting.toUpperCase().includes('SATURDAY'));
      setWeekendSun(weekendDaysSetting.toUpperCase().includes('SUNDAY'));

      const minHours = settings.find((s: any) => s.settingKey === 'min_working_hours')?.settingValue || '6.0';
      setMinHoursSetting(minHours);
    } catch (e) {
      showToast('Failed to load settings configuration.', 'error');
    } finally {
      setLoadingSettings(false);
    }
  };

  // Trigger loads based on active tab
  useEffect(() => {
    if (activeTab === 'overview') fetchStats();
    if (activeTab === 'employees') fetchEmployees();
    if (activeTab === 'attendance') fetchAttendance();
    if (activeTab === 'claims') fetchClaims();
    if (activeTab === 'settings') fetchSettingsAndHolidays();
  }, [activeTab, employeesPage, attendancePage]);

  // Handle Search & Filter clicks
  const triggerEmployeeSearch = () => {
    setEmployeesPage(0);
    fetchEmployees();
  };

  const triggerAttendanceSearch = () => {
    setAttendancePage(0);
    fetchAttendance();
  };

  // Claim processing
  const handleApproveClaim = async (claimId: number) => {
    try {
      await axios.post(`/api/claims/${claimId}/approve`);
      showToast('Claim approved successfully.', 'success');
      fetchClaims();
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Failed to approve claim.', 'error');
    }
  };

  const handleRejectClaim = async (claimId: number) => {
    try {
      await axios.post(`/api/claims/${claimId}/reject`);
      showToast('Claim rejected successfully.', 'success');
      fetchClaims();
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Failed to reject claim.', 'error');
    }
  };

  // CRUD actions
  const handleAddEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmpCrudError(null);

    if (!empId || !empName || !empEmail || !empDesg || !empPass) {
      setEmpCrudError('All fields are required.');
      return;
    }

    try {
      await axios.post('/api/admin/employees', {
        employeeId: empId,
        name: empName,
        email: empEmail,
        department: '',
        designation: empDesg,
        passwordHash: empPass,
        status: 'ACTIVE',
        role: empRole
      });
      showToast('Employee account created successfully!', 'success');
      setShowAddEmpModal(false);
      
      // Clear forms
      setEmpId('');
      setEmpName('');
      setEmpEmail('');
      setEmpDesg('');
      setEmpPass('');
      setEmpRole('EMPLOYEE');
      fetchEmployees();
    } catch (err: any) {
      setEmpCrudError(err.response?.data?.message || 'Failed to create employee account.');
    }
  };

  const openEditModal = (emp: any) => {
    setSelectedEmp(emp);
    setEmpName(emp.name);
    setEmpEmail(emp.email);
    setEmpDept(emp.department);
    setEmpDesg(emp.designation);
    setEmpRole(emp.role);
    setEmpCrudError(null);
    setShowEditEmpModal(true);
  };

  const handleEditEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmpCrudError(null);

    if (!empName || !empEmail || !empDesg) {
      setEmpCrudError('All fields are required.');
      return;
    }

    try {
      await axios.put(`/api/admin/employees/${selectedEmp.employeeId}`, {
        name: empName,
        email: empEmail,
        department: empDept,
        designation: empDesg,
        role: empRole
      });
      showToast('Employee account updated successfully!', 'success');
      setShowEditEmpModal(false);
      fetchEmployees();
    } catch (err: any) {
      setEmpCrudError(err.response?.data?.message || 'Failed to update employee account.');
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm(`Are you sure you want to delete employee ${employeeId}?`)) return;
    try {
      await axios.delete(`/api/admin/employees/${employeeId}`);
      showToast('Employee account deleted.', 'success');
      fetchEmployees();
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Failed to delete account.', 'error');
    }
  };

  const handleToggleStatus = async (employeeId: string) => {
    try {
      await axios.post(`/api/admin/employees/${employeeId}/toggle-status`);
      showToast('Employee active status toggled.', 'success');
      fetchEmployees();
    } catch (e: any) {
      showToast('Failed to toggle status.', 'error');
    }
  };

  const handleOverridePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOverrideError(null);

    if (!newPassOverride) {
      setOverrideError('Password cannot be empty.');
      return;
    }

    try {
      await axios.post(`/api/admin/employees/${resetEmpId}/reset-password`, { newPassword: newPassOverride });
      showToast('Password reset successfully.', 'success');
      setShowResetModal(false);
      setNewPassOverride('');
      setResetEmpId('');
    } catch (err: any) {
      setOverrideError(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  // Settings updates
  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayName || !newHolidayDate) return;

    try {
      await axios.post('/api/admin/holidays', {
        holidayName: newHolidayName,
        date: newHolidayDate
      });
      showToast('Holiday added successfully.', 'success');
      setNewHolidayName('');
      setNewHolidayDate('');
      fetchSettingsAndHolidays();
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Failed to add holiday.', 'error');
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    try {
      await axios.delete(`/api/admin/holidays/${id}`);
      showToast('Holiday deleted.', 'success');
      fetchSettingsAndHolidays();
    } catch (e: any) {
      showToast('Failed to delete holiday.', 'error');
    }
  };

  const handleUpdateSettings = async () => {
    const weekendDaysList: string[] = [];
    if (weekendSat) weekendDaysList.push('SATURDAY');
    if (weekendSun) weekendDaysList.push('SUNDAY');

    try {
      await axios.post('/api/admin/settings', {
        weekend_days: weekendDaysList.join(','),
        min_working_hours: minHoursSetting
      });
      showToast('Settings saved successfully.', 'success');
    } catch (e: any) {
      showToast('Failed to save settings.', 'error');
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (attSearchId) params.append('employeeId', attSearchId);
    if (attStartDate) params.append('startDate', attStartDate);
    if (attEndDate) params.append('endDate', attEndDate);
    
    window.open(`/api/admin/attendance/export?${params.toString()}`, '_blank');
    showToast('Attendance report CSV download started.', 'info');
  };

  // Recharts styling calculations
  const getPieChartData = () => {
    if (!stats || !stats.departmentComparison) return [];
    return stats.departmentComparison;
  };

  // Grayscale colors for charts
  const GRAYSCALE_COLORS = ['#09090b', '#27272a', '#52525b', '#71717a', '#a1a1aa', '#d4d4d8'];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row transition-colors duration-300">
      
      {/* Sidebar Panel */}
      <aside className="w-full md:w-64 shrink-0 bg-card border-b md:border-b-0 md:border-r border-border p-6 flex flex-col justify-between">
        <div className="space-y-8">
          {/* Brand */}
          <div className="flex items-center">
            <img 
              src={theme === 'light' ? '/logo-dark.png' : '/logo-light.png'} 
              alt="ID Thirdeye" 
              className="h-10 w-auto object-contain"
            />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition duration-150 flex items-center space-x-2.5 ${
                activeTab === 'overview' ? 'bg-foreground text-background' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users size={16} />
              <span>Overview Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('employees')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition duration-150 flex items-center space-x-2.5 ${
                activeTab === 'employees' ? 'bg-foreground text-background' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserCheck size={16} />
              <span>Manage Employees</span>
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition duration-150 flex items-center space-x-2.5 ${
                activeTab === 'attendance' ? 'bg-foreground text-background' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Clock size={16} />
              <span>Attendance History</span>
            </button>

            <button
              onClick={() => setActiveTab('claims')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition duration-150 flex items-center space-x-2.5 ${
                activeTab === 'claims' ? 'bg-foreground text-background' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Award size={16} />
              <div className="flex items-center justify-between w-full">
                <span>Comp-Off Claims</span>
                {stats?.pendingClaims > 0 && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === 'claims' ? 'bg-background text-foreground' : 'bg-foreground text-background'
                  }`}>
                    {stats.pendingClaims}
                  </span>
                )}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition duration-150 flex items-center space-x-2.5 ${
                activeTab === 'settings' ? 'bg-foreground text-background' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Settings size={16} />
              <span>Settings & Holidays</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="pt-6 border-t border-border mt-6 md:mt-0 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Mode toggle</span>
            <button 
              onClick={toggleTheme}
              className="p-1.5 border border-border rounded bg-card hover:bg-muted transition duration-200"
            >
              {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            </button>
          </div>

          <button
            onClick={() => {
              setAdminPassError(null);
              setAdminPassSuccess(null);
              setAdminOldPass('');
              setAdminNewPass('');
              setAdminConfirmPass('');
              setShowAdminPassModal(true);
            }}
            className="w-full py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold flex items-center justify-center space-x-2 transition duration-200 text-muted-foreground hover:text-foreground"
          >
            <Key size={14} />
            <span>Change Password</span>
          </button>
          
          <button
            onClick={() => logout()}
            className="w-full py-2.5 rounded-xl border border-border hover:bg-muted hover:text-destructive text-xs font-semibold flex items-center justify-center space-x-2 transition duration-200"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Dashboard Panel */}
      <main className="flex-1 overflow-x-hidden p-6 md:p-8 space-y-8">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Top row greeting */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Organization Overview</h1>
                <p className="text-xs text-muted-foreground">Real-time statistics and administrative trends.</p>
              </div>
            </div>

            {loadingStats ? (
              <div className="h-64 w-full flex items-center justify-center">
                <div className="h-8 w-8 border-4 border-foreground border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : stats && (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
                    <div className="text-muted-foreground"><Users size={18} /></div>
                    <div className="text-2xl font-bold mt-2">{stats.totalEmployees}</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Total Employees</div>
                  </div>
                  
                  <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
                    <div className="text-emerald-500"><UserCheck size={18} /></div>
                    <div className="text-2xl font-bold mt-2">{stats.presentToday}</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Present Today</div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
                    <div className="text-sky-500"><Clock size={18} /></div>
                    <div className="text-2xl font-bold mt-2">{stats.workingNow}</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Working Now</div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
                    <div className="text-emerald-500"><CheckCircle size={18} /></div>
                    <div className="text-2xl font-bold mt-2">{stats.completedToday}</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Completed Today</div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
                    <div className="text-amber-500"><AlertTriangle size={18} /></div>
                    <div className="text-2xl font-bold mt-2">{stats.incompleteToday}</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Incomplete Today</div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
                    <div className="text-red-500"><AlertTriangle size={18} /></div>
                    <div className="text-2xl font-bold mt-2">{stats.absentToday}</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Absent Today</div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
                    <div className="text-purple-500"><Calendar size={18} /></div>
                    <div className="text-2xl font-bold mt-2">{stats.weekendWorkers}</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Weekend Work</div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
                    <div className="text-sky-500"><Calendar size={18} /></div>
                    <div className="text-2xl font-bold mt-2">{stats.holidayWorkers}</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Holiday Work</div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
                    <div className="text-zinc-500"><Award size={18} /></div>
                    <div className="text-2xl font-bold mt-2">{stats.pendingClaims}</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Pending Claims</div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
                    <div className="text-zinc-500"><Clock size={18} /></div>
                    <div className="text-2xl font-bold mt-2">{stats.averageWorkingHours}h</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Avg Productive Hrs</div>
                  </div>
                </div>

                {/* Graph Analytics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Daily worked hours weekly trends */}
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm lg:col-span-2">
                    <h3 className="text-sm font-bold tracking-tight mb-6">Attendance Density (Past 7 Days)</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.weeklyTrend}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#27272a' : '#e4e4e7'} />
                          <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                          <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: theme === 'dark' ? '#0a0a0a' : '#ffffff', 
                              borderColor: theme === 'dark' ? '#27272a' : '#e4e4e7',
                              borderRadius: '8px'
                            }} 
                          />
                          <Line type="monotone" dataKey="count" stroke={theme === 'dark' ? '#ffffff' : '#000000'} strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Department distribution */}
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm lg:col-span-1">
                    <h3 className="text-sm font-bold tracking-tight mb-6">Department Distribution</h3>
                    <div className="h-64 flex items-center justify-center">
                      {getPieChartData().length === 0 ? (
                        <div className="text-xs text-muted-foreground">No data available.</div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getPieChartData()}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {getPieChartData().map((_entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={GRAYSCALE_COLORS[index % GRAYSCALE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend formatter={(value) => <span className="text-[10px] font-semibold text-muted-foreground">{value}</span>} />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Row grid: Punctual list and audit log */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Top Punctual Employees */}
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold tracking-tight mb-4">Top Punctual Employees</h3>
                    <div className="space-y-3">
                      {stats.topPunctual?.length === 0 ? (
                        <div className="text-xs text-muted-foreground text-center py-6">No records compiled.</div>
                      ) : (
                        stats.topPunctual.map((emp: any, idx: number) => (
                          <div key={emp.employeeId} className="flex justify-between items-center text-xs p-3 border border-border rounded-xl bg-muted/20">
                            <div className="flex items-center space-x-3">
                              <span className="font-bold text-muted-foreground">#{idx + 1}</span>
                              <div>
                                <div className="font-semibold">{emp.name}</div>
                                <div className="text-muted-foreground text-[10px]">ID: {emp.employeeId}</div>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-emerald-500">{emp.averageHours} hrs/day</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Recent Audit Logs */}
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col max-h-[360px]">
                    <h3 className="text-sm font-bold tracking-tight mb-4">Recent Audit Activity</h3>
                    <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar text-xs">
                      {stats.recentActivities?.length === 0 ? (
                        <div className="text-xs text-muted-foreground text-center py-6">No actions logged yet.</div>
                      ) : (
                        stats.recentActivities.map((log: any) => (
                          <div key={log.logId} className="p-3 border border-border rounded-xl bg-muted/40 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-bold uppercase tracking-wider text-[8px] border border-border px-1.5 py-0.5 rounded bg-card">{log.action}</span>
                              <span className="text-[10px] text-muted-foreground">{log.timestamp.replace('T', ' ').substring(0, 16)}</span>
                            </div>
                            <p className="text-muted-foreground text-[11px] leading-relaxed">{log.details}</p>
                            <div className="text-foreground font-semibold text-[10px]">User: {log.employeeId}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* EMPLOYEES MANAGEMENT TAB */}
        {activeTab === 'employees' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Employee Directory</h1>
                <p className="text-xs text-muted-foreground">Create, update, disable, and configure employee access records.</p>
              </div>
              <button
                onClick={() => {
                  setEmpCrudError(null);
                  setShowAddEmpModal(true);
                }}
                className="py-2.5 px-4 bg-foreground text-background font-medium hover:bg-foreground/90 transition duration-200 text-xs flex items-center justify-center space-x-1.5 rounded-xl self-start"
              >
                <Plus size={14} />
                <span>Add Employee</span>
              </button>
            </div>

            {/* Filter and search row */}
            <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
              <div className="relative w-full md:max-w-xs">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by ID, name, email..."
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-border rounded-lg bg-transparent placeholder-muted-foreground text-xs focus:outline-none focus:ring-1 focus:ring-foreground transition"
                />
              </div>

              <div className="flex flex-wrap gap-2 w-full md:w-auto items-center justify-end">
                <select
                  value={empDeptFilter}
                  onChange={(e) => setEmpDeptFilter(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg bg-card text-xs text-muted-foreground focus:outline-none"
                >
                  <option value="">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Design">Design</option>
                  <option value="Product">Product</option>
                  <option value="HR">HR</option>
                  <option value="Operations">Operations</option>
                </select>

                <select
                  value={empStatusFilter}
                  onChange={(e) => setEmpStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg bg-card text-xs text-muted-foreground focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="DISABLED">Disabled</option>
                </select>

                <button
                  onClick={triggerEmployeeSearch}
                  className="px-4 py-2 bg-foreground text-background hover:bg-foreground/90 font-semibold text-xs rounded-lg transition"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Employees Grid Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              {loadingEmployees ? (
                <div className="h-48 w-full flex items-center justify-center">
                  <div className="h-6 w-6 border-2 border-foreground border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-bold text-[10px] tracking-wider">
                        <th className="py-3.5 px-4">Employee ID</th>
                        <th className="py-3.5 px-4">Name</th>
                        <th className="py-3.5 px-4">Email</th>
                        <th className="py-3.5 px-4">Role</th>
                        <th className="py-3.5 px-4">Department / Designation</th>
                        <th className="py-3.5 px-4">Comp-Off Balance</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {employees.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-muted-foreground">No employees found matching parameters.</td>
                        </tr>
                      ) : (
                        employees.map((emp) => (
                          <tr key={emp.employeeId} className="hover:bg-muted/30 transition duration-150">
                            <td className="py-3 px-4 font-mono font-medium">{emp.employeeId}</td>
                            <td className="py-3 px-4 font-semibold">{emp.name}</td>
                            <td className="py-3 px-4 truncate max-w-[150px]">{emp.email}</td>
                            <td className="py-3 px-4">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                emp.role === 'ADMIN' ? 'border-foreground bg-foreground/5 text-foreground' : 'border-zinc-300 text-muted-foreground'
                              }`}>{emp.role}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div>{emp.designation}</div>
                              <div className="text-[10px] text-muted-foreground">{emp.department}</div>
                            </td>
                            <td className="py-3 px-4 font-mono font-semibold">{(emp.compOffBalance ?? 0).toFixed(2)} hrs</td>
                            <td className="py-3 px-4">
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                emp.status === 'ACTIVE' ? 'border-emerald-500 bg-emerald-500/5 text-emerald-500' : 'border-red-500 bg-red-500/5 text-red-500'
                              }`}>{emp.status}</span>
                            </td>
                            <td className="py-3 px-4 text-right flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => openEditModal(emp)}
                                className="p-1.5 border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded transition"
                                title="Edit Details"
                              >
                                <Edit size={12} />
                              </button>
                              
                              <button
                                onClick={() => handleToggleStatus(emp.employeeId)}
                                className="p-1.5 border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded transition"
                                title="Toggle Status"
                              >
                                {emp.status === 'ACTIVE' ? <ToggleRight size={12} className="text-emerald-500" /> : <ToggleLeft size={12} />}
                              </button>

                              <button
                                onClick={() => {
                                  setResetEmpId(emp.employeeId);
                                  setOverrideError(null);
                                  setShowResetModal(true);
                                }}
                                className="p-1.5 border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded transition"
                                title="Reset Password"
                              >
                                <Lock size={12} />
                              </button>

                              <button
                                onClick={() => handleDeleteEmployee(emp.employeeId)}
                                className="p-1.5 border border-border hover:bg-muted hover:text-destructive rounded transition"
                                title="Delete"
                              >
                                <Trash size={12} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination controls */}
              {employeesTotalPages > 1 && (
                <div className="bg-muted/50 p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>Page {employeesPage + 1} of {employeesTotalPages}</span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setEmployeesPage(prev => Math.max(0, prev - 1))}
                      disabled={employeesPage === 0}
                      className="px-3 py-1 border border-border bg-card rounded hover:bg-muted transition text-[11px] disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setEmployeesPage(prev => Math.min(employeesTotalPages - 1, prev + 1))}
                      disabled={employeesPage === employeesTotalPages - 1}
                      className="px-3 py-1 border border-border bg-card rounded hover:bg-muted transition text-[11px] disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ATTENDANCE AUDIT LOGS TAB */}
        {activeTab === 'attendance' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Attendance Ledger</h1>
                <p className="text-xs text-muted-foreground">Comprehensive archive logs for compliance and reporting audits.</p>
              </div>
              <button
                onClick={handleExportCsv}
                className="py-2.5 px-4 border border-border bg-card hover:bg-muted text-foreground font-semibold text-xs flex items-center justify-center space-x-1.5 rounded-xl self-start"
              >
                <Download size={14} />
                <span>Export filtered data to CSV</span>
              </button>
            </div>

            {/* Filter grid row */}
            <div className="bg-card border border-border rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end shadow-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Employee ID</label>
                <input
                  type="text"
                  placeholder="e.g. EMP001"
                  value={attSearchId}
                  onChange={(e) => setAttSearchId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-transparent placeholder-muted-foreground text-xs focus:outline-none focus:ring-1 focus:ring-foreground transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Status</label>
                <select
                  value={attStatusFilter}
                  onChange={(e) => setAttStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-xs text-muted-foreground focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="INCOMPLETE">Incomplete</option>
                  <option value="WORKING">Working</option>
                  <option value="WEEKEND_WORK">Weekend Worked</option>
                  <option value="HOLIDAY_WORK">Holiday Worked</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Start Date</label>
                <input
                  type="date"
                  value={attStartDate}
                  onChange={(e) => setAttStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-transparent text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">End Date</label>
                <input
                  type="date"
                  value={attEndDate}
                  onChange={(e) => setAttEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-transparent text-xs focus:outline-none"
                />
              </div>

              <button
                onClick={triggerAttendanceSearch}
                className="w-full py-2 bg-foreground text-background hover:bg-foreground/90 font-semibold text-xs rounded-lg transition"
              >
                Apply Filters
              </button>
            </div>

            {/* Attendance list log table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              {loadingAttendance ? (
                <div className="h-48 w-full flex items-center justify-center">
                  <div className="h-6 w-6 border-2 border-foreground border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-bold text-[10px] tracking-wider">
                        <th className="py-3.5 px-4">Employee ID</th>
                        <th className="py-3.5 px-4">Date</th>
                        <th className="py-3.5 px-4">Clock In</th>
                        <th className="py-3.5 px-4">Clock Out</th>
                        <th className="py-3.5 px-4">Worked Hours</th>
                        <th className="py-3.5 px-4">Comp-Off Earned</th>
                        <th className="py-3.5 px-4">Comp-Off Used</th>
                        <th className="py-3.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {attendance.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-muted-foreground">No records logged.</td>
                        </tr>
                      ) : (
                        attendance.map((log) => {
                          const workedHours = log.workedMinutes ? log.workedMinutes / 60.0 : 0.0;
                          return (
                            <tr key={log.attendanceId} className="hover:bg-muted/30 transition duration-150">
                              <td className="py-3 px-4 font-mono font-medium">{log.employeeId}</td>
                              <td className="py-3 px-4 font-semibold">{log.date}</td>
                              <td className="py-3 px-4 font-mono">{log.clockIn ? log.clockIn.split('T')[1].substring(0, 8) : 'N/A'}</td>
                              <td className="py-3 px-4 font-mono">{log.clockOut ? log.clockOut.split('T')[1].substring(0, 8) : 'WORKING'}</td>
                              <td className="py-3 px-4 font-mono font-semibold">{workedHours.toFixed(2)} hrs</td>
                              <td className="py-3 px-4 font-mono">{(log.compOffEarned ?? 0).toFixed(2)} hrs</td>
                              <td className="py-3 px-4 font-mono">{(log.compOffUsed ?? 0).toFixed(2)} hrs</td>
                              <td className="py-3 px-4">
                                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                  log.status === 'COMPLETED' ? 'border-emerald-500 bg-emerald-500/5 text-emerald-500' :
                                  log.status === 'INCOMPLETE' ? 'border-amber-500 bg-amber-500/5 text-amber-500' :
                                  log.status === 'WEEKEND_WORK' ? 'border-purple-500 bg-purple-500/5 text-purple-500' :
                                  log.status === 'HOLIDAY_WORK' ? 'border-sky-500 bg-sky-500/5 text-sky-500' :
                                  'border-zinc-400 text-zinc-500'
                                }`}>{log.status}</span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {attendanceTotalPages > 1 && (
                <div className="bg-muted/50 p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>Page {attendancePage + 1} of {attendanceTotalPages}</span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setAttendancePage(prev => Math.max(0, prev - 1))}
                      disabled={attendancePage === 0}
                      className="px-3 py-1 border border-border bg-card rounded hover:bg-muted transition text-[11px] disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setAttendancePage(prev => Math.min(attendanceTotalPages - 1, prev + 1))}
                      disabled={attendancePage === attendanceTotalPages - 1}
                      className="px-3 py-1 border border-border bg-card rounded hover:bg-muted transition text-[11px] disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* COMP-OFF CLAIMS TAB */}
        {activeTab === 'claims' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Compensatory Off Claims</h1>
              <p className="text-xs text-muted-foreground">Approve or reject compensation claims for holiday or weekend work.</p>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              {loadingClaims ? (
                <div className="h-48 w-full flex items-center justify-center">
                  <div className="h-6 w-6 border-2 border-foreground border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-bold text-[10px] tracking-wider">
                        <th className="py-3.5 px-4">Claim ID</th>
                        <th className="py-3.5 px-4">Employee ID</th>
                        <th className="py-3.5 px-4">Worked Date</th>
                        <th className="py-3.5 px-4">Hours Claimed</th>
                        <th className="py-3.5 px-4">Reason</th>
                        <th className="py-3.5 px-4">Submitted Date</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {pendingClaims.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-muted-foreground">No pending claims in queue.</td>
                        </tr>
                      ) : (
                        pendingClaims.map((claim) => (
                          <tr key={claim.claimId} className="hover:bg-muted/30 transition duration-150">
                            <td className="py-3.5 px-4 font-mono font-medium">#{claim.claimId}</td>
                            <td className="py-3.5 px-4 font-bold">{claim.employeeId}</td>
                            <td className="py-3.5 px-4">{claim.workedDate}</td>
                            <td className="py-3.5 px-4 font-mono font-bold">{claim.hours.toFixed(2)} hrs</td>
                            <td className="py-3.5 px-4 max-w-[200px] truncate" title={claim.reason}>{claim.reason}</td>
                            <td className="py-3.5 px-4 text-[10px] text-muted-foreground">{claim.createdAt?.replace('T', ' ').substring(0, 16)}</td>
                            <td className="py-3.5 px-4 text-right flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleRejectClaim(claim.claimId)}
                                className="px-3 py-1.5 border border-destructive/25 text-destructive bg-destructive/5 rounded-lg hover:bg-destructive/10 text-[10px] font-bold transition uppercase tracking-wider"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleApproveClaim(claim.claimId)}
                                className="px-3 py-1.5 bg-foreground text-background rounded-lg hover:bg-foreground/95 text-[10px] font-bold transition uppercase tracking-wider"
                              >
                                Approve
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SETTINGS AND HOLIDAYS CONFIGURATION TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Configuration Settings</h1>
              <p className="text-xs text-muted-foreground">Customize work policies and seeding holiday lists.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Working Hours & Weekend Policy settings */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
                <h3 className="font-bold tracking-tight text-sm flex items-center space-x-1.5">
                  <Settings size={16} />
                  <span>Workplace Policy</span>
                </h3>

                {loadingSettings ? (
                  <div className="h-24 w-full flex items-center justify-center">
                    <div className="h-4 w-4 border-2 border-foreground border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="space-y-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Minimum Required Hours</label>
                      <input
                        type="number"
                        step="0.5"
                        value={minHoursSetting}
                        onChange={(e) => setMinHoursSetting(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Weekend Days</label>
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={weekendSat}
                            onChange={(e) => setWeekendSat(e.target.checked)}
                            className="rounded border-border bg-transparent text-foreground accent-foreground h-4 w-4"
                          />
                          <span>Saturday</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={weekendSun}
                            onChange={(e) => setWeekendSun(e.target.checked)}
                            className="rounded border-border bg-transparent text-foreground accent-foreground h-4 w-4"
                          />
                          <span>Sunday</span>
                        </label>
                      </div>
                    </div>

                    <button
                      onClick={handleUpdateSettings}
                      className="py-2.5 px-4 bg-foreground text-background font-medium hover:bg-foreground/90 transition duration-200 text-xs rounded-xl"
                    >
                      Save Policy Settings
                    </button>
                  </div>
                )}
              </div>

              {/* Holidays Configuration Card */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
                <h3 className="font-bold tracking-tight text-sm flex items-center space-x-1.5">
                  <Calendar size={16} />
                  <span>Public Holidays</span>
                </h3>

                {/* Add Holiday Form */}
                <form onSubmit={handleAddHoliday} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Holiday Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Diwali"
                      value={newHolidayName}
                      onChange={(e) => setNewHolidayName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-border rounded-lg bg-transparent text-xs focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Date</label>
                    <input
                      type="date"
                      value={newHolidayDate}
                      onChange={(e) => setNewHolidayDate(e.target.value)}
                      className="w-full px-3 py-1.5 border border-border rounded-lg bg-transparent text-xs focus:outline-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="sm:col-span-3 py-2 bg-foreground text-background font-medium hover:bg-foreground/90 transition text-xs rounded-lg flex items-center justify-center space-x-1"
                  >
                    <Plus size={14} />
                    <span>Add Holiday</span>
                  </button>
                </form>

                {/* Holidays List */}
                <div className="border border-border rounded-xl overflow-hidden max-h-60 overflow-y-auto no-scrollbar text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border uppercase font-bold text-[9px] text-muted-foreground">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Holiday Name</th>
                        <th className="py-2.5 px-3 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {holidays.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-muted-foreground">No holidays defined.</td>
                        </tr>
                      ) : (
                        holidays.map((h) => (
                          <tr key={h.holidayId} className="hover:bg-muted/40 transition">
                            <td className="py-2.5 px-3 font-mono">{h.date}</td>
                            <td className="py-2.5 px-3 font-semibold">{h.holidayName}</td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => handleDeleteHoliday(h.holidayId)}
                                className="p-1 border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded"
                                title="Delete Holiday"
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* CREATE EMPLOYEE MODAL */}
      {showAddEmpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
          <div className="w-full max-w-[420px] bg-card border border-border rounded-2xl p-6 shadow-lg relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold tracking-tight mb-2">Create Employee Profile</h2>
            
            {empCrudError && <div className="mb-4 p-3 border border-destructive/20 bg-destructive/5 text-destructive rounded-lg text-xs">{empCrudError}</div>}

            <form onSubmit={handleAddEmployeeSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Employee ID</label>
                  <input
                    type="text"
                    placeholder="e.g. EMP003"
                    value={empId}
                    onChange={(e) => setEmpId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground transition"
                    required
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Role</label>
                  <select
                    value={empRole}
                    onChange={(e: any) => setEmpRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card focus:outline-none"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground transition"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. ramesh@idthirdeye.com"
                  value={empEmail}
                  onChange={(e) => setEmpEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground transition"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Designation</label>
                <input
                  type="text"
                  placeholder="e.g. Associate QA"
                  value={empDesg}
                  onChange={(e) => setEmpDesg(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground transition"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Default Password</label>
                <input
                  type="password"
                  placeholder="Create temporary password"
                  value={empPass}
                  onChange={(e) => setEmpPass(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-transparent focus:outline-none"
                  required
                />
              </div>

              <div className="flex space-x-2 pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 font-medium transition"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EMPLOYEE MODAL */}
      {showEditEmpModal && selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
          <div className="w-full max-w-[400px] bg-card border border-border rounded-2xl p-6 shadow-lg relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold tracking-tight mb-2">Edit Employee Profile</h2>
            <p className="text-[10px] text-muted-foreground mb-4">Editing records for ID: {selectedEmp.employeeId}</p>
            
            {empCrudError && <div className="mb-4 p-3 border border-destructive/20 bg-destructive/5 text-destructive rounded-lg text-xs">{empCrudError}</div>}

            <form onSubmit={handleEditEmployeeSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Full Name</label>
                <input
                  type="text"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-transparent focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Email Address</label>
                <input
                  type="email"
                  value={empEmail}
                  onChange={(e) => setEmpEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-transparent focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Department</label>
                  <select
                    value={empDept}
                    onChange={(e) => setEmpDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card focus:outline-none"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Product">Product</option>
                    <option value="HR">HR</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Designation</label>
                  <input
                    type="text"
                    value={empDesg}
                    onChange={(e) => setEmpDesg(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-transparent focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Role</label>
                <select
                  value={empRole}
                  onChange={(e: any) => setEmpRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card focus:outline-none"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="flex space-x-2 pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowEditEmpModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 font-medium transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OVERRIDE PASSWORD MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
          <div className="w-full max-w-[380px] bg-card border border-border rounded-2xl p-6 shadow-lg relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold tracking-tight mb-2">Reset Password</h2>
            <p className="text-[10px] text-muted-foreground mb-4">Overriding password security credentials for employee: {resetEmpId}</p>
            
            {overrideError && <div className="mb-4 p-3 border border-destructive/20 bg-destructive/5 text-destructive rounded-lg text-xs">{overrideError}</div>}

            <form onSubmit={handleOverridePasswordSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">New Secure Password</label>
                <input
                  type="password"
                  placeholder="Enter new password override"
                  value={newPassOverride}
                  onChange={(e) => setNewPassOverride(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-transparent focus:outline-none"
                  required
                />
              </div>

              <div className="flex space-x-2 pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(false);
                    setNewPassOverride('');
                    setResetEmpId('');
                  }}
                  className="flex-1 py-2.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 font-medium transition"
                >
                  Save Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN PASSWORD CHANGE MODAL */}
      {showAdminPassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
          <div className="w-full max-w-[380px] bg-card border border-border rounded-2xl p-6 shadow-lg relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-2 mb-2">
              <Key size={18} className="text-foreground" />
              <h2 className="text-lg font-bold tracking-tight">Change Admin Password</h2>
            </div>
            <p className="text-[10px] text-muted-foreground mb-4">Update your admin account password securely.</p>

            {adminPassError && <div className="mb-4 p-3 border border-destructive/20 bg-destructive/5 text-destructive rounded-lg text-xs">{adminPassError}</div>}
            {adminPassSuccess && <div className="mb-4 p-3 border border-foreground/10 bg-muted text-foreground rounded-lg text-xs">{adminPassSuccess}</div>}

            <form onSubmit={handleAdminPasswordChange} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Current Password</label>
                <input
                  type="password"
                  value={adminOldPass}
                  onChange={(e) => setAdminOldPass(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">New Password</label>
                <input
                  type="password"
                  value={adminNewPass}
                  onChange={(e) => setAdminNewPass(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Confirm New Password</label>
                <input
                  type="password"
                  value={adminConfirmPass}
                  onChange={(e) => setAdminConfirmPass(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30"
                  required
                />
              </div>

              <div className="flex space-x-2 pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAdminPassModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 font-medium transition"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST ALERTS OVERLAY */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl border border-border bg-card shadow-lg animate-in slide-in-from-bottom-5 duration-300">
          <div className={`h-2 w-2 rounded-full ${
            toastType === 'success' ? 'bg-emerald-500' :
            toastType === 'error' ? 'bg-red-500' :
            'bg-foreground'
          }`}></div>
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

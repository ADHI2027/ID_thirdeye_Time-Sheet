import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Clock, Award, LogOut, Moon, Sun, 
  Upload, Key, FileDown, PlusCircle, AlertCircle, 
  ChevronLeft, ChevronRight, CheckCircle2, User
} from 'lucide-react';
import axios from 'axios';
import {
  ResponsiveContainer, BarChart, Bar, 
  XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

export const EmployeeDashboard: React.FC = () => {
  const { user, logout, updateUserBalance, updateProfilePic } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Attendance states
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [loadingRecord, setLoadingRecord] = useState(true);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // Stats
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [compOffClaims, setCompOffClaims] = useState<any[]>([]);

  // Modals & UI states
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningData, setWarningData] = useState<any>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [activeHistoryTab, setActiveHistoryTab] = useState<'attendance' | 'claims'>('attendance');

  // Forms
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  const [claimDate, setClaimDate] = useState('');
  const [claimHours, setClaimHours] = useState('');
  const [claimReason, setClaimReason] = useState('');
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerIntervalRef = useRef<any>(null);

  // Trigger toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Live ticking date/time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch today's clock status & user history
  const fetchData = async () => {
    try {
      setLoadingRecord(true);
      const [statusRes, historyRes, claimsRes] = await Promise.all([
        axios.get('/api/attendance/status'),
        axios.get('/api/attendance/history'),
        axios.get('/api/claims')
      ]);

      setTodayRecord(statusRes.data || null);
      setAttendanceHistory(historyRes.data || []);
      setCompOffClaims(claimsRes.data || []);

      // If user profile changed, refresh context details
      const profileRes = await axios.get('/api/profile');
      if (profileRes.data) {
        updateUserBalance(profileRes.data.compOffBalance);
      }
    } catch (e) {
      console.error('Failed to load dashboard data');
    } finally {
      setLoadingRecord(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Live session counter hook
  useEffect(() => {
    if (todayRecord && ['WORKING', 'WEEKEND_WORK', 'HOLIDAY_WORK'].includes(todayRecord.status)) {
      const clockInTime = new Date(todayRecord.clockIn).getTime();
      
      const updateSessionTimer = () => {
        const now = new Date().getTime();
        const diffSeconds = Math.max(0, Math.floor((now - clockInTime) / 1000));
        setSessionSeconds(diffSeconds);
      };

      updateSessionTimer();
      timerIntervalRef.current = setInterval(updateSessionTimer, 1000);
    } else {
      setSessionSeconds(0);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [todayRecord]);

  // Format seconds to HH:MM:SS
  const formatSeconds = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Clock In handler
  const handleClockIn = async () => {
    try {
      const res = await axios.post('/api/attendance/clock-in');
      setTodayRecord(res.data);
      showToast('Successfully clocked in for today!', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to clock in.', 'error');
    }
  };

  // Clock Out handler (triggers warning if required)
  const handleClockOutClick = async () => {
    try {
      const warningRes = await axios.get('/api/attendance/warning');
      const data = warningRes.data;

      if (data.showWarning) {
        setWarningData(data);
        setShowWarningModal(true);
      } else {
        performClockOut();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to evaluate clock out parameters.', 'error');
    }
  };

  const performClockOut = async (useCompOff: boolean = false) => {
    try {
      const res = await axios.post(`/api/attendance/clock-out?useCompOff=${useCompOff}`);
      setTodayRecord(res.data);
      setShowWarningModal(false);
      
      const compOffApplied = res.data.compOffUsed > 0;
      if (compOffApplied) {
        showToast(`Clocked out. Applied ${res.data.compOffUsed.toFixed(2)} Comp-Off hours to complete attendance.`, 'success');
      } else if (res.data.status === 'INCOMPLETE') {
        showToast('Clocked out as Incomplete.', 'info');
      } else {
        showToast('Successfully clocked out.', 'success');
      }
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to clock out.', 'error');
    }
  };

  // Profile picture upload Base64 encoding
  const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        await axios.post('/api/profile/picture', { image: base64String });
        updateProfilePic(base64String);
        showToast('Profile picture updated successfully!', 'success');
      } catch (err: any) {
        showToast('Failed to upload picture.', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  // Change password handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }

    try {
      await axios.post('/api/auth/change-password', { currentPassword: oldPassword, newPassword });
      setPassSuccess('Password changed successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setShowPasswordModal(false), 2000);
      showToast('Password changed successfully.', 'success');
    } catch (err: any) {
      setPassError(err.response?.data?.message || 'Failed to change password.');
    }
  };

  // Submit Comp-Off Claim handler
  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimError(null);
    setClaimSuccess(null);

    if (!claimDate || !claimHours || !claimReason) {
      setClaimError('All fields are required.');
      return;
    }

    try {
      await axios.post('/api/claims', {
        workedDate: claimDate,
        hours: parseFloat(claimHours),
        reason: claimReason
      });
      setClaimSuccess('Claim submitted successfully to Admin.');
      setClaimDate('');
      setClaimHours('');
      setClaimReason('');
      fetchData();
      showToast('Comp-Off claim submitted successfully.', 'success');
      setTimeout(() => setShowClaimModal(false), 2000);
    } catch (err: any) {
      setClaimError(err.response?.data?.message || 'Failed to submit claim.');
    }
  };

  // Download personal CSV
  const handleDownloadCsv = () => {
    window.open(`/api/admin/attendance/export?employeeId=${user?.employeeId}`, '_blank');
    showToast('Attendance CSV download started.', 'info');
  };

  // Greeting logic
  const getGreeting = () => {
    const hrs = currentTime.getHours();
    if (hrs < 12) return 'Good Morning';
    if (hrs < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Dynamic calendar computation for the current month
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  const getDaysInMonth = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    
    // Add empty slots for days of week before the first day of month
    const startDay = date.getDay(); // 0 is Sunday
    // Adjust: 0 for Mon, 1 for Tue, ..., 6 for Sun
    const adjustedStart = startDay === 0 ? 6 : startDay - 1;
    for (let i = 0; i < adjustedStart; i++) {
      days.push(null);
    }
    
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    
    return days;
  };

  const getDayStatusColor = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const record = attendanceHistory.find(h => h.date === dateStr);

    if (record) {
      switch (record.status) {
        case 'COMPLETED': return 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400';
        case 'INCOMPLETE': return 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400';
        case 'HOLIDAY_WORK': return 'bg-sky-500/10 border-sky-500 text-sky-600 dark:text-sky-400';
        case 'WEEKEND_WORK': return 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400';
        case 'WORKING': return 'bg-zinc-500/10 border-zinc-400 text-zinc-600 dark:text-zinc-400 animate-pulse';
        default: return 'bg-muted border-border text-foreground/50';
      }
    }

    // Default Absent marking for past weekdays
    const todayStr = new Date().toISOString().split('T')[0];
    const isPast = dateStr < todayStr;
    const isWeekendDay = date.getDay() === 0 || date.getDay() === 6; // Sun / Sat
    
    if (isPast && !isWeekendDay) {
      return 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400'; // Absent
    }

    return 'bg-card border-border text-foreground/30';
  };

  // Compile Recharts daily analytics
  const getDailyChartData = () => {
    return attendanceHistory.slice(0, 7).reverse().map(h => {
      const workedHrs = h.workedMinutes ? h.workedMinutes / 60.0 : 0.0;
      return {
        date: h.date.split('-').slice(1).join('/'),
        Hours: parseFloat(workedHrs.toFixed(2))
      };
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      
      {/* Navigation Bar */}
      <nav className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <img 
              src={theme === 'light' ? '/logo-dark.png' : '/logo-light.png'} 
              alt="ID Thirdeye" 
              className="h-9 w-auto object-contain"
            />
          </div>

          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleTheme}
              className="p-2 border border-border rounded-lg bg-card hover:bg-muted transition duration-200"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <button 
              onClick={() => logout()}
              className="p-2 border border-border rounded-lg bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition duration-200"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Profile Card & Actions */}
        <div className="space-y-6 lg:col-span-1">
          {/* User Details */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm text-center relative overflow-hidden">
            <div className="relative w-24 h-24 mx-auto mb-4 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {user?.profilePictureBase64 ? (
                <img 
                  src={user.profilePictureBase64} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover border border-border"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-muted flex items-center justify-center border border-border text-foreground/45">
                  <User size={36} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Upload size={18} className="text-white" />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleProfilePictureUpload} 
                className="hidden" 
                accept="image/*"
              />
            </div>
            
            <h2 className="font-bold text-lg leading-tight">{user?.name}</h2>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{user?.designation} &middot; {user?.department}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">{user?.email}</p>
            
            <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
              <span>ID: {user?.employeeId}</span>
              <button 
                onClick={() => {
                  setPassError(null);
                  setPassSuccess(null);
                  setShowPasswordModal(true);
                }}
                className="flex items-center space-x-1 hover:text-foreground transition duration-200"
              >
                <Key size={12} />
                <span>Password</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Comp-Off Details</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Award size={18} className="text-zinc-600 dark:text-zinc-400" />
                <span className="text-sm font-medium">Balance</span>
              </div>
              <span className="text-lg font-bold">{(user?.compOffBalance ?? 0.0).toFixed(2)} hrs</span>
            </div>

            <button
              onClick={() => {
                setClaimError(null);
                setClaimSuccess(null);
                setShowClaimModal(true);
              }}
              className="w-full py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-medium transition duration-200 flex items-center justify-center space-x-1"
            >
              <PlusCircle size={14} />
              <span>Claim Holiday/Weekend Work</span>
            </button>
          </div>

          {/* Downloads */}
          <button 
            onClick={handleDownloadCsv}
            className="w-full py-3 bg-muted border border-border hover:bg-foreground/5 dark:hover:bg-white/5 rounded-xl text-xs font-medium flex items-center justify-center space-x-2 transition duration-200"
          >
            <FileDown size={14} />
            <span>Download Attendance CSV</span>
          </button>
        </div>

        {/* Right Columns: Main Work Area */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Greeting & Time Clock Widget */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-1.5 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{getGreeting()}, {user?.name.split(' ')[0]}</h1>
              <p className="text-sm text-muted-foreground">
                Today is {currentTime.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Attendance Clock Action */}
            <div className="flex flex-col items-center space-y-4 w-full md:w-auto md:min-w-[240px] p-4 bg-muted/50 dark:bg-muted/10 rounded-xl border border-border">
              <div className="text-center">
                <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Session Time</span>
                <div className="text-2xl font-bold font-mono tracking-widest mt-1">
                  {todayRecord && ['WORKING', 'WEEKEND_WORK', 'HOLIDAY_WORK'].includes(todayRecord.status) ? 
                    formatSeconds(sessionSeconds) : '00:00:00'}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1 px-2.5 py-0.5 border border-border bg-card rounded-full inline-block">
                  {todayRecord ? todayRecord.status : 'NOT CLOCKED IN'}
                </div>
              </div>

              {loadingRecord ? (
                <div className="h-10 w-full flex items-center justify-center">
                  <div className="h-5 w-5 border-2 border-foreground border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : !todayRecord || ['COMPLETED', 'INCOMPLETE'].includes(todayRecord.status) ? (
                <button
                  onClick={handleClockIn}
                  className="w-full py-2.5 rounded-xl bg-foreground text-background font-medium hover:bg-foreground/90 transition duration-200 text-xs flex items-center justify-center space-x-1.5"
                >
                  <Clock size={14} />
                  <span>Clock In</span>
                </button>
              ) : (
                <button
                  onClick={handleClockOutClick}
                  className="w-full py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-medium transition duration-200 text-xs flex items-center justify-center space-x-1.5"
                >
                  <Clock size={14} />
                  <span>Clock Out</span>
                </button>
              )}
            </div>
          </div>

          {/* Core Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm text-center">
              <span className="text-xs font-medium text-muted-foreground uppercase">Today Worked</span>
              <h2 className="text-2xl font-bold tracking-tight mt-2">
                {todayRecord && todayRecord.workedMinutes ? 
                  `${Math.floor(todayRecord.workedMinutes / 60)}h ${todayRecord.workedMinutes % 60}m` : 
                  todayRecord && ['WORKING', 'WEEKEND_WORK', 'HOLIDAY_WORK'].includes(todayRecord.status) ? 
                  `${Math.floor(sessionSeconds / 3600)}h ${Math.floor((sessionSeconds % 3600) / 60)}m` : 
                  '0h 0m'}
              </h2>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm text-center">
              <span className="text-xs font-medium text-muted-foreground uppercase">Remaining to Minimum</span>
              <h2 className="text-2xl font-bold tracking-tight mt-2">
                {(() => {
                  const minMinutes = 6 * 60;
                  let workedMins = 0;
                  if (todayRecord && todayRecord.workedMinutes) workedMins = todayRecord.workedMinutes;
                  else if (todayRecord && ['WORKING'].includes(todayRecord.status)) workedMins = Math.floor(sessionSeconds / 60);

                  const diff = minMinutes - workedMins;
                  if (diff <= 0) return '0h 0m';
                  return `${Math.floor(diff / 60)}h ${diff % 60}m`;
                })()}
              </h2>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm text-center">
              <span className="text-xs font-medium text-muted-foreground uppercase">Attendance Rate (30d)</span>
              <h2 className="text-2xl font-bold tracking-tight mt-2">
                {(() => {
                  if (attendanceHistory.length === 0) return '0%';
                  const past30Records = attendanceHistory.slice(0, 30);
                  const completedDays = past30Records.filter(h => ['COMPLETED', 'WEEKEND_WORK', 'HOLIDAY_WORK'].includes(h.status)).length;
                  return `${Math.round((completedDays / past30Records.length) * 100)}%`;
                })()}
              </h2>
            </div>
          </div>

          {/* Interactive Calendar & Historical Logs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Attendance Calendar Matrix */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold tracking-tight text-sm">Attendance Calendar</h3>
                
                <div className="flex items-center space-x-1">
                  <button onClick={handlePrevMonth} className="p-1 border border-border rounded hover:bg-muted text-muted-foreground">
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-semibold px-2">
                    {calendarDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </span>
                  <button onClick={handleNextMonth} className="p-1 border border-border rounded hover:bg-muted text-muted-foreground">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Day of Week headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted-foreground mb-2">
                <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth().map((day, idx) => {
                  if (!day) return <div key={`empty-${idx}`} className="aspect-square"></div>;
                  return (
                    <div 
                      key={day.toISOString()} 
                      className={`aspect-square rounded border text-[10px] font-semibold flex items-center justify-center transition duration-150 ${getDayStatusColor(day)}`}
                      title={day.toDateString()}
                    >
                      {day.getDate()}
                    </div>
                  );
                })}
              </div>

              {/* Calendar Legend */}
              <div className="mt-4 pt-4 border-t border-border grid grid-cols-5 gap-2 text-[8px] font-medium uppercase tracking-wider text-muted-foreground text-center">
                <div className="flex flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 mb-1"></div>
                  <span>Complete</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-amber-500 mb-1"></div>
                  <span>Incomplete</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-purple-500 mb-1"></div>
                  <span>Weekend</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-sky-500 mb-1"></div>
                  <span>Holiday</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-red-500 mb-1"></div>
                  <span>Absent</span>
                </div>
              </div>
            </div>

            {/* Historical Logs List / Comp-Off Claims tabbed view */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col max-h-[340px]">
              <div className="flex border-b border-border mb-4 text-xs">
                <button
                  onClick={() => setActiveHistoryTab('attendance')}
                  className={`flex-1 pb-2 font-bold tracking-tight text-center border-b-2 transition duration-200 ${
                    activeHistoryTab === 'attendance' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground'
                  }`}
                >
                  Recent Attendance
                </button>
                <button
                  onClick={() => setActiveHistoryTab('claims')}
                  className={`flex-1 pb-2 font-bold tracking-tight text-center border-b-2 transition duration-200 ${
                    activeHistoryTab === 'claims' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground'
                  }`}
                >
                  My Comp-Off Claims
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-3 no-scrollbar text-xs">
                {activeHistoryTab === 'attendance' ? (
                  attendanceHistory.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">No attendance history found.</div>
                  ) : (
                    attendanceHistory.slice(0, 10).map((h) => {
                      const workedHrs = h.workedMinutes ? h.workedMinutes / 60.0 : 0.0;
                      return (
                        <div key={h.attendanceId} className="flex justify-between items-center p-2.5 rounded-xl border border-border hover:bg-muted transition duration-150">
                          <div className="space-y-0.5">
                            <div className="font-semibold">{h.date}</div>
                            <div className="text-muted-foreground text-[10px]">
                              {h.clockIn ? h.clockIn.split('T')[1].substring(0,5) : 'N/A'} - {h.clockOut ? h.clockOut.split('T')[1].substring(0,5) : 'Working'}
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="font-mono font-medium">{workedHrs.toFixed(2)} hrs</div>
                            <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              h.status === 'COMPLETED' ? 'border-emerald-500 bg-emerald-500/5 text-emerald-500' :
                              h.status === 'INCOMPLETE' ? 'border-amber-500 bg-amber-500/5 text-amber-500' :
                              h.status === 'WEEKEND_WORK' ? 'border-purple-500 bg-purple-500/5 text-purple-500' :
                              h.status === 'HOLIDAY_WORK' ? 'border-sky-500 bg-sky-500/5 text-sky-500' :
                              'border-zinc-400 text-zinc-500'
                            }`}>
                              {h.status}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )
                ) : (
                  compOffClaims.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">No claims logged.</div>
                  ) : (
                    compOffClaims.slice(0, 10).map((c) => (
                      <div key={c.claimId} className="flex justify-between items-center p-2.5 rounded-xl border border-border hover:bg-muted transition duration-150">
                        <div className="space-y-0.5">
                          <div className="font-semibold">{c.workedDate}</div>
                          <div className="text-muted-foreground text-[10px] truncate max-w-[130px]" title={c.reason}>
                            {c.reason}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="font-mono font-medium">{c.hours.toFixed(1)} hrs</div>
                          <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            c.status === 'APPROVED' ? 'border-emerald-500 bg-emerald-500/5 text-emerald-500' :
                            c.status === 'REJECTED' ? 'border-red-500 bg-red-500/5 text-red-500' :
                            'border-amber-500 bg-amber-500/5 text-amber-500'
                          }`}>
                            {c.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )
                )}
              </div>
            </div>
          </div>

          {/* Graphics & Charts Analytics */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold tracking-tight text-sm mb-6">Worked Hours (Last 7 Days)</h3>
            <div className="h-64 w-full">
              {attendanceHistory.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-xs">No analytics data available.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getDailyChartData()}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#27272a' : '#e4e4e7'} />
                    <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: theme === 'dark' ? '#0a0a0a' : '#ffffff', 
                        borderColor: theme === 'dark' ? '#27272a' : '#e4e4e7',
                        borderRadius: '8px',
                        color: theme === 'dark' ? '#f5f5f5' : '#0a0a0a'
                      }} 
                    />
                    <Bar dataKey="Hours" fill={theme === 'dark' ? '#ffffff' : '#0a0a0a'} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Warning Clock Out Dialog */}
      {showWarningModal && warningData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
          <div className="w-full max-w-[440px] bg-card border border-border rounded-2xl p-6 shadow-lg relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-2 text-destructive mb-3">
              <AlertCircle size={20} />
              <h2 className="text-lg font-bold tracking-tight">Early Clock Out</h2>
            </div>
            
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              You have worked <strong className="text-foreground">{Math.floor(warningData.minutesWorked / 60)}h {warningData.minutesWorked % 60}m</strong> today. 
              The minimum required is <strong>{warningData.minRequiredHours} hours</strong>.
              You are short by <strong className="text-foreground">{(warningData.remainingMinutes / 60.0).toFixed(2)} hours</strong>.
            </p>

            {/* Option: Use Comp-Off */}
            {user && user.compOffBalance >= warningData.remainingMinutes / 60.0 ? (
              <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/30 text-xs mb-3">
                <div className="flex items-start space-x-2 text-foreground/90 mb-3">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    You have <strong>{user.compOffBalance.toFixed(2)} hours</strong> of Comp-Off balance.
                    Using <strong>{(warningData.remainingMinutes / 60.0).toFixed(2)} hours</strong> will mark today as <span className="text-emerald-500 font-bold">COMPLETED</span>.
                  </span>
                </div>
                <button
                  onClick={() => performClockOut(true)}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition duration-200 flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 size={14} />
                  <span>Use Comp-Off & Mark Completed</span>
                </button>
              </div>
            ) : (
              <div className="p-3 bg-muted rounded-xl border border-border text-xs mb-3">
                <div className="flex items-start space-x-1.5 text-muted-foreground">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>
                    Comp-Off balance: <strong>{user?.compOffBalance?.toFixed(2) || '0.00'} hours</strong> — not enough to cover the deficit.
                  </span>
                </div>
              </div>
            )}

            {/* Option: Clock out as Incomplete */}
            <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/30 text-xs mb-4">
              <div className="flex items-start space-x-2 text-foreground/90 mb-3">
                <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <span>
                  Clock out without using Comp-Off. Today will be marked as <span className="text-amber-500 font-bold">INCOMPLETE</span>.
                </span>
              </div>
              <button
                onClick={() => performClockOut(false)}
                className="w-full py-2.5 rounded-lg border border-amber-500/50 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold transition duration-200"
              >
                Clock Out as Incomplete
              </button>
            </div>

            {/* Cancel */}
            <button
              onClick={() => setShowWarningModal(false)}
              className="w-full py-2.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium transition duration-200"
            >
              Cancel — Continue Working
            </button>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
          <div className="w-full max-w-[380px] bg-card border border-border rounded-2xl p-6 shadow-lg relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold tracking-tight mb-2">Change Password</h2>
            
            {passError && <div className="mb-4 p-3 border border-destructive/20 bg-destructive/5 text-destructive rounded-lg text-xs">{passError}</div>}
            {passSuccess && <div className="mb-4 p-3 border border-foreground/10 bg-muted text-foreground rounded-lg text-xs">{passSuccess}</div>}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase">Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-transparent placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition duration-200 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-transparent placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition duration-200 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-transparent placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition duration-200 text-xs"
                  required
                />
              </div>

              <div className="flex space-x-2 pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition duration-200"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 font-medium transition duration-200"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
          <div className="w-full max-w-[400px] bg-card border border-border rounded-2xl p-6 shadow-lg relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold tracking-tight mb-2">Claim Comp-Off</h2>
            <p className="text-xs text-muted-foreground mb-4">Submit hours worked on holidays or weekend days to claim compensatory off time.</p>
            
            {claimError && <div className="mb-4 p-3 border border-destructive/20 bg-destructive/5 text-destructive rounded-lg text-xs">{claimError}</div>}
            {claimSuccess && <div className="mb-4 p-3 border border-foreground/10 bg-muted text-foreground rounded-lg text-xs">{claimSuccess}</div>}

            <form onSubmit={handleSubmitClaim} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase">Worked Date</label>
                <input
                  type="date"
                  value={claimDate}
                  onChange={(e) => setClaimDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-transparent placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition duration-200 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase">Hours Claimed</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="e.g. 7.5"
                  value={claimHours}
                  onChange={(e) => setClaimHours(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-transparent placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition duration-200 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase">Reason / Project details</label>
                <textarea
                  placeholder="e.g. Worked on server migration / Diwali support"
                  value={claimReason}
                  onChange={(e) => setClaimReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-transparent placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition duration-200 text-xs h-20 resize-none"
                  required
                />
              </div>

              <div className="flex space-x-2 pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition duration-200"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 font-medium transition duration-200"
                >
                  Submit Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification overlay */}
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

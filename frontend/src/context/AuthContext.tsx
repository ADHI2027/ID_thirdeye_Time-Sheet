import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface User {
  employeeId: String;
  name: string;
  role: 'ADMIN' | 'EMPLOYEE';
  email: string;
  department?: string;
  designation?: string;
  compOffBalance: number;
  profilePictureBase64?: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string, userData: User, rememberMe: boolean) => void;
  logout: (reason?: string) => void;
  updateUserBalance: (newBalance: number) => void;
  updateProfilePic: (base64: string) => void;
  loading: boolean;
  logoutReason: string | null;
  clearLogoutReason: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  });
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user') || sessionStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [rememberMeFlag, setRememberMeFlag] = useState<boolean>(() => !!localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [logoutReason, setLogoutReason] = useState<string | null>(null);

  const inactivityTimerRef = useRef<any>(null);

  // Configure axios token header when token state changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const storage = rememberMeFlag ? localStorage : sessionStorage;
      storage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
    }
  }, [token, rememberMeFlag]);

  // Sync user profile state with storage
  useEffect(() => {
    if (user) {
      const storage = rememberMeFlag ? localStorage : sessionStorage;
      storage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
    }
  }, [user, rememberMeFlag]);

  // Load and verify session
  useEffect(() => {
    const initSession = async () => {
      const savedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (savedToken) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
          const res = await axios.get('/api/profile');
          setUser(res.data);
        } catch (e) {
          // Token expired or invalid
          logout('Session expired. Please log in again.');
        }
      }
      setLoading(false);
    };
    initSession();
  }, []);

  const login = (newToken: string, userData: User, rememberMe: boolean) => {
    setRememberMeFlag(rememberMe);
    setToken(newToken);
    setUser(userData);
    setLogoutReason(null);

    // Persist to the correct storage
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('token', newToken);
    storage.setItem('user', JSON.stringify(userData));

    // Clear the other storage
    const otherStorage = rememberMe ? sessionStorage : localStorage;
    otherStorage.removeItem('token');
    otherStorage.removeItem('user');

    if (rememberMe) {
      localStorage.setItem('remembered_id', String(userData.employeeId));
    } else {
      localStorage.removeItem('remembered_id');
    }
  };

  const logout = (reason?: string) => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    if (reason) {
      setLogoutReason(reason);
    }
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
  };

  const updateUserBalance = (newBalance: number) => {
    if (user) {
      setUser({ ...user, compOffBalance: newBalance });
    }
  };

  const updateProfilePic = (base64: string) => {
    if (user) {
      setUser({ ...user, profilePictureBase64: base64 });
    }
  };

  const clearLogoutReason = () => {
    setLogoutReason(null);
  };

  // Client-side Inactivity Tracker
  useEffect(() => {
    if (!token) return;

    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = setTimeout(() => {
        logout('Logged out due to inactivity.');
      }, INACTIVITY_TIMEOUT);
    };

    // Listen for activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });

    // Start timer on mount
    resetInactivityTimer();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [token]);

  return (
    <AuthContext.Provider value={{
      token,
      user,
      login,
      logout,
      updateUserBalance,
      updateProfilePic,
      loading,
      logoutReason,
      clearLogoutReason
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

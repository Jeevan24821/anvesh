import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken, getAuthToken } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize and verify authentication on app launch
  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const profile = await api.getCurrentUser();
        setUser(profile);
      } catch (err) {
        // Expired or invalid token
        setAuthToken('');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const handleExpired = () => {
      setUser(null);
      setAuthToken('');
    };
    window.addEventListener('sentrix_auth_expired', handleExpired);
    return () => window.removeEventListener('sentrix_auth_expired', handleExpired);
  }, []);

  const login = async (username, password, portal_type = null) => {
    const res = await api.login({ username, password, portal_type });
    setAuthToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const loginWithOtp = async (identifier, otp, portal_type = null) => {
    const res = await api.verifyOtp({ identifier, otp, portal_type });
    setAuthToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const registerUser = async (payload) => {
    const res = await api.register(payload);
    return res;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    }
    setAuthToken('');
    setUser(null);
  };

  const refreshNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.getUnreadNotificationCount();
      setUnreadCount(typeof res.unread_count === 'number' ? res.unread_count : 0);
    } catch (e) {
      // Fallback if unread-count endpoint not yet reached
      try {
        const bureauParam = user.role === 'Administrator' ? null : user.bureau;
        const notifs = await api.getNotifications({
          bureau: bureauParam,
          unread_only: true,
          limit: 100
        });
        setUnreadCount(notifs.length);
      } catch (err) {
        // Quiet fail
      }
    }
  };

  useEffect(() => {
    if (user) {
      refreshNotifications();
      const interval = setInterval(refreshNotifications, 15000);
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
    }
  }, [user]);

  // Derived role permissions
  const currentRole = user ? {
    id: user.username,
    name: user.full_name,
    role: user.role,
    roleName: user.role === 'Administrator'
      ? 'Main Administrator (AICTE Central HQ)'
      : user.role === 'Reviewer'
      ? `Reviewing Official (${user.bureau})`
      : user.role === 'Complainant'
      ? `Complainant (${user.designation || 'Student'})`
      : 'Ministry Scrutiny Auditor (External)',
    bureau: user.bureau,
    complainantId: user.complainant_id,
    identifier: user.complainant_id || user.username,
    affiliation: user.designation,
    canEditAll: user.role === 'Administrator',
    canReview: user.role === 'Administrator' || user.role === 'Reviewer',
    canAssign: user.role === 'Administrator',
    canDecideOverlap: user.role === 'Administrator',
    readOnly: user.role === 'Viewer',
  } : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        currentRole,
        isAuthenticated: Boolean(user),
        loading,
        login,
        loginWithOtp,
        registerUser,
        logout,
        unreadCount,
        refreshNotifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

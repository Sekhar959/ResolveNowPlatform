import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';
import { initSocket, disconnectSocket } from '../utils/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rn_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem('rn_token');
    if (token) {
      authAPI.getMe()
        .then(({ data }) => {
          setUser(data.user);
          localStorage.setItem('rn_user', JSON.stringify(data.user));
          const s = initSocket(token);
          setSocket(s);
        })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await authAPI.login(credentials);
    localStorage.setItem('rn_token', data.token);
    localStorage.setItem('rn_user', JSON.stringify(data.user));
    setUser(data.user);
    const s = initSocket(data.token);
    setSocket(s);
    return data;
  }, []);

  const register = useCallback(async (userData) => {
    const { data } = await authAPI.register(userData);
    localStorage.setItem('rn_token', data.token);
    localStorage.setItem('rn_user', JSON.stringify(data.user));
    setUser(data.user);
    const s = initSocket(data.token);
    setSocket(s);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('rn_token');
    localStorage.removeItem('rn_user');
    setUser(null);
    disconnectSocket();
    setSocket(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('rn_user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, socket }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredToken, setStoredToken, getStoredUser, setStoredUser, apiRequest } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(getStoredToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifySession() {
      if (token) {
        try {
          const res = await apiRequest('/auth/me');
          setUser(res.user);
          setStoredUser(res.user);
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    }

    verifySession();

    const handleUnauthorized = () => logout();
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [token]);

  const login = async (email, password) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setToken(res.token);
    setUser(res.user);
    setStoredToken(res.token);
    setStoredUser(res.user);
    return res.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setStoredToken(null);
    setStoredUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

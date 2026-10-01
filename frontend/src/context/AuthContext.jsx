import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(() => sessionStorage.getItem('ums_token') || localStorage.getItem('ums_token'));

  // Decode JWT payload (no signature verification on client)
  const decodeToken = (tkn) => {
    try {
      const payload = tkn.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded;
    } catch {
      return null;
    }
  };

  // Load user from stored token on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = sessionStorage.getItem('ums_token') || localStorage.getItem('ums_token');
      if (storedToken) {
        const decoded = decodeToken(storedToken);
        if (decoded && decoded.exp * 1000 > Date.now()) {
          try {
            const res = await authService.getProfile();
            const userData = res.data || res;
            setUser(userData);
            setToken(storedToken);
            sessionStorage.setItem('ums_token', storedToken);
            sessionStorage.setItem('ums_user', JSON.stringify(userData));
          } catch {
            sessionStorage.removeItem('ums_token');
            sessionStorage.removeItem('ums_user');
            localStorage.removeItem('ums_token');
            localStorage.removeItem('ums_user');
            setToken(null);
            setUser(null);
          }
        } else {
          sessionStorage.removeItem('ums_token');
          sessionStorage.removeItem('ums_user');
          localStorage.removeItem('ums_token');
          localStorage.removeItem('ums_user');
          setToken(null);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await authService.login(email, password);
    const payload = response.data || response;
    const { token: newToken, user: userData } = payload;
    // Store in sessionStorage so each browser tab has completely independent login sessions
    sessionStorage.setItem('ums_token', newToken);
    sessionStorage.setItem('ums_user', JSON.stringify(userData));
    // Clear localStorage to prevent cross-tab session contamination
    localStorage.removeItem('ums_token');
    localStorage.removeItem('ums_user');
    setToken(newToken);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('ums_token');
    sessionStorage.removeItem('ums_user');
    localStorage.removeItem('ums_token');
    localStorage.removeItem('ums_user');
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

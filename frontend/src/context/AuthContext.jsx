import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import { TOKEN_KEY } from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initial load: verify token & fetch user profile
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
          setToken(storedToken);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Failed to validate session token:', error.message);
          localStorage.removeItem(TOKEN_KEY);
          setUser(null);
          setToken(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async ({ email, password }) => {
    const responseData = await authService.loginUser({ email, password });
    
    // Extract token string from backend response
    const authToken = responseData?.access_token || responseData?.token || responseData;
    if (typeof authToken !== 'string') {
      throw new Error('Invalid token structure received from server.');
    }

    localStorage.setItem(TOKEN_KEY, authToken);
    setToken(authToken);

    // Fetch user profile using token
    const userData = await authService.getCurrentUser();
    setUser(userData);
    setIsAuthenticated(true);

    return userData;
  };

  const register = async ({ name, email, password }) => {
    const regResult = await authService.registerUser({ name, email, password });
    // After registration, automatically log in user
    try {
      await login({ email, password });
    } catch (e) {
      // If auto-login fails, return registration result anyway
      console.log('Registration successful, manual login required:', e.message);
    }
    return regResult;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

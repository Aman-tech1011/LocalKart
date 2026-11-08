import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const sessionRequestId = useRef(0);

  useEffect(() => {
    const requestId = ++sessionRequestId.current;
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    api.get('/auth/me')
      .then((response) => {
        if (sessionRequestId.current === requestId) setUser(response.data.user);
      })
      .catch((error) => {
        if (sessionRequestId.current === requestId) setUser(null);
        if (error.response?.status !== 401) {
          console.error('Could not restore the LocalKart session:', error);
        }
      })
      .finally(() => {
        if (sessionRequestId.current === requestId) setLoading(false);
      });

    return () => {
      sessionRequestId.current += 1;
    };
  }, []);

  const login = (userData) => {
    sessionRequestId.current += 1;
    setUser(userData);
    setLoading(false);
  };

  const logout = async () => {
    await api.post('/auth/logout');
    sessionRequestId.current += 1;
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

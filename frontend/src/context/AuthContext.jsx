import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

const getSavedSession = () => {
  const savedUser = localStorage.getItem('user');
  const savedToken = localStorage.getItem('token');

  if (!savedUser || !savedToken) {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return { user: null, token: null };
  }

  try {
    const user = JSON.parse(savedUser);
    if (!user || typeof user !== 'object') throw new Error('Saved user data is invalid');
    return { user, token: savedToken };
  } catch {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return { user: null, token: null };
  }
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(getSavedSession);
  const { user, token } = session;

  const clearSession = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setSession({ user: null, token: null });
  };

  const login = (userData, authToken) => {
    setSession({ user: userData, token: authToken });
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
  };

  const logout = clearSession;

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

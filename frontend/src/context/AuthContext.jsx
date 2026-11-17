import { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config.js';

const AuthContext = createContext(null);


export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('gs_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('gs_token'));
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) return;

    const s = io(API_BASE_URL || window.location.origin, {
      transports: ['websocket', 'polling'],
    });

    setSocket(s);

    return () => s.disconnect();
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }

    localStorage.setItem('gs_token', data.token);
    localStorage.setItem('gs_user', JSON.stringify(data.user));

    setToken(data.token);
    setUser(data.user);

    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('gs_token');
    localStorage.removeItem('gs_user');

    setUser(null);
    setToken(null);

    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        socket,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
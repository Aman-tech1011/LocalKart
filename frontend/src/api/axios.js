import axios from 'axios';

// LocalKart serves the frontend and API together on port 6001. Point local
// browser tabs at that server even if they were opened from an old Vite port.
const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const API_URL = import.meta.env.VITE_API_URL || (isLocalHost ? 'http://localhost:6001/api' : '/api');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;

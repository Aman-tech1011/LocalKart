import axios from 'axios';

const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const backendPort = import.meta.env.VITE_BACKEND_PORT || '6002';
const localApiUrl = isLocalHost
  ? window.location.port === backendPort
    ? `${window.location.origin}/api`
    : `${window.location.protocol}//${window.location.hostname}:${backendPort}/api`
  : '/api';
const API_URL = import.meta.env.VITE_API_URL || localApiUrl;
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export const getAssetUrl = (assetPath) => (
  typeof assetPath === 'string' && assetPath.startsWith('/uploads/')
    ? `${API_ORIGIN}${assetPath}`
    : assetPath
);

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

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
let csrfToken = null;
let csrfTokenPromise = null;

const getCsrfToken = () => {
  if (csrfToken) return Promise.resolve(csrfToken);
  if (!csrfTokenPromise) {
    csrfTokenPromise = api.get('/auth/csrf-token')
      .then((response) => {
        csrfToken = response.data.token;
        return csrfToken;
      })
      .finally(() => {
        csrfTokenPromise = null;
      });
  }
  return csrfTokenPromise;
};

export const getAssetUrl = (assetPath) => (
  typeof assetPath === 'string' && assetPath.startsWith('/uploads/')
    ? `${API_ORIGIN}${assetPath}`
    : assetPath
);

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase();
  const needsCsrfToken = ['post', 'put', 'patch', 'delete'].includes(method);

  if (!needsCsrfToken) return config;

  return getCsrfToken().then((token) => {
    config.headers['X-CSRF-Token'] = token;
    return config;
  });
});

api.interceptors.response.use(undefined, (error) => {
  if (error.response?.status === 403 && /security token/i.test(error.response?.data?.message || '')) {
    csrfToken = null;
    csrfTokenPromise = null;
  }

  return Promise.reject(error);
});

export default api;

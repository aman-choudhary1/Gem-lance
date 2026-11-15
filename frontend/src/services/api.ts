import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach Access Token from localStorage if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auctionlens_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401 & token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login')) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        const newToken = refreshResponse.data?.data?.accessToken;
        if (newToken) {
          localStorage.setItem('auctionlens_access_token', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        localStorage.removeItem('auctionlens_access_token');
        localStorage.removeItem('auctionlens_user');
      }
    }
    return Promise.reject(error);
  }
);

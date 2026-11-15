import axios from 'axios';

const TOKEN_KEY = 'auctionlens_access_token';
const USER_KEY = 'auctionlens_user';

/** Fired when the session can no longer be refreshed; AuthContext listens and signs the user out. */
export const SESSION_EXPIRED_EVENT = 'auctionlens:session-expired';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach Access Token from localStorage if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// One shared refresh request, so a burst of 401s triggers a single /auth/refresh call.
let refreshInFlight: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = axios
      .post('/api/auth/refresh', {}, { withCredentials: true })
      .then((res) => {
        const token: string | undefined = res.data?.data?.accessToken;
        if (token) localStorage.setItem(TOKEN_KEY, token);
        return token ?? null;
      })
      .catch(() => null)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

const NO_REFRESH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url: string = originalRequest?.url || '';
    const hadToken = Boolean(localStorage.getItem(TOKEN_KEY));

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      hadToken &&
      !NO_REFRESH_PATHS.some((p) => url.includes(p))
    ) {
      originalRequest._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  }
);

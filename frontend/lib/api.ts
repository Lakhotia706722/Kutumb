import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // send httpOnly cookies on every request
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// ── Response interceptor ──────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Build a user-friendly message based on error type
    let message = 'An unexpected error occurred.';

    if (error.code === 'ECONNABORTED') {
      message = 'Request timed out. Check your connection and try again.';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      message = 'Could not connect to the server. Check your internet connection.';
    } else if (!error.response) {
      // Network error (no response from server)
      message = 'Network error. Please check your connection and try again.';
    } else {
      // Server responded with error
      message =
        error.response?.data?.message ||
        error.message ||
        'An unexpected error occurred.';
    }

    error.message = message;

    // On 401 (session expired / cookie gone), redirect to login.
    // Guard against redirect loops: don't redirect if we're already on /login.
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/login')
    ) {
      window.location.replace('/login');
    }

    return Promise.reject(error);
  }
);

export default api;

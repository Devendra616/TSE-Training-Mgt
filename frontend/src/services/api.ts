import axios from 'axios';
import { toast } from 'react-toastify';

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      // Redirect to login if unauthorized and not already on login page
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Show toast for forbidden actions
      toast.error(error.response?.data?.message || 'You do not have permission to perform this action');
    }
    return Promise.reject(error);
  }
);

export default api;

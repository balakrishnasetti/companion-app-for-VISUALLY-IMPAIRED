import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

export function apiMessage(error) {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === 'ECONNABORTED') return 'The request took too long. Please try again.';
  if (!error?.response) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return 'You appear to be offline. Check your connection and try again.';
    }
    return 'Cannot reach the BALA server. Make sure the backend is running and try again.';
  }
  return 'Something went wrong. Please try again.';
}

export default api;

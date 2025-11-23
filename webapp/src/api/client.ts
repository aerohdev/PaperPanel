import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '../types/api';

const API_URL = '/api/v1';

const client: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add JWT token to requests
client.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 responses (unauthorized) and unwrap API responses
client.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>): AxiosResponse => {
    // Auto-unwrap successful API responses: { success: true, data: {...} } -> {...}
    if (response.data && response.data.success && response.data.data !== undefined) {
      return { ...response, data: response.data.data };
    }
    // Handle legacy single-key responses (stats, users, players, etc.)
    if (response.data && response.data.success) {
      const keys = Object.keys(response.data).filter(k => k !== 'success' && k !== 'message');
      if (keys.length === 1) {
        return { ...response, data: response.data[keys[0] as keyof typeof response.data] };
      }
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if not already on login page to avoid infinite loops
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;
export { client as apiClient };

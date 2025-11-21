import axios from 'axios';

const API_URL = '/api/v1';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add JWT token to requests
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
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
  (response) => {
    // Auto-unwrap successful API responses: { success: true, data: {...} } -> {...}
    if (response.data && response.data.success && response.data.data !== undefined) {
      return { ...response, data: response.data.data };
    }
    if (response.data && response.data.success && response.data.stats !== undefined) {
      // Handle legacy "stats" key from DashboardAPI
      return { ...response, data: response.data.stats };
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;

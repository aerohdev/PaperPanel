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
    // Auto-unwrap successful API responses
    if (response.data && response.data.success) {
      // Extract the data from the response, excluding 'success' and 'message'
      const { success, message, ...data } = response.data;
      
      // If there's only one key left, unwrap it
      const keys = Object.keys(data);
      if (keys.length === 1) {
        return { ...response, data: data[keys[0]] };
      }
      
      // Otherwise return all data keys
      return { ...response, data };
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

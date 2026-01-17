import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
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

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (!error.response) {
      return Promise.reject({
        success: false,
        message: 'Network error. Please check if the backend server is running.'
      });
    }

    if (error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
      return Promise.reject({
        success: false,
        message: 'Your session has expired. Please login again.'
      });
    }

    const errorData = error.response?.data || {
      success: false,
      message: 'An unexpected error occurred. Please try again.'
    };
    return Promise.reject(errorData);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile')
};

export const groupsAPI = {
  getGroups: () => api.get('/groups'),
  getGroup: (id) => api.get(`/groups/${id}`),
  createGroup: (data) => api.post('/groups', data),
  updateGroup: (id, data) => api.put(`/groups/${id}`, data),
  deleteGroup: (id) => api.delete(`/groups/${id}`),
  addParticipant: (groupId, data) => api.post(`/groups/${groupId}/participants`, data),
  updateParticipant: (groupId, participantId, data) => api.put(`/groups/${groupId}/participants/${participantId}`, data),
  removeParticipant: (groupId, participantId) => api.delete(`/groups/${groupId}/participants/${participantId}`),
  getBalances: (groupId) => api.get(`/groups/${groupId}/balances`),
  getSettlements: (groupId) => api.get(`/groups/${groupId}/settlements`),
  getUserBalance: (groupId) => api.get(`/groups/${groupId}/balance/user`)
};

export const expensesAPI = {
  getExpenses: (groupId) => api.get(`/expenses?groupId=${groupId}`),
  getExpense: (id) => api.get(`/expenses/${id}`),
  createExpense: (data) => api.post('/expenses', data),
  updateExpense: (id, data) => api.put(`/expenses/${id}`, data),
  deleteExpense: (id) => api.delete(`/expenses/${id}`)
};

export const usersAPI = {
  searchUsers: (query) => api.get(`/users/search?query=${encodeURIComponent(query)}`)
};

export default api;

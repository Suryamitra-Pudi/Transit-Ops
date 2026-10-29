import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Attach the JWT to every request once the user is logged in.
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = window.sessionStorage.getItem('transitops_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Redirect to login on 401s so an expired session doesn't leave the user
// stuck on a broken screen.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (typeof window !== 'undefined' && err?.response?.status === 401) {
      window.sessionStorage.removeItem('transitops_token');
      window.sessionStorage.removeItem('transitops_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

import axios from 'axios';

// Definimos dónde vive cada servicio
const SERVICES = {
  USER: 'http://localhost:8081',
  COURSE: 'http://localhost:8082',
  EVALUATION: 'http://localhost:8083'
};

const apiClient = axios.create({
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
});

// --- INTERCEPTOR INTELIGENTE ---
// Antes de que salga la petición, decidimos a qué puerto ir según la URL
apiClient.interceptors.request.use((config) => {
  if (config.url.startsWith('/auth') || config.url.startsWith('/api/users')) {
    config.baseURL = SERVICES.USER;
  } else if (config.url.startsWith('/api/courses') || config.url.startsWith('/api/enrollments')) {
    config.baseURL = SERVICES.COURSE;
  } else if (config.url.startsWith('/api/evaluations') || config.url.startsWith('/api/rubrics')) {
    config.baseURL = SERVICES.EVALUATION;
  }
  return config;
}, (error) => Promise.reject(error));

// --- FUNCIONES EXPORTADAS ---
export const login = (creds) => apiClient.post('/auth/login', creds);
export const register = (data) => apiClient.post('/auth/register', data);

export default apiClient;
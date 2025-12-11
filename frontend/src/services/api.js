// src/services/api.js
import axios from 'axios';

// ¡Ya no necesitamos 3 clientes!
// Creamos UN solo cliente que apunta a nuestro propio servidor (el proxy)
const apiClient = axios.create({
  baseURL: '/', // Apunta a la raíz de nuestro sitio (http://localhost:5173)
  withCredentials: true, 
});

// Simplemente exportamos este cliente único
export default apiClient;
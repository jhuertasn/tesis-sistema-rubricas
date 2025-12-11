// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // 1. Peticiones de Login (OAuth2) van al user-service
      '/oauth2': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      // 2. Peticiones de Logout van al user-service
      '/api/logout': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      // 3. Peticiones de Usuarios van al user-service
      '/api/users': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      // 4. Peticiones de Cursos van al course-service
      '/api/courses': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      // 5. Peticiones de Evaluaciones van al evaluation-service
      '/api/evaluations': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      }
    }
  }
})
import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Loader from './components/Loader.jsx'; 

// --- FUNCIÓN PARA RETRASO ARTIFICIAL (SOLO PARA DEMO) ---
// Esto obliga a que el Loader se muestre por al menos 'delay' milisegundos.
const lazyWithDelay = (importPromise) => {
  return React.lazy(() => {
    return Promise.all([
      importPromise,
      new Promise(resolve => setTimeout(resolve, 1000)) // <--- TIEMPO DE ESPERA (1000ms = 1 seg)
    ]).then(([moduleExports]) => moduleExports);
  });
};

// --- IMPORTS CON LAZY LOADING + DELAY ---
// Usamos nuestra función mágica en lugar de React.lazy directo
const Login = lazyWithDelay(import('./pages/Login.jsx'));
const Register = lazyWithDelay(import('./pages/Register.jsx'));
const MisClases = lazyWithDelay(import('./pages/MisClases.jsx'));
const UserManagement = lazyWithDelay(import('./pages/UserManagement.jsx'));
const ClaseDetalle = lazyWithDelay(import('./pages/ClaseDetalle.jsx'));
const EvaluacionForm = lazyWithDelay(import('./pages/EvaluacionForm.jsx'));
const Resultados = lazyWithDelay(import('./pages/Resultados.jsx'));
const Reportes = lazyWithDelay(import('./pages/Reportes.jsx'));
const CoevaluacionForm = lazyWithDelay(import('./pages/CoevaluacionForm.jsx'));
const Perfil = lazyWithDelay(import('./pages/Perfil.jsx'));

// --- SEGURIDAD ---
const PrivateRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user ? children : <Navigate to="/" />;
};

function App() {
  return (
    // El Loader se mostrará durante esos 2 segundos de espera
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/clases" element={
          <PrivateRoute><MisClases /></PrivateRoute>
        } />
        
        <Route path="/admin/users" element={
          <PrivateRoute><UserManagement /></PrivateRoute>
        } />
        
        <Route path="/clase/:id" element={
          <PrivateRoute><ClaseDetalle /></PrivateRoute>
        } />
        
        <Route path="/evaluacion/:rubricId" element={
          <PrivateRoute><EvaluacionForm /></PrivateRoute>
        } />
        
        <Route path="/resultados" element={
          <PrivateRoute><Resultados /></PrivateRoute>
        } />
        
        <Route path="/reportes/:rubricId" element={
          <PrivateRoute><Reportes /></PrivateRoute>
        } />
        
        <Route path="/coevaluacion/:rubricId" element={
          <PrivateRoute><CoevaluacionForm /></PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />

        <Route path="/perfil" element={
          <PrivateRoute><Perfil /></PrivateRoute>
        } />

      </Routes>
    </Suspense>
  );
}

export default App;
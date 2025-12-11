// src/main.jsx
import React, { Suspense } from 'react' // <-- 1. AÑADIR { Suspense }
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import Loader from './components/Loader.jsx' // <-- 2. MOVER ARRIBA (Junto a los otros imports)

// --- IMPORTS CON LAZY LOADING ---
const Login = React.lazy(() => import('./pages/Login.jsx'));
const MisClases = React.lazy(() => import('./pages/MisClases.jsx'));
const UserManagement = React.lazy(() => import('./pages/UserManagement.jsx'));
const ClaseDetalle = React.lazy(() => import('./pages/ClaseDetalle.jsx'));
const EvaluacionForm = React.lazy(() => import('./pages/EvaluacionForm.jsx'));
const Resultados = React.lazy(() => import('./pages/Resultados.jsx'));
const Reportes = React.lazy(() => import('./pages/Reportes.jsx'));
const CoevaluacionForm = React.lazy(() => import('./pages/CoevaluacionForm.jsx'));

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/clases" element={<MisClases />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/clase/:id" element={<ClaseDetalle />} />
          <Route path="/evaluacion/:rubricId" element={<EvaluacionForm />} />
          <Route path="/resultados" element={<Resultados />} />
          <Route path="/reportes/:rubricId" element={<Reportes />} />
          <Route path="/coevaluacion/:rubricId" element={<CoevaluacionForm />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>,
)
// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/api'; 
import Swal from 'sweetalert2';
import './Login.css';

// 1. IMPORTAMOS LA IMAGEN
// Asegúrate que el nombre del archivo coincida
import logoCCF from '../assets/logoIESTPCCF2024.png'; 

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.includes('@')) {
       Swal.fire('Atención', 'El correo debe tener un @', 'warning');
       return;
    }

    setLoading(true);
    try {
      const response = await login({ email, password });
      
      localStorage.setItem('user', JSON.stringify(response.data));

      const rol = response.data.rol;
      if (rol === 'ADMINISTRADOR') navigate('/admin/users');
      else if (rol === 'DOCENTE') navigate('/clases');
      else navigate('/clases'); 

    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Credenciales incorrectas', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        
        {/* 2. AQUÍ REEMPLAZAMOS EL ÍCONO POR EL LOGO */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <img 
                src={logoCCF} 
                alt="Logo IESTP Carlos Cueto Fernandini" 
                style={{ width: '120px', height: 'auto', display: 'block', margin: '0 auto' }} 
            />
        </div>
        
        <h2 style={{margin: '0 0 5px 0', color: '#111827'}}>Bienvenido a EvalSpace</h2>
        <p style={{margin: '0 0 20px 0', color: '#6b7280', fontSize: '0.9rem'}}>
          Inicia sesión para acceder a tu panel
        </p>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Correo Electrónico</label>
            <input 
              type="email" className="input-field" placeholder="ej. tucorreo@ccf.com" required 
              value={email} onChange={e => setEmail(e.target.value)} 
            />
          </div>

          <div className="input-group">
            <label>Contraseña</label>
            <input 
              type="password" className="input-field" placeholder="••••••••" required 
              value={password} onChange={e => setPassword(e.target.value)} 
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="auth-link">
          ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
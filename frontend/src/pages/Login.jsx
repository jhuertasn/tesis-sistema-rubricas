// src/pages/Login.jsx

import React from 'react';
import './Login.css'; // Importamos los estilos

// Importamos los íconos
import { FcGoogle } from 'react-icons/fc';
import { FaChalkboardTeacher, FaUserGraduate } from 'react-icons/fa';
import { FaGraduationCap } from 'react-icons/fa';

function Login() {
  
  // Esta es la URL de tu backend que inicia el login con Google
  const GOOGLE_LOGIN_URL = '/oauth2/authorization/google';

  // URL de registro (por ahora, la mandamos al mismo login de Google)
  const REGISTER_URL = '/oauth2/authorization/google';

return (
    <div className="login-container">
      <div className="login-wrapper">
        
        {/* LADO IZQUIERDO: BRANDING */}
        <div className="login-branding">
          <div className="brand-content">
            <div className="logo-icon">
              <FaGraduationCap />
            </div>
            <h1>EvaluaApp</h1>
            <p className="brand-tagline">
              La plataforma integral para la gestión y evaluación académica moderna.
            </p>
            
            <div className="features-list">
              <div className="feature-item">
                <FaChalkboardTeacher className="feature-icon" />
                <span>Para Docentes: Crea clases y rúbricas en minutos.</span>
              </div>
              <div className="feature-item">
                <FaUserGraduate className="feature-icon" />
                <span>Para Estudiantes: Evaluaciones y feedback en tiempo real.</span>
              </div>
            </div>
          </div>
        </div>

        {/* LADO DERECHO: LOGIN */}
        <div className="login-form-section">
          <div className="form-card">
            <h2>¡Bienvenido!</h2>
            <p className="subtitle">Inicia sesión para acceder a tu panel.</p>

            <a href={GOOGLE_LOGIN_URL} className="google-btn">
              <div className="google-icon-wrapper">
                <FcGoogle size={24} />
              </div>
              <span className="btn-text">Continuar con Google</span>
            </a>

            <div className="divider">
              <span>Acceso Seguro Institucional</span>
            </div>

            <p className="terms-text">
              Al ingresar, aceptas nuestros Términos de Servicio y Política de Privacidad.
              <br/>
              <strong>Nota:</strong> Los nuevos usuarios se registrarán automáticamente como Estudiantes.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;
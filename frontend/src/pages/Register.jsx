// src/pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/api'; 
import Swal from 'sweetalert2';
import './Login.css';

function Register() {
  const navigate = useNavigate();
  
  // Estados para el formulario
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rol, setRol] = useState('ESTUDIANTE');

    const isValidEmail = (email) => {
    // Regex estándar para emails
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // NUEVAS VALIDACIONES
    if (!isValidEmail(email)) {
        Swal.fire('Error', 'Ingresa un correo válido (ej. juan@gmail.com)', 'warning');
        return;
    }
    if (password !== confirmPassword) {
      Swal.fire('Error', 'Las contraseñas no coinciden', 'error');
      return;
    }
    
    // 1. Validaciones simples
    if (password !== confirmPassword) {
      Swal.fire('Error', 'Las contraseñas no coinciden', 'error');
      return;
    }
    if (password.length < 3) { // Puedes poner 8 si quieres ser estricto
        Swal.fire('Error', 'La contraseña es muy corta', 'warning');
        return;
    }

    // 2. Preparar datos (Unimos Nombre + Apellido)
    const userData = {
      nombre: `${nombre} ${apellido}`.trim(),
      email: email,
      password: password,
      rol: rol
    };

    // 3. Enviar al Backend
    try {
      await register(userData);
      Swal.fire({
        title: '¡Cuenta Creada!',
        text: 'Ya puedes iniciar sesión.',
        icon: 'success',
        confirmButtonColor: '#5D5FEF'
      }).then(() => {
        navigate('/'); // Ir al Login
      });
    } catch (error) {
      console.error(error);
      const msg = error.response?.data || 'Error al conectar con el servidor';
      Swal.fire('Error', msg.toString(), 'error');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Ícono de birrete */}
        <div className="auth-icon">🎓</div>
        
        <h2 style={{margin: '0 0 5px 0', color: '#111827'}}>Crear Cuenta</h2>
        <p style={{margin: '0 0 20px 0', color: '#6b7280', fontSize: '0.9rem'}}>
          Únete a EvaluaApp y comienza a evaluar
        </p>

        <form onSubmit={handleSubmit}>
          {/* Fila Nombre y Apellido */}
          <div className="row-2-cols">
            <div className="input-group">
              <label>Nombre <span>*</span></label>
              <input type="text" className="input-field" placeholder="Tu nombre" required 
                     value={nombre} onChange={e => setNombre(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Apellido <span>*</span></label>
              <input type="text" className="input-field" placeholder="Tu apellido" required 
                     value={apellido} onChange={e => setApellido(e.target.value)} />
            </div>
          </div>

          <div className="input-group">
            <label>Correo Electrónico <span>*</span></label>
            <input type="email" className="input-field" placeholder="tu.correo@ejemplo.com" required 
                   value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div className="input-group">
            <label>Rol <span>*</span></label>
            <select className="input-field" value={rol} onChange={e => setRol(e.target.value)}>
              <option value="ESTUDIANTE">Estudiante</option>
              <option value="DOCENTE">Docente</option>
            </select>
            <small style={{display:'block', marginTop:'5px', color:'#9ca3af', fontSize:'0.75rem'}}>
              * El rol de Administrador debe ser asignado por el sistema
            </small>
          </div>

          <div className="input-group">
            <label>Contraseña <span>*</span></label>
            <input type="password" className="input-field" placeholder="Mínimo 3 caracteres" required 
                   value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          <div className="input-group">
            <label>Confirmar Contraseña <span>*</span></label>
            <input type="password" className="input-field" placeholder="Repite tu contraseña" required 
                   value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>

          <button type="submit" className="btn-primary">
            Crear Cuenta
          </button>
        </form>

        <div className="auth-link">
          ¿Ya tienes una cuenta? <Link to="/">Inicia Sesión</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
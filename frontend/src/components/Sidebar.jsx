// src/components/Sidebar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import '../pages/MisClases.css'; 

function Sidebar({ user, activePage }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await apiClient.get('/api/logout');
      navigate('/'); 
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  if (!user) {
    return <nav className="sidebar"></nav>;
  }

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <span className="logo">EvaluaApp</span>
      </div>
      <div className="user-profile">
        <span className="user-avatar">{user.nombre ? user.nombre.charAt(0) : 'U'}</span>
        <div className="user-info">
          <span className="user-name">{user.nombre}</span>
          <span className="user-role">{user.rol}</span>
        </div>
      </div>
      
      <ul className="nav-menu">
        {/* ENLACE PRINCIPAL */}
        <li 
          className={activePage === 'clases' ? 'nav-item active' : 'nav-item'} 
          onClick={() => navigate('/clases')}
        >
          Mis Clases
        </li>

        {/* --- ENLACES ELIMINADOS ---
           Quitamos "Evaluaciones" y "Reportes" del menú principal 
           para evitar errores 404 y confusión.
           
           El flujo correcto es: Mis Clases -> Seleccionar Clase -> Ver Reportes/Evaluaciones
        */}

        {/* ENLACE SOLO PARA ESTUDIANTES */}
        {user.rol === 'ESTUDIANTE' && (
           <li 
             className={activePage === 'resultados' ? 'nav-item active' : 'nav-item'} 
             onClick={() => navigate('/resultados')}
           >
             Mis Notas
           </li>
        )}
        
        {/* ENLACE SOLO PARA ADMINISTRADOR */}
        {user.rol === 'ADMINISTRADOR' && (
          <li 
            className={activePage === 'admin' ? 'nav-item active' : 'nav-item'} 
            style={{ cursor: 'pointer', color: (activePage === 'admin' ? '' : '#d9534f') }} 
            onClick={() => navigate('/admin/users')}
          >
            Gestionar Usuarios
          </li>
        )}
      </ul>
      
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-button">Cerrar Sesión</button>
      </div>
    </nav>
  );
}

export default Sidebar;
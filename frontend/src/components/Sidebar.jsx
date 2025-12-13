// src/components/Sidebar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../pages/MisClases.css';

function Sidebar({ activePage }) {
  const navigate = useNavigate();

  // 1. LEEMOS EL USUARIO DESDE LOCALSTORAGE (La fuente de verdad actual)
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    Swal.fire({
      title: '¿Cerrar Sesión?',
      text: "Tendrás que ingresar tus credenciales nuevamente.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#5D5FEF', // Tu color morado
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // 2. LIMPIEZA LOCAL
        localStorage.removeItem('user');
        navigate('/');
      }
    });
  };

  // Si por alguna razón no hay usuario, mostramos algo vacío o redirigimos
  if (!user) {
    return <nav className="sidebar"></nav>;
  }

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <span className="logo">EvalSpace</span>
        <span style={{ fontSize: '0.7rem', color: '#888', display: 'block' }}>Versión 1.1 en Local</span>
      </div>

      <div className="user-profile">
        {/* 3. AVATAR: Usamos la URL del backend o un fallback */}
        <img
          src={user.picture || `https://ui-avatars.com/api/?name=${user.nombre}&background=random`}
          alt="Avatar"
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            marginBottom: '10px',
            border: '3px solid #e0e7ff'
          }}
        />
        <div className="user-info">
          <span className="user-name">{user.nombre}</span>
          <span className="user-role" style={{ fontWeight: 'bold', color: '#5D5FEF' }}>{user.rol}</span>
        </div>
      </div>

      <ul className="nav-menu">
        {/* --- ENLACE PARA TODOS (Mis Clases) --- */}
        <li
          className={activePage === 'clases' ? 'nav-item active' : 'nav-item'}
          onClick={() => navigate('/clases')}
        >
          📚 Mis Clases
        </li>

        {/* --- ENLACE SOLO PARA ESTUDIANTES (Mis Notas) --- */}
        {user.rol === 'ESTUDIANTE' && (
          <li
            className={activePage === 'resultados' ? 'nav-item active' : 'nav-item'}
            onClick={() => navigate('/resultados')}
          >
            📊 Mis Notas
          </li>
        )}

        {/* --- ENLACE SOLO PARA ADMINISTRADOR (Gestionar Usuarios) --- */}
        {user.rol === 'ADMINISTRADOR' && (
          <li
            className={activePage === 'admin' ? 'nav-item active' : 'nav-item'}
            onClick={() => navigate('/admin/users')}
            style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}
          >
            🛠️ Gestionar Usuarios
          </li>
        )}

        <li
          className={activePage === 'perfil' ? 'nav-item active' : 'nav-item'}
          onClick={() => navigate('/perfil')}
          style={{ marginTop: 'auto' }} // Truco CSS: Esto empuja el botón hacia abajo si hay espacio
        >
          👤 Mi Perfil
        </li>

      </ul>



      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-button">
          🚪 Cerrar Sesión
        </button>
      </div>
    </nav>
  );
}

export default Sidebar;
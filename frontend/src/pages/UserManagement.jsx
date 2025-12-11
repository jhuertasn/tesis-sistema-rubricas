// src/pages/UserManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import './MisClases.css'; // Sigue usando el mismo CSS
import Sidebar from '../components/Sidebar.jsx'; // Importa la Sidebar
import Loader from '../components/Loader.jsx';
import Swal from 'sweetalert2';

// Estilos para la tabla
const styles = {
	table: { width: '100%', borderCollapse: 'collapse', marginTop: '2rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0, 0.05)' },
	th: { textAlign: 'left', padding: '1rem', borderBottom: '2px solid #f0f0f0' },
	td: { textAlign: 'left', padding: '1rem', borderBottom: '1px solid #f0f0f0' },
	select: { padding: '6px', fontSize: '0.9rem', borderRadius: '6px', border: '1px solid #ccc' }
};

function UserManagement() {
	const navigate = useNavigate();
	const [user, setUser] = useState(null); // Para la sidebar
	const [userList, setUserList] = useState([]); // Para la tabla
	const [loading, setLoading] = useState(true);

	// Carga el usuario logueado (para la sidebar) Y la lista de usuarios (para la tabla)
	const loadData = useCallback(async () => {
		try {
			const userMeResponse = await apiClient.get('/api/users/me');
			setUser(userMeResponse.data);
			if (userMeResponse.data.rol !== 'ADMINISTRADOR') {
				alert("Acceso denegado.");
				navigate('/clases');
				return;
			}
			const userListResponse = await apiClient.get('/api/users');
			setUserList(userListResponse.data);
		} catch (error) {
			console.error("Error al cargar datos:", error);
			if (error.response && error.response.status === 403) {
				// [MODIFICADO] Usamos Swal para la alerta de acceso denegado
				Swal.fire('Acceso Denegado', 'Esta página es solo para Administradores.', 'error');
				navigate('/clases');
			}
		} finally {
			setLoading(false);
		}
	}, [navigate]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	// Función para manejar el cambio de rol
	const handleChangeRole = async (userId, newRole) => {
		// 1. Buscamos en userList (NO en users)
		const userToUpdate = userList.find(u => u.id === userId);

		const result = await Swal.fire({
			title: 'Confirmar cambio',
			html: `¿Asignar el rol <strong>${newRole}</strong> a ${userToUpdate ? userToUpdate.nombre : 'este usuario'}?`,
			icon: 'question',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Sí, cambiar'
		});

		if (result.isConfirmed) {
			try {
				await apiClient.put(`/api/users/${userId}/role`, { role: newRole });

				Swal.fire('¡Actualizado!', 'El rol ha sido modificado.', 'success');
				loadData();
			} catch (error) {
				Swal.fire('Error', 'No se pudo actualizar el rol.', 'error');
			}
		}
	};

	if (loading) { return <Loader />; }

	return (
		<div className="dashboard-container">

			{/* 1. La Sidebar (ahora está correcta) */}
			<Sidebar user={user} activePage="admin" />

			{/* 2. El Contenido Principal (¡LA TABLA ESTÁ AQUÍ AHORA!) */}
			<main className="main-content">
				<h2>Gestión de Usuarios</h2>
				<p>Aquí puedes asignar los roles de Docente a los usuarios registrados.</p>

				<table style={styles.table}>
					<thead>
						<tr>
							<th style={styles.th}>ID</th>
							<th style={styles.th}>Nombre</th>
							<th style={styles.th}>Email</th>
							<th style={styles.th}>Rol Actual</th>
							<th style={styles.th}>Cambiar Rol</th>
						</tr>
					</thead>
					<tbody>
						{userList.map(u => (
							<tr key={u.id}>
								<td style={styles.td}>{u.id}</td>
								<td style={styles.td}>{u.nombre}</td>
								<td style={styles.td}>{u.email}</td>
								<td style={styles.td}>{u.rol}</td>
								<td style={styles.td}>
									<select
										style={styles.select}
										value={u.rol}
										onChange={(e) => handleChangeRole(u.id, e.target.value)}
									>
										<option value="ESTUDIANTE">Estudiante</option>
										<option value="DOCENTE">Docente</option>
										<option value="ADMINISTRADOR">Administrador</option>
									</select>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</main>
		</div>
	);
}

export default UserManagement;
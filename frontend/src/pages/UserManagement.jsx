// src/pages/UserManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import './MisClases.css';
import Sidebar from '../components/Sidebar.jsx';
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
	const [user, setUser] = useState(null);
	const [userList, setUserList] = useState([]);
	const [loading, setLoading] = useState(true);

	const loadData = useCallback(async () => {
		try {
			// 1. LEER ID DEL LOCALSTORAGE (Igual que en MisClases)
			const localUser = JSON.parse(localStorage.getItem('user'));

			if (!localUser || !localUser.id) {
				navigate('/');
				return;
			}

			// 2. VALIDAR IDENTIDAD CON LA BD (Usando el ID, no /me)
			const userMeResponse = await apiClient.get(`/api/users/${localUser.id}`);
			const dbUser = userMeResponse.data;
			setUser(dbUser); // Guardamos el usuario real para la Sidebar

			// 3. VERIFICAR SI ES ADMIN
			if (dbUser.rol !== 'ADMINISTRADOR') {
				Swal.fire('Acceso Denegado', 'No tienes permisos de Administrador.', 'error');
				navigate('/clases');
				return;
			}

			// 4. SI ES ADMIN, CARGAMOS LA LISTA DE TODOS LOS USUARIOS
			const userListResponse = await apiClient.get('/api/users'); // Asegúrate que este endpoint exista en UserController
			setUserList(userListResponse.data);

		} catch (error) {
			console.error("Error al cargar datos:", error);
			// Si el usuario no existe en BD o hay error de red
			if (error.response && error.response.status === 404) {
				navigate('/');
			} else {
				Swal.fire('Error', 'No se pudo cargar la lista de usuarios.', 'error');
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
				loadData(); // Recargamos la tabla
			} catch (error) {
				console.error(error);
				Swal.fire('Error', 'No se pudo actualizar el rol.', 'error');
			}
		}
	};

	// ELIMINAR USUARIO (SOFT DELETE)
	const handleDeleteUser = async (userId) => {
		const result = await Swal.fire({
			title: '¿Eliminar usuario?',
            text: "El usuario perderá acceso al sistema inmediatamente.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
		});

		if (result.isConfirmed) {
			try {
				await apiClient.delete(`/api/users/${userId}`);
				Swal.fire('Eliminado', 'El usuario ha sido desactivado.', 'success');
				loadData(); // Recargamos la tabla
			} catch (error) {
				Swal.fire('Error', 'No se pudo eliminar el usuario.', 'error');
			}
		}
	};

	if (loading) { return <Loader />; }
	if (!user) return null;

	return (
		<div className="dashboard-container">
			<Sidebar user={user} activePage="admin" />

			<main className="main-content">
				<h2>Gestión de Usuarios</h2>
				<p>Administra los roles y el acceso de los usuarios del sistema</p>

				<table style={styles.table}>
					<thead>
						<tr>
							<th style={styles.th}>ID</th>
							<th style={styles.th}>Nombre</th>
							<th style={styles.th}>Email</th>
							<th style={styles.th}>Rol Actual</th>
							<th style={styles.th}>Cambiar Rol</th>
							<th style={styles.th}>Acciones</th>
						</tr>
					</thead>
					<tbody>
						{userList.map(u => (
							<tr key={u.id}>
								<td style={styles.td}>{u.id}</td>
								<td style={styles.td}>
									<div style={{ fontWeight: 'bold' }}>{u.nombre}</div>
								</td>
								<td style={styles.td}>{u.email}</td>
								<td style={styles.td}>
									<span className={`badge ${u.rol === 'ADMINISTRADOR' ? 'purple' : u.rol === 'DOCENTE' ? 'info' : 'success'}`}>
										{u.rol}
									</span>
								</td>
								<td style={styles.td}>
									<select
										style={styles.select}
										value={u.rol}
										onChange={(e) => handleChangeRole(u.id, e.target.value)}
										// Deshabilitamos cambiar el rol de uno mismo para no bloquearse
										disabled={u.id === user.id}
									>
										<option value="ESTUDIANTE">Estudiante</option>
										<option value="DOCENTE">Docente</option>
										<option value="ADMINISTRADOR">Administrador</option>
									</select>
								</td>
								<td style={styles.td}>
									{/* No permitimos que el Admin se borre a sí mismo */}
									{u.id !== user.id && (
										<button
											onClick={() => handleDeleteUser(u.id)}
											style={{
												background: '#ffebee', color: '#d32f2f',
												border: '1px solid #ffcdd2', borderRadius: '6px',
												padding: '6px 10px', cursor: 'pointer', fontWeight: 'bold'
											}}
										>
											Eliminar
										</button>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
				{userList.length === 0 && <p style={{textAlign:'center', marginTop:'2rem'}}>No hay usuarios.</p>}
			</main>
		</div>
	);
}

export default UserManagement;
// src/pages/MisClases.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './MisClases.css';
import apiClient from '../services/api';
import CrearClaseModal from '../components/CrearClaseModal.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { FaChalkboardTeacher, FaFolderOpen } from 'react-icons/fa';
import Loader from '../components/Loader.jsx';
import Swal from 'sweetalert2';


function MisClases() {
	const navigate = useNavigate();
	const [user, setUser] = useState(null);
	const [myClasses, setMyClasses] = useState([]);
	const [loading, setLoading] = useState(true);
	const [joinCode, setJoinCode] = useState('');

	// Estados para modales y edición
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [classToEdit, setClassToEdit] = useState(null);

	// --- CARGA DE CLASES ---
	const fetchMyClasses = useCallback(async (currentUser) => {
		if (!currentUser) return;
		try {
			let classesResponse;

			// Lógica de roles
			if (currentUser.rol === 'ADMINISTRADOR') {
				classesResponse = await apiClient.get('/api/courses/all');
			} else if (currentUser.rol === 'DOCENTE') {
				classesResponse = await apiClient.get(`/api/courses/teacher/${currentUser.id}`);
			} else if (currentUser.rol === 'ESTUDIANTE') {
				classesResponse = await apiClient.get(`/api/courses/student/${currentUser.id}`);
			}

			if (classesResponse) {
				setMyClasses(classesResponse.data);
			}
		} catch (error) {
			console.error("Error al cargar las clases:", error);
		}
	}, []);

	// --- CARGA INICIAL ---
	useEffect(() => {
		const loadPageData = async () => {
			setLoading(true);
			try {
				const userResponse = await apiClient.get('/api/users/me');
				const userData = userResponse.data;
				setUser(userData);
				await fetchMyClasses(userData);
			} catch (error) {
				console.error('Error al cargar datos:', error);
				navigate('/');
			} finally {
				setLoading(false);
			}
		};
		loadPageData();
	}, [navigate, fetchMyClasses]);

	// --- MANEJADORES ---
	const handleJoinCourse = async () => {
		if (!joinCode.trim() || !user) {
			Swal.fire('Error', 'Por favor, ingresa un código de clase.', 'warning');
			return;
		}

		// 1. Verificar si ya está inscrito en esa clase
		const isAlreadyEnrolled = myClasses.some(clase =>
			clase.codigoClase === joinCode.toUpperCase().trim()
		);

		if (isAlreadyEnrolled) {
			Swal.fire({
				icon: 'warning',
				title: 'Ya estás inscrito',
				text: 'Ya perteneces a esta clase.',
				confirmButtonText: 'Entendido'
			});
			return;
		}

		try {
			await apiClient.post(`/api/courses/enroll/code/${joinCode}?studentId=${user.id}`);

			Swal.fire({
				icon: 'success',
				title: '¡Inscripción exitosa!',
				text: 'Te has unido a la clase correctamente.',
				timer: 2000,
				showConfirmButton: false
			});

			setJoinCode('');
			await fetchMyClasses(user);
		} catch (error) {
			let errorMsg = 'No se pudo completar la inscripción.';

			if (error.response) {
				// Si hay respuesta del servidor
				if (error.response.status === 409) {
					errorMsg = 'Ya estás inscrito en esta clase.';
				} else if (error.response.status === 404) {
					errorMsg = 'Código de clase no encontrado.';
				} else if (error.response.data) {
					// Intentar obtener el mensaje del backend
					errorMsg = error.response.data;
				}
			} else if (error.message) {
				errorMsg = error.message;
			}

			Swal.fire('Error', errorMsg, 'error');
		}
	};

	// --- LÓGICA DE EDICIÓN Y ELIMINACIÓN ---

	const handleDeleteClass = async (claseId) => {
		const result = await Swal.fire({
			title: '¿Estás seguro?',
			text: "Moverás esta clase a la papelera.",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Sí, eliminar',
			cancelButtonText: 'Cancelar'
		});

		if (result.isConfirmed) {
			try {
				await apiClient.delete(`/api/courses/${claseId}`);
				Swal.fire('Eliminado', 'La clase ha sido eliminada.', 'success');
				await fetchMyClasses(user);
			} catch (error) {
				Swal.fire('Error', 'No se pudo eliminar la clase.', 'error');
			}
		}
	};

	const handleEditClick = (clase, e) => {
		e.stopPropagation(); // Evita que se abra el detalle de la clase
		setClassToEdit(clase); // Preparamos los datos para el modal
		setShowCreateModal(true);
	};

	const handleCreateClick = () => {
		setClassToEdit(null); // Modo creación (limpio)
		setShowCreateModal(true);
	};

	if (loading) { return <Loader />; }
	if (!user) { return null; }

	return (
		<>
			<div className="dashboard-container">

				<Sidebar user={user} activePage="clases" />

				<main className="main-content">
					<div className="main-header">
						<h2>Mis Clases</h2>
						{/* Botón Crear solo para Docente/Admin */}
						{(user.rol === 'DOCENTE' || user.rol === 'ADMINISTRADOR') && (
							<button className="button-primary" onClick={handleCreateClick}>
								+ Crear Clase
							</button>
						)}
					</div>

					{/* Barra de Unirse solo para Estudiante */}
					{user.rol === 'ESTUDIANTE' && (
						<div className="join-class-bar">
							<div className="join-class-content">
								<strong>Únete a una clase</strong>
								<span>Ingresa el código de clase</span>
							</div>
							<div className="join-class-actions">
								<input
									type="text"
									placeholder="Ej: DISEÑO-101"
									value={joinCode}
									onChange={(e) => setJoinCode(e.target.value)}
								/>
								<button onClick={handleJoinCourse} className="button-primary">Unirse</button>
							</div>
						</div>
					)}

					<div className="class-list">
						{myClasses.map((clase) => (
							<div
								className="class-card"
								key={clase.id}
								// Navegación al hacer clic en la tarjeta
								onClick={() => navigate(`/clase/${clase.id}`)}
							>
								<div>
									<h3>{clase.name}</h3>
									<span>Código: <strong>{clase.codigoClase}</strong></span>
									<br />
									<span className="rubric-count">Periodo: {clase.periodoAcademico || 'N/A'}</span>
								</div>

								{/* Botones de Acción (Solo Docente/Admin) */}
								{(user.rol === 'DOCENTE' || user.rol === 'ADMINISTRADOR') && (
									<div className="class-card-actions" style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem', display: 'flex', gap: '10px' }}>
										<button
											className="button-edit"
											style={{ background: '#f0f0f8', color: '#5D5FEF', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
											onClick={(e) => handleEditClick(clase, e)}
										>
											Editar
										</button>
										<button
											className="button-delete"
											style={{ background: '#ffebee', color: '#d32f2f', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
											onClick={(e) => { e.stopPropagation(); handleDeleteClass(clase.id); }}
										>
											Eliminar
										</button>
									</div>
								)}
							</div>
						))}

						{myClasses.length === 0 && (
							<div className="empty-state">
								<div className="empty-icon-container">
									<FaFolderOpen size={48} color="#cbd5e0" />
								</div>
								<h3>¡Todo listo para empezar!</h3>
								<p>
									{user.rol === 'ESTUDIANTE'
										? "Aún no te has inscrito en ninguna clase. Ingresa un código arriba para empezar."
										: "Aún no has creado ninguna clase. ¡Crea la primera ahora!"}
								</p>
							</div>
						)}
					</div>
				</main>
			</div>

			{/* El Modal sirve para Crear y Editar */}
			{showCreateModal && (
				<CrearClaseModal
					onClose={() => setShowCreateModal(false)}
					onClassSaved={() => fetchMyClasses(user)}
					teacherId={user.id}
					courseToEdit={classToEdit} // Pasamos la clase si es edición
				/>
			)}
		</>
	);
}

export default MisClases;
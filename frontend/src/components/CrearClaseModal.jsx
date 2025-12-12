// src/components/CrearClaseModal.jsx
import React, { useState, useEffect } from 'react';
import './CrearClaseModal.css';
import apiClient from '../services/api';
import Swal from 'sweetalert2'; // <-- 1. FALTABA IMPORTAR ESTO

function CrearClaseModal({ onClose, onClassSaved, teacherId, courseToEdit }) {

	const [nombre, setNombre] = useState('');
	const [periodo, setPeriodo] = useState('2025-1 (Marzo - Julio)'); // Ajusté el default
	const [descripcion, setDescripcion] = useState('');
	const [maxEstudiantes, setMaxEstudiantes] = useState(30);
	const [codigo, setCodigo] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	// Si estamos editando, cargamos los datos al abrir
	useEffect(() => {
		if (courseToEdit) {
			setNombre(courseToEdit.name);
			setPeriodo(courseToEdit.periodoAcademico || '2025-1 (Marzo - Julio)');
			setDescripcion(courseToEdit.descripcion || '');
			setMaxEstudiantes(courseToEdit.maxEstudiantes || 30);
			setCodigo(courseToEdit.codigoClase);
		}
	}, [courseToEdit]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!nombre.trim()) {
			Swal.fire('Atención', 'El nombre de la clase es obligatorio.', 'warning');
			return;
		}

		setIsLoading(true);

		// Definimos la variable como 'courseData'
		const courseData = {
			name: nombre,
			periodoAcademico: periodo,
			descripcion: descripcion,
			maxEstudiantes: maxEstudiantes ? parseInt(maxEstudiantes) : null,
			teacherId: teacherId,
			codigoClase: codigo
		};

		try {
			if (courseToEdit) {
				// 2. Usamos 'courseData' en lugar de 'newCourseData'
				await apiClient.put(`/api/courses/${courseToEdit.id}`, courseData);
				Swal.fire('¡Actualizado!', 'La clase se actualizó correctamente.', 'success');
			} else {
				// 2. Usamos 'courseData' en lugar de 'newCourseData'
				await apiClient.post('/api/courses', courseData);
				Swal.fire('¡Creado!', 'Clase creada con éxito.', 'success');
			}
			onClassSaved();
			onClose();

		} catch (error) {
			console.error('Error completo:', error);
			const errorMessage = error.response?.data || error.message || 'No se pudo guardar la clase.';

			console.log('Mensaje: ', errorMessage);
			Swal.fire('Error', errorMessage, 'error');
		}

		finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div className="modal-content" onClick={(e) => e.stopPropagation()}>
				<h2>{courseToEdit ? 'Editar Clase' : 'Crear Nueva Clase'}</h2>
				<form onSubmit={handleSubmit}>
					<label>Nombre de la Clase*</label>
					<input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />

					<label>Código de Clase</label>
					<input type="text" value={codigo} onChange={(e) => setCodigo(e.target.value)} disabled={!!courseToEdit} placeholder="No puede estar vacío" />

					<label>Periodo Académico</label>
					<select value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
						<option>2025-1 (Marzo - Julio)</option>
						<option>2025-2 (Agosto - Diciembre)</option>
					</select>

					<label>Descripción</label>
					<textarea rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />

					<label>Máx. Estudiantes</label>
					<input type="number" value={maxEstudiantes} onChange={(e) => setMaxEstudiantes(e.target.value)} />

					<div className="modal-actions">
						<button type="button" className="button-secondary" onClick={onClose}>Cancelar</button>
						<button type="submit" className="button-primary" disabled={isLoading}>
							{isLoading ? 'Guardando...' : 'Guardar'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

export default CrearClaseModal;
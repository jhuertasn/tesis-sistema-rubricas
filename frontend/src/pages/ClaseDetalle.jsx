// src/pages/ClaseDetalle.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import Sidebar from '../components/Sidebar.jsx';
import './MisClases.css';
import Loader from '../components/Loader.jsx';
import Swal from 'sweetalert2'; // <-- 1. FALTABA IMPORTAR ESTO


function ClaseDetalle() {
  const navigate = useNavigate();
  const { id } = useParams(); 
  
  const [user, setUser] = useState(null);
  const [clase, setClase] = useState(null);
  const [rubricas, setRubricas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const userRes = await apiClient.get('/api/users/me');
      setUser(userRes.data);

      const claseRes = await apiClient.get(`/api/courses/${id}`);
      setClase(claseRes.data);
      
      const rubricsRes = await apiClient.get(`/api/courses/${id}/rubrics`);
      setRubricas(rubricsRes.data);
      
    } catch (error) {
      console.error("Error al cargar datos:", error);
      navigate('/clases');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUploadRubric = async () => {
    if (!selectedFile) {
      alert('Por favor, selecciona un archivo Excel.');
      return;
    }
    if (!selectedFile.name.endsWith('.xlsx')) {
        alert('El archivo debe ser de tipo .xlsx');
        return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await apiClient.post(`/api/courses/${id}/rubrics`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Swal.fire('¡Éxito!', 'Cuestionario subido correctamente.', 'success');
      setSelectedFile(null);
      loadData(); 
    } catch (error) {
      Swal.fire('Error', 'No se pudo subir el archivo.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // --- FUNCIÓN FALTANTE 1: Navegación del Docente ---
  const handleVerResultados = (rubricId) => {
    navigate(`/reportes/${rubricId}`);
  };

// --- NUEVA FUNCIÓN: Eliminar Rúbrica ---
const handleDeleteRubric = async (rubricId) => {
  const result = await Swal.fire({
    title: '¿Eliminar cuestionario?',
    text: "Los estudiantes ya no podrán verlo.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Sí, eliminar'
  });

  if (result.isConfirmed) {
    try {
      await apiClient.delete(`/api/courses/rubrics/${rubricId}`);
      Swal.fire('Eliminado', 'El cuestionario ha sido eliminado.', 'success');
      loadData();
    } catch (error) {
      Swal.fire('Error', 'No se pudo eliminar.', 'error');
    }
  }
};

  // --- FUNCIÓN FALTANTE 2: Navegación del Estudiante ---
  const handleStartEvaluation = (rubrica) => {
    // Verificamos el tipo para saber a qué pantalla ir
    if (rubrica.type === 'COEVAL') {
        navigate(`/coevaluacion/${rubrica.id}`);
    } else {
        navigate(`/evaluacion/${rubrica.id}`);
    }
  };

if (loading) { 
  return <Loader />; 
}

if (!user || !clase) { return null; }

  return (
    <div className="dashboard-container">
      <Sidebar user={user} activePage="clases" />

      <main className="main-content">
        <div className="main-header">
          <h2>{clase.name}</h2>
          <span style={{color: '#666'}}>Código: {clase.codigoClase}</span>
        </div>
        <p>{clase.descripcion || "Este curso no tiene descripción."}</p>
        <hr style={{border: 'none', borderTop: '1px solid #eee', margin: '2rem 0'}} />
        
        {/* VISTA DOCENTE */}
        {(user.rol === 'DOCENTE' || user.rol === 'ADMINISTRADOR') && (
          <>
            <div className="rubrica-uploader class-card" style={{backgroundColor: '#fafafa', marginBottom: '2rem'}}>
              <h3>Subir Cuestionario (Excel)</h3>
              <p>Sube el archivo Excel (.xlsx) con el formato de preguntas.</p>
              <div className="upload-actions" style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                <input type="file" accept=".xlsx" onChange={handleFileChange} />
                <button className="button-primary" onClick={handleUploadRubric} disabled={isUploading}>
                  {isUploading ? 'Subiendo...' : 'Subir Archivo'}
                </button>
              </div>
            </div>

<h3>Cuestionarios Publicados</h3>
            <div className="evaluaciones-lista">
              {rubricas.length === 0 ? <p>No has subido cuestionarios.</p> : rubricas.map(rubrica => (
                <div className="class-card" key={rubrica.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div>
                    <h4>Cuestionario #{rubrica.id}</h4>
                    <span>(Tipo: {rubrica.type === 'COEVAL' ? 'Coevaluación' : 'Examen'})</span>
                  </div>
                  
                  <div style={{display: 'flex', gap: '10px'}}>
                    {/* Botón Ver Resultados (Existente) */}
                    <button 
                      className="button-secondary" 
                      style={{background: '#667eea', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '600'}}
                        onClick={() => handleVerResultados(rubrica.id)}
                        >
                      Ver Resultados 📊
                    </button>

                    {/* --- NUEVO BOTÓN ELIMINAR --- */}
                    <button 
                        className="button-delete" // Usamos el estilo rojo que creamos para clases
                        style={{background: '#ffebee', color: '#d32f2f', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '600'}}
                        onClick={() => handleDeleteRubric(rubrica.id)}
                    >
                        Eliminar
                    </button>
                  </div>

                </div>
              ))}
            </div>
          </>
        )}
        
        {/* VISTA ESTUDIANTE */}
        {user.rol === 'ESTUDIANTE' && (
          <div className="evaluaciones-lista">
            <h3>Evaluaciones Disponibles</h3>
            {rubricas.length === 0 ? (
              <p>Aún no hay evaluaciones disponibles.</p>
            ) : (
              rubricas.map(rubrica => (
                <div className="class-card" key={rubrica.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div>
                    <h4>{rubrica.type === 'COEVAL' ? 'Ficha de Coevaluación' : 'Cuestionario'} #{rubrica.id}</h4>
                  </div>
                  <button 
                    className="button-primary" 
                    // AQUÍ ESTABA EL ERROR: Pasamos el OBJETO entero 'rubrica', no solo el ID
                    onClick={() => handleStartEvaluation(rubrica)} 
                  >
                    Iniciar Evaluación
                  </button>
                </div>
              ))
            )}
          </div>
        )}
        
      </main>
    </div>
  );
}

export default ClaseDetalle;
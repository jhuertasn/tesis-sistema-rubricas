// src/pages/ClaseDetalle.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import Sidebar from '../components/Sidebar.jsx';
import './MisClases.css';
import Loader from '../components/Loader.jsx';
import Swal from 'sweetalert2'; 

function ClaseDetalle() {
  const navigate = useNavigate();
  const { id } = useParams(); 
  
  const [user, setUser] = useState(null);
  const [clase, setClase] = useState(null);
  const [rubricas, setRubricas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el conteo de estudiantes (Opcional, si quieres mostrar cuántos van)
  const [studentCount, setStudentCount] = useState(0); 

  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      // 1. CORRECCIÓN DEL ERROR 400: Usamos localStorage + ID
      const localUser = JSON.parse(localStorage.getItem('user'));
      if (!localUser || !localUser.id) {
          navigate('/');
          return;
      }

      // Pedimos usuario real
      const userRes = await apiClient.get(`/api/users/${localUser.id}`);
      setUser(userRes.data);

      // 2. Pedimos la clase
      const claseRes = await apiClient.get(`/api/courses/${id}`);
      setClase(claseRes.data);
      
      // 3. Pedimos las rúbricas
      const rubricsRes = await apiClient.get(`/api/courses/${id}/rubrics`);
      setRubricas(rubricsRes.data);

      // (Opcional) Podríamos pedir aquí la lista de inscritos para validar el cupo
      // const enrolledRes = await apiClient.get(...) 
      
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

  const handleVerResultados = (rubricId) => {
    navigate(`/reportes/${rubricId}`);
  };

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

  const handleStartEvaluation = (rubrica) => {
    if (rubrica.type === 'COEVAL') {
        navigate(`/coevaluacion/${rubrica.id}`);
    } else {
        navigate(`/evaluacion/${rubrica.id}`);
    }
  };

  if (loading) return <Loader />;
  if (!user || !clase) return null;

  return (
    <div className="dashboard-container">
      <Sidebar user={user} activePage="clases" />

      <main className="main-content">
        <div className="main-header">
          <div>
            <h2>{clase.name}</h2>
            <div style={{display:'flex', gap:'15px', color: '#666', marginTop:'5px'}}>
                <span>Código: <strong>{clase.codigoClase}</strong></span>
                {/* AQUI MOSTRAMOS EL LÍMITE DE ESTUDIANTES */}
                <span className="badge info">
                    Cupos: {clase.maxEstudiantes || 'Ilimitado'}
                </span>
            </div>
          </div>
        </div>

        <p style={{fontSize:'1.1rem', color:'#444'}}>{clase.descripcion || "Sin descripción."}</p>
        
        <hr style={{border: 'none', borderTop: '1px solid #eee', margin: '2rem 0'}} />
        
        {/* VISTA DOCENTE */}
        {(user.rol === 'DOCENTE' || user.rol === 'ADMINISTRADOR') && (
          <>
            <div className="rubrica-uploader class-card" style={{backgroundColor: '#fafafa', marginBottom: '2rem'}}>
              <h3>Subir Cuestionario (Excel) </h3>
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
                    <button 
                      className="button-secondary" 
                      style={{background: '#667eea', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '600'}}
                        onClick={() => handleVerResultados(rubrica.id)}
                        >
                      Ver Resultados 📊
                    </button>

                    <button 
                        className="button-delete" 
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
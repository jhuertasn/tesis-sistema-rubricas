// src/pages/Reportes.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import Sidebar from '../components/Sidebar.jsx';
import * as XLSX from 'xlsx';
import './MisClases.css';
import Loader from '../components/Loader.jsx';
import Swal from 'sweetalert2'; // <-- 1. FALTABA IMPORTAR ESTO


const styles = {
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '2rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0, 0.05)' },
  th: { textAlign: 'left', padding: '1rem', borderBottom: '2px solid #f0f0f0', backgroundColor: '#f9f9f9' },
  td: { textAlign: 'left', padding: '1rem', borderBottom: '1px solid #ddd' },
  scoreBad: { color: '#d9534f', fontWeight: 'bold' },
  scoreGood: { color: '#00C49A', fontWeight: 'bold' }
};

function Reportes() {
  const navigate = useNavigate();
  const { rubricId } = useParams(); 
  
  const [user, setUser] = useState(null);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

useEffect(() => {
    const loadData = async () => {
      try {
        // --- 1. CORRECCIÓN: USAR ID LOCALSTORAGE ---
        const localUser = JSON.parse(localStorage.getItem('user'));
        
        if (!localUser || !localUser.id) {
            navigate('/');
            return;
        }

        // Pedimos datos frescos del usuario por ID
        const userRes = await apiClient.get(`/api/users/${localUser.id}`);
        setUser(userRes.data);

        // Seguridad: Si es estudiante, lo sacamos
        if (userRes.data.rol === 'ESTUDIANTE') {
          navigate('/clases');
          return;
        }
        // ------------------------------------------

        // 2. Cargar evaluaciones de la rúbrica
        const evalRes = await apiClient.get(`/api/evaluations/rubric/${rubricId}`);
        setEvaluaciones(evalRes.data);
        
      } catch (error) {
        console.error("Error al cargar datos:", error);
        navigate('/clases');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [navigate, rubricId]);

  const handleExport = () => {
    if (evaluaciones.length === 0) {
      Swal.fire('Error', 'No hay datos para exportar.', 'error');
      return;
    }

    setIsExporting(true);

    try {
      let datosExcel = [];

      evaluaciones.forEach(ev => {
        let parsedResults = {};
        try {
            if (typeof ev.results === 'string') {
                parsedResults = JSON.parse(ev.results);
            } else {
                parsedResults = ev.results || {};
            }
        } catch (e) {
            console.warn("JSON inválido:", ev.id);
        }

        // Validamos la nota para evitar errores
        const notaSegura = typeof ev.score === 'number' ? ev.score : 0;

        if (parsedResults.members && Array.isArray(parsedResults.members)) {
            // COEVALUACIÓN
            parsedResults.members.forEach(member => {
                datosExcel.push({
                    "Tipo": "Coevaluación Grupal",
                    "Grupo": parsedResults.groupName || "Sin Nombre",
                    "Evaluador (Líder)": ev.studentName,
                    "Integrante Evaluado": member.name,
                    "Puntaje Asignado": member.total,
                    "Estado": "Completado"
                });
            });
        } else {
            // EXAMEN INDIVIDUAL
            datosExcel.push({
                "Tipo": "Examen Individual",
                "Grupo": "-",
                "Evaluador (Líder)": "-", 
                "Estudiante": ev.studentName,
                "Email": ev.studentEmail,
                "Nota Final": notaSegura.toFixed(2),
                "Estado": notaSegura >= 60 ? "Aprobado" : "Desaprobado"
            });
        }
      });

      const ws = XLSX.utils.json_to_sheet(datosExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Reporte");
      
      XLSX.writeFile(wb, `Reporte_Rubrica_${rubricId}.xlsx`);
      
    } catch (error) {
      console.error("Error exportando:", error);
      Swal.fire('Error', 'Error al generar el Excel.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

     if (loading) {
        return <Loader />;
    }
  if (!user) return null;

  return (
    <div className="dashboard-container">
      <Sidebar user={user} activePage="reportes" />

      <main className="main-content">
        <div className="main-header">
          <h2>Reporte de Notas (ID: {rubricId})</h2>
          <button 
            className="button-primary" 
            style={{backgroundColor: '#107C41'}} 
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? "Generando..." : "Descargar Excel 📥"}
          </button>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Estudiante / Evaluador</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Nota Final</th>
              <th style={styles.th}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {evaluaciones.map((ev, index) => {
               // Validación de seguridad para la nota
               const nota = typeof ev.score === 'number' ? ev.score : null;
               const notaTexto = nota !== null ? nota.toFixed(2) : "N/A";
               const esAprobado = nota !== null && nota >= 60;

               return (
                  <tr key={index}>
                    <td style={styles.td}>{ev.studentName}</td>
                    <td style={styles.td}>{ev.studentEmail}</td>
                    <td style={styles.td}>
                      <span style={esAprobado || nota === 100.0 ? styles.scoreGood : styles.scoreBad}>
                        {notaTexto}
                      </span>
                    </td>
                    <td style={styles.td}>
                        {/* Si es 100 exacto puede ser coevaluación o examen perfecto */}
                        {nota === 100.0 ? "Completado/Aprobado" : (esAprobado ? "Aprobado" : "Desaprobado")}
                    </td>
                  </tr>
               );
            })}
          </tbody>
        </table>
        
        {evaluaciones.length === 0 && (
          <p style={{marginTop: '2rem', textAlign:'center', color:'#888'}}>Aún no hay envíos.</p>
        )}
      </main>
    </div>
  );
}

export default Reportes;
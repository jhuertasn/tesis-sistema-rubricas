import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import Sidebar from '../components/Sidebar.jsx';
import './MisClases.css';
import Loader from '../components/Loader.jsx';
import Swal from 'sweetalert2';

const deleteBtnStyle = {
  background: '#ffcccc', color: '#cc0000', border: 'none', 
  borderRadius: '50%', width: '24px', height: '24px', 
  cursor: 'pointer', fontWeight: 'bold', display: 'flex', 
  alignItems: 'center', justifyContent: 'center'
};

function CoevaluacionForm() {
  const { rubricId } = useParams();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [courseName, setCourseName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [criteria, setCriteria] = useState([]); 
  
  const [members, setMembers] = useState([
    { id: Date.now(), name: '', scores: {} } 
  ]);
  
  const [loading, setLoading] = useState(true);

// --- CARGA DE DATOS CORREGIDA ---
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. CORRECCIÓN: USAR ID LOCALSTORAGE
        const localUser = JSON.parse(localStorage.getItem('user'));
        if (!localUser || !localUser.id) { navigate('/'); return; }

        const userRes = await apiClient.get(`/api/users/${localUser.id}`);
        setUser(userRes.data);

        // 2. Obtener Rúbrica
        const rubricRes = await apiClient.get(`/api/courses/rubrics/${rubricId}`);
        const data = JSON.parse(rubricRes.data.content);
        
        // Normalizamos los datos (por si el Excel varía)
        const normalizedCriteria = Array.isArray(data) ? data.map(item => ({
            label: item.Criterio || item.criterio || item.Pregunta || "Criterio",
            max: parseInt(item.PuntajeMaximo || item.puntaje || item.max || 20)
        })) : [];

        setCriteria(normalizedCriteria);

        // 3. Obtener Curso
        const courseRes = await apiClient.get(`/api/courses/${rubricRes.data.courseId}`);
        setCourseName(courseRes.data.name);

      } catch (error) {
        console.error("Error cargando coevaluación:", error);
        Swal.fire('Error', 'No se pudo cargar la ficha.', 'error');
        navigate('/clases');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [rubricId, navigate]);

  // --- LÓGICA DE SUMA ---
  const calculateTotal = (scores) => {
    return Object.values(scores).reduce((sum, val) => {
      const numero = parseFloat(val) || 0; 
      return sum + numero;
    }, 0);
  };

  const updateMemberScore = (memberId, criterionLabel, value) => {
    setMembers(prevMembers => prevMembers.map(m => {
      if (m.id === memberId) {
        const newScores = { ...m.scores, [criterionLabel]: value };
        return { ...m, scores: newScores };
      }
      return m;
    }));
  };

  const handleScoreChange = (memberId, criterionLabel, val, max) => {
    if (val === '') {
        updateMemberScore(memberId, criterionLabel, '');
        return;
    }
    let numVal = parseFloat(val);
    if (isNaN(numVal)) return; 
    if (numVal < 0) numVal = 0;
    if (numVal > max) numVal = max; 

    updateMemberScore(memberId, criterionLabel, numVal);
  };

  const addMember = () => {
    const newId = Date.now() + Math.random();
    setMembers([...members, { id: newId, name: '', scores: {} }]);
  };

  const removeMember = (idToRemove) => {
    setMembers(members.filter(m => m.id !== idToRemove));
  };

  const handleNameChange = (id, newName) => {
    setMembers(members.map(m => 
      m.id === id ? { ...m, name: newName } : m
    ));
  };

  const handleSubmit = async () => {
    if (!groupName.trim()) return Swal.fire('Alerta','Falta el nombre del grupo','warning');
    
    // Validar que haya al menos un miembro con nombre
    if (members.some(m => !m.name.trim())) {
        return Swal.fire('Alerta', 'Todos los integrantes deben tener nombre.', 'warning');
    }

    const payload = {
      rubricId: rubricId,
      evaluatorId: user.id,
      evaluatedId: user.id, // En coevaluación, el evaluado es el grupo (representado por el líder)
      results: JSON.stringify({ 
          groupName, 
          members: members.map(m => ({
            name: m.name,
            scores: m.scores,
            total: calculateTotal(m.scores)
          }))
      })
    };

    try {
      await apiClient.post('/api/evaluations', payload);
      Swal.fire ('¡Enviado!','¡Coevaluación enviada con éxito!', 'success');
      navigate('/clases');
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'No se pudo enviar la evaluación.','error');
    }
  };

  if (loading) return <Loader />;
  if (!user) return null;
  
  return (
    <div className="dashboard-container">
      <Sidebar activePage="clases" /> {/* Sidebar ya lee el user del storage, no hace falta pasarlo */}
      
      <main className="main-content">
        
        <div className="class-card" style={{marginBottom: '1.5rem', borderLeft: '5px solid #5D5FEF'}}>
            <h2 style={{marginTop:0}}>Ficha de Coevaluación</h2>
            <p><strong>Curso:</strong> {courseName}</p>
            <div style={{display:'flex', alignItems:'center', gap:'10px', marginTop:'10px'}}>
                <label><strong>Nombre del Grupo:</strong></label>
                <input 
                    type="text" 
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    placeholder="Ej. Grupo 1"
                    style={{padding:'8px', borderRadius:'4px', border:'1px solid #ccc', width:'250px'}}
                />
            </div>
        </div>

        <div style={{background:'white', padding:'1.5rem', borderRadius:'12px', boxShadow:'0 4px 6px rgba(0,0,0,0.05)', overflowX:'auto'}}>
            <table style={{width:'100%', borderCollapse:'collapse'}}>
                <thead>
                    <tr style={{background:'#f8f9fa', borderBottom:'2px solid #e0e0e0'}}>
                        <th style={{padding:'15px', textAlign:'left', minWidth:'200px', color:'#444'}}>Integrantes</th>
                        
                        {/* ITERAMOS SOBRE LOS CRITERIOS NORMALIZADOS */}
                        {criteria.map((c, i) => (
                            <th key={i} style={{padding:'10px', textAlign:'center', minWidth:'100px'}}>
                                <div style={{fontSize:'0.9rem', fontWeight:'700', marginBottom:'4px'}}>{c.label}</div>
                                <span className="badge info" style={{fontSize:'0.75rem'}}>Max: {c.max}</span>
                            </th>
                        ))}
                        
                        <th style={{padding:'10px', textAlign:'center', background:'#f0f0ff', color:'#5D5FEF'}}>Total</th>
                        <th style={{width:'50px'}}></th>
                    </tr>
                </thead>
                <tbody>
                    {members.map((m) => (
                        <tr key={m.id} style={{borderBottom:'1px solid #f0f0f0'}}>
                            <td style={{padding:'15px'}}>
                                <input 
                                    type="text" 
                                    value={m.name}
                                    onChange={(e) => handleNameChange(m.id, e.target.value)}
                                    placeholder="Nombre del compañero"
                                    style={{width:'100%', padding:'8px', border:'1px solid #ddd', borderRadius:'6px'}}
                                />
                            </td>

                            {criteria.map((c, i) => (
                                <td key={i} style={{padding:'10px', textAlign:'center'}}>
                                    <input 
                                        type="number" 
                                        min="0" 
                                        max={c.max}
                                        value={m.scores[c.label] !== undefined ? m.scores[c.label] : ''}
                                        onChange={(e) => handleScoreChange(m.id, c.label, e.target.value, c.max)}
                                        style={{width:'60px', textAlign:'center', padding:'8px', borderRadius:'6px', border:'1px solid #ddd'}}
                                    />
                                </td>
                            ))}

                            <td style={{padding:'10px', textAlign:'center', fontWeight:'bold', color:'#5D5FEF', fontSize:'1.1rem', background:'#fbfbff'}}>
                                {calculateTotal(m.scores)}
                            </td>

                            <td style={{padding:'10px', textAlign:'center'}}>
                                {members.length > 1 && (
                                    <button onClick={() => removeMember(m.id)} style={deleteBtnStyle} title="Eliminar Fila">
                                        ×
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <button 
                onClick={addMember} 
                className="button-secondary" 
                style={{marginTop:'1.5rem', width:'100%', border:'2px dashed #b0b0ff', color:'#5D5FEF', fontWeight:'bold'}}
            >
                + Agregar otro integrante
            </button>
        </div>

        <div style={{marginTop:'2rem', textAlign:'right'}}>
            <button className="button-primary" onClick={handleSubmit} style={{padding:'12px 24px', fontSize:'1rem'}}>
                💾 Guardar y Enviar Coevaluación
            </button>
        </div>

      </main>
    </div>
  );
}

export default CoevaluacionForm;
// src/pages/CoevaluacionForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import Sidebar from '../components/Sidebar.jsx';
import './MisClases.css';
import Loader from '../components/Loader.jsx';
import Swal from 'sweetalert2'; // <-- 1. FALTABA IMPORTAR ESTO


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

  useEffect(() => {
    const loadData = async () => {
      try {
        const userRes = await apiClient.get('/api/users/me');
        setUser(userRes.data);

        const rubricRes = await apiClient.get(`/api/courses/rubrics/${rubricId}`);
        const data = JSON.parse(rubricRes.data.content);
        setCriteria(Array.isArray(data) ? data : []);

        const courseRes = await apiClient.get(`/api/courses/${rubricRes.data.courseId}`);
        setCourseName(courseRes.data.name);

      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [rubricId]);

  // --- LÓGICA DE SUMA CORREGIDA ---

  const calculateTotal = (scores) => {
    return Object.values(scores).reduce((sum, val) => {
      const numero = parseFloat(val) || 0; 
      return sum + numero;
    }, 0);
  };

  const updateMemberScore = (memberId, criterionName, value) => {
    setMembers(prevMembers => prevMembers.map(m => {
      if (m.id === memberId) {
        const newScores = { ...m.scores, [criterionName]: value };
        return { ...m, scores: newScores };
      }
      return m;
    }));
  };

  const handleScoreChange = (memberId, criterionName, val, max) => {
    // Si está vacío (usuario borrando), permitimos que quede vacío visualmente
    if (val === '') {
        updateMemberScore(memberId, criterionName, '');
        return;
    }

    let numVal = parseFloat(val);

    // Validaciones estrictas
    if (isNaN(numVal)) return; 
    if (numVal < 0) numVal = 0;
    if (numVal > max) numVal = max; // Tope máximo

    updateMemberScore(memberId, criterionName, numVal);
  };
  // --------------------------------

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
    
    const payload = {
      rubricId: rubricId,
      evaluatorId: user.id,
      evaluatedId: user.id, 
      results: JSON.stringify({ 
          groupName, 
          members: members.map(m => ({
            name: m.name,
            scores: m.scores,
            total: calculateTotal(m.scores) // Guardamos el total calculado
          }))
      })
    };

    try {
      await apiClient.post('/api/evaluations', payload);
      Swal.fire ('¡Enviado!','¡Coevaluación enviada con éxito!', 'success');
      navigate('/clases');
    } catch (e) {
      Swal.fire('Error', 'No se pudo enviar.','error');
    }
  };

if (loading) { 
  return <Loader />; 
}
  return (
    <div className="dashboard-container">
      <Sidebar user={user} activePage="evaluaciones" />
      <main className="main-content">
        
        <div className="class-card" style={{marginBottom: '1.5rem', borderLeft: '5px solid #5D5FEF'}}>
            <h2 style={{marginTop:0}}>Ficha de Coevaluación</h2>
            <p><strong>Curso:</strong> {courseName}</p>
            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <label><strong>Nombre del Grupo:</strong></label>
                <input 
                    type="text" 
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    placeholder="Ej. Grupo 1"
                    style={{padding:'5px', borderRadius:'4px', border:'1px solid #ccc'}}
                />
            </div>
        </div>

        <div style={{background:'white', padding:'1rem', borderRadius:'8px', overflowX:'auto'}}>
            <table style={{width:'100%', borderCollapse:'collapse'}}>
                <thead>
                    <tr style={{background:'#f4f4f4', borderBottom:'2px solid #ddd'}}>
                        <th style={{padding:'10px', textAlign:'left', minWidth:'150px'}}>Integrantes</th>
                        {criteria.map((c, i) => (
                            <th key={i} style={{padding:'10px', textAlign:'center', fontSize:'0.9rem', verticalAlign:'top'}}>
                                <strong>{c.Criterio}</strong> <br/>
                                <span style={{color:'#666', fontSize:'0.8rem', background:'#eee', padding:'2px 5px', borderRadius:'4px'}}>
                                    (0 - {c.PuntajeMaximo})
                                </span>
                            </th>
                        ))}
                        <th style={{padding:'10px', textAlign:'center', background:'#eef'}}>Total</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {members.map((m) => (
                        <tr key={m.id} style={{borderBottom:'1px solid #eee'}}>
                            <td style={{padding:'10px'}}>
                                <input 
                                    type="text" 
                                    value={m.name}
                                    onChange={(e) => handleNameChange(m.id, e.target.value)}
                                    placeholder="Nombre y Apellido"
                                    style={{width:'100%', padding:'5px', border:'1px solid #ddd', borderRadius:'4px'}}
                                />
                            </td>

                            {criteria.map((c, i) => (
                                <td key={i} style={{padding:'10px', textAlign:'center'}}>
                                    <input 
                                        type="number" 
                                        min="0" 
                                        max={c.PuntajeMaximo}
                                        // USAMOS LA CLAVE CORRECTA AQUÍ:
                                        value={m.scores[c.Criterio] !== undefined ? m.scores[c.Criterio] : ''}
                                        onChange={(e) => handleScoreChange(m.id, c.Criterio, e.target.value, c.PuntajeMaximo)}
                                        style={{width:'60px', textAlign:'center', padding:'5px'}}
                                    />
                                </td>
                            ))}

                            <td style={{padding:'10px', textAlign:'center', fontWeight:'bold', color:'#5D5FEF', fontSize:'1.1rem'}}>
                                {calculateTotal(m.scores)}
                            </td>

                            <td style={{padding:'10px', textAlign:'center'}}>
                                {members.length > 1 && (
                                    <button onClick={() => removeMember(m.id)} style={deleteBtnStyle} title="Eliminar">
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
                style={{marginTop:'1rem', width:'100%', border:'2px dashed #ccc', color:'#5D5FEF'}}
            >
                + Agregar Integrante al Grupo
            </button>
        </div>

        <div style={{marginTop:'2rem', textAlign:'right'}}>
            <button className="button-primary" onClick={handleSubmit}>
                Guardar y Enviar
            </button>
        </div>

      </main>
    </div>
  );
}

export default CoevaluacionForm;
// src/pages/Resultados.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import Sidebar from '../components/Sidebar.jsx';
import './MisClases.css';
import { FaTrophy, FaClipboardCheck, FaChartLine } from 'react-icons/fa';
import Loader from '../components/Loader.jsx';

const styles = {
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '2rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0, 0.05)' },
    th: { textAlign: 'left', padding: '1rem', borderBottom: '2px solid #f0f0f0', backgroundColor: '#f9f9f9' },
    td: { textAlign: 'left', padding: '1rem', borderBottom: '1px solid #ddd' },
    scoreBad: { color: '#d9534f', fontWeight: 'bold' },
    scoreGood: { color: '#00C49A', fontWeight: 'bold' },
    scoreNeutral: { color: '#5D5FEF', fontWeight: 'bold' } // Nuevo estilo para coevaluación
};

function Resultados() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [evaluaciones, setEvaluaciones] = useState([]);
    const [loading, setLoading] = useState(true);

    const [promedio, setPromedio] = useState(0);
    const [aprobadas, setAprobadas] = useState(0);
    const [totalExamenes, setTotalExamenes] = useState(0);

    useEffect(() => {
        const loadData = async () => {
            try {
                const userRes = await apiClient.get('/api/users/me');
                setUser(userRes.data);

                const evalRes = await apiClient.get(`/api/evaluations/student/${userRes.data.id}`);
                const data = evalRes.data;
                setEvaluaciones(data);

                // --- LÓGICA DE CÁLCULO CORREGIDA ---

                // 1. Filtramos: Solo nos interesan los EXÁMENES para el promedio.
                // Ignoramos las que tengan "Coevaluación" en el título.
                // --- CÁLCULO SEGURO ---
                const examenesReales = data.filter(ev =>
                    ev.rubricTitle &&
                    !ev.rubricTitle.toLowerCase().includes("coevaluación") &&
                    !ev.rubricTitle.toLowerCase().includes("coevaluacion")
                );

                setTotalExamenes(examenesReales.length);

                if (examenesReales.length > 0) {
                    const totalPuntos = examenesReales.reduce((sum, ev) => sum + (ev.score || 0), 0);
                    const prom = totalPuntos / examenesReales.length;
                    setPromedio(prom.toFixed(1));

                    const aprob = examenesReales.filter(ev => (ev.score || 0) >= 60).length;
                    setAprobadas(aprob);
                } else {
                    setPromedio("0.0");
                    setAprobadas(0);
                }
                // -----------------------------------

            } catch (error) {
                console.error("Error al cargar datos:", error);
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [navigate]);

    if (loading) {
        return <Loader />;
    }
    if (!user) return null;

    return (
        <div className="dashboard-container">
            <Sidebar user={user} activePage="resultados" />

            <main className="main-content">
                <div className="main-header">
                    <h2>Mis Notas</h2>
                </div>

                {/* --- TARJETAS DE RESUMEN (STATS) --- */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                            <FaChartLine />
                        </div>
                        <div className="stat-info">
                            <h3>{promedio}</h3>
                            {/* Aclaramos que es promedio de EXÁMENES */}
                            <span>Promedio (Exámenes)</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                            <FaTrophy />
                        </div>
                        <div className="stat-info">
                            <h3>{aprobadas} / {totalExamenes}</h3>
                            <span>Exámenes Aprobados</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#f3e8ff', color: '#9333ea' }}>
                            <FaClipboardCheck />
                        </div>
                        <div className="stat-info">
                            {/* Aquí mostramos el total de TODO (incluyendo coevaluaciones) */}
                            <h3>{evaluaciones.length}</h3>
                            <span>Actividades Totales</span>
                        </div>
                    </div>
                </div>

                {/* --- TABLA --- */}
                <div className="table-container">
                    <table className="styled-table">
                        <thead>
                            <tr>
                                <th>Curso / Actividad</th>
                                <th>Tipo</th>
                                <th>Nota / Estado</th>
                                <th>Resultado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {evaluaciones.map((ev) => {
                                const esCoevaluacion = ev.rubricTitle.toLowerCase().includes("coevaluación");
                                const nota = typeof ev.score === 'number' ? ev.score : 0;
                                const esAprobado = nota >= 13;

                                return (
                                    <tr key={ev.id}>
                                        <td>
                                            <div style={{ fontWeight: 'bold' }}>{ev.courseName}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#666' }}>{ev.rubricTitle}</div>
                                        </td>
                                        <td>
                                            {esCoevaluacion
                                                ? <span className="badge info">Grupal</span>
                                                : <span className="badge purple">Individual</span>}
                                        </td>
                                        <td style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                            {/* CAMBIO VISUAL: Si es coevaluación, mostramos "Completado" en vez de nota */}
                                            {esCoevaluacion ? (
                                                <span style={{ fontSize: '0.9rem', color: '#555' }}>Participación Registrada</span>
                                            ) : (
                                                nota.toFixed(2)
                                            )}
                                        </td>
                                        <td>
                                            {esCoevaluacion ? (
                                                <span className="badge success">Enviado</span>
                                            ) : (
                                                <span className={`badge ${esAprobado ? 'success' : 'danger'}`}>
                                                    {esAprobado ? 'Aprobado' : 'Reprobado'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {evaluaciones.length === 0 && (
                    <p style={{ textAlign: 'center', marginTop: '2rem', color: '#888' }}>
                        Aún no tienes notas registradas.
                    </p>
                )}
            </main>
        </div>
    );
}

export default Resultados;
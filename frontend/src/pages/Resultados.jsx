// src/pages/Resultados.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import Sidebar from '../components/Sidebar.jsx';
import './MisClases.css'; // Reusamos estilos de tarjetas
import { FaTrophy, FaClipboardCheck, FaChartLine } from 'react-icons/fa';
import Loader from '../components/Loader.jsx';

const styles = {
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '2rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0, 0.05)', overflow: 'hidden' },
    th: { textAlign: 'left', padding: '1rem', borderBottom: '2px solid #f0f0f0', backgroundColor: '#f9f9f9', color: '#555' },
    td: { textAlign: 'left', padding: '1rem', borderBottom: '1px solid #eee' },
    scoreBad: { color: '#d9534f', fontWeight: 'bold' },
    scoreGood: { color: '#00C49A', fontWeight: 'bold' },
    scoreNeutral: { color: '#5D5FEF', fontWeight: 'bold' } 
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
                // 1. Sincronización robusta (Igual que en MisClases)
                const localUser = JSON.parse(localStorage.getItem('user'));
                if (!localUser) { navigate('/'); return; }

                // Pedimos datos frescos del usuario
                const userRes = await apiClient.get(`/api/users/${localUser.id}`);
                setUser(userRes.data);

                // 2. Pedimos las evaluaciones
                const evalRes = await apiClient.get(`/api/evaluations/student/${localUser.id}`);
                const data = evalRes.data;
                setEvaluaciones(data);

                // --- LÓGICA DE ESTADÍSTICAS ---
                // Filtramos para que el promedio sea solo de EXÁMENES reales (no coevaluaciones)
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

                    // Consideramos aprobado nota >= 13 (Estándar académico común, ajusta si es 60)
                    const aprob = examenesReales.filter(ev => (ev.score || 0) >= 13).length;
                    setAprobadas(aprob);
                } else {
                    setPromedio("0.0");
                    setAprobadas(0);
                }

            } catch (error) {
                console.error("Error al cargar datos:", error);
                // Si falla la carga, no lo sacamos inmediatamente, solo mostramos vacío
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [navigate]);

    if (loading) return <Loader />;
    if (!user) return null;

    return (
        <div className="dashboard-container">
            <Sidebar user={user} activePage="resultados" />

            <main className="main-content">
                <div className="main-header">
                    <h2>Mis Notas y Resultados</h2>
                </div>

                {/* --- TARJETAS DE RESUMEN (STATS) --- */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                            <FaChartLine />
                        </div>
                        <div className="stat-info">
                            <h3>{promedio}</h3>
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
                            <h3>{evaluaciones.length}</h3>
                            <span>Actividades Totales</span>
                        </div>
                    </div>
                </div>

                {/* --- TABLA DE RESULTADOS --- */}
                <div className="table-container">
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Curso / Actividad</th>
                                <th style={styles.th}>Tipo</th>
                                <th style={styles.th}>Nota / Estado</th>
                                <th style={styles.th}>Resultado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {evaluaciones.map((ev) => {
                                const esCoevaluacion = ev.rubricTitle.toLowerCase().includes("coevaluación") || ev.rubricTitle.toLowerCase().includes("coevaluacion");
                                const nota = typeof ev.score === 'number' ? ev.score : 0;
                                // Ajusta aquí la nota mínima aprobatoria (ej. 13 o 60)
                                const esAprobado = nota >= 13; 

                                return (
                                    <tr key={ev.id}>
                                        <td style={styles.td}>
                                            <div style={{ fontWeight: 'bold', color: '#333' }}>{ev.courseName}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#888' }}>{ev.rubricTitle}</div>
                                        </td>
                                        <td style={styles.td}>
                                            {esCoevaluacion
                                                ? <span className="badge info">Grupal</span>
                                                : <span className="badge purple">Individual</span>}
                                        </td>
                                        <td style={styles.td}>
                                            {esCoevaluacion ? (
                                                <span style={{ fontSize: '0.9rem', color: '#555', fontStyle:'italic' }}>
                                                    Participación Registrada
                                                </span>
                                            ) : (
                                                <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                    {nota.toFixed(2)}
                                                </span>
                                            )}
                                        </td>
                                        <td style={styles.td}>
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
                    <div className="empty-state">
                        <h3>No tienes notas aún</h3>
                        <p>Cuando completes exámenes o coevaluaciones, aparecerán aquí.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Resultados;
import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import Sidebar from '../components/Sidebar.jsx';
import Loader from '../components/Loader.jsx';
import Swal from 'sweetalert2';
import './MisClases.css'; // Reusamos estilos

function Perfil() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Estados del formulario
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState(''); // Nueva contraseña
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const localUser = JSON.parse(localStorage.getItem('user'));
                if (!localUser) return;
                
                const res = await apiClient.get(`/api/users/${localUser.id}`);
                setUser(res.data);
                
                // Pre-llenamos los campos
                setNombre(res.data.nombre);
                setEmail(res.data.email);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();

        // Validación de contraseña
        if (password && password !== confirmPassword) {
            Swal.fire('Error', 'Las contraseñas nuevas no coinciden.', 'error');
            return;
        }

        try {
            const payload = {
                nombre: nombre,
                email: email,
                // Solo enviamos password si el usuario escribió algo
                ...(password && { password: password }) 
            };

            const res = await apiClient.put(`/api/users/${user.id}`, payload);
            
            // Actualizamos el localStorage con los nuevos datos (nombre/foto)
            localStorage.setItem('user', JSON.stringify(res.data));
            setUser(res.data);
            setPassword('');
            setConfirmPassword('');

            Swal.fire('¡Actualizado!', 'Tus datos han sido guardados.', 'success');

        } catch (error) {
            Swal.fire('Error', 'No se pudo actualizar el perfil.', 'error');
        }
    };

    if (loading) return <Loader />;
    if (!user) return null;

    return (
        <div className="dashboard-container">
            <Sidebar user={user} activePage="perfil" />

            <main className="main-content">
                <div className="main-header">
                    <h2>Mi Perfil</h2>
                </div>

                <div className="class-card" style={{maxWidth: '600px', margin: '0 auto'}}>
                    <div style={{textAlign:'center', marginBottom:'2rem'}}>
                        <img 
                            src={user.picture} 
                            alt="Avatar" 
                            style={{width:'100px', height:'100px', borderRadius:'50%', border:'4px solid #f0f0f8'}}
                        />
                        <h3 style={{marginTop:'10px', color:'#333'}}>{user.rol}</h3>
                    </div>

                    <form onSubmit={handleUpdate}>
                        <div style={{marginBottom:'1rem'}}>
                            <label style={{display:'block', marginBottom:'5px', fontWeight:'600'}}>Nombre Completo</label>
                            <input 
                                type="text" 
                                value={nombre} 
                                onChange={e => setNombre(e.target.value)}
                                style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #ccc'}}
                            />
                        </div>

                        <div style={{marginBottom:'1rem'}}>
                            <label style={{display:'block', marginBottom:'5px', fontWeight:'600'}}>Correo Electrónico</label>
                            <input 
                                type="email" 
                                value={email} 
                                disabled // Recomendación: No dejar cambiar el email fácilmente para no romper el login
                                style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #ccc', background:'#f9f9f9', color:'#777'}}
                            />
                            <small style={{color:'#888'}}>El correo no se puede modificar.</small>
                        </div>

                        <hr style={{border:'none', borderTop:'1px solid #eee', margin:'1.5rem 0'}} />
                        
                        <h4 style={{color:'#5D5FEF', marginTop:0}}>Cambiar Contraseña</h4>
                        <p style={{fontSize:'0.85rem', color:'#666', marginBottom:'1rem'}}>Deja esto en blanco si no quieres cambiarla.</p>

                        <div style={{marginBottom:'1rem'}}>
                            <label style={{display:'block', marginBottom:'5px', fontWeight:'600'}}>Nueva Contraseña</label>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Mínimo 3 caracteres"
                                style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #ccc'}}
                            />
                        </div>

                        <div style={{marginBottom:'2rem'}}>
                            <label style={{display:'block', marginBottom:'5px', fontWeight:'600'}}>Confirmar Nueva Contraseña</label>
                            <input 
                                type="password" 
                                value={confirmPassword} 
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Repite la nueva contraseña"
                                style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #ccc'}}
                            />
                        </div>

                        <button type="submit" className="button-primary" style={{width:'100%', padding:'12px'}}>
                            Guardar Cambios
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}

export default Perfil;
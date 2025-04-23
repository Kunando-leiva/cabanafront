import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';

export default function Cabanas() {
  const [cabanas, setCabanas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null); // Para saber cuál se está eliminando
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    const fetchCabanas = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get('${import.meta.env.VITE_API_URL}/api/cabanas', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setCabanas(response.data);
      } catch (error) {
        console.error('Error fetching cabanas:', error);
        setError('No se pudieron cargar las cabañas. Verifica la conexión con el servidor.');
      } finally {
        setLoading(false);
      }
    };

    fetchCabanas();
  }, [token]);

  const eliminarCabana = async (id) => {
    const confirmacion = window.confirm('¿Estás seguro de que deseas eliminar esta cabaña?');
    if (!confirmacion) return;
  
    setDeletingId(id);
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/cabanas/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      setCabanas(cabanas.filter(c => c._id !== id));
      alert('Cabaña eliminada correctamente.');
    } catch (error) {
      console.error('Error al eliminar cabaña:', error);
      alert('No se pudo eliminar la cabaña.');
    } finally {
      setDeletingId(null);
    }
  };
  

  return (
    <AdminLayout>
      <div className="container-fluid mt-4">
        <div className="card shadow">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h2 className="mb-0">Administrar Cabañas</h2>
            <button
              onClick={() => navigate('/admin/cabanas/crear')}
              className="btn btn-success"
            >
              <i className="fas fa-plus me-2"></i>
              Crear Nueva Cabaña
            </button>
          </div>

          <div className="card-body">
            {error ? (
              <div className="alert alert-danger">{error}</div>
            ) : loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="mt-2">Cargando lista de cabañas...</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Imagen</th>
                      <th>Nombre</th>
                      <th>Capacidad</th>
                      <th>Precio</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cabanas.map((cabana) => (
                      <tr key={cabana._id}>
                        <td>
  {cabana.imagenes?.length > 0 ? (
    <img 
      src={
        cabana.imagenes[0].startsWith('http') 
          ? cabana.imagenes[0] 
          : `${import.meta.env.VITE_API_URL}/uploads/${cabana.imagenes[0]}`
      }
      alt={`Cabaña ${cabana.nombre}`}
      className="img-thumbnail"
      style={{ 
        width: '100px', 
        height: '70px', 
        objectFit: 'cover',
        backgroundColor: '#f8f9fa' // Fondo por si la imagen no carga
      }}
      onError={(e) => {
        e.target.onerror = null; 
        e.target.src = '/placeholder-cabana.jpg';
      }}
    />
  ) : (
    <div className="text-muted">Sin imagen</div>
  )}
</td>
                        <td className="align-middle">{cabana.nombre}</td>
                        <td className="align-middle">{cabana.capacidad} personas</td>
                        <td className="align-middle">${cabana.precio} por noche</td>
                        <td className="align-middle">
                          <Link
                            to={`/admin/cabanas/editar/${cabana._id}`}
                            className="btn btn-sm btn-primary me-2"
                          >
                            <i className="fas fa-edit me-1"></i>
                            Editar
                          </Link>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => eliminarCabana(cabana._id)}
                            disabled={deletingId === cabana._id}
                          >
                            {deletingId === cabana._id ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                Eliminando...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-trash me-1"></i>
                                Eliminar
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

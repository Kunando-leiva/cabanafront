import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useTransition } from 'react';
import axios from 'axios';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';

export default function Cabanas() {
  const [cabanas, setCabanas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();
  const { token } = useAuth();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchCabanas = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/cabanas`, {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: controller.signal,
        });
        if (isMounted) {
          setCabanas(response.data);
        }
      } catch (error) {
        if (isMounted && error.name !== 'CanceledError') {
          console.error('Error al cargar cabañas:', error);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCabanas();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [token]);

  const eliminarCabana = async (id) => {
    if (!window.confirm('¿Confirmas eliminar esta cabaña?')) return;
    
    try {
      setDeletingId(id);
      
      // Optimistic update: eliminamos primero del estado local
      setCabanas(prevCabanas => {
        const newCabanas = prevCabanas.filter(cabana => cabana._id !== id);
        return newCabanas;
      });
  
      // Luego hacemos la llamada a la API
      await axios.delete(`${API_URL}/api/cabanas/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
  
    } catch (error) {
      console.error('Error al eliminar cabaña:', error);
      // Si hay error, revertimos el cambio
      if (error.response && error.response.status !== 404) {
        const response = await axios.get(`${API_URL}/api/cabanas`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        setCabanas(response.data);
      }
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
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="mt-2">Cargando lista de cabañas...</p>
              </div>
            ) : cabanas.length === 0 ? (
              <div className="alert alert-info text-center">
                No hay cabañas registradas.
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
                                  : `${API_URL}/uploads/${cabana.imagenes[0]}`
                              }
                              alt={`Cabaña ${cabana.nombre}`}
                              className="img-thumbnail"
                              style={{
                                width: '100px',
                                height: '70px',
                                objectFit: 'cover',
                                backgroundColor: '#f8f9fa',
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
                        <td className="align-middle d-flex gap-2">
                          <Link
                            to={`/admin/cabanas/editar/${cabana._id}`}
                            className="btn btn-sm btn-primary"
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
                                <span
                                  className="spinner-border spinner-border-sm me-1"
                                  role="status"
                                ></span>
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

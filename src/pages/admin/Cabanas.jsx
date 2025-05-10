import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';
import Spinner from 'react-bootstrap/Spinner';

export default function Cabanas() {
  const [cabanas, setCabanas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const navigate = useNavigate();
  const { token } = useAuth();

  // Configuración de Axios con interceptores
  const api = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Interceptor para añadir el token a las peticiones
  api.interceptors.request.use(config => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }, error => {
    return Promise.reject(error);
  });

  // Función para obtener la URL correcta de la imagen
  const getImageUrl = (imageId) => {
    // Si es un objeto con fileId
    if (imageId?.fileId) {
      return `${API_URL}/api/images/${imageId.fileId}`;
    }
    // Si es un string (ID directo)
    if (typeof imageId === 'string') {
      return `${API_URL}/api/images/${imageId}`;
    }
    // Si ya tiene URL
    if (imageId?.url) {
      return imageId.url.startsWith('http') ? imageId.url : `${API_URL}${imageId.url}`;
    }
    // Default
    return `${process.env.PUBLIC_URL}/placeholder-cabana.jpg`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const response = await api.get('/api/cabanas', {
          params: { populate: 'images' }
        });

        if (response.data.success) {
          const processedCabanas = response.data.data.map(cabana => ({
            ...cabana,
            // Asegurar que images sea siempre un array de objetos con url
            images: (cabana.images || []).map(img => ({
              ...img,
              url: getImageUrl(img)
            }))
          }));

          setCabanas(processedCabanas);
        }
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError(err.response?.data?.error || 'Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);


  const handleDelete = async (cabanaId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta cabaña?')) return;
    
    try {
      const response = await api.delete(`/api/cabanas/${cabanaId}`);
      
      if (response.data.success) {
        setCabanas(prev => prev.filter(cabana => cabana._id !== cabanaId));
        setSuccessMessage(response.data.message || 'Cabaña eliminada correctamente');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error al eliminar cabaña:', err);
      setError(err.response?.data?.error || 
              err.response?.data?.message || 
              'Error al eliminar la cabaña');
    }
  };

  // Función mejorada para manejar errores de imagen
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = `${process.env.PUBLIC_URL}/placeholder-cabana.jpg`;
    e.target.style.objectFit = 'contain';
    e.target.className = 'img-thumbnail img-error';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p>Cargando cabañas...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container-fluid mt-4">
        {/* Mostrar mensajes de error */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show">
            {error}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setError(null)}
            />
          </div>
        )}
        
        {/* Mostrar mensajes de éxito */}
        {successMessage && (
          <div className="alert alert-success alert-dismissible fade show">
            {successMessage}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setSuccessMessage(null)}
            />
          </div>
        )}

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
              <div className="text-center py-5">
                <Spinner animation="border" />
                <p>Cargando...</p>
              </div>
            ) : cabanas.length === 0 ? (
              <div className="alert alert-info">
                No hay cabañas registradas.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th style={{ width: '120px' }}>Imagen</th>
                      <th>Nombre</th>
                      <th>Descripción</th>
                      <th>Capacidad</th>
                      <th>Precio</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cabanas.map(cabana => (
                      <tr key={cabana._id}>
                        <td>
                          {cabana.images?.length > 0 ? (
                            <div className="cabana-image-container">
                              <img
                                src={cabana.images[0].url}
                                alt={`Cabaña ${cabana.nombre}`}
                                className="img-thumbnail cabana-image"
                                onError={handleImageError}
                              />
                            </div>
                          ) : (
                            <div className="no-image-placeholder">
                              <span>Sin imagen</span>
                            </div>
                          )}
                        </td>
                        <td>{cabana.nombre}</td>
                        <td className="text-truncate" style={{maxWidth: '200px'}}>
                          {cabana.descripcion}
                        </td>
                        <td>{cabana.capacidad} personas</td>
                        <td>${cabana.precio?.toLocaleString('es-AR')} por noche</td>
                        <td>
                          <Link
                            to={`/admin/cabanas/editar/${cabana._id}`}
                            className="btn btn-sm btn-primary me-2"
                          >
                            <i className="fas fa-edit"></i> Editar
                          </Link>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(cabana._id)}
                          >
                            <i className="fas fa-trash"></i> Eliminar
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
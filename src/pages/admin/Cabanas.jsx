import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';

export default function Cabanas() {
  const [cabanas, setCabanas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const navigate = useNavigate();
  const { token } = useAuth();
  const isMounted = useRef(true);

  // Configuración de Axios
  const api = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Interceptor para el token
  api.interceptors.request.use(config => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }, error => Promise.reject(error));

  useEffect(() => {
    isMounted.current = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get('/api/cabanas');
        
        if (isMounted.current && response.data.success) {
          setCabanas(response.data.data);
        }
      } catch (err) {
        console.error('Error al cargar datos:', err);
        if (isMounted.current) {
          setError(err.response?.data?.error || 'Error al cargar los datos');
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted.current = false;
    };
  }, [token]);

  const handleDelete = async (cabanaId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta cabaña?')) return;
    
    try {
      
      const response = await api.delete(`/api/cabanas/${cabanaId}`);
      
      if (isMounted.current) {
        setCabanas(prev => prev.filter(cabana => cabana._id !== cabanaId));
        setSuccessMessage(response.data.message || 'Cabaña eliminada correctamente');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error al eliminar cabaña:', err);
      if (isMounted.current) {
        setError(err.response?.data?.error || 
                err.response?.data?.message || 
                'Error al eliminar la cabaña');
      }
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </Spinner>
          <p>Cargando cabañas...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container-fluid mt-4">
        {/* Mensajes de alerta */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {successMessage && (
          <Alert variant="success" dismissible onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        <Card className="shadow">
          <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
            <h2 className="mb-0">Administrar Cabañas</h2>
            <Button
              variant="success"
              onClick={() => navigate('/admin/cabanas/crear')}
            >
              <i className="fas fa-plus me-2"></i>
              Crear Nueva Cabaña
            </Button>
          </Card.Header>

          <Card.Body>
            {cabanas.length === 0 ? (
              <Alert variant="info">
                No hay cabañas registradas.
              </Alert>
            ) : (
              <div className="table-responsive">
                <Table striped hover>
                  <thead className="table-dark">
                    <tr>
                      <th>Nombre</th>
                      <th>Capacidad</th>
                      <th>Precio</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cabanas.map(cabana => (
                      <tr key={cabana._id}>
                        <td>
                          <strong>{cabana.nombre}</strong>
                        </td>


                        
                       
                        <td>
                          <Badge bg="info">
                            {cabana.capacidad} personas
                          </Badge>
                        </td>
                        <td>
                          <Badge bg="success">
                            ${cabana.precio?.toLocaleString('es-AR')}
                          </Badge>
                        </td>
                        <td>
                          <Link
                            to={`/admin/cabanas/editar/${cabana._id}`}
                            className="btn btn-sm btn-primary me-2"
                          >
                            <i className="fas fa-edit"></i> Editar
                          </Link>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(cabana._id)}
                          >
                            <i className="fas fa-trash"></i> Eliminar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </AdminLayout>
  );
}
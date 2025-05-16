import { useState, useEffect } from 'react';
import axios from 'axios';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config';
import DeleteReserva from './DeleteReserva';
import { Pagination, Form, Row, Col } from 'react-bootstrap';

export default function ReservasAdmin() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();
  const navigate = useNavigate();

  // Estado para paginación y filtros
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const [filters, setFilters] = useState({ 
    estado: '', 
    fechaInicio: '',
    fechaFin: ''
  });

  // Función para cargar reservas
  const fetchReservas = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Construir parámetros de consulta
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        ...filters
      };

      const response = await axios.get(`${API_URL}/api/reservas/admin`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      // Asegúrate que el backend devuelva { data, total, pages }
      setReservas(response.data.data);
      setTotalPages(response.data.pages);
    } catch (err) {
      console.error('Error al cargar reservas:', err);
      setError(err.response?.data?.error || 
              err.response?.data?.message || 
              'Error al cargar reservas. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar reservas al montar o cambiar filtros/página
  useEffect(() => {
    fetchReservas();
  }, [token, currentPage, filters]);

  // Función para manejar cambios en filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Resetear a primera página al cambiar filtros
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleDateString('es-ES') : 'N/A';
  };

  return (
    <AdminLayout>
      <div className="container-fluid mt-4">
        <div className="card shadow">
          <div className="card-header bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h2 className="mb-0">Administrar Reservas</h2>
              <button 
                onClick={() => navigate('/admin/reservas/crear')} 
                className="btn btn-success"
              >
                <i className="fas fa-plus me-2"></i>
                Crear Reserva Manual
              </button>
            </div>
          </div>
          
          {/* Filtros */}
          <div className="card-body border-bottom">
            <Row>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Estado</Form.Label>
                  <Form.Select
                    name="estado"
                    value={filters.estado}
                    onChange={handleFilterChange}
                  >
                    <option value="">Todos</option>
                    <option value="pendiente">Pendientes</option>
                    <option value="confirmada">Confirmadas</option>
                    <option value="cancelada">Canceladas</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Desde</Form.Label>
                  <Form.Control
                    type="date"
                    name="fechaInicio"
                    value={filters.fechaInicio}
                    onChange={handleFilterChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Hasta</Form.Label>
                  <Form.Control
                    type="date"
                    name="fechaFin"
                    value={filters.fechaFin}
                    onChange={handleFilterChange}
                    min={filters.fechaInicio}
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>

          <div className="card-body">
            {error && <div className="alert alert-danger">{error}</div>}
            
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Cabaña</th>
                        <th>Usuario</th>
                        <th>Fechas</th>
                        <th>Precio Total</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservas.length > 0 ? (
                        reservas.map((reserva) => (
                          <tr key={reserva._id}>
                            <td>{reserva._id.slice(0, 6)}...</td>
                            <td>{reserva.cabana?.nombre || 'N/A'}</td>
                            <td>{reserva.usuario?.nombre || 'N/A'}</td>
                            <td>
                              {formatDate(reserva.fechaInicio)} - {formatDate(reserva.fechaFin)}
                            </td>
                            <td>${reserva.precioTotal?.toFixed(2)}</td>
                            <td>
                              <span className={`badge ${
                                reserva.estado === 'confirmada' ? 'bg-success' : 
                                reserva.estado === 'cancelada' ? 'bg-danger' : 'bg-warning'
                              }`}>
                                {reserva.estado}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <button
                                  className="btn btn-sm btn-info"
                                  onClick={() => navigate(`/admin/reservas/editar/${reserva._id}`)}
                                  title="Editar"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <DeleteReserva 
                                  reservaId={reserva._id}
                                  onSuccess={(deletedId) => {
                                    setReservas(reservas.filter(r => r._id !== deletedId));
                                  }}
                                />
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center py-4">
                            No se encontraron reservas
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-center mt-4">
                    <Pagination>
                      <Pagination.Prev 
                        disabled={currentPage === 1} 
                        onClick={() => setCurrentPage(p => p - 1)} 
                      />
                      {[...Array(totalPages).keys()].map(page => (
                        <Pagination.Item
                          key={page + 1}
                          active={page + 1 === currentPage}
                          onClick={() => setCurrentPage(page + 1)}
                        >
                          {page + 1}
                        </Pagination.Item>
                      ))}
                      <Pagination.Next 
                        disabled={currentPage === totalPages} 
                        onClick={() => setCurrentPage(p => p + 1)} 
                      />
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
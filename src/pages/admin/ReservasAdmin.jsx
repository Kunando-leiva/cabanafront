import { useState, useEffect } from 'react';
import axios from 'axios';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config';
import DeleteReserva from './DeleteReserva';
import { Pagination, Form, Row, Col, Button, Badge } from 'react-bootstrap';
import { FaEdit, FaTrash, FaEye, FaPlus, FaSearch, FaCalendarAlt } from 'react-icons/fa';

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

  // Función para limpiar filtros
  const clearFilters = () => {
    setFilters({ estado: '', fechaInicio: '', fechaFin: '' });
    setCurrentPage(1);
  };

  return (
    <AdminLayout>
      <div className="container-fluid mt-4">
        <div className="card shadow">
          <div className="card-header bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <FaCalendarAlt size={24} className="me-3" />
                <h2 className="mb-0">Administrar Reservas</h2>
                <Badge bg="light" text="dark" className="ms-3">
                  {reservas.length} reservas
                </Badge>
              </div>
              <Button 
                variant="success" 
                onClick={() => navigate('/admin/reservas/crear')}
                className="d-flex align-items-center"
              >
                <FaPlus className="me-2" />
                Crear Reserva
              </Button>
            </div>
          </div>
          
          {/* Filtros */}
          <div className="card-body border-bottom">
            <div className="d-flex align-items-center mb-3">
              <FaSearch className="me-2" />
              <h5 className="mb-0">Filtros de búsqueda</h5>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={clearFilters}
                className="ms-auto"
              >
                Limpiar filtros
              </Button>
            </div>
            
            <Row className="g-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Estado</Form.Label>
                  <Form.Select
                    name="estado"
                    value={filters.estado}
                    onChange={handleFilterChange}
                    className="form-select"
                  >
                    <option value="">Todos los estados</option>
                    <option value="pendiente">Pendientes</option>
                    <option value="confirmada">Confirmadas</option>
                    <option value="cancelada">Canceladas</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Fecha desde</Form.Label>
                  <Form.Control
                    type="date"
                    name="fechaInicio"
                    value={filters.fechaInicio}
                    onChange={handleFilterChange}
                    className="form-control"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Fecha hasta</Form.Label>
                  <Form.Control
                    type="date"
                    name="fechaFin"
                    value={filters.fechaFin}
                    onChange={handleFilterChange}
                    min={filters.fechaInicio}
                    className="form-control"
                  />
                </Form.Group>
              </Col>
              <Col md={3} className="d-flex align-items-end">
                <Button 
                  variant="info" 
                  onClick={fetchReservas}
                  className="w-100 d-flex align-items-center justify-content-center"
                >
                  <FaSearch className="me-2" />
                  Buscar
                </Button>
              </Col>
            </Row>
          </div>

          <div className="card-body">
            {error && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                {error}
                <button type="button" className="btn-close" onClick={() => setError('')}></button>
              </div>
            )}
            
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}} role="status">
                  <span className="visually-hidden">Cargando reservas...</span>
                </div>
                <p className="mt-3">Cargando reservas...</p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-dark">
                      <tr>
                        <th>ID</th>
                        <th>Cabaña</th>
                        <th>Huésped</th>
                        <th>Fechas</th>
                        <th>Precio</th>
                        <th>Estado</th>
                        <th className="text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservas.length > 0 ? (
                        reservas.map((reserva) => (
                          <tr key={reserva._id} className={reserva.estado === 'cancelada' ? 'table-secondary' : ''}>
                            <td>
                              <code className="text-primary">{reserva._id.slice(0, 8)}</code>
                            </td>
                            <td>
                              <div className="fw-bold">{reserva.cabana?.nombre || 'Sin cabaña'}</div>
                              <small className="text-muted">{reserva.cabana?.tipo || ''}</small>
                            </td>
                            <td>
                              <div className="fw-bold">{reserva.huesped?.nombre || reserva.usuario?.nombre || 'N/A'}</div>
                              <small className="text-muted">{reserva.huesped?.dni || ''}</small>
                            </td>
                            <td>
                              <div className="fw-bold">
                                {formatDate(reserva.fechaInicio)}
                              </div>
                              <div className="text-muted">
                                al {formatDate(reserva.fechaFin)}
                              </div>
                              <small className="text-info">
                                {Math.ceil((new Date(reserva.fechaFin) - new Date(reserva.fechaInicio)) / (1000 * 60 * 60 * 24))} noches
                              </small>
                            </td>
                            <td>
                              <div className="fw-bold text-success">
                                ${reserva.precioTotal?.toLocaleString('es-AR')}
                              </div>
                              {reserva.senia > 0 && (
                                <small className="text-muted">
                                  Seña: ${reserva.senia?.toLocaleString('es-AR')}
                                </small>
                              )}
                            </td>
                            <td>
                              <Badge 
                                bg={
                                  reserva.estado === 'confirmada' ? 'success' : 
                                  reserva.estado === 'cancelada' ? 'danger' : 
                                  reserva.estado === 'pendiente' ? 'warning' : 'secondary'
                                }
                                className="px-3 py-2"
                              >
                                {reserva.estado?.toUpperCase()}
                              </Badge>
                            </td>
                            <td>
                              <div className="d-flex justify-content-center gap-2">
                                <Button 
                                  variant="info" 
                                  size="sm"
                                  onClick={() => navigate(`/admin/reservas/${reserva._id}`)}
                                  title="Ver detalles"
                                  className="d-flex align-items-center"
                                >
                                  <FaEye />
                                </Button>
                                
                                <Button 
                                  variant="warning" 
                                  size="sm"
                                  onClick={() => navigate(`/admin/reservas/editar/${reserva._id}`)}
                                  title="Editar reserva"
                                  className="d-flex align-items-center"
                                >
                                  <FaEdit />
                                </Button>
                                
                                <DeleteReserva 
                                  reservaId={reserva._id}
                                  onSuccess={(deletedId) => {
                                    setReservas(reservas.filter(r => r._id !== deletedId));
                                  }}
                                  variant="danger"
                                  size="sm"
                                />
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center py-5">
                            <div className="text-muted">
                              <FaCalendarAlt size={48} className="mb-3" />
                              <h4>No se encontraron reservas</h4>
                              <p>Intenta ajustar los filtros o crear una nueva reserva</p>
                              <Button 
                                variant="outline-primary" 
                                onClick={() => navigate('/admin/reservas/crear')}
                              >
                                <FaPlus className="me-2" />
                                Crear nueva reserva
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-between align-items-center mt-4">
                    <div className="text-muted">
                      Página {currentPage} de {totalPages} • Total: {reservas.length} reservas
                    </div>
                    <Pagination>
                      <Pagination.First 
                        disabled={currentPage === 1} 
                        onClick={() => setCurrentPage(1)} 
                      />
                      <Pagination.Prev 
                        disabled={currentPage === 1} 
                        onClick={() => setCurrentPage(p => p - 1)} 
                      />
                      
                      {/* Mostrar máximo 5 páginas */}
                      {[...Array(Math.min(5, totalPages)).keys()].map(page => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = page + 1;
                        } else if (currentPage <= 3) {
                          pageNum = page + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + page;
                        } else {
                          pageNum = currentPage - 2 + page;
                        }
                        
                        return (
                          <Pagination.Item
                            key={pageNum}
                            active={pageNum === currentPage}
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Pagination.Item>
                        );
                      })}
                      
                      <Pagination.Next 
                        disabled={currentPage === totalPages} 
                        onClick={() => setCurrentPage(p => p + 1)} 
                      />
                      <Pagination.Last 
                        disabled={currentPage === totalPages} 
                        onClick={() => setCurrentPage(totalPages)} 
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
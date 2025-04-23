import { useState, useEffect } from 'react';
import axios from 'axios';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config'; // Asegúrate de que la ruta sea correcta
import DeleteReserva from './DeleteReserva'; // Asegúrate que esta ruta sea correcta
import { Pagination } from 'react-bootstrap'; // Asegúrate de tener react-bootstrap instalado


export default function ReservasAdmin() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;

const [filters, setFilters] = useState({ estado: '', fechaInicio: '' });

const filteredReservas = reservas.filter(reserva => {
  return (
    (filters.estado ? reserva.estado === filters.estado : true) &&
    (filters.fechaInicio ? new Date(reserva.fechaInicio) >= new Date(filters.fechaInicio) : true)
  );
});

const paginatedReservas = reservas.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);

  useEffect(() => {
    const fetchReservas = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/reservas/admin`
, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReservas(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Error al cargar reservas');
      } finally {
        setLoading(false);
      }
    };
    fetchReservas();
  }, [token]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES');
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
          <div className="card-body">
            {error && <div className="alert alert-danger">{error}</div>}
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              </div>
            ) : (
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
                    {reservas.map((reserva) => (
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
                    ))}
                  </tbody>
                </table>
                <Pagination>
  <Pagination.Prev 
    disabled={currentPage === 1} 
    onClick={() => setCurrentPage(p => p - 1)} 
  />
  <Pagination.Next 
    disabled={currentPage * itemsPerPage >= reservas.length} 
    onClick={() => setCurrentPage(p => p + 1)} 
  />
</Pagination>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
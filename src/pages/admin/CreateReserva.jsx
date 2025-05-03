// src/pages/admin/CreateReserva.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import CalendarioDisponibilidad from '../../components/admin/CalendarioDisponibilidad';
import 'react-datepicker/dist/react-datepicker.css';
import { API_URL } from '../../../config';
import { Spinner, Alert } from 'react-bootstrap';

export default function CreateReserva() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [cabanas, setCabanas] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState({
    initial: true,
    form: false
  });
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    usuarioId: '',
    cabanaId: '',
    fechaInicio: null,
    fechaFin: null,
    precioTotal: 0,
  });

  // Función para procesar datos de la API
  const processApiData = (data) => {
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(prev => ({ ...prev, initial: true }));
        setError('');

        const [usuariosRes, cabanasRes, reservasRes] = await Promise.all([
          axios.get(`${API_URL}/api/usuarios`, { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
          axios.get(`${API_URL}/api/cabanas`, { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
          axios.get(`${API_URL}/api/reservas`, { 
            headers: { Authorization: `Bearer ${token}` } 
          })
        ]);

        // Procesamiento seguro de los datos
        setUsuarios(processApiData(usuariosRes.data));
        setCabanas(processApiData(cabanasRes.data));
        setReservas(processApiData(reservasRes.data));

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || 'Error al cargar datos iniciales');
      } finally {
        setLoading(prev => ({ ...prev, initial: false }));
      }
    };

    fetchData();
  }, [token]);

   // Función para eliminar reserva
   const handleEliminarReserva = async (reservaId) => {
    if (window.confirm('¿Estás seguro de eliminar esta reserva?')) {
      try {
        setLoading(true);
        await axios.delete(`${API_URL}/api/reservas/admin/${reservaId}`, {
          headers: {
          headers: { Authorization: `Bearer ${token}` }
        }});
        // Actualizar lista de reservas después de eliminar
        setReservas(reservas.filter(reserva => reserva._id !== reservaId));
        setError('');
      } catch (err) {
        setError(err.response?.data?.error || 'Error al eliminar reserva');
      } finally {
        setLoading(false);
      }
    }
  };

  // Calcular precio al cambiar fechas o cabaña
  useEffect(() => {
    if (formData.cabanaId && formData.fechaInicio && formData.fechaFin) {
      const cabana = cabanas.find(c => c._id === formData.cabanaId);
      if (cabana) {
        const diffDays = (formData.fechaFin - formData.fechaInicio) / (1000 * 60 * 60 * 24);
        setFormData(prev => ({ ...prev, precioTotal: diffDays * cabana.precio }));
      }
    }
  }, [formData.fechaInicio, formData.fechaFin, formData.cabanaId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/reservas/admin/crear`,
        {
          usuarioId: formData.usuarioId,
          cabanaId: formData.cabanaId,
          fechaInicio: formData.fechaInicio,
          fechaFin: formData.fechaFin,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate('/admin/reservas');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear reserva');
    } finally {
      setLoading(false);
    }
  };
  if (loading.initial) {
    return (
      <AdminLayout>
        <div className="text-center my-5">
          <Spinner animation="border" />
          <p>Cargando datos iniciales...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mt-4">
        <div className="card shadow">
          <div className="card-header bg-primary text-white">
            <h2>Crear Reserva Manual</h2>
          </div>
          <div className="card-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
              {/* Selección de Usuario */}
              <div className="mb-3">
                <label className="form-label">Usuario</label>
                <select
                  className="form-select"
                  value={formData.usuarioId}
                  onChange={(e) => setFormData({ ...formData, usuarioId: e.target.value })}
                  required
                >
                   <option value="">Seleccionar usuario...</option>
                  {usuarios.length > 0 ? (
                    usuarios.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.nombre} ({user.email})
                      </option>
                    ))
                  ) : (
                    <option disabled>No hay usuarios disponibles</option>
                  )}
                </select>
              </div>

              <div className="mb-3">
  <label className="form-label">Cabaña</label>
  <select
    className="form-select"
    value={formData.cabanaId}
    onChange={(e) => setFormData({ ...formData, cabanaId: e.target.value })}
    required
    disabled={loading.form}
  >
    <option value="">Seleccionar cabaña...</option>
                  {Array.isArray(cabanas) && cabanas.length > 0 ? (
                    cabanas.map((cabana) => (
                      <option key={cabana._id} value={cabana._id}>
                        {cabana.nombre} (${cabana.precio}/noche)
                      </option>
                    ))
                  ) : (
                    <option disabled>No hay cabañas disponibles</option>
                  )}
                </select>
              </div>

{/* Calendario de Disponibilidad */}
{formData.cabanaId && (
  <CalendarioDisponibilidad cabanaId={formData.cabanaId} />
)}



              {/* Selección de Cabaña */}
              <div className="mb-3">
                <label className="form-label">Cabaña</label>
                <select
                  className="form-select"
                  value={formData.cabanaId}
                  onChange={(e) => setFormData({ ...formData, cabanaId: e.target.value })}
                  required
                >
                  <option value="">Seleccionar cabaña...</option>
                  {cabanas.map((cabana) => (
                    <option key={cabana._id} value={cabana._id}>
                      {cabana.nombre} (${cabana.precio}/noche)
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Fechas */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Fecha Inicio</label>
                  <DatePicker
                    selected={formData.fechaInicio}
                    onChange={(date) => setFormData({ ...formData, fechaInicio: date })}
                    excludeDates={fechasOcupadas.map(f => new Date(f))}
                    selectsStart
                    startDate={formData.fechaInicio}
                    endDate={formData.fechaFin}
                    minDate={new Date()}
                    className="form-control"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Fecha Fin</label>
                  <DatePicker
                    selected={formData.fechaFin}
                    onChange={(date) => setFormData({ ...formData, fechaFin: date })}
                    selectsEnd
                    startDate={formData.fechaInicio}
                    endDate={formData.fechaFin}
                    minDate={formData.fechaInicio || new Date()}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              {/* Precio Calculado */}
              <div className="mb-3">
                <label className="form-label">Precio Total</label>
                <input
                  type="text"
                  className="form-control"
                  value={`$${formData.precioTotal.toFixed(2)}`}
                  readOnly
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creando...' : 'Crear Reserva'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
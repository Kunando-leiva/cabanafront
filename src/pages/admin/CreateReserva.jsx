import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { API_URL } from '../../../config';
import { Spinner, Alert } from 'react-bootstrap';

// Función auxiliar para generar rango de fechas (fuera del componente)
function getDatesInRange(startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}

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

  // Calcula fechas ocupadas para la cabaña seleccionada
  const fechasOcupadas = useMemo(() => {
    if (!formData.cabanaId) return [];
    return reservas
      .filter(reserva => reserva.cabanaId === formData.cabanaId)
      .flatMap(reserva => getDatesInRange(
        new Date(reserva.fechaInicio), 
        new Date(reserva.fechaFin)
      ));
  }, [formData.cabanaId, reservas]);

  // Carga inicial de datos
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

        setUsuarios(usuariosRes.data?.data || []);
        setCabanas(cabanasRes.data?.data || []);
        setReservas(reservasRes.data?.data || []);

      } catch (err) {
        setError(err.response?.data?.message || 'Error al cargar datos');
      } finally {
        setLoading(prev => ({ ...prev, initial: false }));
      }
    };

    fetchData();
  }, [token]);

  // Calcula precio total al cambiar fechas o cabaña
  useEffect(() => {
    if (formData.cabanaId && formData.fechaInicio && formData.fechaFin) {
      const cabana = cabanas.find(c => c._id === formData.cabanaId);
      if (cabana) {
        const diffDays = Math.ceil(
          (formData.fechaFin - formData.fechaInicio) / (1000 * 60 * 60 * 24)
        );
        setFormData(prev => ({ ...prev, precioTotal: diffDays * cabana.precio }));
      }
    }
  }, [formData.fechaInicio, formData.fechaFin, formData.cabanaId, cabanas]);

  // Maneja el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, form: true }));
    setError('');

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
      const errorMessage = err.response?.data?.error || 
                           err.message || 
                           'Error al crear reserva. Verifica las fechas seleccionadas.';
      
      setError(errorMessage);

      // Ocultar alerta después de 5 segundos
      setTimeout(() => {
        setError('');
      }, 5000);
    } finally {
      setLoading(prev => ({ ...prev, form: false }));
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
            {/* Alertas de error */}
            {error && (
              <Alert variant="danger" className="mb-4">
                <Alert.Heading>Error en la reserva</Alert.Heading>
                <p>{error}</p>
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              {/* Selección de Usuario */}
              <div className="mb-3">
                <label className="form-label">Usuario</label>
                <select
                  className="form-select"
                  value={formData.usuarioId}
                  onChange={(e) => setFormData({ ...formData, usuarioId: e.target.value })}
                  required
                  disabled={loading.form}
                >
                  <option value="">Seleccionar usuario...</option>
                  {usuarios.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.nombre} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selección de Cabaña */}
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
                  {cabanas.map((cabana) => (
                    <option key={cabana._id} value={cabana._id}>
                      {cabana.nombre} (${cabana.precio}/noche)
                    </option>
                  ))}
                </select>
              </div>

              {/* Selectores de Fecha */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Fecha Inicio</label>
                  <DatePicker
                    selected={formData.fechaInicio}
                    onChange={(date) => setFormData({ ...formData, fechaInicio: date })}
                    selectsStart
                    startDate={formData.fechaInicio}
                    endDate={formData.fechaFin}
                    minDate={new Date()}
                    excludeDates={fechasOcupadas}
                    className="form-control"
                    required
                    disabled={loading.form}
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
                    excludeDates={fechasOcupadas}
                    className="form-control"
                    required
                    disabled={loading.form}
                  />
                </div>
              </div>

              {/* Precio Total */}
              <div className="mb-3">
                <label className="form-label">Precio Total</label>
                <input
                  type="text"
                  className="form-control"
                  value={`$${formData.precioTotal.toFixed(2)}`}
                  readOnly
                />
              </div>

              {/* Botón de Envío */}
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading.form}
              >
                {loading.form ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Procesando...
                  </>
                ) : (
                  'Crear Reserva'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
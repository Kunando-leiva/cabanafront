import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Form, Button, Alert, Spinner, Card } from 'react-bootstrap';
import { AdminLayout } from '../../components/admin/AdminLayout';

export default function EditarReservaAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [reserva, setReserva] = useState(null);
  const [cabanas, setCabanas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    fechaInicio: '',
    fechaFin: '',
    estado: 'pendiente',
    cabanaId: '',
    huesped: {
      nombre: '',
      apellido: '',
      dni: '',
      direccion: '',
      telefono: '',
      email: ''
    }
  });

  // Cargar reserva y cabañas al iniciar
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar reserva actual
        const reservaResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/reservas/admin/${id}`,

          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Cargar lista de cabañas disponibles
        const cabanasResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/cabanas`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (reservaResponse.data.success && cabanasResponse.data) {
          const reservaData = reservaResponse.data.data;
          setReserva(reservaData);
          setCabanas(cabanasResponse.data);
          setFormData({
            fechaInicio: reservaData.fechaInicio.split('T')[0],
            fechaFin: reservaData.fechaFin.split('T')[0],
            estado: reservaData.estado,
            cabanaId: reservaData.cabana._id,
            huesped: {
              nombre: reservaData.huesped?.nombre || '',
              apellido: reservaData.huesped?.apellido || '',
              dni: reservaData.huesped?.dni || '',
              direccion: reservaData.huesped?.direccion || '',
              telefono: reservaData.huesped?.telefono || '',
              email: reservaData.huesped?.email || ''
            }
          });
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, token]);

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/reservas/admin/${id}`,

        {
          ...formData,
          cabana: formData.cabanaId // Asegura compatibilidad con el backend
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Reserva actualizada correctamente');
      setTimeout(() => navigate('/admin/reservas'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar la reserva');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !reserva) return <Spinner animation="border" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <AdminLayout>
      <div className="container mt-4">
        <Card className="shadow">
          <Card.Header className="bg-primary text-white">
            <h2>Editar Reserva #{reserva?._id?.slice(0, 6)}</h2>
          </Card.Header>
          <Card.Body>
            {success && <Alert variant="success">{success}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Nombre del Huésped</Form.Label>
                <Form.Control
                  value={formData.huesped.nombre}
                  onChange={(e) => setFormData({
                    ...formData,
                    huesped: { ...formData.huesped, nombre: e.target.value }
                  })}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Apellido del Huésped</Form.Label>
                <Form.Control
                  value={formData.huesped.apellido}
                  onChange={(e) => setFormData({
                    ...formData,
                    huesped: { ...formData.huesped, apellido: e.target.value }
                  })}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>DNI</Form.Label>
                <Form.Control
                  value={formData.huesped.dni}
                  onChange={(e) => setFormData({
                    ...formData,
                    huesped: { ...formData.huesped, dni: e.target.value }
                  })}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Teléfono</Form.Label>
                <Form.Control
                  value={formData.huesped.telefono}
                  onChange={(e) => setFormData({
                    ...formData,
                    huesped: { ...formData.huesped, telefono: e.target.value }
                  })}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={formData.huesped.email}
                  onChange={(e) => setFormData({
                    ...formData,
                    huesped: { ...formData.huesped, email: e.target.value }
                  })}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Cabaña</Form.Label>
                <Form.Select
                  value={formData.cabanaId}
                  onChange={(e) => setFormData({ ...formData, cabanaId: e.target.value })}
                  required
                >
                  <option value="">Seleccionar cabaña</option>
                  {cabanas.map(cabana => (
                    <option key={cabana._id} value={cabana._id}>
                      {cabana.nombre} - ${cabana.precio}/noche
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Fecha de Inicio</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.fechaInicio}
                  onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Fecha de Fin</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.fechaFin}
                  onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Estado</Form.Label>
                <Form.Select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmada">Confirmada</option>
                  <option value="cancelada">Cancelada</option>
                </Form.Select>
              </Form.Group>

              <div className="d-flex gap-2">
                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
                <Button variant="secondary" onClick={() => navigate('/admin/reservas')}>
                  Cancelar
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </AdminLayout>
  );
}
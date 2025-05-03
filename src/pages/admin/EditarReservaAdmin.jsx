import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Form, Button, Alert, Spinner, Card, Row, Col } from 'react-bootstrap';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { API_URL } from '../../config';
import { FaArrowLeft, FaSave, FaTimes } from 'react-icons/fa';

export default function EditarReservaAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [reserva, setReserva] = useState(null);
  const [cabanas, setCabanas] = useState([]);
  const [loading, setLoading] = useState({ initial: true, saving: false });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estado inicial con todos los campos necesarios
  const [formData, setFormData] = useState({
    fechaInicio: '',
    fechaFin: '',
    estado: 'pendiente',
    cabanaId: '',
    precioTotal: 0,
    huesped: {
      nombre: '',
      apellido: '',
      dni: '',
      direccion: '',
      telefono: '',
      email: ''
    },
    observaciones: '',
    metodoPago: 'efectivo',
    senia: 0,
    pagado: false
  });

  // Función para procesar datos de cabañas
  const processCabanasData = (data) => {
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    if (data?.cabanas && Array.isArray(data.cabanas)) return data.cabanas;
    console.warn('Formato de datos inesperado para cabañas:', data);
    return [];
  };

  // Cargar reserva y cabañas al iniciar
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading({ initial: true, saving: false });
        setError('');
        
        // Cargar reserva actual
        const reservaResponse = await axios.get(
          `${API_URL}/api/reservas/admin/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Cargar lista de cabañas disponibles
        const cabanasResponse = await axios.get(
          `${API_URL}/api/cabanas`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Validar respuesta de reserva
        if (!reservaResponse.data?.success || !reservaResponse.data.data) {
          throw new Error('Formato de respuesta de reserva inválido');
        }

        const reservaData = reservaResponse.data.data;
        
        // Procesar cabañas
        const cabanasData = processCabanasData(cabanasResponse.data);
        if (!cabanasData.length) {
          console.warn('No se encontraron cabañas disponibles');
        }

        setReserva(reservaData);
        setCabanas(cabanasData);
        
        // Establecer todos los valores del formulario
        setFormData({
          fechaInicio: reservaData.fechaInicio.split('T')[0],
          fechaFin: reservaData.fechaFin.split('T')[0],
          estado: reservaData.estado || 'pendiente',
          cabanaId: reservaData.cabana?._id || '',
          precioTotal: reservaData.precioTotal || 0,
          huesped: {
            nombre: reservaData.huesped?.nombre || '',
            apellido: reservaData.huesped?.apellido || '',
            dni: reservaData.huesped?.dni || '',
            direccion: reservaData.huesped?.direccion || '',
            telefono: reservaData.huesped?.telefono || '',
            email: reservaData.huesped?.email || ''
          },
          observaciones: reservaData.observaciones || '',
          metodoPago: reservaData.metodoPago || 'efectivo',
          senia: reservaData.senia || 0,
          pagado: reservaData.pagado || false
        });

      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError(err.response?.data?.error || err.message || 'Error al cargar datos');
      } finally {
        setLoading({ initial: false, saving: false });
      }
    };
    fetchData();
  }, [id, token]);

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Calcular precio cuando cambian fechas o cabaña
  useEffect(() => {
    if (formData.cabanaId && formData.fechaInicio && formData.fechaFin) {
      const cabana = cabanas.find(c => c._id === formData.cabanaId);
      if (cabana) {
        const diffTime = new Date(formData.fechaFin) - new Date(formData.fechaInicio);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const total = diffDays * (cabana.precio || 0);
        
        setFormData(prev => ({ 
          ...prev, 
          precioTotal: total > 0 ? total : 0 
        }));
      }
    }
  }, [formData.fechaInicio, formData.fechaFin, formData.cabanaId, cabanas]);

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading({ initial: false, saving: true });
    setError('');
    setSuccess('');

    try {
      // Validaciones adicionales
      if (new Date(formData.fechaInicio) >= new Date(formData.fechaFin)) {
        throw new Error('La fecha de fin debe ser posterior a la de inicio');
      }

      if (!/^\d+$/.test(formData.huesped.dni)) {
        throw new Error('El DNI debe contener solo números');
      }

      if (!formData.huesped.email.includes('@')) {
        throw new Error('Ingrese un email válido');
      }

      const response = await axios.put(
        `${API_URL}/api/reservas/admin/${id}`,
        {
          ...formData,
          cabana: formData.cabanaId // Compatibilidad con backend
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al actualizar');
      }
      
      setSuccess('Reserva actualizada correctamente');
      setTimeout(() => navigate('/admin/reservas'), 1500);
    } catch (err) {
      console.error('Error al actualizar reserva:', err);
      setError(err.response?.data?.error || err.message || 'Error al actualizar la reserva');
    } finally {
      setLoading({ initial: false, saving: false });
    }
  };

  if (loading.initial && !reserva) {
    return (
      <AdminLayout>
        <div className="text-center my-5">
          <Spinner animation="border" />
          <p>Cargando datos de la reserva...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <Alert variant="danger" className="m-4">
          {error}
          <Button 
            variant="outline-danger" 
            className="ms-3" 
            onClick={() => navigate('/admin/reservas')}
          >
            <FaArrowLeft className="me-1" /> Volver a reservas
          </Button>
        </Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mt-4">
        <Card className="shadow">
          <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
            <h2 className="mb-0">Editar Reserva #{reserva?._id?.slice(0, 6)}</h2>
            <Button 
              variant="outline-light" 
              size="sm"
              onClick={() => navigate('/admin/reservas')}
            >
              <FaTimes className="me-1" /> Cancelar
            </Button>
          </Card.Header>
          
          <Card.Body>
            {success && <Alert variant="success">{success}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Form onSubmit={handleSubmit}>
              <h4 className="mb-4 border-bottom pb-2">Datos del Huésped</h4>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nombre *</Form.Label>
                    <Form.Control
                      name="huesped.nombre"
                      value={formData.huesped.nombre}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Apellido *</Form.Label>
                    <Form.Control
                      name="huesped.apellido"
                      value={formData.huesped.apellido}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
                
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>DNI *</Form.Label>
                    <Form.Control
                      name="huesped.dni"
                      value={formData.huesped.dni}
                      onChange={handleChange}
                      required
                      pattern="\d*"
                      title="Solo números"
                    />
                  </Form.Group>
                </Col>
                
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Teléfono *</Form.Label>
                    <Form.Control
                      name="huesped.telefono"
                      value={formData.huesped.telefono}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
                
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email *</Form.Label>
                    <Form.Control
                      type="email"
                      name="huesped.email"
                      value={formData.huesped.email}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
                
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Dirección</Form.Label>
                    <Form.Control
                      name="huesped.direccion"
                      value={formData.huesped.direccion}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <h4 className="mb-4 mt-4 border-bottom pb-2">Datos de la Reserva</h4>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Cabaña *</Form.Label>
                    <Form.Select
                      name="cabanaId"
                      value={formData.cabanaId}
                      onChange={handleChange}
                      required
                      disabled={loading.saving}
                    >
                      <option value="">Seleccionar cabaña</option>
                      {Array.isArray(cabanas) && cabanas.map(cabana => (
                        <option key={cabana._id} value={cabana._id}>
                          {cabana.nombre} - ${cabana.precio?.toFixed(2) || '0.00'}/noche
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Fecha Inicio *</Form.Label>
                    <Form.Control
                      type="date"
                      name="fechaInicio"
                      value={formData.fechaInicio}
                      onChange={handleChange}
                      required
                      disabled={loading.saving}
                    />
                  </Form.Group>
                </Col>
                
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Fecha Fin *</Form.Label>
                    <Form.Control
                      type="date"
                      name="fechaFin"
                      value={formData.fechaFin}
                      onChange={handleChange}
                      required
                      disabled={loading.saving}
                    />
                  </Form.Group>
                </Col>
                
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Estado *</Form.Label>
                    <Form.Select
                      name="estado"
                      value={formData.estado}
                      onChange={handleChange}
                      disabled={loading.saving}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="confirmada">Confirmada</option>
                      <option value="cancelada">Cancelada</option>
                      <option value="finalizada">Finalizada</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
 
  
              </Row>

              <div className="d-flex justify-content-end gap-3 mt-4">
                <Button 
                  variant="outline-secondary" 
                  onClick={() => navigate('/admin/reservas')}
                  disabled={loading.saving}
                >
                  <FaTimes className="me-1" /> Cancelar
                </Button>
                
                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={loading.saving}
                >
                  {loading.saving ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <FaSave className="me-1" /> Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </AdminLayout>
  );
}
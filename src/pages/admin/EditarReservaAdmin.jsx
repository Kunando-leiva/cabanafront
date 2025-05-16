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
  const [loading, setLoading] = useState({ initial: true, saving: false });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cabanas, setCabanas] = useState([]);
  const [formData, setFormData] = useState({
    cabana: '',
    fechaInicio: '',
    fechaFin: '',
    estado: 'pendiente',
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

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Validar formato del ID primero
        if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
          throw new Error('ID de reserva inválido');
        }

        setLoading({ initial: true, saving: false });
        setError('');

        const [reservaRes, cabanasRes] = await Promise.all([
          axios.get(`${API_URL}/api/reservas/admin/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_URL}/api/cabanas`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        // Verificar estructura de respuesta
        if (!reservaRes.data?.success) {
          throw new Error(reservaRes.data?.error || 'Error al cargar reserva');
        }

        const reserva = reservaRes.data.data || {};
        const cabanasData = Array.isArray(cabanasRes.data?.data) ? 
                          cabanasRes.data.data : 
                          Array.isArray(cabanasRes.data) ? 
                          cabanasRes.data : 
                          [];

        setCabanas(cabanasData);
        
        // Formatear datos de la reserva con protecciones
        setFormData({
          cabana: reserva.cabana?._id || reserva.cabana || '',
          fechaInicio: reserva.fechaInicio ? new Date(reserva.fechaInicio).toISOString().split('T')[0] : '',
          fechaFin: reserva.fechaFin ? new Date(reserva.fechaFin).toISOString().split('T')[0] : '',
          estado: reserva.estado || 'pendiente',
          precioTotal: reserva.precioTotal || 0,
          huesped: {
            nombre: reserva.huesped?.nombre || '',
            apellido: reserva.huesped?.apellido || '',
            dni: reserva.huesped?.dni || reserva.dni || '',
            direccion: reserva.huesped?.direccion || '',
            telefono: reserva.huesped?.telefono || '',
            email: reserva.huesped?.email || ''
          },
          observaciones: reserva.observaciones || '',
          metodoPago: reserva.metodoPago || 'efectivo',
          senia: reserva.senia || 0,
          pagado: reserva.pagado || false
        });

      } catch (err) {
        console.error('Error al cargar datos:', err);
        let errorMsg = 'Error al cargar la reserva';
        
        if (err.message === 'ID de reserva inválido') {
          errorMsg = 'ID de reserva inválido';
        } else if (err.response?.status === 404) {
          errorMsg = 'Reserva no encontrada';
        } else if (err.response?.data?.error) {
          errorMsg = err.response.data.error;
        } else if (err.message) {
          errorMsg = err.message;
        }
        
        setError(errorMsg);
      } finally {
        setLoading({ initial: false, saving: false });
      }
    };

    fetchData();
  }, [id, token]);

  // Calcular precio cuando cambian fechas o cabaña
  useEffect(() => {
    if (formData.cabana && formData.fechaInicio && formData.fechaFin) {
      const cabanaSeleccionada = cabanas.find(c => c._id === formData.cabana);
      if (cabanaSeleccionada && cabanaSeleccionada.precio) {
        const inicio = new Date(formData.fechaInicio);
        const fin = new Date(formData.fechaFin);
        
        if (inicio && fin && fin > inicio) {
          const diffTime = fin - inicio;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const total = diffDays * cabanaSeleccionada.precio;
          
          setFormData(prev => ({ 
            ...prev, 
            precioTotal: total > 0 ? total : 0 
          }));
        }
      }
    }
  }, [formData.fechaInicio, formData.fechaFin, formData.cabana, cabanas]);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent] || {}), // Protección si el objeto padre no existe
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

  // Validar formulario
  const validateForm = () => {
    if (!formData.cabana) {
      throw new Error('Seleccione una cabaña');
    }

    if (!formData.fechaInicio || !formData.fechaFin) {
      throw new Error('Complete ambas fechas');
    }

    const inicio = new Date(formData.fechaInicio);
    const fin = new Date(formData.fechaFin);
    
    if (inicio >= fin) {
      throw new Error('La fecha fin debe ser posterior a la fecha inicio');
    }

    if (!formData.huesped?.nombre || !formData.huesped?.apellido || !formData.huesped?.dni) {
      throw new Error('Complete todos los datos del huésped');
    }

    if (!/^\d+$/.test(formData.huesped.dni)) {
      throw new Error('El DNI debe contener solo números');
    }

    if (formData.huesped.email && !formData.huesped.email.includes('@')) {
      throw new Error('Ingrese un email válido');
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading( true );
    setError('');
    setSuccess('');

    try {
      validateForm();

      const datosEnvio = {
        cabana: formData.cabana,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        estado: formData.estado,
        precioTotal: formData.precioTotal,
        huesped: formData.huesped,
        observaciones: formData.observaciones,
        metodoPago: formData.metodoPago,
        senia: formData.senia,
        pagado: formData.pagado
      };

      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await axios.put(
        `${API_URL}/api/reservas/admin/${id}`,
        datosEnvio,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Error al actualizar');
      }

      setSuccess('Reserva actualizada correctamente');
      setTimeout(() => navigate('/admin/reservas'), 2000);
    } catch (err) {
      console.error('Error al actualizar reserva:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          'Error al actualizar la reserva';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Manejo de estado de carga
  if (loading.initial) {
    return (
      <AdminLayout>
        <div className="text-center my-5">
          <Spinner animation="border" />
          <p>Cargando datos de la reserva...</p>
        </div>
      </AdminLayout>
    );
  }

  // Manejo de errores específicos
  if (error) {
    return (
      <AdminLayout>
        <Alert variant="danger" className="m-4">
          {error === 'ID de reserva inválido' ? (
            <>
              <h4>Error: ID de reserva inválido</h4>
              <p>El identificador de la reserva no tiene el formato correcto.</p>
              <Button 
                variant="outline-danger" 
                onClick={() => navigate('/admin/reservas')}
              >
                <FaArrowLeft className="me-1" /> Volver al listado
              </Button>
            </>
          ) : (
            <>
              <p>{error}</p>
              <div className="d-flex gap-2 mt-2">
                <Button 
                  variant="outline-danger" 
                  onClick={() => navigate('/admin/reservas')}
                >
                  <FaArrowLeft className="me-1" /> Volver
                </Button>
                <Button 
                  variant="danger" 
                  onClick={() => window.location.reload()}
                >
                  Reintentar
                </Button>
              </div>
            </>
          )}
        </Alert>
      </AdminLayout>
    );
  }

  // Renderizado del formulario
  return (
    <AdminLayout>
      <div className="container mt-4">
        <Card className="shadow">
          <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
            <h2 className="mb-0">Editar Reserva #{id?.slice(0, 6)}</h2>
            <Button 
              variant="outline-light" 
              size="sm"
              onClick={() => navigate('/admin/reservas')}
              disabled={loading.saving}
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
                      value={formData.huesped?.nombre || ''}
                      onChange={handleChange}
                      required
                      disabled={loading.saving}
                    />
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Apellido *</Form.Label>
                    <Form.Control
                      name="huesped.apellido"
                      value={formData.huesped?.apellido || ''}
                      onChange={handleChange}
                      required
                      disabled={loading.saving}
                    />
                  </Form.Group>
                </Col>
                
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>DNI *</Form.Label>
                    <Form.Control
                      name="huesped.dni"
                      value={formData.huesped?.dni || ''}
                      onChange={handleChange}
                      required
                      pattern="\d*"
                      title="Solo números"
                      disabled={loading.saving}
                    />
                  </Form.Group>
                </Col>
                
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Teléfono *</Form.Label>
                    <Form.Control
                      name="huesped.telefono"
                      value={formData.huesped?.telefono || ''}
                      onChange={handleChange}
                      required
                      disabled={loading.saving}
                    />
                  </Form.Group>
                </Col>
                
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="huesped.email"
                      value={formData.huesped?.email || ''}
                      onChange={handleChange}
                      disabled={loading.saving}
                    />
                  </Form.Group>
                </Col>
                
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Dirección</Form.Label>
                    <Form.Control
                      name="huesped.direccion"
                      value={formData.huesped?.direccion || ''}
                      onChange={handleChange}
                      disabled={loading.saving}
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
                      name="cabana"
                      value={formData.cabana || ''}
                      onChange={handleChange}
                      required
                      disabled={loading.saving}
                    >
                      <option value="">Seleccionar cabaña</option>
                      {cabanas.map(cabana => (
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
                      value={formData.fechaInicio || ''}
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
                      value={formData.fechaFin || ''}
                      onChange={handleChange}
                      required
                      min={formData.fechaInicio}
                      disabled={loading.saving}
                    />
                  </Form.Group>
                </Col>
                
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Estado *</Form.Label>
                    <Form.Select
                      name="estado"
                      value={formData.estado || 'pendiente'}
                      onChange={handleChange}
                      disabled={loading.saving}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="confirmada">Confirmada</option>
                      <option value="cancelada">Cancelada</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Método de Pago</Form.Label>
                    <Form.Select
                      name="metodoPago"
                      value={formData.metodoPago || 'efectivo'}
                      onChange={handleChange}
                      disabled={loading.saving}
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="tarjeta">Tarjeta</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Seña ($)</Form.Label>
                    <Form.Control
                      type="number"
                      name="senia"
                      value={formData.senia || 0}
                      onChange={handleChange}
                      min="0"
                      disabled={loading.saving}
                    />
                  </Form.Group>
                </Col>
                
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Pagado</Form.Label>
                    <Form.Check
                      type="switch"
                      name="pagado"
                      label={formData.pagado ? 'Sí' : 'No'}
                      checked={formData.pagado || false}
                      onChange={handleChange}
                      disabled={loading.saving}
                    />
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Precio Total</Form.Label>
                    <Form.Control
                      type="text"
                      value={`$${(formData.precioTotal || 0).toFixed(2)}`}
                      readOnly
                    />
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Saldo Pendiente</Form.Label>
                    <Form.Control
                      type="text"
                      value={`$${((formData.precioTotal || 0) - (formData.senia || 0)).toFixed(2)}`}
                      readOnly
                    />
                  </Form.Group>
                </Col>
                
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Observaciones</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="observaciones"
                      value={formData.observaciones || ''}
                      onChange={handleChange}
                      disabled={loading.saving}
                    />
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
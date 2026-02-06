import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Container, Form, Row, Col, Card, Button, Alert, 
  Spinner, ListGroup, Badge 
} from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { API_URL } from '../../config';
import { formatearPrecioArgentino } from '../../config';
import { FaCalendarAlt, FaMoneyBillWave, FaTag, FaUser, FaPhone, FaEnvelope, FaHome } from 'react-icons/fa';

const CrearReservaAdmin = () => {
  const { user, token, isAuthenticated, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [cabanas, setCabanas] = useState([]);
  const [loading, setLoading] = useState({
    initial: false,
    form: false,
    calculando: false
  });
  const [error, setError] = useState('');
  const [precioCalculado, setPrecioCalculado] = useState({
    total: 0,
    desglose: [],
    desgloseAgrupado: [],
    totalNoches: 0,
    precioFormateado: '$0'
  });
  const [fechasOcupadas, setFechasOcupadas] = useState([]);
  
  const processCabanasData = (data) => {
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    if (data?.cabanas && Array.isArray(data.cabanas)) return data.cabanas;
    return [];
  };

  const [formData, setFormData] = useState({
    cabanaId: '',
    fechaInicio: null,
    fechaFin: null,
    precioTotal: 0,
    huesped: {
      nombre: '',
      apellido: '',
      dni: '',
      direccion: '',
      telefono: '',
      email: ''
    }
  });

  // Redirigir si no está autenticado o no es admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { 
        state: { 
          from: '/admin/reservas/crear',
          message: 'Debes iniciar sesión para acceder a esta página' 
        } 
      });
      return;
    }

    if (!isAdmin()) {
      navigate('/dashboard', { 
        state: { 
          error: 'No tienes permisos para acceder a esta sección' 
        } 
      });
    }
  }, [isAuthenticated, navigate, isAdmin]);

  // Obtener cabañas al cargar
  useEffect(() => {
    const fetchCabanas = async () => {
      try {
        setLoading(prev => ({ ...prev, initial: true }));
        setError('');
        const response = await fetch(`${API_URL}/api/cabanas`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
    
        if (response.status === 401) {
          logout();
          throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
        }
    
        if (!response.ok) {
          throw new Error('No se pudieron cargar las cabañas. Intenta nuevamente.');
        }
    
        const data = await response.json();
        console.log('Datos recibidos de cabañas:', data);
        
        const processedCabanas = processCabanasData(data);
        console.log('Cabañas procesadas:', processedCabanas);
        
        if (!Array.isArray(processedCabanas)) {
          throw new Error('Formato de datos inesperado');
        }
    
        setCabanas(processedCabanas);
      } catch (err) {
        console.error('Error al cargar cabañas:', err);
        setError(err.message);
        setCabanas([]);
      } finally {
        setLoading(prev => ({ ...prev, initial: false }));
      }
    };

    if (isAuthenticated && isAdmin() && token) {
      fetchCabanas();
    }
  }, [token, isAuthenticated, logout, isAdmin]);

  // Obtener fechas ocupadas cuando se selecciona una cabaña
  useEffect(() => {
    const fetchFechasOcupadas = async () => {
      if (!formData.cabanaId) {
        setFechasOcupadas([]);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/reservas/ocupadas?cabanaId=${formData.cabanaId}`,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Error al obtener fechas ocupadas');
        }

        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          setFechasOcupadas(data.data.map(fecha => new Date(fecha)));
          console.log(`📅 Fechas ocupadas para cabaña ${formData.cabanaId}:`, data.data.length);
        }
      } catch (error) {
        console.error('Error obteniendo fechas ocupadas:', error);
        setFechasOcupadas([]);
      }
    };

    if (formData.cabanaId) {
      fetchFechasOcupadas();
    }
  }, [formData.cabanaId, token]);

  // Calcular precio DINÁMICO cuando cambian fechas
  useEffect(() => {
    const calcularPrecioDinamico = async () => {
      if (formData.fechaInicio && formData.fechaFin && 
          formData.fechaInicio < formData.fechaFin && 
          formData.cabanaId) {
        
        setLoading(prev => ({ ...prev, calculando: true }));
        try {
          const response = await fetch(`${API_URL}/api/reservas/calcular-precio`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              fechaInicio: formData.fechaInicio.toISOString(),
              fechaFin: formData.fechaFin.toISOString(),
              cabanaId: formData.cabanaId
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error calculando precio');
          }

          const precioData = await response.json();
          
          if (precioData.success) {
            // Agrupar desglose por tipo para mostrar mejor
            const desgloseAgrupado = [];
            const agrupadoPorTipo = {};
            
            if (precioData.desglose && precioData.desglose.length > 0) {
              precioData.desglose.forEach(dia => {
                // Determinar categoría según el backend
                let tipo;
                if (dia.tipo === 'feriado') {
                  tipo = 'Feriado';
                } else if (dia.categoria === 'Lunes a Jueves') {
                  tipo = 'Lunes a Jueves';
                } else if (dia.categoria === 'Viernes') {
                  tipo = 'Viernes';
                } else if (dia.categoria === 'Sábado') {
                  tipo = 'Sábado';
                } else if (dia.categoria === 'Domingo') {
                  tipo = 'Domingo';
                } else {
                  tipo = dia.categoria || dia.tipo;
                }
                
                if (!agrupadoPorTipo[tipo]) {
                  agrupadoPorTipo[tipo] = {
                    tipo,
                    cantidad: 0,
                    precioUnitario: dia.precio,
                    subtotal: 0
                  };
                }
                agrupadoPorTipo[tipo].cantidad++;
                agrupadoPorTipo[tipo].subtotal += dia.precio;
              });
              
              Object.values(agrupadoPorTipo).forEach(agrupado => {
                if (agrupado.cantidad > 0) {
                  desgloseAgrupado.push(agrupado);
                }
              });
            }
            
            setPrecioCalculado({
              total: precioData.precioTotal || 0,
              desglose: precioData.desglose || [],
              desgloseAgrupado,
              totalNoches: precioData.totalNoches || 0,
              precioFormateado: formatearPrecioArgentino(precioData.precioTotal)
            });
            
            // Actualizar también en formData para enviar al backend
            setFormData(prev => ({ 
              ...prev, 
              precioTotal: precioData.precioTotal || 0 
            }));
            
            setError('');
          } else {
            throw new Error(precioData.error || 'Error al calcular precio');
          }
          
        } catch (err) {
          console.error('Error calculando precio:', err);
          setPrecioCalculado({
            total: 0,
            desglose: [],
            desgloseAgrupado: [],
            totalNoches: 0,
            precioFormateado: '$0'
          });
          setFormData(prev => ({ ...prev, precioTotal: 0 }));
          setError(err.message);
        } finally {
          setLoading(prev => ({ ...prev, calculando: false }));
        }
      } else {
        setPrecioCalculado({
          total: 0,
          desglose: [],
          desgloseAgrupado: [],
          totalNoches: 0,
          precioFormateado: '$0'
        });
        setFormData(prev => ({ ...prev, precioTotal: 0 }));
      }
    };

    calcularPrecioDinamico();
  }, [formData.fechaInicio, formData.fechaFin, formData.cabanaId, token]);

  // Función para renderizar el desglose de precios
  const renderDesglosePrecios = () => {
    if (!precioCalculado.desgloseAgrupado || precioCalculado.desgloseAgrupado.length === 0) {
      return null;
    }

    return (
      <div className="mt-3 p-3 bg-light rounded">
        <h6 className="mb-2">
          <FaTag className="me-2" />
          Desglose de Precios
        </h6>
        <ListGroup variant="flush">
          {precioCalculado.desgloseAgrupado.map((item, index) => (
            <ListGroup.Item
              key={index}
              className="d-flex justify-content-between align-items-center px-0 py-1"
              style={{ borderTop: 'none', boxShadow: 'none', backgroundColor: 'transparent' }}
            >
              <span>
                <Badge 
                  bg={
                    item.tipo === 'Lunes a Jueves' ? 'info' :
                    item.tipo === 'Viernes' ? 'warning' :
                    item.tipo === 'Sábado' ? 'primary' :
                    item.tipo === 'Domingo' ? 'secondary' :
                    'danger'
                  } 
                  className="me-2"
                >
                  {item.tipo === 'Lunes a Jueves' ? 'L-J' :
                   item.tipo === 'Viernes' ? 'V' :
                   item.tipo === 'Sábado' ? 'S' :
                   item.tipo === 'Domingo' ? 'D' : 'F'}
                </Badge>
                {item.cantidad} {item.cantidad === 1 ? 'noche' : 'noches'} ({item.tipo})
              </span>
              <span className="fw-bold">
                {formatearPrecioArgentino(item.subtotal)}
              </span>
            </ListGroup.Item>
          ))}
          <ListGroup.Item
            className="d-flex justify-content-between align-items-center border-0 px-0 py-1 mt-2 pt-2"
            style={{ borderTop: 'none', boxShadow: 'none', backgroundColor: 'transparent' }}
          >
            <span className="fw-bold">Total {precioCalculado.totalNoches} noche{precioCalculado.totalNoches !== 1 ? 's' : ''}:</span>
            <span className="fs-5 fw-bold text-success">
              {precioCalculado.precioFormateado}
            </span>
          </ListGroup.Item>
        </ListGroup>
        
        <div className="small text-muted mt-2">
          <div><strong>Tarifas:</strong> Lunes a Jueves: $180.000 - Viernes y Domingo: $200.000 - Sábados: $220.000 - Feriados: $250.000</div>
        </div>
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, form: true }));
    setError('');

    try {
      // Validar campos obligatorios
      const requiredFields = {
        cabanaId: 'Cabaña',
        fechaInicio: 'Fecha de inicio',
        fechaFin: 'Fecha de fin',
        'huesped.nombre': 'Nombre del huésped',
        'huesped.apellido': 'Apellido del huésped',
        'huesped.dni': 'DNI del huésped'
      };
      
      const missingFields = [];
      for (const [field, label] of Object.entries(requiredFields)) {
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          if (!formData[parent]?.[child]) missingFields.push(label);
        } else if (!formData[field]) {
          missingFields.push(label);
        }
      }

      if (missingFields.length > 0) {
        throw new Error(`Faltan campos obligatorios: ${missingFields.join(', ')}`);
      }

      // Validar fechas
      if (new Date(formData.fechaInicio) >= new Date(formData.fechaFin)) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }

      // Validar DNI
      if (!/^\d+$/.test(formData.huesped.dni)) {
        throw new Error('El DNI debe contener solo números');
      }

      // Validar disponibilidad
      if (fechasOcupadas.length > 0) {
        const start = new Date(formData.fechaInicio);
        const end = new Date(formData.fechaFin);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        
        const current = new Date(start);
        while (current < end) {
          const dateStr = current.toISOString().split('T')[0];
          const isOcupada = fechasOcupadas.some(fecha => 
            fecha.toISOString().split('T')[0] === dateStr
          );
          
          if (isOcupada) {
            throw new Error(`La fecha ${dateStr} ya está ocupada. Seleccione otras fechas.`);
          }
          current.setDate(current.getDate() + 1);
        }
      }

      // Preparar payload (precioTotal NO se envía, el backend lo calcula)
      const payload = {
        cabanaId: formData.cabanaId,
        fechaInicio: formData.fechaInicio.toISOString(),
        fechaFin: formData.fechaFin.toISOString(),
        huesped: {
          nombre: formData.huesped.nombre.trim(),
          apellido: formData.huesped.apellido.trim(),
          dni: formData.huesped.dni.trim(),
          direccion: formData.huesped.direccion?.trim() || '',
          telefono: formData.huesped.telefono?.trim() || '',
          email: formData.huesped.email?.trim() || ''
        }
      };

      console.log('Enviando reserva:', payload);

      const response = await fetch(`${API_URL}/api/reservas/admin/crear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Error al crear la reserva');
      }

      navigate('/admin/reservas', { 
        state: { 
          success: `Reserva creada exitosamente! ID: ${responseData.data?._id || ''}`,
          tipo: 'success'
        } 
      });

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(prev => ({ ...prev, form: false }));
    }
  };

  const handleHuespedChange = (field, value) => {
    setFormData({
      ...formData,
      huesped: {
        ...formData.huesped,
        [field]: value
      }
    });
  };

  if (!isAuthenticated || !isAdmin()) {
    return null;
  }

  return (
    <Container className="mt-4">
      <h2 className="text-center mb-4">Crear Reserva Manual</h2>
      
      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
        </Alert>
      )}

      <Card className="p-4">
        <Form onSubmit={handleSubmit}>
          <Row>
            {/* Sección: Datos del Huésped */}
            <Col md={12}>
              <h4 className="mb-3 border-bottom pb-2 d-flex align-items-center">
                <FaUser className="me-2" />
                Datos del Huésped
              </h4>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FaUser className="me-1" /> Nombre <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  value={formData.huesped.nombre}
                  onChange={(e) => handleHuespedChange('nombre', e.target.value)}
                  required
                  placeholder="Ej: Juan"
                  disabled={loading.form}
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FaUser className="me-1" /> Apellido <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  value={formData.huesped.apellido}
                  onChange={(e) => handleHuespedChange('apellido', e.target.value)}
                  required
                  placeholder="Ej: Pérez"
                  disabled={loading.form}
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FaUser className="me-1" /> DNI <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  value={formData.huesped.dni}
                  onChange={(e) => handleHuespedChange('dni', e.target.value.replace(/\D/g, '').slice(0, 8))}
                  required
                  pattern="\d{7,8}"
                  placeholder="Ej: 12345678"
                  disabled={loading.form}
                />
                <small className="text-muted">7 u 8 números sin puntos</small>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FaPhone className="me-1" /> Teléfono
                </Form.Label>
                <Form.Control
                  type="tel"
                  value={formData.huesped.telefono}
                  onChange={(e) => handleHuespedChange('telefono', e.target.value)}
                  placeholder="Ej: 11 2345-6789"
                  disabled={loading.form}
                />
              </Form.Group>
            </Col>
            
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FaEnvelope className="me-1" /> Email
                </Form.Label>
                <Form.Control
                  type="email"
                  value={formData.huesped.email}
                  onChange={(e) => handleHuespedChange('email', e.target.value)}
                  placeholder="ejemplo@email.com"
                  disabled={loading.form}
                />
              </Form.Group>
            </Col>
            
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FaHome className="me-1" /> Dirección
                </Form.Label>
                <Form.Control
                  type="text"
                  value={formData.huesped.direccion}
                  onChange={(e) => handleHuespedChange('direccion', e.target.value)}
                  placeholder="Ej: Calle Falsa 123"
                  disabled={loading.form}
                />
              </Form.Group>
            </Col>

            {/* Sección: Datos de la Reserva */}
            <Col md={12}>
              <h4 className="mb-3 mt-4 border-bottom pb-2 d-flex align-items-center">
                <FaCalendarAlt className="me-2" />
                Datos de la Reserva
              </h4>
            </Col>
            
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Cabaña <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  value={formData.cabanaId}
                  onChange={(e) => setFormData({...formData, cabanaId: e.target.value})}
                  required
                  disabled={loading.initial || loading.form}
                >
                  <option value="">
                    {loading.initial ? 'Cargando cabañas...' : 
                     cabanas.length === 0 ? 'No hay cabañas disponibles' : 'Seleccionar cabaña...'}
                  </option>
                  {Array.isArray(cabanas) && cabanas.map((cabana) => (
                    <option key={cabana._id} value={cabana._id}>
                      {cabana.nombre} (Capacidad: {cabana.capacidad || 2})
                    </option>
                  ))}
                </Form.Select>
                {formData.cabanaId && fechasOcupadas.length > 0 && (
                  <small className="text-muted d-block mt-1">
                    <FaCalendarAlt className="me-1" />
                    {fechasOcupadas.length} día{fechasOcupadas.length !== 1 ? 's' : ''} ocupado{fechasOcupadas.length !== 1 ? 's' : ''} en el calendario
                  </small>
                )}
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Fecha Check-in <span className="text-danger">*</span></Form.Label>
                <DatePicker
                  selected={formData.fechaInicio}
                  onChange={(date) => setFormData({...formData, fechaInicio: date})}
                  selectsStart
                  startDate={formData.fechaInicio}
                  endDate={formData.fechaFin}
                  minDate={new Date()}
                  excludeDates={fechasOcupadas}
                  className="form-control"
                  required
                  disabled={loading.form || !formData.cabanaId}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Seleccione fecha de entrada"
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Fecha Check-out <span className="text-danger">*</span></Form.Label>
                <DatePicker
                  selected={formData.fechaFin}
                  onChange={(date) => setFormData({...formData, fechaFin: date})}
                  selectsEnd
                  startDate={formData.fechaInicio}
                  endDate={formData.fechaFin}
                  minDate={formData.fechaInicio || new Date()}
                  excludeDates={fechasOcupadas}
                  className="form-control"
                  required
                  disabled={loading.form || !formData.fechaInicio || !formData.cabanaId}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Seleccione fecha de salida"
                />
              </Form.Group>
            </Col>
            
            {/* Sección de Precio Calculado */}
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Precio Total Calculado</Form.Label>
                <div className="border p-3 rounded bg-light">
                  {loading.calculando ? (
                    <div className="text-center">
                      <Spinner size="sm" animation="border" className="me-2" />
                      Calculando precio...
                    </div>
                  ) : formData.fechaInicio && formData.fechaFin && formData.cabanaId ? (
                    <div>
                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-2">
                          <span><strong>Estadía:</strong></span>
                          <span>
                            {formData.fechaInicio.toLocaleDateString('es-ES', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })} - {formData.fechaFin.toLocaleDateString('es-ES', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span><strong>Total noches:</strong></span>
                          <span>{precioCalculado.totalNoches}</span>
                        </div>
                      </div>
                      
                      {renderDesglosePrecios()}
                    </div>
                  ) : (
                    <div className="text-muted text-center">
                      <FaCalendarAlt className="mb-2" size={24} />
                      <p className="mb-0">
                        Seleccione una cabaña y las fechas de check-in y check-out para calcular el precio
                      </p>
                    </div>
                  )}
                </div>
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-between mt-4">
            <Button 
              variant="outline-secondary" 
              onClick={() => navigate('/admin/reservas')}
              disabled={loading.form || loading.calculando}
            >
              Cancelar
            </Button>
            
            <Button 
              variant="primary" 
              type="submit" 
              disabled={loading.form || loading.calculando || precioCalculado.total <= 0}
              className="px-4"
            >
              {loading.form ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Creando reserva...
                </>
              ) : (
                <>
                  <FaMoneyBillWave className="me-2" />
                  Confirmar Reserva - {precioCalculado.precioFormateado}
                </>
              )}
            </Button>
          </div>
        </Form>
      </Card>
    </Container>
  );
};

export default CrearReservaAdmin;
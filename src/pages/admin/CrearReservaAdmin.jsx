import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Container, Form, Row, Col, Card, Button, Alert, 
  Spinner, ListGroup, Badge 
} from 'react-bootstrap';
import { API_URL } from '../../config';
import { formatearPrecioArgentino, getOccupiedDates, calcularPrecioReserva } from '../../config';
import { FaCalendarAlt, FaMoneyBillWave, FaTag, FaUser, FaPhone, FaEnvelope, FaHome } from 'react-icons/fa';
import CalendarFull from '../../components/CalendarFull';

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
  const [selectedDates, setSelectedDates] = useState({ start: null, end: null });
  
  const processCabanasData = (data) => {
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    if (data?.cabanas && Array.isArray(data.cabanas)) return data.cabanas;
    return [];
  };

  const [formData, setFormData] = useState({
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

  // ============================================
  // FUNCIÓN AUXILIAR PARA FORMATEAR FECHAS
  // ============================================
  const formatDateForAPI = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // ============================================
  // REDIRECCIONES DE AUTENTICACIÓN
  // ============================================
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

  // ============================================
  // OBTENER CABAÑAS
  // ============================================
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
        
        const processedCabanas = processCabanasData(data);
        
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

  // ============================================
  // OBTENER FECHAS OCUPADAS
  // ============================================
  useEffect(() => {
    const fetchFechasOcupadas = async () => {
      if (!formData.cabanaId) {
        setFechasOcupadas([]);
        return;
      }

      try {  
        const dates = await getOccupiedDates(formData.cabanaId);
        setFechasOcupadas(dates);
      } catch (error) {
        setFechasOcupadas([]);
      }
    };

    if (formData.cabanaId) {
      fetchFechasOcupadas();
    }
  }, [formData.cabanaId]);

  // ============================================
  // ACTUALIZAR FORMDATA CON FECHAS SELECCIONADAS
  // ============================================
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      fechaInicio: selectedDates.start,
      fechaFin: selectedDates.end
    }));
  }, [selectedDates]);

  // ============================================
  // CALCULAR PRECIO DINÁMICO
  // ============================================
  useEffect(() => {
    const calcularPrecioDinamico = async () => {
      if (!selectedDates.start || !selectedDates.end || !formData.cabanaId) {
        setPrecioCalculado({
          total: 0,
          desglose: [],
          desgloseAgrupado: [],
          totalNoches: 0,
          precioFormateado: '$0'
        });
        return;
      }

      if (selectedDates.start >= selectedDates.end) {
        setError('La fecha de fin debe ser posterior al inicio');
        return;
      }

      setLoading(prev => ({ ...prev, calculando: true }));
      
      try {
        const precioData = await calcularPrecioReserva(
          selectedDates.start,
          selectedDates.end,
          formData.cabanaId
        );

        const desgloseAgrupado = [];
        const agrupadoPorTipo = {};
        
        if (precioData.desglose && precioData.desglose.length > 0) {
          precioData.desglose.forEach(dia => {
            const tipo = dia.tipo;
            if (!agrupadoPorTipo[tipo]) {
              agrupadoPorTipo[tipo] = {
                tipo,
                cantidad: 0,
                precioUnitario: dia.precioUnitario || dia.precio || 0,
                subtotal: 0
              };
            }
            agrupadoPorTipo[tipo].cantidad++;
            agrupadoPorTipo[tipo].subtotal += dia.precioUnitario || dia.precio || 0;
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

        setError('');
      } catch (err) {
        console.error('❌ Error calculando precio:', err);
        setError(err.message);
        setPrecioCalculado({
          total: 0,
          desglose: [],
          desgloseAgrupado: [],
          totalNoches: 0,
          precioFormateado: '$0'
        });
      } finally {
        setLoading(prev => ({ ...prev, calculando: false }));
      }
    };

    calcularPrecioDinamico();
  }, [selectedDates.start, selectedDates.end, formData.cabanaId]);

  // ============================================
  // RENDERIZAR DESGLOSE DE PRECIOS
  // ============================================
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
                    item.tipo === 'semana' ? 'info' :
                    item.tipo === 'fin de semana' ? 'warning' :
                    'danger'
                  } 
                  className="me-2"
                >
                  {item.tipo === 'semana' ? 'L-J' :
                   item.tipo === 'fin de semana' ? 'V-D' : 'F'}
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
      </div>
    );
  };

  // ============================================
  // VALIDAR DISPONIBILIDAD
  // ============================================
  const validarDisponibilidad = () => {
    if (!selectedDates.start || !selectedDates.end) {
      return { valido: false, error: 'Selecciona un rango de fechas válido' };
    }
    
    const startDate = new Date(selectedDates.start);
    const endDate = new Date(selectedDates.end);
    
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (startDate < today) {
      return { valido: false, error: 'No puedes seleccionar fechas pasadas' };
    }

    if (precioCalculado.total <= 0) {
      return { valido: false, error: 'El precio calculado no es válido' };
    }

    console.log('🔍 Validando disponibilidad:');
    console.log('   - Fechas seleccionadas:', {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    });
    console.log('   - Fechas ocupadas:', fechasOcupadas);

    let tieneConflicto = false;
    let fechaConflicto = null;
    const current = new Date(startDate);
    
    while (current < endDate) {
      const dateStr = current.toISOString().split('T')[0];
      
      if (fechasOcupadas.includes(dateStr)) {
        tieneConflicto = true;
        fechaConflicto = dateStr;
        console.log(`❌ Conflicto: La noche del ${dateStr} está ocupada`);
        break;
      }
      
      console.log(`✅ Noche del ${dateStr} disponible`);
      current.setDate(current.getDate() + 1);
    }
    
    if (tieneConflicto) {
      return { valido: false, error: `La noche del ${fechaConflicto} ya está reservada. Selecciona otras fechas.` };
    }

    console.log('✅ Todas las noches están disponibles');
    return { valido: true };
  };

  // ============================================
  // HANDLE SUBMIT
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validacion = validarDisponibilidad();
    if (!validacion.valido) {
      setError(validacion.error);
      return;
    }

    setLoading(prev => ({ ...prev, form: true }));
    setError('');

    try {
      const requiredFields = {
        cabanaId: 'Cabaña',
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

      if (!/^\d+$/.test(formData.huesped.dni)) {
        throw new Error('El DNI debe contener solo números');
      }

      // 🔥 FORMATEAR FECHAS CORRECTAMENTE PARA EL BACKEND
      const fechaInicio = formatDateForAPI(selectedDates.start);
      const fechaFin = formatDateForAPI(selectedDates.end);

      const payload = {
        cabanaId: formData.cabanaId,
        fechaInicio: fechaInicio,
        fechaFin: fechaFin,
        huesped: {
          nombre: formData.huesped.nombre.trim(),
          apellido: formData.huesped.apellido.trim(),
          dni: formData.huesped.dni.trim(),
          direccion: formData.huesped.direccion?.trim() || '',
          telefono: formData.huesped.telefono?.trim() || '',
          email: formData.huesped.email?.trim() || ''
        }
      };

      console.log('📤 Enviando reserva:', payload);

      const response = await fetch(`${API_URL}/api/reservas/admin/crear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();
      console.log('📥 Respuesta:', responseData);

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
      console.error('❌ Error:', error);
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

  const noches = (() => {
    if (!selectedDates.start || !selectedDates.end) return 0;
    const start = new Date(selectedDates.start);
    const end = new Date(selectedDates.end);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return Math.floor((end - start) / 86400000);
  })();

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
                  onChange={(e) => {
                    setFormData({...formData, cabanaId: e.target.value});
                    setSelectedDates({ start: null, end: null });
                  }}
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
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Seleccionar Fechas <span className="text-danger">*</span></Form.Label>
                <CalendarFull 
                  cabanaId={formData.cabanaId}
                  onDatesSelected={(start, end) => {
                    console.log('📅 Fechas seleccionadas en calendario:', {
                      start: start ? new Date(start).toISOString().split('T')[0] : null,
                      end: end ? new Date(end).toISOString().split('T')[0] : null
                    });
                    
                    if (start && end) {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      
                      if (start < today) {
                        setError('No puedes seleccionar fechas pasadas');
                        return;
                      }
                      
                      if (start >= end) {
                        setError('La fecha de fin debe ser posterior al inicio');
                        return;
                      }
                      
                      setSelectedDates({ start, end });
                      setError('');
                    }
                  }}
                  precioPorNoche={cabanas.find(c => c._id === formData.cabanaId)?.precio || 0}
                  showTotal={false}
                />
                {!formData.cabanaId && (
                  <small className="text-muted">
                    Selecciona una cabaña primero para ver la disponibilidad
                  </small>
                )}
              </Form.Group>
            </Col>
            
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Precio Total Calculado</Form.Label>
                <div className="border p-3 rounded bg-light">
                  {loading.calculando ? (
                    <div className="text-center">
                      <Spinner size="sm" animation="border" className="me-2" />
                      Calculando precio...
                    </div>
                  ) : selectedDates.start && selectedDates.end && formData.cabanaId ? (
                    <div>
                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-2">
                          <span><strong>Estadía:</strong></span>
                          <span>
                            {new Date(selectedDates.start).toLocaleDateString('es-ES', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })} - {new Date(selectedDates.end).toLocaleDateString('es-ES', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span><strong>Total noches:</strong></span>
                          <span>{precioCalculado.totalNoches || noches}</span>
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
              disabled={loading.form || loading.calculando || precioCalculado.total <= 0 || !selectedDates.start || !selectedDates.end}
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
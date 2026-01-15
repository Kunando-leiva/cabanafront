import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Spinner, ListGroup, Badge } from 'react-bootstrap';
import { 
  FaCalendarAlt, FaMoneyBillWave, FaHome, FaUser, FaPhone, 
  FaEnvelope, FaComment, FaCalendarDay, FaTag, FaArrowLeft 
} from 'react-icons/fa';
import { formatearPrecioArgentino } from '../../config.js';

export default function Reservar() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    dni: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    comentarios: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reservaData, setReservaData] = useState({
    noches: 0,
    total: 0,
    precioNoche: 0,
    desglosePrecios: [],
    fechaInicio: null,
    fechaFin: null
  });
  const [isMounted, setIsMounted] = useState(false);
  const formRef = useRef(null);
  const containerRef = useRef(null);

  // Controlar montaje del componente
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Validar y calcular datos al cargar el componente
  useEffect(() => {
    if (!isMounted) return;

    if (!state) {
      setError('No se encontraron datos de reserva');
      navigate('/cabanas', { replace: true });
      return;
    }

    if (!state.fechaInicio || !state.fechaFin) {
      setError('Fechas de reserva no especificadas');
      setTimeout(() => navigate('/cabanas'), 2000);
      return;
    }

    if (!state.precioTotal && state.precioTotal !== 0) {
      setError('Precio no especificado');
      return;
    }

    try {
      const fechaInicio = new Date(state.fechaInicio);
      const fechaFin = new Date(state.fechaFin);
      
      if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
        throw new Error('Fechas inválidas');
      }

      const diffTime = Math.abs(fechaFin - fechaInicio);
      const noches = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      setReservaData({
        noches,
        total: state.precioTotal || 0,
        precioNoche: state.precio || 0,
        desglosePrecios: state.precioDesglose || [],
        fechaInicio: state.fechaInicio,
        fechaFin: state.fechaFin
      });
    } catch (err) {
      console.error('Error al procesar fechas:', err);
      setError('Error al procesar los datos de reserva');
    }
  }, [state, isMounted, navigate]);

  // Función para mostrar desglose de precios
  const renderDesglosePrecios = useCallback(() => {
    if (!reservaData.desglosePrecios || !Array.isArray(reservaData.desglosePrecios) || reservaData.desglosePrecios.length === 0) {
      return null;
    }

    const resumen = {
      semana: { count: 0, total: 0 },
      finSemana: { count: 0, total: 0 },
      feriado: { count: 0, total: 0 }
    };

    reservaData.desglosePrecios.forEach(dia => {
      if (!dia || !dia.tipo) return;
      
      const tipo = dia.tipo.includes('fin de semana') || dia.tipo.includes('finSemana') 
        ? 'finSemana' 
        : dia.tipo.includes('feriado') 
          ? 'feriado' 
          : 'semana';
      
      if (resumen[tipo]) {
        resumen[tipo].count += 1;
        resumen[tipo].total += dia.precio || 0;
      }
    });

    return (
      <div className="mt-3 p-3 bg-light rounded">
        <h6 className="mb-2">
          <FaTag className="me-2" />
          Desglose de Precios
        </h6>
        <ListGroup variant="flush">
          {resumen.semana.count > 0 && (
            <ListGroup.Item className="d-flex justify-content-between align-items-center border-0 px-0 py-1">
              <span>
                <Badge bg="info" className="me-2">L-V</Badge>
                {resumen.semana.count} día{resumen.semana.count !== 1 ? 's' : ''} semana
              </span>
              <span className="fw-bold">
                {formatearPrecioArgentino(resumen.semana.total)}
              </span>
            </ListGroup.Item>
          )}
          {resumen.finSemana.count > 0 && (
            <ListGroup.Item className="d-flex justify-content-between align-items-center border-0 px-0 py-1">
              <span>
                <Badge bg="warning" className="me-2">S-D</Badge>
                {resumen.finSemana.count} fin{resumen.finSemana.count !== 1 ? 'es' : ''} de semana
              </span>
              <span className="fw-bold">
                {formatearPrecioArgentino(resumen.finSemana.total)}
              </span>
            </ListGroup.Item>
          )}
          {resumen.feriado.count > 0 && (
            <ListGroup.Item className="d-flex justify-content-between align-items-center border-0 px-0 py-1">
              <span>
                <Badge bg="danger" className="me-2">F</Badge>
                {resumen.feriado.count} feriado{resumen.feriado.count !== 1 ? 's' : ''}
              </span>
              <span className="fw-bold">
                {formatearPrecioArgentino(resumen.feriado.total)}
              </span>
            </ListGroup.Item>
          )}
          <ListGroup.Item className="d-flex justify-content-between align-items-center border-0 px-0 py-1 mt-2 pt-2 border-top">
            <span className="fw-bold">Total {reservaData.noches} noche{reservaData.noches !== 1 ? 's' : ''}:</span>
            <span className="fs-5 fw-bold text-success">
              {formatearPrecioArgentino(reservaData.total)}
            </span>
          </ListGroup.Item>
        </ListGroup>
        
        <div className="small text-muted mt-2">
          <div><strong>Tarifas:</strong> Lunes a Viernes: $150.000 - Sábado/Domingo: $180.000 - Feriados: $200.000</div>
        </div>
      </div>
    );
  }, [reservaData.desglosePrecios, reservaData.noches, reservaData.total]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (!isMounted) return;
    
    setLoading(true);
    setError('');

    // Validación adicional
    if (!reservaData.total || reservaData.total <= 0) {
      setError('El total de la reserva no es válido');
      setLoading(false);
      return;
    }

    // Validar datos del formulario
    if (!formData.nombre.trim() || !formData.dni.trim() || !formData.email.trim() || !formData.telefono.trim()) {
      setError('Complete todos los campos obligatorios');
      setLoading(false);
      return;
    }

    // Validar DNI
    if (!/^\d{7,8}$/.test(formData.dni)) {
      setError('El DNI debe tener 7 u 8 números');
      setLoading(false);
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Ingrese un email válido');
      setLoading(false);
      return;
    }

    // Validar teléfono
    if (!/^[\d\s\-\(\)\+]+$/.test(formData.telefono)) {
      setError('Ingrese un teléfono válido');
      setLoading(false);
      return;
    }

    // Preparar datos para enviar
    const reservaFinal = {
      ...state,
      ...formData,
      ...reservaData,
      precioFormateado: formatearPrecioArgentino(reservaData.total),
      fechaReserva: new Date().toISOString()
    };

    // Simular envío a la API
    setTimeout(() => {
      if (!isMounted) return;
      
      // Usar replace: true para evitar problemas de navegación
      navigate('/confirmacion-reserva', { 
        state: reservaFinal,
        replace: true 
      });
    }, 800);

  }, [formData, reservaData, state, navigate, isMounted]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleGoBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  if (!isMounted) {
    return (
      <Container className="my-5 d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (error && !loading) {
    return (
      <Container className="my-5" ref={containerRef}>
        <Alert variant="danger" className="text-center">
          <h4>Error</h4>
          <p>{error}</p>
          <div className="mt-3">
            <Button variant="primary" onClick={handleGoBack}>
              <FaArrowLeft className="me-2" /> Volver
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  // Formatear fechas de forma segura
  const formatDateSafe = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  return (
    <Container className="my-5" ref={containerRef}>
      <Card className="shadow" ref={formRef}>
        <Card.Body>
          <div className="mb-4">
            <Button 
              variant="outline-secondary" 
              onClick={handleGoBack}
              className="mb-3"
            >
              <FaArrowLeft className="me-2" /> Volver
            </Button>
            <h2 className="text-center mb-4">Confirmar Reserva</h2>
          </div>
          
          {/* Detalles de la Reserva */}
          <div className="mb-4 p-3 bg-light rounded">
            <h5 className="mb-3">
              <FaCalendarAlt className="me-2" /> Detalles de la reserva
            </h5>
            
            <div className="d-flex justify-content-between mb-2">
              <span><strong>Cabaña:</strong></span>
              <span>{state?.cabanaNombre || 'No especificada'}</span>
            </div>
            
            <div className="d-flex justify-content-between mb-2">
              <span><strong>Fechas:</strong></span>
              <span>
                {formatDateSafe(state?.fechaInicio)} - {formatDateSafe(state?.fechaFin)}
              </span>
            </div>
            
            <div className="d-flex justify-content-between mb-2">
              <span><strong>Check-in:</strong></span>
              <span>12:00 PM</span>
            </div>

            <div className="d-flex justify-content-between mb-2">
              <span><strong>Check-out:</strong></span>
              <span>10:00 AM</span>
            </div>

            <div className="d-flex justify-content-between mb-2">
              <span><strong>Noches:</strong></span>
              <span>{reservaData.noches}</span>
            </div>
            
            {/* Desglose de precios */}
            {renderDesglosePrecios()}
          </div>

          {/* Formulario de Contacto */}
          <Form onSubmit={handleSubmit} id="reserva-form">
            <h5 className="mb-3">
              <FaUser className="me-2" /> Información personal
              <span className="text-danger ms-1">* Campos obligatorios</span>
            </h5>
            
            <Form.Group className="mb-3">
              <Form.Label>
                <FaUser className="me-2" /> Nombre completo <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                required
                minLength={3}
                maxLength={100}
                placeholder="Ej: Juan Pérez"
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                <FaUser className="me-2" /> DNI <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                value={formData.dni}
                onChange={(e) => handleInputChange('dni', e.target.value.replace(/\D/g, '').slice(0, 8))}
                required
                minLength={7}
                maxLength={8}
                pattern="\d{7,8}"
                title="7 u 8 números sin puntos"
                placeholder="Ej: 12345678"
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                <FaEnvelope className="me-2" /> Email <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                placeholder="ejemplo@email.com"
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                <FaPhone className="me-2" /> Teléfono <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="tel"
                value={formData.telefono}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                required
                minLength={8}
                placeholder="Ej: 11 2345-6789"
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                <FaHome className="me-2" /> Dirección
              </Form.Label>
              <Form.Control
                type="text"
                value={formData.direccion}
                onChange={(e) => handleInputChange('direccion', e.target.value)}
                placeholder="Ej: Calle Falsa 123"
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                <FaHome className="me-2" /> Ciudad
              </Form.Label>
              <Form.Control
                type="text"
                value={formData.ciudad}
                onChange={(e) => handleInputChange('ciudad', e.target.value)}
                placeholder="Ej: Buenos Aires"
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>
                <FaComment className="me-2" /> Comentarios adicionales
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.comentarios}
                onChange={(e) => handleInputChange('comentarios', e.target.value)}
                placeholder="Indica si tienes requerimientos especiales, horarios especiales, etc."
                disabled={loading}
                maxLength={500}
              />
            </Form.Group>

            {error && (
              <Alert 
                variant="danger" 
                className="mb-3"
                dismissible
                onClose={() => setError('')}
              >
                {error}
              </Alert>
            )}

            <div className="d-grid gap-2">
              <Button 
                variant="primary" 
                type="submit" 
                size="lg"
                disabled={loading || !reservaData.total || !isMounted}
                style={{
                  fontWeight: 600,
                  lineHeight: '1.6',
                  marginBottom: '1.5rem',
                  backgroundColor: '#eaac25',
                  borderColor: '#00000666',
                  transition: 'all 0.3s ease',
                  opacity: loading ? 0.7 : 1
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                {loading ? (
                  <>
                    <Spinner 
                      as="span" 
                      animation="border" 
                      size="sm" 
                      role="status" 
                      aria-hidden="true" 
                      className="me-2"
                    />
                    <span>Procesando reserva...</span>
                  </>
                ) : (
                  <>
                    <FaMoneyBillWave className="me-2" />
                    Confirmar Reserva - {formatearPrecioArgentino(reservaData.total)}
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
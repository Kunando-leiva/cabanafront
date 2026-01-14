import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Spinner, ListGroup, Badge } from 'react-bootstrap';
import { 
  FaCalendarAlt, FaMoneyBillWave, FaHome, FaUser, FaPhone, 
  FaEnvelope, FaComment, FaCalendarDay, FaTag 
} from 'react-icons/fa';
import { formatearPrecioArgentino } from '../../services/api'; // ✅ AGREGAR IMPORT

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
    desglosePrecios: [], // ✅ NUEVO: Para mostrar desglose
    fechaInicio: null,
    fechaFin: null
  });

  // ✅ MODIFICADO: Validar y calcular datos al cargar el componente
  useEffect(() => {
    if (!state) {
      setError('No se encontraron datos de reserva');
      return;
    }

    if (!state.fechaInicio || !state.fechaFin) {
      setError('Fechas de reserva no especificadas');
      return;
    }

    if (!state.precioTotal && state.precioTotal !== 0) {
      setError('Precio no especificado');
      return;
    }

    const fechaInicio = new Date(state.fechaInicio);
    const fechaFin = new Date(state.fechaFin);
    const diffTime = Math.abs(fechaFin - fechaInicio);
    const noches = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // ✅ Usar precioTotal enviado desde CabanaDetalle (ya calculado dinámicamente)
    setReservaData({
      noches,
      total: state.precioTotal || 0,
      precioNoche: state.precio || 0,
      desglosePrecios: state.precioDesglose || [], // ✅ Usar desglose si está disponible
      fechaInicio: state.fechaInicio,
      fechaFin: state.fechaFin
    });
  }, [state]);

  // ✅ NUEVO: Función para mostrar desglose de precios
  const renderDesglosePrecios = () => {
    if (!reservaData.desglosePrecios || reservaData.desglosePrecios.length === 0) {
      return null;
    }

    const resumen = {
      semana: { count: 0, total: 0 },
      finSemana: { count: 0, total: 0 },
      feriado: { count: 0, total: 0 }
    };

    reservaData.desglosePrecios.forEach(dia => {
      const tipo = dia.tipo.replace('fin de semana', 'finSemana').replace(' ', '');
      if (resumen[tipo]) {
        resumen[tipo].count += 1;
        resumen[tipo].total += dia.precio;
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
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validación adicional
    if (!reservaData.total || reservaData.total <= 0) {
      setError('El total de la reserva no es válido');
      setLoading(false);
      return;
    }

    // Validar datos del formulario
    if (!formData.nombre || !formData.dni || !formData.email || !formData.telefono) {
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

    // Simular envío a la API (aquí deberías integrar con tu backend real)
    setTimeout(() => {
      navigate('/confirmacion-reserva', { 
        state: {
          ...state,
          ...formData,
          ...reservaData,
          precioFormateado: formatearPrecioArgentino(reservaData.total)
        }
      });
    }, 1000);
  };

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger" className="text-center">
          {error}
          <div className="mt-3">
            <Button variant="primary" onClick={() => navigate('/')}>
              <FaHome className="me-2" /> Volver al inicio
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <Card className="shadow">
        <Card.Body>
          <h2 className="mb-4 text-center">Confirmar Reserva</h2>
          
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
                {new Date(state?.fechaInicio).toLocaleDateString('es-ES')} - 
                {' '}{new Date(state?.fechaFin).toLocaleDateString('es-ES')}
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
            
            {/* ✅ Desglose de precios */}
            {renderDesglosePrecios()}
          </div>

          {/* Formulario de Contacto */}
          <Form onSubmit={handleSubmit}>
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
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                required
                minLength={3}
                placeholder="Ej: Juan Pérez"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                <FaUser className="me-2" /> DNI <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                value={formData.dni}
                onChange={(e) => setFormData({...formData, dni: e.target.value.replace(/\D/g, '')})}
                required
                minLength={7}
                maxLength={8}
                pattern="\d{7,8}"
                title="7 u 8 números sin puntos"
                placeholder="Ej: 12345678"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                <FaEnvelope className="me-2" /> Email <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                placeholder="ejemplo@email.com"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                <FaPhone className="me-2" /> Teléfono <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                required
                placeholder="Ej: 11 2345-6789"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                <FaHome className="me-2" /> Dirección
              </Form.Label>
              <Form.Control
                type="text"
                value={formData.direccion}
                onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                placeholder="Ej: Calle Falsa 123"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                <FaHome className="me-2" /> Ciudad
              </Form.Label>
              <Form.Control
                type="text"
                value={formData.ciudad}
                onChange={(e) => setFormData({...formData, ciudad: e.target.value})}
                placeholder="Ej: Buenos Aires"
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
                onChange={(e) => setFormData({...formData, comentarios: e.target.value})}
                placeholder="Indica si tienes requerimientos especiales, horarios especiales, etc."
              />
            </Form.Group>

            {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

            <div className="d-grid gap-2">
              <Button 
                variant="primary" 
                type="submit" 
                size="lg"
                disabled={loading || !reservaData.total}
                style={{
                  fontWeight: 300,
                  lineHeight: '1.6',
                  marginBottom: '1.5rem',
                  backgroundColor: '#eaac25',
                  borderColor: '#00000666',
                }}
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    <span className="ms-2">Procesando...</span>
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
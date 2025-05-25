import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { FaCalendarAlt, FaMoneyBillWave, FaHome, FaUser, FaPhone, FaEnvelope, FaComment } from 'react-icons/fa';

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
    precioNoche: 0
  });

  // Validar y calcular datos al cargar el componente
  useEffect(() => {
    if (!state) {
      setError('No se encontraron datos de reserva');
      return;
    }

    if (!state.fechaInicio || !state.fechaFin) {
      setError('Fechas de reserva no especificadas');
      return;
    }

    if (!state.precioTotal && !state.precio) {
      setError('Precio no especificado');
      return;
    }

    const fechaInicio = new Date(state.fechaInicio);
    const fechaFin = new Date(state.fechaFin);
    const diffTime = Math.abs(fechaFin - fechaInicio);
    const noches = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    setReservaData({
      noches,
      total: state.precioTotal || (noches * state.precio).toFixed(2),
      precioNoche: state.precio
    });
  }, [state]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validación adicional
    if (!reservaData.total || reservaData.total <= 0) {
      setError('El total de la reserva no es válido');
      setLoading(false);
      return;
    }

    // Simular envío a la API
    setTimeout(() => {
      navigate('/confirmacion-reserva', { 
        state: {
          ...state,
          ...formData,
          ...reservaData
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
            <h5 className="mb-3"><FaCalendarAlt className="me-2" /> Detalles de la reserva</h5>
            
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
              <span><strong>check-in :</strong></span>
              <span>12:00 PM</span>
            </div>

             <div className="d-flex justify-content-between mb-2">
              <span><strong>check-out :</strong></span>
              <span>10:00 AM</span>
            </div>

            <div className="d-flex justify-content-between mb-2">
              <span><strong>Noches:</strong></span>
              <span>{reservaData.noches}</span>
            </div>
            
            
            
            <div className="d-flex justify-content-between mt-3 pt-2 border-top">
              <span><strong><FaMoneyBillWave className="me-2" />Total:</strong></span>
              <span className="fw-bold">${reservaData.total?.toLocaleString('es-ES')}</span>
            </div>
          </div>

          {/* Formulario de Contacto */}
          <Form onSubmit={handleSubmit}>
            <h5 className="mb-3"><FaUser className="me-2" /> Información personal</h5>
            
            <Form.Group className="mb-3">
              <Form.Label><FaUser className="me-2" /> Nombre completo</Form.Label>
              <Form.Control
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                required
                minLength={3}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label><FaUser className="me-2" /> DNI</Form.Label>
              <Form.Control
                type="text"
                value={formData.dni}
                onChange={(e) => setFormData({...formData, dni: e.target.value})}
                required
                minLength={7}
                maxLength={8}
              />
            </Form.Group>



            <Form.Group className="mb-3">
              <Form.Label><FaEnvelope className="me-2" /> Email</Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label><FaPhone className="me-2" /> Teléfono</Form.Label>
              <Form.Control
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label><FaHome className="me-2" /> Dirección</Form.Label>
              <Form.Control
                type="text"
                value={formData.direccion}
                onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                required
                minLength={5}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label><FaHome className="me-2" /> Ciudad</Form.Label>
              <Form.Control
                type="text"
                value={formData.ciudad}
                onChange={(e) => setFormData({...formData, ciudad: e.target.value})}
                required
                minLength={3}
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label><FaComment className="me-2" /> Comentarios adicionales</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.comentarios}
                onChange={(e) => setFormData({...formData, comentarios: e.target.value})}
                placeholder="Indica si tienes requerimientos especiales"
              />
            </Form.Group>

            {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

            <div className="d-grid gap-2">
              <Button 
                variant="primary" 
                type="submit" 
                size="lg"
                disabled={loading || !reservaData.total}
                style={{fontWeight: 300,
            lineHeight: '1.6', // Interlineado ajustado
            marginBottom: '1.5rem',
            backgroundColor: '#eaac25',
            borderColor: '#00000666',
         
          }
                }
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"  />
                    <span className="ms-2">Procesando...</span>
                  </>
                ) : (
                  'Confirmar Reserva'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Card, Alert, Button, Spinner, ListGroup, Row, Col, Badge } from 'react-bootstrap';
import { FaWhatsapp, FaEnvelope, FaCheckCircle, FaCalendarAlt, FaMoneyBillWave, FaBed, FaDoorOpen, FaDoorClosed } from 'react-icons/fa';
import axios from 'axios';
import { API_URL } from '../../config';

export default function ConfirmacionReserva() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [precioData, setPrecioData] = useState(null);
  const [error, setError] = useState('');

  // Función para formatear fecha en español
  const formatDateSpanish = (dateString) => {
    const fecha = new Date(dateString);
    const options = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    return fecha.toLocaleDateString('es-ES', options);
  };

  // Función para obtener nombre del día
  const getNombreDia = (fecha) => {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[new Date(fecha).getDay()];
  };

  // Calcular precio cuando se monta el componente
  useEffect(() => {
    const calcularPrecio = async () => {
      if (!state?.fechaInicio || !state?.fechaFin) return;

      try {
        setLoading(true);
        setError('');

        const response = await axios.post(`${API_URL}/api/reservas/calcular-precio`, {
          fechaInicio: state.fechaInicio,
          fechaFin: state.fechaFin,
          cabanaId: state.cabanaId
        });

        if (response.data.success) {
          setPrecioData(response.data);
        } else {
          setError(response.data.error || 'Error al calcular precio');
        }
      } catch (err) {
        console.error('Error al calcular precio:', err);
        setError(err.response?.data?.error || 'Error al conectar con el servidor');
      } finally {
        setLoading(false);
      }
    };

    calcularPrecio();
  }, [state]);

  // Mensajes para WhatsApp y Email (con los precios calculados)
  const mensajeWhatsapp = `Hola, quiero confirmar mi reserva:

*Cabaña:* ${state?.cabanaNombre}
*Fechas:* ${formatDateSpanish(state?.fechaInicio)} al ${formatDateSpanish(state?.fechaFin)}
*Noches:* ${precioData?.totalNoches || 'Calculando...'}
*Check-in:* 12:00 PM
*Check-out:* 10:00 AM

*Desglose de Precios:*
${precioData?.desglose?.map(noche => 
  `• ${getNombreDia(noche.fecha)} ${noche.fecha}: $${noche.precio.toLocaleString('es-AR')}`
).join('\n') || 'Calculando...'}

*Total:* ${precioData?.precioTotalFormateado || 'Calculando...'}

*Mis datos:*
*Nombre:* ${state?.nombre}
*DNI:* ${state?.dni}
*Teléfono:* ${state?.telefono}
*Email:* ${state?.email}
*Dirección:* ${state?.direccion}
*Ciudad:* ${state?.ciudad}

*Comentarios:* ${state?.comentarios || 'Ninguno'}`;

  const asuntoEmail = `Confirmación de Reserva - ${state?.cabanaNombre}`;
  const cuerpoEmail = `DETALLES DE LA RESERVA
=======================
Cabaña: ${state?.cabanaNombre}
Fechas: ${formatDateSpanish(state?.fechaInicio)} al ${formatDateSpanish(state?.fechaFin)}
Noches: ${precioData?.totalNoches || 'Calculando...'}
Check-in: 12:00 PM
Check-out: 10:00 AM

DESGLOSE DE PRECIOS
===================
${precioData?.desglose?.map(noche => 
  `${getNombreDia(noche.fecha)} ${noche.fecha}: $${noche.precio.toLocaleString('es-AR')}`
).join('\n') || 'Calculando...'}

TOTAL: ${precioData?.precioTotalFormateado || 'Calculando...'}

MIS DATOS
=========
Nombre: ${state?.nombre}
DNI: ${state?.dni}
Teléfono: ${state?.telefono}
Email: ${state?.email}
Dirección: ${state?.direccion}
Ciudad: ${state?.ciudad}

Comentarios: ${state?.comentarios || 'Ninguno'}`;

  return (
    <Container className="my-5">
      <Card className="shadow">
        <Card.Header className="bg-success text-white text-center py-4">
          <FaCheckCircle size={64} className="mb-3" />
          <h1 className="mb-0">¡Tu solicitud de reserva está generada!</h1>
          <p className="lead mb-0 mt-2">Elegí el método por donde te querés comunicar con nosotros para finalizar</p>
        </Card.Header>
        
        <Card.Body className="p-4">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="success" />
              <p className="mt-3">Calculando precio de la reserva...</p>
            </div>
          ) : error ? (
            <Alert variant="danger" className="text-center">
              <h5>Error al calcular el precio</h5>
              <p>{error}</p>
              <Button variant="outline-danger" onClick={() => navigate(-1)}>
                Volver y reintentar
              </Button>
            </Alert>
          ) : (
            <>
              {/* Detalles de la reserva */}
              <div className="mb-5">
                <h3 className="text-center mb-4 text-dark">
                  <FaCalendarAlt className="me-2" />
                  Detalles de la reserva
                </h3>
                
                <Row className="mb-4">
                  <Col md={6}>
                    <div className="p-3 bg-light rounded mb-3">
                      <h5><strong>Cabaña:</strong></h5>
                      <p className="h4 text-primary">{state?.cabanaNombre}</p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="p-3 bg-light rounded mb-3">
                      <h5><strong>Noches:</strong></h5>
                      <p className="h4 text-primary">
                        <FaBed className="me-2" />
                        {precioData?.totalNoches || 0} noches
                      </p>
                    </div>
                  </Col>
                </Row>

                <Row className="mb-4">
                  <Col md={6}>
                    <div className="p-3 bg-light rounded mb-3">
                      <h5><strong>Check-in:</strong></h5>
                      <p className="h5">
                        <FaDoorOpen className="me-2 text-success" />
                        {formatDateSpanish(state?.fechaInicio)}
                      </p>
                      <p className="mb-0"><strong>Horario:</strong> 12:00 PM</p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="p-3 bg-light rounded mb-3">
                      <h5><strong>Check-out:</strong></h5>
                      <p className="h5">
                        <FaDoorClosed className="me-2 text-warning" />
                        {formatDateSpanish(state?.fechaFin)}
                      </p>
                      <p className="mb-0"><strong>Horario:</strong> 10:00 AM</p>
                    </div>
                  </Col>
                </Row>

                {/* Desglose de precios */}
                <div className="mb-4">
                  <h4 className="text-center mb-3 text-dark">
                    <FaMoneyBillWave className="me-2" />
                    Desglose de precios
                  </h4>
                  
                  <ListGroup>
                    {precioData?.desglose?.map((noche, index) => (
                      <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                        <div>
                          <Badge bg={
                            noche.tipo === 'feriado' ? 'danger' : 
                            noche.categoria === 'Sábado' ? 'warning' :
                            noche.categoria === 'Viernes' || noche.categoria === 'Domingo' ? 'info' : 'secondary'
                          } className="me-2">
                            {noche.categoria}
                          </Badge>
                          <strong>{getNombreDia(noche.fecha)}</strong> - {noche.fecha}
                        </div>
                        <span className="fw-bold">${noche.precio.toLocaleString('es-AR')}</span>
                      </ListGroup.Item>
                    ))}
                    
                    <ListGroup.Item className="bg-primary text-white d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Total {precioData?.totalNoches} noches</h5>
                      <h4 className="mb-0">{precioData?.precioTotalFormateado}</h4>
                    </ListGroup.Item>
                  </ListGroup>
                </div>

                {/* Resumen por tipo */}
                {precioData?.cuentaPorTipo && (
                  <div className="mb-4">
                    <h5 className="text-center mb-3">Resumen por categoría</h5>
                    <Row className="text-center">
                      {Object.entries(precioData.cuentaPorTipo).map(([tipo, cantidad]) => (
                        cantidad > 0 && (
                          <Col key={tipo} xs={6} md={3} className="mb-2">
                            <div className="p-2 border rounded">
                              <small className="text-muted d-block">{tipo}</small>
                              <strong>{cantidad} {cantidad === 1 ? 'noche' : 'noches'}</strong>
                            </div>
                          </Col>
                        )
                      ))}
                    </Row>
                  </div>
                )}
              </div>

              {/* Información del huésped */}
              <Alert variant="info" className="my-4">
                <h5 className="mb-3">Información del huésped</h5>
                <Row>
                  <Col md={6}><strong>Nombre:</strong> {state?.nombre}</Col>
                  <Col md={6}><strong>DNI:</strong> {state?.dni}</Col>
                  <Col md={6}><strong>Teléfono:</strong> {state?.telefono}</Col>
                  <Col md={6}><strong>Email:</strong> {state?.email}</Col>
                  <Col md={12}><strong>Dirección:</strong> {state?.direccion}</Col>
                  <Col md={12}><strong>Ciudad:</strong> {state?.ciudad}</Col>
                  {state?.comentarios && (
                    <Col md={12} className="mt-2">
                      <strong>Comentarios:</strong> {state?.comentarios}
                    </Col>
                  )}
                </Row>
              </Alert>

              {/* Tarifas de referencia */}
              <Alert variant="light" className="text-center border">
                <h6 className="mb-2">Tarifas vigentes</h6>
                <div className="d-flex flex-wrap justify-content-center gap-3">
                  <Badge bg="secondary">Lunes a Jueves: $180.000</Badge>
                  <Badge bg="info">Viernes y Domingo: $200.000</Badge>
                  <Badge bg="warning">Sábados: $220.000</Badge>
                  <Badge bg="danger">Feriados: $250.000</Badge>
                </div>
              </Alert>

              {/* Botones de contacto */}
              <div className="text-center mt-5 mb-4">
                <h4 className="mb-4">Contactanos para confirmar tu reserva</h4>
                <div className="d-flex justify-content-center gap-4">
                  <Button 
                    variant="success" 
                    size="lg"
                    className="px-5 py-3 d-flex align-items-center"
                    href={`https://wa.me/+5491164680413?text=${encodeURIComponent(mensajeWhatsapp)}`}
                    target="_blank"
                  >
                    <FaWhatsapp size={24} className="me-3" />
                    <div className="text-start">
                      <strong>WhatsApp</strong><br />
                      <small>Respuesta inmediata</small>
                    </div>
                  </Button>
                  
                  <Button
                    variant="primary"
                    size="lg"
                    className="px-5 py-3 d-flex align-items-center"
                    href={`mailto:Nathanquarta427@gmail.com?subject=${encodeURIComponent(asuntoEmail)}&body=${encodeURIComponent(cuerpoEmail)}`}
                  >
                    <FaEnvelope size={24} className="me-3" />
                    <div className="text-start">
                      <strong>Email</strong><br />
                      <small>Confirmación formal</small>
                    </div>
                  </Button>
                </div>
              </div>
            </>
          )}

          <div className="text-center mt-4">
            <Button 
              variant="outline-secondary" 
              onClick={() => navigate('/')}
              className="px-4"
            >
              Volver al inicio
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Card, Alert, Button, Spinner, Row, Col, Badge } from 'react-bootstrap';
import { FaWhatsapp, FaEnvelope, FaCheckCircle, FaCalendarAlt, FaMoneyBillWave, FaBed, FaDoorOpen, FaDoorClosed } from 'react-icons/fa';
import axios from 'axios';
import { API_URL } from '../../config';

// Estilos personalizados como constante fuera del componente
const responsiveStyles = `
  @media (max-width: 768px) {
    .tarifas-container {
      flex-direction: column !important;
      gap: 0.5rem !important;
    }
    .tarifas-container .badge {
      width: 100%;
      margin: 0.25rem 0;
      padding: 0.75rem !important;
    }
    .desglose-item {
      flex-direction: column;
      align-items: flex-start !important;
      gap: 0.5rem;
    }
    .desglose-item span:last-child {
      align-self: flex-end;
    }
    .responsive-stack {
      flex-direction: column !important;
    }
    .responsive-stack > * {
      width: 100% !important;
      margin-bottom: 0.5rem;
    }
  }
  
  @media (max-width: 576px) {
    .display-6 {
      font-size: 1.5rem;
    }
    .lead-sm {
      font-size: 0.95rem;
    }
  }
  
  /* Mejoras para los badges de tarifas */
  .tarifas-container .badge {
    font-size: 0.85rem;
    font-weight: normal;
    transition: all 0.3s ease;
  }
  
  .tarifas-container .badge:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
  
  /* Animación suave para los botones */
  .contact-button {
    transition: all 0.3s ease !important;
  }
  
  .contact-button:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 16px rgba(0,0,0,0.2) !important;
  }
  
  /* Mejora para la información del huésped en móvil */
  @media (max-width: 576px) {
    .guest-info {
      font-size: 0.9rem;
    }
    .guest-info strong {
      display: block;
      font-size: 0.8rem;
      color: #666;
    }
  }
`;

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
    <>
      {/* Inyectar estilos de forma segura */}
      <style type="text/css">{responsiveStyles}</style>
      
      <Container className="my-3 my-md-5">
        {/* Card con fondo blanco, sin sombras, bordes redondeados */}
        <Card 
          className="border-0" 
          style={{ 
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)'
          }}
        >
          <Card.Header 
            className="bg-success text-white text-center py-3 py-md-4 border-0"
            style={{ 
              background: 'linear-gradient(145deg, #eaac25 0%, #eaac25 100%)',
              borderBottom: 'none'
            }}
          >
            <FaCheckCircle size={48} className="mb-2 mb-md-3 d-none d-sm-inline opacity-90" />
            <FaCheckCircle size={32} className="mb-2 d-sm-none opacity-90" />
            <h1 className="h3 h2-md mb-0 fw-semibold">¡Tu solicitud de reserva está generada!</h1>
            <p className="lead lead-sm mb-0 mt-2 px-2 opacity-85">
              Elegí el método por donde te querés comunicar con nosotros para finalizar
            </p>
          </Card.Header>
          
          <Card.Body className="p-3 p-md-4" style={{ backgroundColor: '#ffffff' }}>
            {loading ? (
              <div className="text-center py-4 py-md-5">
                <Spinner animation="border" variant="success" />
                <p className="mt-3 text-muted">Calculando precio de la reserva...</p>
              </div>
            ) : error ? (
              <Alert variant="danger" className="text-center border-0 rounded-4">
                <h5 className="h6 h5-md">Error al calcular el precio</h5>
                <p className="small mb-3">{error}</p>
                <Button variant="outline-danger" size="sm" onClick={() => navigate(-1)}>
                  Volver y reintentar
                </Button>
              </Alert>
            ) : (
              <>
                {/* Detalles de la reserva */}
                <div className="mb-4 mb-md-5">
                  <h3 className="text-center mb-3 mb-md-4 text-dark h4 h3-md fw-semibold">
                    <FaCalendarAlt className="me-2 text-success" style={{ color: '#eaac25' }} />
                    Detalles de la reserva
                  </h3>
                  
                  <Row className="mb-3 mb-md-4 g-3">
                    <Col xs={12} md={6}>
                      <div className="p-3 bg-light rounded-4 h-100 border-0">
                        <h5 className="h6 h5-md text-muted mb-1"><strong>Cabaña:</strong></h5>
                        <p className="h5 h4-md text-success mb-0 fw-bold">{state?.cabanaNombre}</p>
                      </div>
                    </Col>
                    <Col xs={12} md={6}>
                      <div className="p-3 bg-light rounded-4 h-100 border-0">
                        <h5 className="h6 h5-md text-muted mb-1"><strong>Noches:</strong></h5>
                        <p className="h5 h4-md text-success mb-0 fw-bold">
                          <FaBed className="me-2" />
                          {precioData?.totalNoches || 0} noches
                        </p>
                      </div>
                    </Col>
                  </Row>

                  <Row className="mb-3 mb-md-4 g-3">
                    <Col xs={12} md={6}>
                      <div className="p-3 bg-light rounded-4 h-100 border-0">
                        <h5 className="h6 h5-md text-muted mb-1"><strong>Check-in:</strong></h5>
                        <p className="h6 h5-md mb-1 fw-semibold">
                          <FaDoorOpen className="me-2 text-success" />
                          {formatDateSpanish(state?.fechaInicio)}
                        </p>
                        <p className="mb-0 small text-muted"><strong>Horario:</strong> 12:00 PM</p>
                      </div>
                    </Col>
                    <Col xs={12} md={6}>
                      <div className="p-3 bg-light rounded-4 h-100 border-0">
                        <h5 className="h6 h5-md text-muted mb-1"><strong>Check-out:</strong></h5>
                        <p className="h6 h5-md mb-1 fw-semibold">
                          <FaDoorClosed className="me-2 text-warning" />
                          {formatDateSpanish(state?.fechaFin)}
                        </p>
                        <p className="mb-0 small text-muted"><strong>Horario:</strong> 10:00 AM</p>
                      </div>
                    </Col>
                  </Row>

                  {/* Desglose de precios - CORREGIDO: sin bordes negros */}
                  <div className="mb-4">
                    <h4 className="text-center mb-3 text-dark h5 h4-md fw-semibold">
                      <FaMoneyBillWave className="me-2 text-success" />
                      Desglose de precios
                    </h4>
                    
                    {/* Contenedor sin bordes ni sombras */}
                    <div className="d-flex flex-column gap-2">
                      {precioData?.desglose?.map((noche, index) => (
                        <div 
                          key={index} 
                          className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center p-3 rounded-4"
                          style={{ 
                            backgroundColor: '#f8f9fa',
                            border: 'none'
                          }}
                        >
                          <div className="mb-2 mb-sm-0 d-flex align-items-center flex-wrap gap-2">
                            <Badge 
                              bg={
                                noche.tipo === 'feriado' ? 'danger' : 
                                noche.categoria === 'Sábado' ? 'warning' :
                                noche.categoria === 'Viernes' || noche.categoria === 'Domingo' ? 'info' : 'secondary'
                              } 
                              className="p-2 rounded-3"
                              style={{ fontSize: '0.8rem' }}
                            >
                              {noche.categoria}
                            </Badge>
                            <span className="text-dark" style={{ fontSize: '0.95rem' }}>
                              {new Date(noche.fecha).toLocaleDateString('es-ES', { 
                                weekday: 'long', 
                                day: 'numeric', 
                                month: 'long' 
                              })}
                            </span>
                          </div>
                          <span className="fw-bold text-success" style={{ fontSize: '1.1rem' }}>
                            ${noche.precio.toLocaleString('es-AR')}
                          </span>
                        </div>
                      ))}
                      
                      {/* Total */}
                      <div 
                        className="d-flex flex-column flex-sm-row justify-content-between align-items-center p-3 rounded-4 text-white"
                        style={{ 
                          background: 'linear-gradient(145deg, #eaac25 0%, #eaac25 100%)',
                          border: 'none',
                          marginTop: '0.5rem'
                        }}
                      >
                        <h5 className="mb-1 mb-sm-0 h6 h5-md fw-semibold">Total {precioData?.totalNoches} noches</h5>
                        <h4 className="mb-0 h5 h4-md fw-bold">{precioData?.precioTotalFormateado}</h4>
                      </div>
                    </div>
                  </div>

                  {/* Resumen por tipo - CORREGIDO: sin bordes */}
                  {precioData?.cuentaPorTipo && (
                    <div className="mb-4">
                      <h5 className="text-center mb-3 h6 h5-md text-muted">Resumen por categoría</h5>
                      <Row className="text-center g-2">
                        {Object.entries(precioData.cuentaPorTipo).map(([tipo, cantidad]) => (
                          cantidad > 0 && (
                            <Col key={tipo} xs={6} md={3} className="mb-2">
                              <div 
                                className="p-3 rounded-4"
                                style={{ backgroundColor: '#f8f9fa' }}
                              >
                                <small className="text-muted d-block text-uppercase" style={{ fontSize: '0.75rem' }}>{tipo}</small>
                                <strong className="text-success" style={{ fontSize: '1rem' }}>{cantidad} {cantidad === 1 ? 'noche' : 'noches'}</strong>
                              </div>
                            </Col>
                          )
                        ))}
                      </Row>
                    </div>
                  )}
                </div>

                {/* Información del huésped */}
                <Alert variant="info" className="my-3 my-md-4 p-3 guest-info border-0 rounded-4" style={{ backgroundColor: '#e3f2fd' }}>
                  <h5 className="mb-3 h6 h5-md fw-semibold" style={{ color: '#0a58ca' }}>Información del huésped</h5>
                  <Row className="g-2">
                    <Col xs={12} sm={6}><span className="text-muted">Nombre:</span> <span className="fw-semibold">{state?.nombre}</span></Col>
                    <Col xs={12} sm={6}><span className="text-muted">DNI:</span> <span className="fw-semibold">{state?.dni}</span></Col>
                    <Col xs={12} sm={6}><span className="text-muted">Teléfono:</span> <span className="fw-semibold">{state?.telefono}</span></Col>
                    <Col xs={12} sm={6}><span className="text-muted">Email:</span> <span className="fw-semibold">{state?.email}</span></Col>
                    <Col xs={12}><span className="text-muted">Dirección:</span> <span className="fw-semibold">{state?.direccion}</span></Col>
                    <Col xs={12}><span className="text-muted">Ciudad:</span> <span className="fw-semibold">{state?.ciudad}</span></Col>
                    {state?.comentarios && (
                      <Col xs={12} className="mt-2">
                        <span className="text-muted">Comentarios:</span> <span className="fw-semibold">{state?.comentarios}</span>
                      </Col>
                    )}
                  </Row>
                </Alert>

                {/* Botones de contacto */}
                <div className="text-center mt-4 mt-md-5 mb-4">
                  <h4 className="mb-3 mb-md-4 h5 h4-md fw-semibold">Contactanos para confirmar tu reserva</h4>
                  
                  {/* Versión para móvil: vertical, para desktop: horizontal */}
                  <div className="d-flex flex-column flex-md-row justify-content-center gap-3 gap-md-4">
                    {/* Botón WhatsApp - Verde */}
                    <Button 
                      variant="success" 
                      size="lg"
                      className="contact-button px-4 px-md-5 py-3 d-flex align-items-center justify-content-center w-100 w-md-auto border-0 rounded-4"
                      href={`https://wa.me/+5491164680413?text=${encodeURIComponent(mensajeWhatsapp)}`}
                      target="_blank"
                      style={{ 
                        backgroundColor: '#25D366',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <FaWhatsapp size={24} className="me-3 flex-shrink-0" />
                      <div className="text-start">
                        <strong>WhatsApp</strong><br />
                        <small className="opacity-75">Respuesta inmediata</small>
                      </div>
                    </Button>
                    
                    {/* Botón Email - Amarillo/Dorado */}
                    <Button
                      variant="warning"
                      size="lg"
                      className="contact-button px-4 px-md-5 py-3 d-flex align-items-center justify-content-center w-100 w-md-auto border-0 rounded-4 text-dark"
                      href={`mailto:Nathanquarta427@gmail.com?subject=${encodeURIComponent(asuntoEmail)}&body=${encodeURIComponent(cuerpoEmail)}`}
                      style={{ 
                        backgroundColor: '#FFC107',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <FaEnvelope size={24} className="me-3 flex-shrink-0" />
                      <div className="text-start">
                        <strong>Email</strong><br />
                        <small className="opacity-75">Confirmación formal</small>
                      </div>
                    </Button>
                  </div>
                  
                  {/* Indicadores debajo de los botones */}
                  <div className="mt-3 mt-md-4 text-muted d-flex flex-column flex-sm-row justify-content-center gap-2 gap-sm-4">
                    <span className="d-inline-flex align-items-center small">
                      <FaCheckCircle className="text-success me-1" size={14} /> Respuesta inmediata
                    </span>
                    <span className="d-inline-flex align-items-center small">
                      <FaCheckCircle className="text-warning me-1" size={14} /> Confirmación formal
                    </span>
                  </div>
                </div>
              </>
            )}

            <div className="text-center mt-3 mt-md-4">
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate('/')}
                className="px-4 py-2 rounded-4 border-0"
                style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
              >
                Volver al inicio
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </>
  );
}
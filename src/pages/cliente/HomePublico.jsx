import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button, Container, Row, Col, Card, Alert, Overlay, Tooltip } from 'react-bootstrap';
import { FaWifi, FaSwimmingPool, FaSnowflake, FaStar, FaCalendarAlt, FaSearch, FaUtensils, FaTree, FaQuestionCircle, FaFacebook, FaInstagram, FaMapMarkerAlt, FaPhone, FaEnvelope, FaHome, FaConciergeBell, FaUsers } from 'react-icons/fa';
import PublicNavbar from '../../components/PublicNavbar';
import CalendarFull from '../../components/CalendarFull';
import { API_URL } from '../../config';
import './HomePublico.css';
import imagenRecorrido from '../../assets/images/recorrido.jpeg';
import encontrarnos from '../../assets/images/frente.jpeg';
import servicio from '../../assets/images/servicio.jpg';
import Footer from '../../components/admin/Footer';


export default function HomePublico() {
  const [cabanas, setCabanas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [availableCabanas, setAvailableCabanas] = useState([]);
  const [error, setError] = useState(null);
  const [searchStatus, setSearchStatus] = useState({
    loading: false,
    error: null,
    searched: false
  });
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTarget = useRef(null);
  const navigate = useNavigate();
  const isMounted = useRef(true);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Cerrar tooltip al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipTarget.current && !tooltipTarget.current.contains(event.target)) {
        setShowTooltip(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const getImageUrl = (imageData) => {
    if (!imageData) return `${API_URL}/default-cabana.jpg`;
    
    if (typeof imageData === 'string' && imageData.startsWith('http')) {
      return imageData;
    }
    
    if (typeof imageData === 'string') {
      return `${API_URL}${imageData.startsWith('/') ? '' : '/'}${imageData}`;
    }
    
    if (imageData.url) {
      return imageData.url.startsWith('http') 
        ? imageData.url 
        : `${API_URL}${imageData.url.startsWith('/') ? '' : '/'}${imageData.url}`;
    }
    
    if (imageData._id || imageData.fileId) {
      return `${API_URL}/api/images/${imageData._id || imageData.fileId}`;
    }
    
    return `${API_URL}/default-cabana.jpg`;
  };

  useEffect(() => {
    const fetchCabanas = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/cabanas?destacadas=true`);
        
        if (isMounted.current) {
          const data = response.data?.data || response.data;
          
          if (!Array.isArray(data)) {
            throw new Error('Formato de respuesta inválido');
          }

          const processedCabanas = data.map(cabana => ({
            ...cabana,
            imagenPrincipal: getImageUrl(cabana.imagenPrincipal || cabana.imagenes?.[0]),
            imagenes: (cabana.imagenes || []).map(img => ({
              ...img,
              url: getImageUrl(img)
            }))
          }));

          setCabanas(processedCabanas);
          setError(null);
        }
      } catch (err) {
        if (isMounted.current) {
          console.error('Error al cargar cabañas:', err);
          setError(err.message);
          setCabanas([]);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };
  
    fetchCabanas();
  }, []);

  const handleSearchAvailability = async () => {
    if (!dateRange.start || !dateRange.end) {
      setSearchStatus({
        loading: false,
        error: 'Por favor seleccione ambas fechas',
        searched: false
      });
      return;
    }

    try {
      setSearchStatus({ loading: true, error: null, searched: true });

      const formatDateForAPI = (date) => {
        const isoString = date.toISOString();
        return isoString.split('T')[0];
      };

      const fechaInicio = formatDateForAPI(dateRange.start);
      const fechaFin = formatDateForAPI(dateRange.end);

      const response = await axios.get(`${API_URL}/api/cabanas/disponibles`, {
        params: {
          fechaInicio,
          fechaFin
        },
        paramsSerializer: params => {
          return Object.entries(params)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');
        }
      });

      if (isMounted.current) {
        if (!response.data || !response.data.success) {
          throw new Error(response.data?.error || 'Respuesta inesperada del servidor');
        }

        const processedCabanas = (response.data.data || []).map(cabana => ({
          ...cabana,
          imagenPrincipal: cabana.imagenPrincipal || `${API_URL}/default-cabana.jpg`
        }));

        setAvailableCabanas(processedCabanas);
        setSearchStatus(prev => ({ ...prev, loading: false }));
      }

    } catch (error) {
      if (isMounted.current) {
        console.error('Error en búsqueda:', {
          error: error.response?.data || error.message,
          config: error.config
        });

        let errorMessage = 'Error al buscar disponibilidad';
        
        if (error.response) {
          errorMessage = error.response.data?.error || 
                        error.response.data?.message || 
                        'Error en el servidor';
        } else if (error.message) {
          errorMessage = error.message;
        }

        setSearchStatus({
          loading: false,
          error: errorMessage,
          searched: true
        });
        setAvailableCabanas([]);
      }
    }
  };

  const CabanaCard = ({ cabana, dateRange }) => {
    const noches = dateRange ? Math.ceil((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24)) : 0;
    const precioTotal = (noches * cabana.precio).toFixed(2);

    return (
      <Col>
        <Card className="h-100 shadow-sm">
          <div className="ratio ratio-16x9">
            <img
              src={cabana.imagenPrincipal}
              alt={cabana.nombre}
              className="card-img-top"
              style={{ objectFit: 'cover' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `${API_URL}/default-cabana.jpg`;
              }}
            />
          </div>
          <Card.Body className="d-flex flex-column">
            <Card.Title>{cabana.nombre}</Card.Title>
            <Card.Text className="text-muted">
              <small>
                <FaStar className="text-warning" /> {cabana.capacidad} personas · ${cabana.precio}/noche
              </small>
            </Card.Text>
            {dateRange && (
              <div className="mt-auto">
                <div className="d-flex justify-content-between mb-3">
                  <span>Total {noches} noches:</span>
                  <strong>${precioTotal}</strong>
                </div>
                <Button 
                  variant="primary" 
                  className="w-100 mb-2"
                  onClick={() => navigate(`/reservar/${cabana._id}`, {
                    state: {
                      cabanaId: cabana._id,
                      cabanaNombre: cabana.nombre,
                      fechaInicio: dateRange.start,
                      fechaFin: dateRange.end,
                      precioTotal,
                      imagenPrincipal: cabana.imagenPrincipal
                    }
                  })}
                >
                  Reservar ahora
                </Button>
              </div>
            )}
            <Button 
              as={Link}
              to={`/cabanas/${cabana._id}`}
              variant={dateRange ? "outline-primary" : "primary"}
              className="w-100"
              style={{
                fontWeight: 300,
                lineHeight: '1.6',
                marginBottom: '1.5rem',
                backgroundColor: '#eaac25',
                borderColor: '#eaac25',
              }}
            >
              Ver detalles
            </Button>
          </Card.Body>
        </Card>
      </Col>
    );
  };

  const FeaturedCabanas = () => {
    if (loading) {
      return (
        <div className="text-center py-5">
          <p>Cargando cabañas destacadas...</p>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="danger" className="text-center my-5">
          Error al cargar cabañas: {error}
        </Alert>
      );
    }

    return (
      <section className="py-5">
        <Container>
          <h2 className="text-center mb-5">Nuestras Cabañas Destacadas</h2>
          {cabanas.length > 0 ? (
            <Row xs={1} md={3} className="g-4">
              {cabanas.map(cabana => (
                <CabanaCard 
                  key={cabana._id} 
                  cabana={cabana} 
                  dateRange={null} 
                />
              ))}
            </Row>
          ) : (
            <Alert variant="info" className="text-center">
              No hay cabañas disponibles en este momento
            </Alert>
          )}
        </Container>
      </section>
    );
  };

  return (
    <div className="home-publico">
      <PublicNavbar />

      <section className="home-publico-hero bg-dark text-white text-center py-5 position-relative">
        <Container className="position-relative z-index-1">
          <h1 className="display-4 fw-bold mb-4">Complejo Los Alerces</h1>
          <p className="lead mb-4">Libertad - Pontevedra</p>
          <Button as={Link} to="/cabanas" variant="primary" size="lg">
            Ver Cabañas Disponibles
          </Button>
        </Container>
      </section>

      <section style={{ 
        color: 'white', 
        padding: '60px 0',
        position: 'relative', 
        overflow: 'hidden' 
      }}>
        <Container>
          <Row className="align-items-center">
            <Col md={5} className="order-md-1 order-2">
              <div style={{ padding: '20px' }}>
                <h2 style={{ 
                  fontWeight: 300, 
                  fontSize: '2rem',
                  letterSpacing: '1px',
                  marginBottom: '1.5rem'
                }}>
                  ¿Por qué elegirnos?
                </h2>
                <p style={{ 
                  fontSize: '1rem',
                  fontWeight: 300, 
                  lineHeight: '1.6',
                  marginBottom: '1.5rem',
                  textAlign: 'justify'
                }}>
                  Somos un grupo familiar que busca brindarte una experiencia única, para que te relajes y desconectes de la rutina.
                  Sin nada que envidiarle a ningún otro hospedaje, contamos con los mejores servicios de Buenos Aires y del país, pero en Libertad, Merlo.
                </p>
                <div className="text-center">
                  <Button 
                    onClick={() => navigate('/galeria')}
                    variant="outline-light"
                    style={{
                      padding: '10px 25px',
                      fontWeight: 300,
                      letterSpacing: '1px',
                      borderRadius: '0',
                      textTransform: 'uppercase',
                      width: '100%',
                      maxWidth: '200px'
                    }}
                  >
                    Ver fotos
                  </Button>
                </div>
              </div>
            </Col>

            <Col md={7} className="order-md-2 order-1 mb-4 mb-md-0">
              <div style={{
                height: '300px',
                width: '100%',
                backgroundImage: `url(${imagenRecorrido})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '8px'
              }} />
            </Col>
          </Row>
        </Container>
      </section>

      <section style={{  
        color: 'white', 
        padding: '60px 0',
        position: 'relative',
        overflow: 'hidden' 
      }}>
        <Container>
          <Row className="align-items-center">
            <Col md={7} className="order-md-2 order-1 mb-4 mb-md-0">
              <div 
                style={{
                  height: '300px',
                  width: '100%',
                  backgroundImage: `url(${encontrarnos})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: '8px'
                }}
                className="img-hover-zoom"
              />
            </Col>
            
            <Col md={5} className="order-2 order-md-2">
              <div style={{ padding: '0 15px' }}>
                <h2 style={{ 
                  fontWeight: 300,
                  fontSize: '2rem',
                  letterSpacing: '1px',
                  marginBottom: '1.5rem'
                }}>
                  ¿Listo para desconectar?
                </h2>
                <p style={{ 
                  fontSize: '1rem',
                  fontWeight: 300,
                  lineHeight: '1.6',
                  marginBottom: '1.5rem'
                }}>Ubicanos en:
                  Complejo Los Alerces
                  📍 7898+M4, Libertad, Provincia de Buenos Aires
                </p>
                <div className="text-center">
                  <Button 
                    onClick={() => navigate('/ubicacion')}
                    variant="outline-light"
                    style={{
                      padding: '10px 25px',
                      fontWeight: 300,
                      letterSpacing: '1px',
                      borderRadius: '0',
                      textTransform: 'uppercase',
                      width: '100%',
                      maxWidth: '200px'
                    }}
                  >
                    Ver ubicación
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <section style={{ 
        color: 'white', 
        padding: '60px 0',
        position: 'relative', 
        overflow: 'hidden' 
      }}>
        <Container>
          <Row className="align-items-center">
            <Col md={5} className="order-md-1 order-2">
              <div style={{ padding: '20px' }}>
                <h2 style={{ 
                  fontWeight: 300, 
                  fontSize: '2rem',
                  letterSpacing: '1px',
                  marginBottom: '1.5rem'
                }}>
                  Nuestros Servicios 
                </h2>
                <p style={{ 
                  fontSize: '1rem',
                  fontWeight: 300, 
                  lineHeight: '1.6',
                  marginBottom: '1.5rem',
                  textAlign: 'justify'
                }}>
                  Te ofrecemos todo lo que necesitás para una estadía perfecta, con servicios pensados para tu comodidad y relax. 
                  Disfrutá de la calidad que nos caracteriza, en un entorno donde cada detalle está cuidado para vos.
                </p>
                <div className="text-center">
                  <Button 
                    onClick={() => navigate('/servicios')}
                    variant="outline-light"
                    style={{
                      padding: '10px 25px',
                      fontWeight: 300,
                      letterSpacing: '1px',
                      borderRadius: '0',
                      textTransform: 'uppercase',
                      width: '100%',
                      maxWidth: '200px'
                    }}
                  >
                    Ver servicios
                  </Button>
                </div>
              </div>
            </Col>

            <Col md={7} className="order-md-2 order-1 mb-4 mb-md-0">
              <div style={{
                height: '300px',
                width: '100%',
                backgroundImage: `url(${servicio})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '8px'
              }} />
            </Col>
          </Row>
        </Container>
      </section>

      <section className="py-4 bg-light">
        <Container>
          <h3 className="text-center mb-4" style={{ color: "#333" }}>
            <FaCalendarAlt className="me-2" />
            Consultar disponibilidad
          </h3>

          <Row className="justify-content-center mb-3">
            <Col lg={8} className="text-center">
              <div className="d-inline-block position-relative">
                <div 
                  ref={tooltipTarget}
                  className="btn btn-sm btn-outline-secondary rounded-pill mb-3"
                  onClick={() => setShowTooltip(!showTooltip)}
                  style={{ cursor: 'pointer' }}
                >
                  <FaQuestionCircle className="me-1" />
                  Modo de elegir fechas
                </div>

                <Overlay target={tooltipTarget.current} show={showTooltip} placement="bottom">
                  {(props) => (
                    <Tooltip id="date-instructions-tooltip" {...props}>
                      <div className="text-start">
                        <strong>Instrucciones para seleccionar fechas:</strong>
                        <ul className="mb-0">
                          <li>Primer click: Selecciona fecha de inicio</li>
                          <li>Segundo click: Selecciona fecha de fin</li>
                          <li>Doble click: Cancela o reinicia selección</li>
                        </ul>
                      </div>
                    </Tooltip>
                  )}
                </Overlay>
              </div>
            </Col>
          </Row>
          
          <Row className="justify-content-center mb-3">
            <Col lg={8}>
              <CalendarFull 
                onDatesSelected={(start, end) => {
                  if (isMounted.current) {
                    setDateRange({ start, end });
                    setSearchStatus(prev => ({ ...prev, error: null }));
                  }
                }}
                showInline={true}
              />
            </Col>
          </Row>
          
          <Row className="justify-content-center">
            <Col md={4} className="text-center">
              <Button 
                variant="primary" 
                onClick={handleSearchAvailability}
                disabled={searchStatus.loading || !dateRange.start || !dateRange.end}
              >
                {searchStatus.loading ? (
                  "Buscando..."
                ) : (
                  <>
                    <FaSearch className="me-2" />
                    Buscar disponibilidad
                  </>
                )}
              </Button>
            </Col>
          </Row>
          
          {dateRange.start && dateRange.end && (
            <>
              {searchStatus.searched && !searchStatus.loading && availableCabanas.length > 0 && (
                <Row className="justify-content-center mt-2">
                  <Col md={8}>
                    <Alert variant="success" className="text-center">
                      {availableCabanas.length} {availableCabanas.length === 1 ? 'Cabaña disponible' : 'Cabañas disponibles'} del {formatDate(dateRange.start)} al {formatDate(dateRange.end)}
                    </Alert>
                  </Col>
                </Row>
              )}
            </>
          )}
        </Container>
      </section>

      {searchStatus.searched && (
        <section className="py-5">
          <Container>
            {searchStatus.loading ? (
              <div className="text-center">
                <p>Buscando cabañas disponibles...</p>
              </div>
            ) : searchStatus.error ? (
              <Alert variant="danger" className="text-center">
                {searchStatus.error}
              </Alert>
            ) : availableCabanas.length > 0 ? (
              <>
                <h2 className="text-center mb-5 text-white">
                  {availableCabanas.length} Cabañas disponibles del {formatDate(dateRange.start)} al {formatDate(dateRange.end)}
                </h2>
                <Row xs={1} md={3} className="g-4">
                  {availableCabanas.map(cabana => (
                    <CabanaCard 
                      key={cabana._id}
                      cabana={cabana}
                      dateRange={dateRange}
                    />
                  ))}
                </Row>
              </>
            ) : (
              <Alert variant="warning" className="text-center">
                No hay cabañas disponibles para las fechas seleccionadas.
              </Alert>
            )}
          </Container>
        </section>
      )}

      <Footer />
    </div>
  );
}

function formatDate(date) {
  return date?.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }) || '';
}

function calcularNoches(start, end) {
  if (!start || !end || start >= end) return 0;
  
  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);

  const diffMs = endDate - startDate;
  
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)); 
}
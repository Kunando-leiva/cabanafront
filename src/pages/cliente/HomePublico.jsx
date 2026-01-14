import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button, Container, Row, Col, Card, Alert, Overlay, Tooltip } from 'react-bootstrap';
import { FaWifi, FaSwimmingPool, FaSnowflake, FaStar, FaCalendarAlt, FaSearch, FaUtensils, FaTree, FaQuestionCircle, FaFacebook, FaInstagram, FaMapMarkerAlt, FaPhone, FaEnvelope, FaHome, FaConciergeBell, FaUsers } from 'react-icons/fa';
import PublicNavbar from '../../components/PublicNavbar';
import CalendarFull from '../../components/CalendarFull';
import { API_URL } from '../../config';
import { calcularPrecioReserva, formatearPrecioArgentino } from '../../services/api';
import './HomePublico.css';
import imagenRecorrido from '../../assets/images/recorrido.jpeg';
import encontrarnos from '../../assets/images/frente.jpeg';
import servicio from '../../assets/images/servicio.jpg';
import Footer from '../../components/admin/Footer';

// Mover CabanaCard fuera del componente principal
const CabanaCard = ({ cabana, dateRange, calculandoPrecios, navigate }) => {
  const noches = dateRange ? calcularNoches(dateRange.start, dateRange.end) : 0;
  const estaCalculando = calculandoPrecios[cabana._id];
  const precioInfo = cabana.precioCalculado;

  return (
    <Col key={cabana._id}>
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
              <FaStar className="text-warning" /> {cabana.capacidad} personas
            </small>
            <br />
            <small className="text-muted">
              {dateRange ? 'Precio según fechas seleccionadas' : `Precio base: ${formatearPrecioArgentino(cabana.precio)}/noche`}
            </small>
          </Card.Text>
          
          {dateRange && (
            <div className="mt-auto">
              <div className="mb-3">
                {estaCalculando ? (
                  <div className="text-center py-2">
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Calculando precio...
                  </div>
                ) : precioInfo ? (
                  <>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Total {noches} noche{noches !== 1 ? 's' : ''}:</span>
                      <strong className="text-success">{precioInfo.precioFormateado}</strong>
                    </div>
                    {precioInfo.desglose && precioInfo.desglose.length > 0 && (
                      <div className="small text-muted">
                        <div>
                          {precioInfo.desglose.filter(d => d.tipo === 'semana').length} días semana
                        </div>
                        <div>
                          {precioInfo.desglose.filter(d => d.tipo === 'fin de semana').length} fines de semana
                        </div>
                        <div>
                          {precioInfo.desglose.filter(d => d.tipo === 'feriado').length} feriados
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-muted text-center">
                    <small>Precio base: {formatearPrecioArgentino(cabana.precio)}/noche</small>
                  </div>
                )}
              </div>
              
              <Button 
                variant="primary" 
                className="w-100 mb-2"
                onClick={() => {
                  if (!precioInfo || estaCalculando) return;
                  
                  navigate(`/reservar/${cabana._id}`, {
                    state: {
                      cabanaId: cabana._id,
                      cabanaNombre: cabana.nombre,
                      fechaInicio: dateRange.start,
                      fechaFin: dateRange.end,
                      precioTotal: precioInfo.total,
                      precioDesglose: precioInfo.desglose,
                      imagenPrincipal: cabana.imagenPrincipal
                    }
                  });
                }}
                disabled={!precioInfo || estaCalculando || precioInfo.total <= 0}
                style={{
                  fontWeight: 300,
                  backgroundColor: '#eaac25',
                  borderColor: '#eaac25',
                }}
              >
                {estaCalculando ? 'Calculando...' : 'Reservar ahora'}
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
              backgroundColor: dateRange ? 'transparent' : '#eaac25',
              borderColor: '#eaac25',
              color: dateRange ? '#eaac25' : 'white',
            }}
          >
            Ver detalles
          </Button>
        </Card.Body>
      </Card>
    </Col>
  );
};

// Helper functions fuera del componente
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const calcularNoches = (start, end) => {
  if (!start || !end) return 0;
  
  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);

  if (startDate >= endDate) return 0;
  
  const diffMs = endDate - startDate;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

const getImageUrl = (imageData, API_URL) => {
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
  const [calculandoPrecios, setCalculandoPrecios] = useState({});
  const tooltipTarget = useRef(null);
  const navigate = useNavigate();

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

  // Cargar cabañas destacadas
  useEffect(() => {
    let isMounted = true;
    
    const fetchCabanas = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/cabanas?destacadas=true`);
        
        if (isMounted) {
          const data = response.data?.data || response.data;
          
          if (!Array.isArray(data)) {
            throw new Error('Formato de respuesta inválido');
          }

          const processedCabanas = data.map(cabana => ({
            ...cabana,
            imagenPrincipal: getImageUrl(cabana.imagenPrincipal || cabana.imagenes?.[0], API_URL),
            imagenes: (cabana.imagenes || []).map(img => ({
              ...img,
              url: getImageUrl(img, API_URL)
            }))
          }));

          setCabanas(processedCabanas);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error al cargar cabañas:', err);
          setError(err.message);
          setCabanas([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
  
    fetchCabanas();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Calcular precios dinámicos cuando cambian las fechas
  useEffect(() => {
    const calcularPreciosDisponibles = async () => {
      if (dateRange.start && dateRange.end && availableCabanas.length > 0) {
        const nuevosPrecios = {};
        
        for (const cabana of availableCabanas) {
          try {
            setCalculandoPrecios(prev => ({ ...prev, [cabana._id]: true }));
            
            // Calcular precio usando el endpoint específico
            const precioData = await calcularPrecioReserva(
              dateRange.start,
              dateRange.end,
              cabana._id
            );
            
            nuevosPrecios[cabana._id] = {
              total: precioData.precioTotal || cabana.precio || 0,
              precioFormateado: formatearPrecioArgentino(precioData.precioTotal || cabana.precio || 0),
              desglose: precioData.desglose || []
            };
          } catch (err) {
            console.error(`Error calculando precio para cabaña ${cabana._id}:`, err);
            nuevosPrecios[cabana._id] = {
              total: cabana.precio || 0,
              precioFormateado: formatearPrecioArgentino(cabana.precio || 0),
              desglose: []
            };
          } finally {
            setCalculandoPrecios(prev => ({ ...prev, [cabana._id]: false }));
          }
        }
        
        setAvailableCabanas(prev => prev.map(cabana => ({
          ...cabana,
          precioCalculado: nuevosPrecios[cabana._id] || null
        })));
      }
    };

    calcularPreciosDisponibles();
  }, [dateRange, availableCabanas]);

  const handleSearchAvailability = async () => {
    if (!dateRange.start || !dateRange.end) {
      setSearchStatus({
        loading: false,
        error: 'Por favor seleccione ambas fechas',
        searched: false
      });
      return;
    }

    // Validar que la fecha de inicio sea hoy o después
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(dateRange.start);
    startDate.setHours(0, 0, 0, 0);
    
    if (startDate < today) {
      setSearchStatus({
        loading: false,
        error: 'No puedes seleccionar fechas pasadas',
        searched: false
      });
      return;
    }

    if (dateRange.start >= dateRange.end) {
      setSearchStatus({
        loading: false,
        error: 'La fecha de fin debe ser posterior a la de inicio',
        searched: false
      });
      return;
    }

    try {
      setSearchStatus({ loading: true, error: null, searched: true });
      setCalculandoPrecios({});

      const formatDateForAPI = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d.toISOString().split('T')[0];
      };

      const fechaInicio = formatDateForAPI(dateRange.start);
      const fechaFin = formatDateForAPI(dateRange.end);

      const response = await axios.get(`${API_URL}/api/cabanas/disponibles`, {
        params: {
          fechaInicio,
          fechaFin
        }
      });

      if (!response.data || !response.data.success) {
        throw new Error(response.data?.error || 'Respuesta inesperada del servidor');
      }

      const processedCabanas = (response.data.data || []).map(cabana => ({
        ...cabana,
        imagenPrincipal: cabana.imagenPrincipal || getImageUrl(null, API_URL),
        precioCalculado: null
      }));

      setAvailableCabanas(processedCabanas);
      setSearchStatus(prev => ({ ...prev, loading: false }));

    } catch (error) {
      console.error('Error en búsqueda:', error);

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
  };

  const handleDatesSelected = (start, end, calculatedTotal) => {
    setDateRange({ start, end });
    setSearchStatus(prev => ({ ...prev, error: null }));
    setAvailableCabanas([]);
  };

  return (
    <div className="home-publico">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="home-publico-hero bg-dark text-white text-center py-5 position-relative">
        <Container className="position-relative z-index-1">
          <h1 className="display-4 fw-bold mb-4">Complejo Los Alerces</h1>
          <p className="lead mb-4">Libertad - Pontevedra</p>
          <Button as={Link} to="/cabanas" variant="primary" size="lg">
            Ver Cabañas Disponibles
          </Button>
        </Container>
      </section>

      {/* Secciones de contenido */}
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

      {/* Más secciones... */}
      {/* Mantén las otras secciones igual */}

      {/* Cabañas Destacadas */}
      <section className="py-5">
        <Container>
          <h2 className="text-center mb-5">Nuestras Cabañas Destacadas</h2>
          {loading ? (
            <div className="text-center py-5">
              <p>Cargando cabañas destacadas...</p>
            </div>
          ) : error ? (
            <Alert variant="danger" className="text-center my-5">
              Error al cargar cabañas: {error}
            </Alert>
          ) : cabanas.length > 0 ? (
            <Row xs={1} md={3} className="g-4">
              {cabanas.map(cabana => (
                <CabanaCard 
                  key={cabana._id} 
                  cabana={cabana} 
                  dateRange={null}
                  calculandoPrecios={{}}
                  navigate={navigate}
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

      {/* Buscador de disponibilidad */}
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
  onDatesSelected={(start, end, calculatedTotal) => {
    setDateRange({ start, end });
    setSearchStatus(prev => ({ ...prev, error: null }));
    setAvailableCabanas([]);
  }}
  showInline={true}
  showTotal={false}
/>
            </Col>
          </Row>
          
          {dateRange.start && dateRange.end && (
            <Row className="justify-content-center mb-3">
              <Col md={8} className="text-center">
                <Alert variant="info">
                  Fechas seleccionadas: {formatDate(dateRange.start)} al {formatDate(dateRange.end)}
                  <br />
                  <small className="text-muted">
                    {calcularNoches(dateRange.start, dateRange.end)} noche{calcularNoches(dateRange.start, dateRange.end) !== 1 ? 's' : ''}
                  </small>
                </Alert>
              </Col>
            </Row>
          )}
          
          <Row className="justify-content-center">
            <Col md={4} className="text-center">
              <Button 
                variant="primary" 
                onClick={handleSearchAvailability}
                disabled={searchStatus.loading || !dateRange.start || !dateRange.end}
                style={{
                  fontWeight: 300,
                  backgroundColor: '#eaac25',
                  borderColor: '#eaac25',
                }}
              >
                {searchStatus.loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Buscando...
                  </>
                ) : (
                  <>
                    <FaSearch className="me-2" />
                    Buscar disponibilidad
                  </>
                )}
              </Button>
            </Col>
          </Row>
          
          {searchStatus.error && (
            <Row className="justify-content-center mt-3">
              <Col md={8}>
                <Alert variant="danger" className="text-center">
                  {searchStatus.error}
                </Alert>
              </Col>
            </Row>
          )}
        </Container>
      </section>

      {/* Resultados de búsqueda */}
      {searchStatus.searched && !searchStatus.loading && (
        <section className="py-5">
          <Container>
            {availableCabanas.length > 0 ? (
              <>
                <h2 className="text-center mb-5">
                  {availableCabanas.length} Cabaña{availableCabanas.length !== 1 ? 's' : ''} disponible{availableCabanas.length !== 1 ? 's' : ''} del {formatDate(dateRange.start)} al {formatDate(dateRange.end)}
                </h2>
                <Row xs={1} md={3} className="g-4">
                  {availableCabanas.map(cabana => (
                    <CabanaCard 
                      key={cabana._id}
                      cabana={cabana}
                      dateRange={dateRange}
                      calculandoPrecios={calculandoPrecios}
                      navigate={navigate}
                    />
                  ))}
                </Row>
              </>
            ) : (
              <Alert variant="warning" className="text-center">
                No hay cabañas disponibles para las fechas seleccionadas.
                <div className="mt-2">
                  <Button 
                    as={Link} 
                    to="/cabanas" 
                    variant="outline-warning"
                  >
                    Ver todas las cabañas
                  </Button>
                </div>
              </Alert>
            )}
          </Container>
        </section>
      )}

      <Footer />
    </div>
  );
}
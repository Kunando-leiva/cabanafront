import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaWifi, FaSwimmingPool, FaSnowflake, FaStar, FaCalendarAlt, 
  FaSearch, FaUtensils, FaTree, FaQuestionCircle, FaFacebook, 
  FaInstagram, FaMapMarkerAlt, FaPhone, FaEnvelope, FaHome, 
  FaConciergeBell, FaUsers, FaExclamationTriangle, FaCheckCircle 
} from 'react-icons/fa';
import PublicNavbar from '../../components/PublicNavbar';
import CalendarFull from '../../components/CalendarFull';
import { API_URL, calcularPrecioReserva, formatearPrecioArgentino, obtenerCabanas } from '../../config';
import imagenRecorrido from '../../assets/images/recorrido.jpeg';
import encontrarnos from '../../assets/images/frente.jpeg';
import servicio from '../../assets/images/servicio.jpg';
import Footer from '../../components/admin/Footer';
import './HomePublico.css';

// ============================================
// COMPONENTES NATIVOS PARA REEMPLAZAR REACT-BOOTSTRAP
// ============================================

const Container = ({ children, className = '', fluid, ...props }) => (
  <div 
    className={`${fluid ? 'container-fluid' : 'container'} ${className}`} 
    {...props}
  >
    {children}
  </div>
);

const Row = ({ children, className = '', ...props }) => (
  <div className={`row ${className}`} {...props}>
    {children}
  </div>
);

const Col = ({ children, xs, md, lg, xl, className = '', ...props }) => {
  const colClasses = [
    xs ? `col-${xs}` : '',
    md ? `col-md-${md}` : '',
    lg ? `col-lg-${lg}` : '',
    xl ? `col-xl-${xl}` : '',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={colClasses} {...props}>
      {children}
    </div>
  );
};

const Card = ({ children, className = '', ...props }) => (
  <div className={`card ${className}`} {...props}>
    {children}
  </div>
);

const CardBody = ({ children, className = '', ...props }) => (
  <div className={`card-body ${className}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '', tag: Tag = 'h5', ...props }) => (
  <Tag className={`card-title ${className}`} {...props}>
    {children}
  </Tag>
);

const CardText = ({ children, className = '', ...props }) => (
  <div className={`card-text ${className}`} {...props}>
    {children}
  </div>
);

const Alert = ({ 
  children, 
  variant = 'info', 
  className = '', 
  dismissible, 
  onClose, 
  ...props 
}) => {
  const alertClass = `alert alert-${variant} ${dismissible ? 'alert-dismissible' : ''} ${className}`;
  
  return (
    <div className={alertClass} role="alert" {...props}>
      {children}
      {dismissible && onClose && (
        <button 
          type="button" 
          className="btn-close" 
          aria-label="Close"
          onClick={onClose}
        ></button>
      )}
    </div>
  );
};

const Button = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  type = 'button',
  as, 
  to,
  href,
  disabled = false,
  onClick,
  style = {},
  ...props 
}) => {
  const buttonClass = `btn btn-${variant} ${disabled ? 'disabled' : ''} ${className}`;
  const buttonStyle = {
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.65 : 1,
    ...style
  };
  
  if (as === Link && to) {
    return (
      <Link 
        to={to} 
        className={buttonClass}
        style={buttonStyle}
        onClick={disabled ? undefined : onClick}
        {...props}
      >
        {children}
      </Link>
    );
  }
  
  if (as === 'a' && href) {
    return (
      <a 
        href={href} 
        className={buttonClass}
        style={buttonStyle}
        onClick={disabled ? undefined : onClick}
        {...props}
      >
        {children}
      </a>
    );
  }
  
  return (
    <button 
      type={type}
      className={buttonClass}
      style={buttonStyle}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      {...props}
    >
      {children}
    </button>
  );
};

// ============================================
// HELPER FUNCTIONS
// ============================================

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

const getImageUrl = (imageData) => {
  if (!imageData) return `${API_URL}/default-cabana.jpg`;
  
  if (typeof imageData === 'string') {
    if (imageData.startsWith('http')) return imageData;
    if (imageData.startsWith('/')) return `${API_URL}${imageData}`;
    return `${API_URL}/${imageData}`;
  }
  
  if (imageData.url) {
    if (imageData.url.startsWith('http')) return imageData.url;
    if (imageData.url.startsWith('/')) return `${API_URL}${imageData.url}`;
    return `${API_URL}/${imageData.url}`;
  }
  
  if (imageData._id || imageData.fileId) {
    return `${API_URL}/api/images/${imageData._id || imageData.fileId}`;
  }
  
  return `${API_URL}/default-cabana.jpg`;
};

// ============================================
// COMPONENTE CabañaCard
// ============================================

const CabanaCard = React.memo(({ cabana, dateRange, calculandoPrecios, navigate }) => {
  const [precioLocal, setPrecioLocal] = useState(null);
  const [cargandoLocal, setCargandoLocal] = useState(false);
  const prevDateRange = useRef(null);
  const isMounted = useRef(true);
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  const noches = React.useMemo(() => {
    if (!dateRange || !dateRange.start || !dateRange.end) return 0;
    return calcularNoches(dateRange.start, dateRange.end);
  }, [dateRange]);

  useEffect(() => {
    if (!isMounted.current) return;
    
    if (!dateRange || !dateRange.start || !dateRange.end) {
      if (precioLocal || cargandoLocal) {
        setPrecioLocal(null);
        setCargandoLocal(false);
      }
      return;
    }

    const dateRangeKey = dateRange.start?.toISOString() + dateRange.end?.toISOString();
    const prevDateRangeKey = prevDateRange.current?.start?.toISOString() + prevDateRange.current?.end?.toISOString();
    
    if (dateRangeKey === prevDateRangeKey && precioLocal !== null) {
      return;
    }
    
    prevDateRange.current = dateRange;

    const estaCalculando = calculandoPrecios[cabana._id];
    
    if (estaCalculando) {
      setCargandoLocal(true);
      setPrecioLocal(null);
    } else if (cabana.precioCalculado) {
      setCargandoLocal(false);
      setPrecioLocal(cabana.precioCalculado);
    } else {
      setCargandoLocal(false);
      setPrecioLocal(null);
    }
  }, [cabana.precioCalculado, calculandoPrecios, cabana._id, dateRange, precioLocal, cargandoLocal]);

  const handleReservarClick = () => {
    if (!isMounted.current || !precioLocal || cargandoLocal) return;
    
    navigate(`/reservar/${cabana._id}`, {
      state: {
        cabanaId: cabana._id,
        cabanaNombre: cabana.nombre,
        fechaInicio: dateRange.start,
        fechaFin: dateRange.end,
        precioTotal: precioLocal.total,
        precioDesglose: precioLocal.desglose,
        imagenPrincipal: cabana.imagenPrincipal
      }
    });
  };

  return (
    <Col xs={12} md={6} lg={4}>
      <Card className="h-100 shadow-sm cabana-card">
        <div className="ratio ratio-16x9">
          <img
            src={cabana.imagenPrincipal || `${API_URL}/default-cabana.jpg`}
            alt={cabana.nombre}
            className="card-img-top"
            style={{ objectFit: 'cover' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `${API_URL}/default-cabana.jpg`;
            }}
          />
        </div>
        <CardBody className="d-flex flex-column">
          <CardTitle className="text-truncate">{cabana.nombre}</CardTitle>
          <CardText className="text-muted small mb-3">
            <FaStar className="text-warning" /> {cabana.capacidad} personas
          </CardText>
          
          {dateRange && dateRange.start && dateRange.end ? (
            <div className="mt-auto">
              <div className="mb-3">
                {cargandoLocal ? (
                  <div className="text-center py-2">
                    <div className="spinner-grow spinner-grow-sm text-warning me-2" role="status"></div>
                    <span className="text-muted">Calculando precio...</span>
                  </div>
                ) : precioLocal ? (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted">Total {noches} noche{noches !== 1 ? 's' : ''}:</span>
                      <strong className="text-success fs-5">
                        {precioLocal.precioFormateado || formatearPrecioArgentino(precioLocal.total || 0)}
                      </strong>
                    </div>
                    {precioLocal.desglose && precioLocal.desglose.length > 0 && (
                      <div className="small text-muted bg-light p-2 rounded">
                        <div className="d-flex justify-content-between">
                          <span>Días semana:</span>
                          <span>{precioLocal.desglose.filter(d => d.tipo === 'semana').length}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span>Fines de semana:</span>
                          <span>{precioLocal.desglose.filter(d => d.tipo === 'fin de semana').length}</span>
                        </div>
                        {precioLocal.desglose.filter(d => d.tipo === 'feriado').length > 0 && (
                          <div className="d-flex justify-content-between">
                            <span>Feriados:</span>
                            <span>{precioLocal.desglose.filter(d => d.tipo === 'feriado').length}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-muted text-center py-3">
                    <FaCalendarAlt className="mb-2" />
                    <div>Precio base: {formatearPrecioArgentino(cabana.precio || 0)}/noche</div>
                  </div>
                )}
              </div>
              
              <Button 
                variant="primary" 
                className="w-100 mb-2"
                onClick={handleReservarClick}
                disabled={!precioLocal || cargandoLocal || (precioLocal.total || 0) <= 0}
                style={{
                  fontWeight: 500,
                  backgroundColor: '#eaac25',
                  borderColor: '#eaac25',
                }}
              >
                {cargandoLocal ? '⌛ Calculando...' : '✅ Reservar ahora'}
              </Button>
            </div>
          ) : (
            <div className="mt-auto text-center text-muted py-3">
              <FaCalendarAlt className="mb-2 fs-4" />
              <div>Selecciona fechas para ver precio</div>
            </div>
          )}
          
          <Button 
            as={Link}
            to={`/cabanas/${cabana._id}`}
            variant={dateRange ? "outline-primary" : "primary"}
            className="w-100 mt-auto"
            style={{
              fontWeight: 300,
              backgroundColor: dateRange ? 'transparent' : '#eaac25',
              borderColor: '#eaac25',
              color: dateRange ? '#eaac25' : 'white',
            }}
          >
            Ver detalles
          </Button>
        </CardBody>
      </Card>
    </Col>
  );
});

CabanaCard.displayName = 'CabanaCard';

// ============================================
// COMPONENTE PRINCIPAL HomePublico
// ============================================

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
  const [calculandoPrecios, setCalculandoPrecios] = useState({});
  const navigate = useNavigate();
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    let isMountedLocal = true;
    
    const fetchCabanas = async () => {
      try {
        const cabanasData = await obtenerCabanas();
        
        if (isMountedLocal) {
          if (!Array.isArray(cabanasData)) {
            throw new Error('Formato de respuesta inválido');
          }

          const processedCabanas = cabanasData.map(cabana => ({
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
        if (isMountedLocal) {
          console.error('Error al cargar cabañas:', err);
          setError(err.message);
          setCabanas([]);
        }
      } finally {
        if (isMountedLocal) {
          setLoading(false);
        }
      }
    };
  
    fetchCabanas();
    
    return () => {
      isMountedLocal = false;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;
    let calculationTimeout = null;
    
    const calcularPreciosDisponibles = async () => {
      if (!isMounted.current) return;
      
      if (dateRange.start && dateRange.end && availableCabanas.length > 0) {
        if (calculationTimeout) clearTimeout(calculationTimeout);
        
        calculationTimeout = setTimeout(async () => {
          if (isCancelled || !isMounted.current) return;
          
          const calculandoInicial = {};
          availableCabanas.forEach(cabana => {
            calculandoInicial[cabana._id] = true;
          });
          setCalculandoPrecios(calculandoInicial);
          
          const calculosPromises = availableCabanas.map(async (cabana) => {
            try {
              const precioData = await calcularPrecioReserva(
                dateRange.start,
                dateRange.end,
                cabana._id
              );
              
              return {
                cabanaId: cabana._id,
                success: true,
                data: {
                  total: precioData.precioTotal || cabana.precio || 0,
                  precioFormateado: formatearPrecioArgentino(precioData.precioTotal || cabana.precio || 0),
                  desglose: precioData.desglose || []
                }
              };
            } catch (err) {
              console.error(`Error calculando precio para cabaña ${cabana._id}:`, err);
              return {
                cabanaId: cabana._id,
                success: false,
                error: err.message
              };
            }
          });
          
          const resultados = await Promise.all(calculosPromises);
          
          if (!isCancelled && isMounted.current) {
            setAvailableCabanas(prev => prev.map(cabana => {
              const resultado = resultados.find(r => r.cabanaId === cabana._id);
              if (resultado?.success) {
                return {
                  ...cabana,
                  precioCalculado: resultado.data
                };
              }
              return cabana;
            }));
            
            setCalculandoPrecios({});
          }
        }, 500);
      }
    };

    calcularPreciosDisponibles();
    
    return () => {
      isCancelled = true;
      if (calculationTimeout) clearTimeout(calculationTimeout);
    };
  }, [dateRange, availableCabanas]);

  const handleDatesSelected = useCallback((start, end) => {
    if (!isMounted.current) return;
    
    if (!start || !end || !(start instanceof Date) || !(end instanceof Date)) {
      console.error('Fechas inválidas recibidas:', start, end);
      return;
    }
    
    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(end);
    endDate.setHours(0, 0, 0, 0);
    
    if (startDate >= endDate) {
      setSearchStatus(prev => ({ 
        ...prev, 
        error: 'La fecha de fin debe ser posterior al inicio' 
      }));
      return;
    }
    
    setDateRange({ start: startDate, end: endDate });
    setSearchStatus({ loading: false, error: null, searched: false });
    setAvailableCabanas([]);
    setCalculandoPrecios({});
  }, [isMounted]);

  const handleSearchAvailability = async () => {
    if (!isMounted.current) return;
    
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
      
      setAvailableCabanas([]);
      setCalculandoPrecios({});

      const formatDateForAPI = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d.toISOString().split('T')[0];
      };

      const fechaInicio = formatDateForAPI(dateRange.start);
      const fechaFin = formatDateForAPI(dateRange.end);

      console.log('Buscando en:', `${API_URL}/api/cabanas/disponibles`);
      console.log('Con parámetros:', { fechaInicio, fechaFin });

      const response = await axios.get(`${API_URL}/api/cabanas/disponibles`, {
        params: {
          fechaInicio,
          fechaFin
        }
      });

      console.log('Respuesta del servidor:', response.data);

      if (!response.data || !response.data.success) {
        throw new Error(response.data?.error || 'Respuesta inesperada del servidor');
      }

      const cabanasDisponibles = response.data.data || [];
      
      console.log(`Cabañas disponibles recibidas: ${cabanasDisponibles.length}`);

      const processedCabanas = cabanasDisponibles.map(cabana => ({
        ...cabana,
        precioCalculado: null
      }));

      if (isMounted.current) {
        setAvailableCabanas(processedCabanas);
        setSearchStatus(prev => ({ ...prev, loading: false }));
      }

    } catch (error) {
      console.error('Error en búsqueda:', error);

      let errorMessage = 'Error al buscar disponibilidad';
      
      if (error.response) {
        console.error('Respuesta de error:', error.response.data);
        errorMessage = error.response.data?.error || 
                      error.response.data?.message || 
                      'Error en el servidor';
      } else if (error.message) {
        errorMessage = error.message;
      }

      if (isMounted.current) {
        setSearchStatus({
          loading: false,
          error: errorMessage,
          searched: true
        });
        setAvailableCabanas([]);
        setCalculandoPrecios({});
      }
    }
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

      {/* Cabañas Destacadas */}
      <section className="py-5" style={{ backgroundColor: "#333" }}>
        <Container>
          <h2 className="text-center mb-5 fw-bold" style={{ color: "#ffffff" }}>
            Nuestras Cabañas Destacadas
          </h2>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-grow spinner-grow-lg text-warning me-2"></div>
              <p className="mt-2 text-white">Cargando cabañas destacadas...</p>
            </div>
          ) : error ? (
            <Alert variant="danger" className="text-center my-5">
              Error al cargar cabañas: {error}
            </Alert>
          ) : cabanas.length > 0 ? (
            <Row xs={1} md={2} lg={3} className="g-4 justify-content-center">
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

      {/* Sección ¿Por qué elegirnos? */}
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

      {/* Sección ¿Listo para desconectar? */}
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

      {/* Sección Nuestros Servicios */}
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

      {/* Buscador de disponibilidad */}
      <section className="py-4" style={{ backgroundColor: "#333" }}>
        <Container>
          <h3 className="text-center mb-4 fw-bold" style={{ color: "#ffffff" }}>
            <FaCalendarAlt className="me-2" />
            Consultar disponibilidad
          </h3>

          <Row className="justify-content-center mb-3">
            <Col lg={8} className="text-center">
              <div className="d-inline-block position-relative">
                <Button 
                  variant="outline-secondary"
                  size="sm"
                  className="rounded-pill mb-3"
                  style={{ color: 'white' }}
                >
                  <FaQuestionCircle className="me-1" />
                  ¿Cómo seleccionar fechas?
                </Button>
              </div>
            </Col>
          </Row>
          
          <Row className="justify-content-center mb-3">
            <Col lg={8}>
              <CalendarFull 
                onDatesSelected={handleDatesSelected}
                showInline={true}
                showTotal={false}
                key="calendar-home"
              />
            </Col>
          </Row>
          
          {dateRange.start && dateRange.end && (
            <Row className="justify-content-center mb-3">
              <Col md={8} className="text-center">
                <Alert variant="info" className="py-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>Fechas seleccionadas:</strong>
                      <div className="small">
                        {formatDate(dateRange.start)} al {formatDate(dateRange.end)}
                      </div>
                    </div>
                    <div className="text-end">
                      <strong>Noches:</strong>
                      <div className="small">
                        {calcularNoches(dateRange.start, dateRange.end)} noche{calcularNoches(dateRange.start, dateRange.end) !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
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
                type="button"
                style={{
                  fontWeight: 500,
                  backgroundColor: '#eaac25',
                  borderColor: '#eaac25',
                  padding: '10px 30px',
                  transition: 'all 0.3s ease'
                }}
              >
                {searchStatus.loading ? (
                  <>
                    <div className="spinner-grow spinner-grow-sm me-2"></div>
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
                <Alert 
                  variant="danger" 
                  className="text-center"
                  dismissible
                  onClose={() => setSearchStatus(prev => ({ ...prev, error: null }))}
                >
                  {searchStatus.error}
                </Alert>
              </Col>
            </Row>
          )}
        </Container>
      </section>

      {/* Resultados de búsqueda */}
      {searchStatus.searched && (
        <section className="py-5" style={{ backgroundColor: "#333" }}>
          <Container>
            {searchStatus.loading ? (
              <div className="text-center py-5">
                <div className="spinner-grow spinner-grow-lg text-warning"></div>
                <p className="mt-3 text-white">Buscando cabañas disponibles...</p>
              </div>
            ) : searchStatus.error ? (
              <Alert variant="danger" className="text-center">
                <h4>Error en la búsqueda</h4>
                <p>{searchStatus.error}</p>
              </Alert>
            ) : availableCabanas.length === 0 ? (
              <Alert variant="warning" className="text-center">
                <h4>No hay disponibilidad para estas fechas</h4>
                <p className="mb-3">Por favor, intenta con otras fechas</p>
                <div className="mt-2">
                  <Button 
                    as={Link} 
                    to="/cabanas" 
                    variant="outline-warning"
                    className="me-2"
                  >
                    Ver todas las cabañas
                  </Button>
                  <Button 
                    variant="warning"
                    onClick={() => {
                      setDateRange({ start: null, end: null });
                      setSearchStatus({ loading: false, error: null, searched: false });
                      setAvailableCabanas([]);
                    }}
                  >
                    Limpiar búsqueda
                  </Button>
                </div>
              </Alert>
            ) : (
              <>
                <h2 className="text-center mb-5 fw-bold text-white">
                  {availableCabanas.length} Cabaña{availableCabanas.length !== 1 ? 's' : ''} disponible{availableCabanas.length !== 1 ? 's' : ''}
                </h2>
                <p className="text-center text-muted mb-4">
                  Del {formatDate(dateRange.start)} al {formatDate(dateRange.end)}
                </p>
                <Row xs={1} md={2} lg={3} className="g-4 justify-content-center">
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
            )}
          </Container>
        </section>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
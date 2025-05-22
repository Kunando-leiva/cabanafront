import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { FaWifi, FaSwimmingPool, FaSnowflake, FaStar, FaCalendarAlt, FaSearch, FaUtensils, FaTree } from 'react-icons/fa';
import PublicNavbar from '../../components/PublicNavbar';
import CalendarFull from '../../components/CalendarFull';
import { API_URL } from '../../config';
import './HomePublico.css';
import imagenRecorrido from '../../assets/images/recorrido.jpeg';
import encontrarnos from '../../assets/images/frente.jpeg';


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
  const navigate = useNavigate();
  const isMounted = useRef(true);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
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

      <section className="hero-section bg-dark text-white text-center py-5 position-relative">
        <Container className="position-relative z-index-1">
          <h1 className="display-4 fw-bold mb-4">Complejo Los Alerces</h1>
          <p className="lead mb-4">Libertad - Pontevedra</p>
          <Button as={Link} to="/cabanas" variant="primary" size="lg">
            Ver Cabañas Disponibles
          </Button>
        </Container>
      </section>


      <section style={{ backgroundColor: '#1c1c1c', color: 'white', padding: '60px 0', position: 'relative', overflow: 'hidden' }}>
  <Container fluid> {/* Cambiado a fluid para ocupar todo el ancho */}
    <Row className="align-items-center">
      {/* Texto - ahora en un Container normal para limitar el ancho */}
      <Col md={5}>
        <Container>
          <h2 style={{ 
            fontWeight: 300, 
            fontSize: '2.5rem',
            letterSpacing: '1px',
            marginBottom: '1.5rem'
          }}>
            Hacer un recorrido
          </h2>
          <p style={{ 
            fontSize: '1.1rem', 
            fontWeight: 300, 
            lineHeight: '1.8',
            marginBottom: '2rem'
          }}>
            Hacer un recorrido por el complejo es abrir la puerta a un mundo de calma. Conocé nuestras cabañas y dejate envolver por la calidez del entorno.
          </p>
          <Button 
            onClick={() => navigate('/galeria')}
            variant="outline-light"
            style={{
              padding: '10px 30px',
              fontWeight: 300,
              letterSpacing: '1px',
              borderRadius: '0',
              textTransform: 'uppercase'
            }}
          >
            Ver más
          </Button>
        </Container>
      </Col>

      {/* Imagen - ahora ocupará más espacio */}
      <Col md={7} className="p-0"> {/* Eliminamos padding */}
        <div style={{
          height: '500px',
          width: '100%',
          backgroundImage: `url(${imagenRecorrido})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }} />
      </Col>
    </Row>
  </Container>
</section>

     
    <section style={{ 
  backgroundColor: '#1c1c1c', 
  color: 'white', 
  padding: '60px 0',
  position: 'relative'
}}>
  <Container fluid>
    <Row className="align-items-center">
      {/* Imagen expandida */}
      <Col md={7} className="p-0">
        <div 
          style={{
            height: '500px',
            backgroundImage: `url(${encontrarnos})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
          className="img-hover-zoom"
        />
      </Col>
      
      {/* Contenido de texto */}
      <Col md={5}>
        <Container>
          <h2 style={{ 
            fontWeight: 300,
            fontSize: '2.5rem',
            letterSpacing: '1px'
          }}>
            Cómo encontrarnos
          </h2>
          <p style={{ 
            fontSize: '1.1rem',
            fontWeight: 300,
            lineHeight: '1.8'
          }}>
            Una estadía en nuestro complejo es más que una habitación...
          </p>
          <Button 
            onClick={() => navigate('/ubicacion')}
            variant="outline-light"
            style={{
              padding: '10px 30px',
              fontWeight: 300,
              letterSpacing: '1px',
              borderRadius: '0'
            }}
          >
            Ver ubicación
          </Button>
        </Container>
      </Col>
    </Row>
  </Container>
</section>

      <section className="py-4 bg-light">
        <Container>
          <h3 className="text-center mb-4">
            <FaCalendarAlt className="me-2" />
            Consultar disponibilidad
          </h3>
          
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
            <Row className="justify-content-center mt-3">
              <Col md={8}>
                <Alert variant="info" className="text-center">
                  Buscando disponibilidad del {formatDate(dateRange.start)} al {formatDate(dateRange.end)} 
                  ({calcularNoches(dateRange.start, dateRange.end)} noches)
                </Alert>
              </Col>
            </Row>
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
                <h2 className="text-center mb-5">
                  Cabañas disponibles del {formatDate(dateRange.start)} al {formatDate(dateRange.end)}
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

      <FeaturedCabanas />

      <section className="py-5 bg-light">
        <Container>
          <h2 className="text-center mb-5">¿Por qué elegirnos?</h2>
          <Row className="g-4">
            <Col md={4} className="text-center">
              <FaSwimmingPool size={40} className="mb-3 text-primary" />
              <h4>Piscinas Privadas</h4>
              <p>Disfruta de piscinas exclusivas en cada cabaña.</p>
            </Col>
            <Col md={4} className="text-center">
              <FaWifi size={40} className="mb-3 text-primary" />
              <h4>Wifi de Alta Velocidad</h4>
              <p>Conectividad incluso en medio de la naturaleza.</p>
            </Col>
            <Col md={4} className="text-center">
              <FaSnowflake size={40} className="mb-3 text-primary" />
              <h4>Aire Acondicionado</h4>
              <p>Comodidad en todas las estaciones del año.</p>
            </Col>
          </Row>
        </Container>
      </section>
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
  
  // 1. Normalizar fechas (ignorar horas/minutos/segundos)
  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);

  // 2. Calcular diferencia en milisegundos
  const diffMs = endDate - startDate;
  
  // 3. Convertir a días (usando Math.floor)
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)); 
}
// import { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import axios from 'axios';
// import { Button, Container, Row, Col, Card, Spinner } from 'react-bootstrap';
// import { FaWifi, FaSwimmingPool, FaSnowflake, FaStar } from 'react-icons/fa';
// import PublicNavbar from '../../components/PublicNavbar';
// import { API_URL } from '../../config';
// import logo from '../../assets/images/logo-alerces.png'; // Importa tu logo

// export default function HomePublico() {
//   const [cabanas, setCabanas] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchCabanas = async () => {
//       try {
//         const response = await axios.get(`${API_URL}/api/cabanas?limit=3`);
//         setCabanas(response.data);
//       } catch (error) {
//         console.error('Error fetching cabañas:', error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchCabanas();
//   }, []);

//   return (
//     <div className="home-publico">
//       <PublicNavbar />

//       {/* Hero Section con Logo */}
//       <section className="hero-section bg-dark text-white text-center py-5 position-relative">
//         <div className="hero-overlay"></div>
//         <Container className="position-relative z-index-1">
//           <h1 className="display-4 fw-bold mb-4">Complejo Los Alerces</h1>
//           <p className="lead mb-4">Libertad - Pontevedra</p>
//           <p className="mb-4">Descubre nuestras cabañas exclusivas en los mejores entornos naturales.</p>
//           <Button as={Link} to="/cabanas" variant="primary" size="lg">
//             Ver Cabañas Disponibles
//           </Button>
//         </Container>
//       </section>

//       {/* Cabañas Destacadas */}
//       <section className="py-5">
//         <Container>
//           <h2 className="text-center mb-5">Nuestras Cabañas Destacadas</h2>
//           {loading ? (
//             <Spinner animation="border" className="d-block mx-auto" />
//           ) : (
//             <Row xs={1} md={3} className="g-4">
//               {cabanas.map((cabana) => (
//                 <Col key={cabana._id}>
//                   <Card className="h-100 shadow-sm">
//                     {cabana.imagenes?.[0] && (
//                       <Card.Img 
//                         variant="top" 
//                         src={cabana.imagenes[0]} 
//                         style={{ height: '180px', objectFit: 'cover' }} 
//                       />
//                     )}
//                     <Card.Body>
//                       <Card.Title>{cabana.nombre}</Card.Title>
//                       <Card.Text>
//                         <small className="text-muted">
//                           <FaStar className="text-warning" /> {cabana.capacidad} personas · ${cabana.precio}/noche
//                         </small>
//                       </Card.Text>
//                       <Button 
//                         as={Link} 
//                         to={`/cabanas/${cabana._id}`} 
//                         variant="outline-primary" 
//                         size="sm"
//                       >
//                         Ver Detalles
//                       </Button>
//                     </Card.Body>
//                   </Card>
//                 </Col>
//               ))}
//             </Row>
//           )}
//         </Container>
//       </section>

//       {/* Servicios/Beneficios */}
//       <section className="py-5 bg-light">
//         <Container>
//           <h2 className="text-center mb-5">¿Por qué elegirnos?</h2>
//           <Row className="g-4">
//             <Col md={4} className="text-center">
//               <FaSwimmingPool size={40} className="mb-3 text-primary" />
//               <h4>Piscinas Privadas</h4>
//               <p>Disfruta de piscinas exclusivas en cada cabaña.</p>
//             </Col>
//             <Col md={4} className="text-center">
//               <FaWifi size={40} className="mb-3 text-primary" />
//               <h4>Wifi de Alta Velocidad</h4>
//               <p>Conectividad incluso en medio de la naturaleza.</p>
//             </Col>
//             <Col md={4} className="text-center">
//               <FaSnowflake size={40} className="mb-3 text-primary" />
//               <h4>Aire Acondicionado</h4>
//               <p>Comodidad en todas las estaciones del año.</p>
//             </Col>
//           </Row>
//         </Container>
//       </section>
//     </div>
//   );
// }
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button, Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { FaWifi, FaSwimmingPool, FaSnowflake, FaStar, FaCalendarAlt, FaSearch } from 'react-icons/fa';
import PublicNavbar from '../../components/PublicNavbar';
import CalendarFull from '../../components/CalendarFull';
import { API_URL } from '../../config';

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

  // Obtener cabañas destacadas
  useEffect(() => {
    const fetchCabanas = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/cabanas?destacadas=true`);
        
        // Validación profunda
        const data = response.data?.data || response.data;
        
        if (!Array.isArray(data)) {
          throw new Error('La respuesta no contiene un array de cabañas');
        }
  
        setCabanas(data);
        setError(null);
      } catch (err) {
        console.error('Error al cargar cabañas:', err);
        setError(err.message);
        setCabanas([]); // Asegura que sea array vacío
      } finally {
        setLoading(false);
      }
    };
  
    fetchCabanas();
  }, [API_URL]);

  // Manejar búsqueda de disponibilidad
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
      setSearchStatus({
        loading: true,
        error: null,
        searched: true
      });
  
      // Formatea fechas
      const fechaInicio = dateRange.start.toISOString().split('T')[0];
      const fechaFin = dateRange.end.toISOString().split('T')[0];
  
      // Usa URLSearchParams para codificación segura
      const params = new URLSearchParams({ fechaInicio, fechaFin });
  
      const response = await axios.get(
        `${API_URL}/api/cabanas/disponibilidad?${params.toString()}`
      );
  
      setAvailableCabanas(response.data?.data || []);
      setSearchStatus(prev => ({ ...prev, loading: false }));
      
    } catch (error) {
      console.error('Error detallado:', {
        url: error.config?.url,
        params: error.config?.params,
        response: error.response?.data
      });
  
      setSearchStatus({
        loading: false,
        error: error.response?.data?.message || 
              'No hay disponibilidad para las fechas seleccionadas',
        searched: true
      });
      setAvailableCabanas([]);
    }
  };

  // Utilidades
  const calcularNoches = (start, end) => {
    if (!start || !end || start >= end) return 0;
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  };

  const formatDate = (date) => {
    return date?.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) || '';
  };

  // Renderizado condicional de resultados
  const renderSearchResults = () => {
    if (searchStatus.loading) {
      return (
        <div className="text-center my-5">
          <Spinner animation="border" />
          <p className="mt-2">Buscando cabañas disponibles...</p>
        </div>
      );
    }

    if (searchStatus.error) {
      return (
        <Alert variant="danger" className="text-center my-4">
          {searchStatus.error}
        </Alert>
      );
    }

    if (searchStatus.searched && availableCabanas.length === 0) {
      return (
        <section className="py-5">
          <Container>
            <Alert variant="warning" className="text-center">
              No hay cabañas disponibles para las fechas seleccionadas.
            </Alert>
            <div className="text-center mt-3">
              <Button 
                variant="outline-primary" 
                onClick={() => {
                  setAvailableCabanas([]);
                  setSearchStatus({ ...searchStatus, searched: false });
                }}
              >
                Intentar con otras fechas
              </Button>
            </div>
          </Container>
        </section>
      );
    }

    if (availableCabanas.length > 0) {
      return (
        <section className="py-5">
          <Container>
            <h2 className="text-center mb-5">
              Cabañas disponibles del {formatDate(dateRange.start)} al {formatDate(dateRange.end)}
            </h2>
            <Row xs={1} md={3} className="g-4">
              {availableCabanas.map(cabana => (
                <CabanaCard 
                  key={cabana._id}
                  cabana={cabana}
                  dateRange={dateRange}
                  navigate={navigate}
                />
              ))}
            </Row>
          </Container>
        </section>
      );
    }

    return null;
  };

  return (
    <div className="home-publico">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="hero-section bg-dark text-white text-center py-5 position-relative">
        <Container className="position-relative z-index-1">
          <h1 className="display-4 fw-bold mb-4">Complejo Los Alerces</h1>
          <p className="lead mb-4">Libertad - Pontevedra</p>
          <Button as={Link} to="/cabanas" variant="primary" size="lg">
            Ver Cabañas Disponibles
          </Button>
        </Container>
      </section>

      {/* Sección de Búsqueda */}
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
                  setDateRange({ start, end });
                  setSearchStatus({ ...searchStatus, error: null });
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
    <>
      <Spinner animation="border" size="sm" className="me-2" />
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

      {/* Resultados de búsqueda */}
      {renderSearchResults()}

      {/* Cabañas Destacadas */}
      <FeaturedCabanas 
        cabanas={cabanas} 
        loading={loading} 
        API_URL={API_URL}
      />

      {/* Servicios/Beneficios */}
      <ServicesSection />
    </div>
  );
}

// Componente para mostrar tarjeta de cabaña
const CabanaCard = ({ cabana, dateRange, navigate }) => {
  const noches = Math.ceil((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24));
  const precioTotal = (noches * cabana.precio).toFixed(2);

  return (
    <Col>
      <Card className="h-100 shadow-sm">
        <Card.Img 
          variant="top" 
          src={getCabanaImage(cabana.imagenes?.[0])}
          style={{ height: '200px', objectFit: 'cover' }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/placeholder-cabana.jpg';
          }}
        />
        <Card.Body className="d-flex flex-column">
          <Card.Title>{cabana.nombre}</Card.Title>
          <Card.Text className="text-muted">
            <small>
              <FaStar className="text-warning" /> {cabana.capacidad} personas · ${cabana.precio}/noche
            </small>
          </Card.Text>
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
                  imagenPrincipal: cabana.imagenes?.[0] || ''
                }
              })}
            >
              Reservar ahora
            </Button>
            <Button 
              as={Link}
              to={`/cabanas/${cabana._id}`}
              variant="outline-primary"
              className="w-100"
            >
              Ver detalles
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );
};

const FeaturedCabanas = ({ cabanas = [], loading, API_URL }) => (
  <section className="py-5">
    <Container>
      <h2 className="text-center mb-5">Nuestras Cabañas Destacadas</h2>
      {loading ? (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </Spinner>
        </div>
      ) : (
        <Row xs={1} md={3} className="g-4">
          {Array.isArray(cabanas) && cabanas.length > 0 ? (
            cabanas.map((cabana) => (
              <Col key={cabana._id || Math.random().toString()}>
                <Card className="h-100 shadow-sm">
                  <Card.Img 
                    variant="top" 
                    src={getCabanaImage(cabana.imagenes?.[0], API_URL)}
                    style={{ height: '200px', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder-cabana.jpg';
                    }}
                  />
                  <Card.Body className="d-flex flex-column">
                    <Card.Title>{cabana.nombre || 'Cabaña sin nombre'}</Card.Title>
                    <Card.Text>
                      <small className="text-muted">
                        <FaStar className="text-warning" /> 
                        {cabana.capacidad || 1} personas · ${(cabana.precio || 0).toLocaleString()}/noche
                      </small>
                    </Card.Text>
                    <Button 
                      as={Link}
                      to={`/cabanas/${cabana._id}`}
                      variant="outline-primary"
                      className="mt-auto"
                    >
                      Ver Detalles
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))
          ) : (
            <Col className="text-center py-4">
              <Alert variant="info">
                No hay cabañas disponibles en este momento
              </Alert>
            </Col>
          )}
        </Row>
      )}
    </Container>
  </section>
);

// Componente para sección de servicios
const ServicesSection = () => (
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
);

// Helper para obtener imagen de cabaña
// Función helper mejorada
const getCabanaImage = (img, API_URL) => {
  if (!img) return '/placeholder-cabana.jpg';
  if (img.startsWith('http')) return img;
  return `${API_URL}/uploads/${img}`;
};
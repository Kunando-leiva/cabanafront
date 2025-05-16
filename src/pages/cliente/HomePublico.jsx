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

  // 1. Añade esta función para manejar las URLs de imágenes
  const getImageUrl = (imageData) => {
    // Si no hay datos de imagen, retorna la imagen por defecto
    if (!imageData) return `${API_URL}/default-cabana.jpg`;
    
    // Si es string y ya es una URL completa
    if (typeof imageData === 'string' && imageData.startsWith('http')) {
      return imageData;
    }
    
    // Si es string pero no es URL completa
    if (typeof imageData === 'string') {
      return `${API_URL}${imageData.startsWith('/') ? '' : '/'}${imageData}`;
    }
    
    // Si es objeto con propiedad url
    if (imageData.url) {
      return imageData.url.startsWith('http') 
        ? imageData.url 
        : `${API_URL}${imageData.url.startsWith('/') ? '' : '/'}${imageData.url}`;
    }
    
    // Si es objeto con _id o fileId
    if (imageData._id || imageData.fileId) {
      return `${API_URL}/api/images/${imageData._id || imageData.fileId}`;
    }
    
    // Caso por defecto
    return `${API_URL}/default-cabana.jpg`;
  };

  // 2. Modifica el useEffect para cargar cabañas
  useEffect(() => {
    const fetchCabanas = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/cabanas?destacadas=true`);
        console.log('Respuesta API:', response.data); // Para depuración
        
        const data = response.data?.data || response.data;
        
        if (!Array.isArray(data)) {
          throw new Error('Formato de respuesta inválido');
        }

        // Procesar las cabañas para asegurar URLs válidas
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
      } catch (err) {
        console.error('Error al cargar cabañas:', err);
        setError(err.message);
        setCabanas([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchCabanas();
  }, []);

  // 3. Modifica la función de búsqueda de disponibilidad
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
  
      const fechaInicio = dateRange.start.toISOString().split('T')[0];
      const fechaFin = dateRange.end.toISOString().split('T')[0];
  
      const params = new URLSearchParams({ fechaInicio, fechaFin });
      const response = await axios.get(
        `${API_URL}/api/cabanas/disponibilidad?${params.toString()}`
      );

      // Procesar las cabañas disponibles
      const processedCabanas = (response.data?.data || []).map(cabana => ({
        ...cabana,
        imagenPrincipal: getImageUrl(cabana.imagenPrincipal || cabana.imagenes?.[0])
      }));
  
      setAvailableCabanas(processedCabanas);
      setSearchStatus(prev => ({ ...prev, loading: false }));
      
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setSearchStatus({
        loading: false,
        error: error.response?.data?.message || 'Error al buscar disponibilidad',
        searched: true
      });
      setAvailableCabanas([]);
    }
  };

  // 4. Componente CabanaCard actualizado
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

  // 5. Componente FeaturedCabanas actualizado
  const FeaturedCabanas = () => {
    if (loading) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-2">Cargando cabañas destacadas...</p>
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

  // ... [resto del código permanece igual]
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
      {searchStatus.searched && (
        <section className="py-5">
          <Container>
            {searchStatus.loading ? (
              <div className="text-center">
                <Spinner animation="border" />
                <p className="mt-2">Buscando cabañas disponibles...</p>
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

      {/* Cabañas Destacadas */}
      <FeaturedCabanas />

      {/* Servicios/Beneficios */}
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

// Funciones auxiliares
function formatDate(date) {
  return date?.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }) || '';
}

function calcularNoches(start, end) {
  if (!start || !end || start >= end) return 0;
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}
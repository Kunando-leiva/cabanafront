import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Card, Row, Col, Spinner, Alert, Badge, Container } from 'react-bootstrap';
import PublicNavbar from '../../components/PublicNavbar';
import { API_URL } from '../../config';
import { 
  FaWifi, FaSwimmingPool, FaSnowflake, FaUtensils, 
  FaParking, FaTv, FaBed, FaShower, FaUmbrellaBeach,
  FaTemperatureHigh, FaFan, FaTshirt, FaGlassWhiskey,
  FaCoffee, FaHome, FaCheckCircle, FaEnvelope,
} from 'react-icons/fa';
import { BiFridge } from 'react-icons/bi';
import { GiElectric } from 'react-icons/gi';
import './CabanasPublico.css'; // Archivo para estilos adicionales
import Footer from '../../components/admin/Footer';


export default function CabanasPublico() {
  const [cabanas, setCabanas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCabanas = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await axios.get(`${API_URL}/api/cabanas`);
        
        const responseData = response.data?.data || response.data || [];
        
        if (!Array.isArray(responseData)) {
          throw new Error('Formato de datos inesperado');
        }

        const formattedCabanas = responseData.map(cabana => ({
          ...cabana,
          imagenPrincipal: cabana.imagenPrincipal?.url || 
                         cabana.images?.[0]?.url || 
                         `${API_URL}/default-cabana.jpg`,
          servicios: cabana.servicios || []
        }));

        setCabanas(formattedCabanas);
      } catch (err) {
        console.error('Error al cargar cabañas:', err);
        setError(err.response?.data?.error || 
                err.message || 
                'Error al cargar las cabañas. Intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchCabanas();
  }, []);

  const servicioIcono = {
  'Piscina': <FaSwimmingPool className="me-1" />,
  'Cocina': <FaUtensils className="me-1" />,
  'Estacionamiento': <FaParking className="me-1" />,
  'Ropa de cama': <FaBed className="me-1" />,
  'Artículos de aseo': <FaShower className="me-1" />,
  'Balcón o terraza': <FaUmbrellaBeach className="me-1" />,
  'Baños': <FaShower className="me-1" />,
  'Cama doble': <FaBed className="me-1" />,
  'Heladera': <BiFridge className="me-1" />,
  'Pava eléctrica': <GiElectric className="me-1" />,
  'Toallones': <FaTshirt className="me-1" />,
  'Vasos': <FaGlassWhiskey className="me-1" />,
  'Platos': <FaUtensils className="me-1" />,
  'Cubiertos': <FaUtensils className="me-1" />,
  'Wi-Fi': <FaWifi className="me-1" />,
  'Ventiladores': <FaFan className="me-1" />,
  'TV': <FaTv className="me-1" />,
  'Ollas': <FaUtensils className="me-1" />,
  'Fuentes para horno': <FaUtensils className="me-1" />,
  'Parrillas': <FaUtensils className="me-1" />,
  'Desayuno seco': <FaCoffee className="me-1" />,
  'Fogón': <GiElectric className="me-1" />,
  'Parque': <FaUmbrellaBeach className="me-1" />,
  'Cancha de fútbol': <FaSwimmingPool className="me-1" />,
  'Aire acondicionado': <FaSnowflake className="me-1" />,
  'Calefacción': <FaTemperatureHigh className="me-1" />
};

  const getImageUrl = (imgPath) => {
    if (!imgPath) return `${API_URL}/default-cabana.jpg`;
    return imgPath.startsWith('http') ? imgPath : `${API_URL}${imgPath.startsWith('/') ? '' : '/'}${imgPath}`;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" style={{ color: '#333' }} />
        <p className="mt-3" style={{ fontWeight: 300 }}>Cargando cabañas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-5">
        <Alert variant="light" className="text-center border">
          <p className="mb-3" style={{ fontWeight: 300 }}>{error}</p>
          <Button 
            variant="outline-dark"
            onClick={() => window.location.reload()}
            className="rounded-0 px-4"
            style={{ fontWeight: 300, letterSpacing: '1px' }}
          >
            Reintentar
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="cabanas-publico">
      <PublicNavbar />
      
      <Container className="py-5">
        <h1 className="H1-text text-center mb-5 fw-light" style={{ letterSpacing: '1px' }}>
          Nuestras Cabañas
        </h1>
        
        {cabanas.length === 0 ? (
          <Alert variant="light" className="text-center border">
            <p style={{ fontWeight: 300 }}>No hay cabañas disponibles en este momento</p>
          </Alert>
        ) : (
          <Row xs={1} md={2} lg={3} className="g-4">
            {cabanas.map((cabana) => (
              <Col key={cabana._id}>
                <Card className="h-100 border-0 shadow-sm">
                  <div className="ratio ratio-16x9">
                    <Card.Img 
                      variant="top"
                      src={getImageUrl(cabana.imagenPrincipal)}
                      alt={`Cabaña ${cabana.nombre}`}
                      style={{ 
                        objectFit: 'cover',
                        transition: 'transform 0.5s ease'
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `${API_URL}/default-cabana.jpg`;
                      }}
                    />
                  </div>
                  <Card.Body className="d-flex flex-column p-4">
                    <Card.Title className="fw-light mb-3" style={{ fontSize: '1.4rem' }}>
                      {cabana.nombre}
                    </Card.Title>
                    <Card.Text className="flex-grow-1" style={{ fontWeight: 300 }}>
                      <small className="d-block mb-2">
                        <strong>Capacidad:</strong> {cabana.capacidad} personas
                      </small>
                      <small className="d-block">
                        <strong>Precio:</strong> ${cabana.precio?.toLocaleString()} por noche
                      </small>
                    </Card.Text>
                    
                    {cabana.servicios?.length > 0 && (
                      <div className="mb-4">
                        {cabana.servicios.slice(0, 5).map((servicio, i) => (
                          <Badge 
                            key={i} 
                            pill 
                            bg="light" 
                            text="dark" 
                            className="me-1 mb-1 border"
                            style={{ 
                              fontWeight: 300,
                              fontSize: '0.8rem'
                            }}
                          >
                            {servicioIcono[servicio] || servicio}
                          </Badge>
                        ))}
                        {cabana.servicios.length > 5 && (
                          <Badge 
                            pill 
                            bg="light" 
                            text="dark"
                            className="border"
                            style={{ fontWeight: 300 }}
                          >
                            +{cabana.servicios.length - 5}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <Link 
                      to={`/cabanas/${cabana._id}`}
                      className="btn btn-outline-dark rounded-0 d-block mx-auto mt-3"
                      style={{
                padding: '10px 25px',
                fontWeight: 300,
                letterSpacing: '1px',
                borderRadius: '0',
                textTransform: 'uppercase',
                width: '100%',
                maxWidth: '200px',
                backgroundColor: '#eaac25',
               
              }}
                    >
                      Ver detalles
                    </Link>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>

      <Footer />
    </div>
  );
}
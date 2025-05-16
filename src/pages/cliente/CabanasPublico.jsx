import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Card, Row, Col, Spinner, Alert, Badge } from 'react-bootstrap';
import PublicNavbar from '../../components/PublicNavbar';
import { API_URL } from '../../config';
import { 
  FaWifi, FaSwimmingPool, FaSnowflake, FaUtensils, 
  FaParking, FaTv, FaBed, FaShower, FaUmbrellaBeach,
  FaTemperatureHigh
} from 'react-icons/fa';

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
        
        // Manejar diferentes formatos de respuesta
        const responseData = response.data?.data || response.data || [];
        
        if (!Array.isArray(responseData)) {
          throw new Error('Formato de datos inesperado');
        }

        // Formatear datos de cabañas
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

  // Iconos para servicios comunes
  const servicioIcono = {
    'Wifi': <FaWifi className="me-1" />,
    'Piscina': <FaSwimmingPool className="me-1" />,
    'Aire acondicionado': <FaSnowflake className="me-1" />,
    'Estacionamiento': <FaParking className="me-1" />,
    'TV': <FaTv className="me-1" />,
    'Cocina': <FaUtensils className="me-1" />,
    'Ropa de cama': <FaBed className="me-1" />,
    'Artículos de aseo': <FaShower className="me-1" />,
    'Balcón o terraza': <FaUmbrellaBeach className="me-1" />,
    'Calefacción': <FaTemperatureHigh className="me-1" />
  };

  // Construir URL de imagen segura
  const getImageUrl = (imgPath) => {
    if (!imgPath) return `${API_URL}/default-cabana.jpg`;
    return imgPath.startsWith('http') ? imgPath : `${API_URL}${imgPath.startsWith('/') ? '' : '/'}${imgPath}`;
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Cargando cabañas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="mt-4 text-center">
        <Alert.Heading>Error</Alert.Heading>
        <p>{error}</p>
        <Button 
          variant="primary" 
          onClick={() => window.location.reload()}
          className="mt-2"
        >
          Reintentar
        </Button>
      </Alert>
    );
  }

  return (
    <div className="container py-5">
      <PublicNavbar />
      <h1 className="text-center mb-4">Nuestras Cabañas</h1>
      
      {cabanas.length === 0 ? (
        <Alert variant="info" className="text-center">
          No hay cabañas disponibles en este momento
        </Alert>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {cabanas.map((cabana) => (
            <Col key={cabana._id}>
              <Card className="h-100 shadow-sm">
                <div className="ratio ratio-16x9">
                  <Card.Img 
                    variant="top"
                    src={getImageUrl(cabana.imagenPrincipal)}
                    alt={`Cabaña ${cabana.nombre}`}
                    style={{ objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `${API_URL}/default-cabana.jpg`;
                    }}
                  />
                </div>
                <Card.Body className="d-flex flex-column">
                  <Card.Title>{cabana.nombre}</Card.Title>
                  <Card.Text className="flex-grow-1">
                    <small className="text-muted d-block mb-2">
                      <strong>Capacidad:</strong> {cabana.capacidad} personas
                    </small>
                    <small className="text-muted d-block">
                      <strong>Precio:</strong> ${cabana.precio?.toLocaleString()} por noche
                    </small>
                  </Card.Text>
                  
                  {cabana.servicios?.length > 0 && (
                    <div className="mb-3">
                      {cabana.servicios.slice(0, 5).map((servicio, i) => (
                        <Badge 
                          key={i} 
                          pill 
                          bg="light" 
                          text="dark" 
                          className="me-1 mb-1 border"
                        >
                          {servicioIcono[servicio] || servicio}
                        </Badge>
                      ))}
                      {cabana.servicios.length > 5 && (
                        <Badge pill bg="secondary" className="ms-1">
                          +{cabana.servicios.length - 5}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <Link 
                    to={`/cabanas/${cabana._id}`}
                    className="btn btn-primary mt-auto"
                  >
                    Ver detalles y reservar
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
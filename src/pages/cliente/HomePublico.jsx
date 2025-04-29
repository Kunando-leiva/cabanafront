import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Button, Container, Row, Col, Card, Spinner } from 'react-bootstrap';
import { FaWifi, FaSwimmingPool, FaSnowflake, FaStar } from 'react-icons/fa';
import PublicNavbar from '../../components/PublicNavbar';
import { API_URL } from '../../config';
import logo from '../../assets/images/logo-alerces.png'; // Importa tu logo

export default function HomePublico() {
  const [cabanas, setCabanas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCabanas = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/cabanas?limit=3`);
        setCabanas(response.data);
      } catch (error) {
        console.error('Error fetching cabañas:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCabanas();
  }, []);

  return (
    <div className="home-publico">
      <PublicNavbar />

      {/* Hero Section con Logo */}
      <section className="hero-section bg-dark text-white text-center py-5 position-relative">
        <div className="hero-overlay"></div>
        <Container className="position-relative z-index-1">
          <h1 className="display-4 fw-bold mb-4">Complejo Los Alerces</h1>
          <p className="lead mb-4">Libertad - Pontevedra</p>
          <p className="mb-4">Descubre nuestras cabañas exclusivas en los mejores entornos naturales.</p>
          <Button as={Link} to="/cabanas" variant="primary" size="lg">
            Ver Cabañas Disponibles
          </Button>
        </Container>
      </section>

      {/* Cabañas Destacadas */}
      <section className="py-5">
        <Container>
          <h2 className="text-center mb-5">Nuestras Cabañas Destacadas</h2>
          {loading ? (
            <Spinner animation="border" className="d-block mx-auto" />
          ) : (
            <Row xs={1} md={3} className="g-4">
              {cabanas.map((cabana) => (
                <Col key={cabana._id}>
                  <Card className="h-100 shadow-sm">
                    {cabana.imagenes?.[0] && (
                      <Card.Img 
                        variant="top" 
                        src={cabana.imagenes[0]} 
                        style={{ height: '180px', objectFit: 'cover' }} 
                      />
                    )}
                    <Card.Body>
                      <Card.Title>{cabana.nombre}</Card.Title>
                      <Card.Text>
                        <small className="text-muted">
                          <FaStar className="text-warning" /> {cabana.capacidad} personas · ${cabana.precio}/noche
                        </small>
                      </Card.Text>
                      <Button 
                        as={Link} 
                        to={`/cabanas/${cabana._id}`} 
                        variant="outline-primary" 
                        size="sm"
                      >
                        Ver Detalles
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>

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
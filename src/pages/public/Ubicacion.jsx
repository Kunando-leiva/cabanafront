import { Container, Row, Col } from 'react-bootstrap';
import { FaMapMarkerAlt, FaPhone, FaClock } from 'react-icons/fa';
import PublicNavbar from '../../components/PublicNavbar';

export default function Ubicacion() {
  return (
    <Container className="py-5">
        <PublicNavbar />
      <h1 className="text-center mb-5">¿Dónde encontrarnos?</h1>
      <Row>
        <Col md={6}>
          <div className="mb-4">
            <h3><FaMapMarkerAlt className="text-danger me-2" />Dirección</h3>
            <p>Ruta 123, Km 45, Valle del Bosque, Argentina</p>
          </div>
          <div className="mb-4">
            <h3><FaPhone className="text-primary me-2" />Contacto</h3>
            <p>+54 261 123-4567</p>
          </div>
          <div>
            <h3><FaClock className="text-warning me-2" />Horarios</h3>
            <p>Check-in: 14:00 hs | Check-out: 10:00 hs</p>
          </div>
        </Col>
        <Col md={6}>
          {/* Integrar Google Maps o similar */}
          <div className="ratio ratio-16x9 bg-light border rounded">
            <iframe 
              src="https://www.google.com/maps/embed?pb=..." 
              title="Ubicación"
              allowFullScreen
            />
          </div>
        </Col>
      </Row>
    </Container>
  );
}
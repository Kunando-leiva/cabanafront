import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaMapMarkerAlt, FaPhone, FaClock, FaWhatsapp, FaEnvelope, FaStar } from 'react-icons/fa';
import PublicNavbar from '../../components/PublicNavbar';
import './Ubicacion.css'; // Archivo CSS opcional para estilos adicionales

export default function Ubicacion() {
  return (
    <Container className="py-5 ubicacion-container">
      <PublicNavbar />
      <h1 className="text-center mb-4">¿Dónde encontrarnos?</h1>
      
      {/* Sección de información arriba */}
      <Row className="justify-content-center mb-5">
        <Col xl={8} xxl={7}>
          <Row>
            {/* Tarjeta de Dirección */}
            <Col md={4} className="mb-4">
              <Card className="h-100 info-card">
                <Card.Body>
                  <h3 className="d-flex align-items-center">
                    <FaMapMarkerAlt className="text-danger me-2" size={20} />
                    <span>Dirección</span>
                  </h3>
                  <p className="mt-3">Ruta 197 Km 1.5, Marcos Paz, Buenos Aires, Argentina</p>
                  <p className="text-muted small">(A 5 minutos del centro de Marcos Paz)</p>
                </Card.Body>
              </Card>
            </Col>

            {/* Tarjeta de Contacto */}
            <Col md={4} className="mb-4">
              <Card className="h-100 info-card">
                <Card.Body>
                  <h3 className="d-flex align-items-center">
                    <FaPhone className="text-primary me-2" size={20} />
                    <span>Contacto</span>
                  </h3>
                  <div className="mt-3">
                    <p>+54 11 5555-5555</p>
                    <a 
                      href="https://wa.me/541155555555" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="d-block text-success mb-2"
                    >
                      <FaWhatsapp className="me-1" />
                      Contactar por WhatsApp
                    </a>
                    <a 
                      href="mailto:info@losalerces.com.ar" 
                      className="d-block text-primary"
                    >
                      <FaEnvelope className="me-1" />
                      info@losalerces.com.ar
                    </a>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Tarjeta de Horarios */}
            <Col md={4} className="mb-4">
              <Card className="h-100 info-card">
                <Card.Body>
                  <h3 className="d-flex align-items-center">
                    <FaClock className="text-warning me-2" size={20} />
                    <span>Horarios</span>
                  </h3>
                  <ul className="mt-3 list-unstyled">
                    <li className="mb-2">Check-in: 14:00 hs</li>
                    <li className="mb-2">Check-out: 10:00 hs</li>
                    <li>Recepción: 08:00 a 22:00 hs</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Información adicional */}
          <div className="text-center mt-3">
            <h4 className="d-inline-flex align-items-center">
              <FaStar className="text-warning me-1" />
              <span>Complejo "LosAlerces"</span>
            </h4>
            <p className="text-muted mb-1">7898+M4, Libertad, Provincia de Buenos Aires</p>
            <div className="d-flex justify-content-center align-items-center">
              <div className="me-2">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className="text-warning" />
                ))}
              </div>
              <span>5,0 ★★★★★ (8 reseñas)</span>
            </div>
          </div>
        </Col>
      </Row>

      {/* Sección del mapa abajo */}
      <Row className="justify-content-center">
        <Col xl={8} xxl={7}>
          <div className="map-container ratio ratio-16x9 rounded shadow overflow-hidden mb-3">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3278.958784069181!2d-58.68699675912354!3d-34.73143327302139!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcc100069fb769%3A0x57c6304c448438d0!2sComplejo%20%22LosAlerces%22!5e0!3m2!1ses!2sar!4v1745450713823!5m2!1ses!2sar" 
              title="Ubicación del Complejo Los Alerces"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          
          <div className="text-center">
            <a 
              href="https://maps.app.goo.gl/s16cgPqc33pQGrYo7" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Abrir en Google Maps
            </a>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

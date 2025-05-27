import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaMapMarkerAlt, FaPhone, FaClock, FaWhatsapp, FaEnvelope, FaStar } from 'react-icons/fa';
import PublicNavbar from '../../components/PublicNavbar';
import Footer from '../../components/admin/Footer';
import './Ubicacion.css';

export default function Ubicacion() {
  return (
    <div className="ubicacion-page">
      <PublicNavbar />
      
      <Container className="py-5">
        {/* Título */}
        <h1 className="text-center mb-5 fw-light" style={{ letterSpacing: '1px' }}>
          ¿Dónde encontrarnos?
        </h1>
        
        {/* Tarjetas de información */}
        <Row className="justify-content-center mb-5 g-4">
          {/* Dirección */}
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center mb-4">
                  <FaMapMarkerAlt className="me-3" size={20} />
                  <h3 className="mb-0 fw-light">Dirección</h3>
                </div>
                <p className="text-muted" style={{ fontWeight: 300 }}>
                  7898+M4 Complejo "LosAlerces", Libertad, Provincia de Buenos Aires
                  <small className="d-block mt-1"></small>
                </p>
              </Card.Body>
            </Card>
          </Col>

          {/* Contacto */}
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center mb-4">
                  <FaPhone className="me-3" size={20} />
                  <h3 className="mb-0 fw-light">Contacto</h3>
                </div>
                <div style={{ fontWeight: 300 }}>
                  <p className="mb-2">+54 9 11 6468-0413</p>
                  <a 
                    href="https://wa.me/5491164680413" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="d-block mb-2 text-decoration-none"
                    style={{ color: '#333' }}
                  >
                    <FaWhatsapp className="me-2" />
                    WhatsApp
                  </a>
                  <a 
                    href="mailto:Nathanquarta427@gmail.com" 
                    className="d-block text-decoration-none"
                    style={{ color: '#333' }}
                  >
                    <FaEnvelope className="me-2" />
                    Nathanquarta427@gmail.com
                  </a>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Horarios */}
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center mb-4">
                  <FaClock className="me-3" size={20} />
                  <h3 className="mb-0 fw-light">Horarios</h3>
                </div>
                <ul className="list-unstyled" style={{ fontWeight: 300 }}>
                  <li className="mb-2">Check-in: 14:00 hs</li>
                  <li className="mb-2">Check-out: 10:00 hs</li>
                  <li>Recepción: 08:00 a 22:00 hs</li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Información adicional */}
        <div className="text-center mb-5">
          <h4 className="fw-light mb-3" style={{ letterSpacing: '1px' }}>
            Complejo "Los Alerces"
          </h4>
          <p className="text-muted mb-3" style={{ fontWeight: 300 }}>
            7898+M4, Libertad, Provincia de Buenos Aires
          </p>
          <div className="d-flex justify-content-center align-items-center">
            {[...Array(5)].map((_, i) => (
              <FaStar key={i} className="me-1" style={{ color: '#ffc107', fontSize: '0.9rem' }} />
            ))}
            <span className="small" style={{ fontWeight: 300 }}>5,0 (8 reseñas)</span>
          </div>
        </div>

        {/* Mapa */}
        <Row className="justify-content-center">
          <Col xl={8} xxl={7}>
            <div className="ratio ratio-16x9 mb-4">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3278.958784069181!2d-58.68699675912354!3d-34.73143327302139!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcc100069fb769%3A0x57c6304c448438d0!2sComplejo%20%22LosAlerces%22!5e0!3m2!1ses!2sar!4v1745450713823!5m2!1ses!2sar" 
                title="Ubicación del Complejo Los Alerces"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                style={{ border: 'none' }}
              />
            </div>
            
            <div className="text-center">
              <a 
                href="https://maps.app.goo.gl/s16cgPqc33pQGrYo7" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-outline-dark rounded-0 px-4 py-2"
                style={{ 
                   fontWeight: 300,
            lineHeight: '1.6', // Interlineado ajustado
            marginBottom: '1.5rem',
            backgroundColor: '#eaac25',
            borderColor: '#eaac25',
                }}
              >
                Abrir en Google Maps
              </a>
            </div>
          </Col>
        </Row>
      </Container>
      <Footer />
    </div>
  );
}
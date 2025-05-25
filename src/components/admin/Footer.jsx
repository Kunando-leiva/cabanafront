import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { FaFacebook, FaInstagram, FaMapMarkerAlt, FaPhone, FaEnvelope, FaHome, FaConciergeBell, FaUsers } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer py-5" style={{ backgroundColor: '#2a2722', color: 'white' }}>
      <Container>
        <Row>
          {/* Columna 1: Logo y redes sociales */}
          <Col md={4} className="mb-4 mb-md-0">
            <h5 className="mb-4" style={{ fontWeight: 300, letterSpacing: '1px' }}>Complejo Los Alerces</h5>
            <p style={{ fontWeight: 300 }}>Libertad - Pontevedra</p>
            <div className="social-icons mt-4">
              <a 
                href="https://www.facebook.com/profile.php?id=61568680598709&ref=pl_edit_ig_profile_ac" 
                target="_blank" 
                rel="noopener noreferrer"
                className="me-3"
                style={{ color: 'white', fontSize: '1.5rem' }}
              >
                <FaFacebook />
              </a>
              <a 
                href="https://www.instagram.com/complejo.losalerces?igsh=MWt4Z2NxYTg4
                MHNncQ%3D%3D&fbclid=PAZXh0bgNhZW0CMTEAAadbyFonF36NK0emMhZ9EQV6gzo3sGQd
                2oRBia-m22I6lZdEgo_lmD7LGvlWkw_aem_Vi55OwRrjLv5-hEWFiQYSA" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: 'white', fontSize: '1.5rem' }}
              >
                <FaInstagram />
              </a>
            </div>
          </Col>

          {/* Columna 2: Enlaces rápidos */}
          <Col md={4} className="mb-4 mb-md-0">
            <h5 className="mb-4" style={{ fontWeight: 300, letterSpacing: '1px' }}>Enlaces Rápidos</h5>
            <ul className="list-unstyled" style={{ fontWeight: 300 }}>
              <li className="mb-2">
                <Link to="/" className="text-white text-decoration-none d-flex align-items-center">
                  <FaHome className="me-2" /> Inicio
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/servicios" className="text-white text-decoration-none d-flex align-items-center">
                  <FaConciergeBell className="me-2" /> Servicios
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/nosotros" className="text-white text-decoration-none d-flex align-items-center">
                  <FaUsers className="me-2" /> Nosotros
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/ubicacion" className="text-white text-decoration-none d-flex align-items-center">
                  <FaMapMarkerAlt className="me-2" /> Ubicación
                </Link>
              </li>
              <li>
                <Link to="/contacto" className="text-white text-decoration-none d-flex align-items-center">
                  <FaEnvelope className="me-2" /> Contacto
                </Link>
              </li>
            </ul>
          </Col>

          {/* Columna 3: Contacto */}
          <Col md={4}>
            <h5 className="mb-4" style={{ fontWeight: 300, letterSpacing: '1px' }}>Contacto</h5>
            <ul className="list-unstyled" style={{ fontWeight: 300 }}>
              <li className="mb-3 d-flex align-items-center">
                <FaMapMarkerAlt className="me-3" />
                <span>Dirección: Ruta 123, Libertad, Pontevedra</span>
              </li>
              <li className="mb-3 d-flex align-items-center">
                <FaPhone className="me-3" />
                <span>Teléfono: +54 11 1234-5678</span>
              </li>
              <li className="d-flex align-items-center">
                <FaEnvelope className="me-3" />
                <span>Email: info@complejolosalerces.com</span>
              </li>
            </ul>
          </Col>
        </Row>

        <Row className="mt-5">
          <Col className="text-center">
            <p className="mb-0" style={{ fontWeight: 300, fontSize: '0.9rem' }}>
              &copy; {new Date().getFullYear()} Complejo Los Alerces. Todos los derechos reservados.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
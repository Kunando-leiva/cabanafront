import { Container, Nav, Navbar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaHome, FaTree, FaMapMarkedAlt, FaImages, FaUsers } from 'react-icons/fa';
import logo from '../assets/images/logo-alerces.png';

export default function PublicNavbar() {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" sticky="top" className="shadow-sm">
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2">
          <img 
            src={logo} 
            alt="Complejo Los Alerces" 
            style={{ height: '50px' }}
            className="d-inline-block align-top"
          />
          <span className="fw-bold fs-5">Complejo Los Alerces</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" className="border-0" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto gap-3">
            <Nav.Link as={Link} to="/" className="d-flex align-items-center text-uppercase fw-semibold">
              <FaHome className="me-1" /> Inicio
            </Nav.Link>
            <Nav.Link as={Link} to="/nosotros" className="d-flex align-items-center text-uppercase fw-semibold">
              <FaUsers className="me-1" /> Nosotros
            </Nav.Link>
            <Nav.Link as={Link} to="/cabanas" className="d-flex align-items-center text-uppercase fw-semibold">
              <FaTree className="me-1" /> Cabañas
            </Nav.Link>
            <Nav.Link as={Link} to="/ubicacion" className="d-flex align-items-center text-uppercase fw-semibold">
              <FaMapMarkedAlt className="me-1" /> Ubicación
            </Nav.Link>
            <Nav.Link as={Link} to="/galeria" className="d-flex align-items-center text-uppercase fw-semibold">
              <FaImages className="me-1" /> Imágenes
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

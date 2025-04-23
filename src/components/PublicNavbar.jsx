import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaHome, FaTree, FaMapMarkedAlt, FaImages, FaUsers } from 'react-icons/fa';

export default function PublicNavbar() {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <FaTree className="me-2" />
          Cabañas del Bosque
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/" className="d-flex align-items-center">
              <FaHome className="me-1" /> Inicio
            </Nav.Link>
            <Nav.Link as={Link} to="/nosotros" className="d-flex align-items-center">
              <FaUsers className="me-1" /> Nosotros
            </Nav.Link>
            <Nav.Link as={Link} to="/cabanas" className="d-flex align-items-center">
              <FaTree className="me-1" /> Cabañas
            </Nav.Link>
            <Nav.Link as={Link} to="/ubicacion" className="d-flex align-items-center">
              <FaMapMarkedAlt className="me-1" /> Ubicación
            </Nav.Link>
            <Nav.Link as={Link} to="/galeria" className="d-flex align-items-center">
              <FaImages className="me-1" /> Imágenes
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
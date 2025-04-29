import { Container, Row, Col, Image } from 'react-bootstrap';
import PublicNavbar from '../../components/PublicNavbar';

export default function Nosotros() {
  return (
    <Container className="py-5">
        <PublicNavbar />
      <Row className="align-items-center">
        <Col md={6}>
          <h1 className="display-4 mb-4">Nuestra Historia</h1>
          <p className="lead">
            Desde 2010 ofreciendo experiencias únicas en contacto con la naturaleza.
          </p>
          <p>
            Fundada por amantes de la montaña, nuestras cabañas combinan confort y aventura.
          </p>
        </Col>
        <Col md={6}>
          <Image 
            src="https://ejemplo.com/nosotros.jpg" 
            fluid 
            rounded 
            alt="Equipo de Cabañas del Bosque"
          />
        </Col>
      </Row>
    </Container>
  );
}
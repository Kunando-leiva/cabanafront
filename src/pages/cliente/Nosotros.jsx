import { Container, Row, Col, Image } from 'react-bootstrap';
import PublicNavbar from '../../components/PublicNavbar';
import './Nosotros.css'; // Archivo para estilos adicionales

export default function Nosotros() {
  return (
    <div className="nosotros-page">
      <PublicNavbar />
      
      <Container className="py-5">
        <Row className="align-items-center">
          {/* Columna de texto */}
          <Col md={6} className="pe-md-5 mb-5 mb-md-0">
            <h1 className="fw-light mb-4" style={{ 
              fontSize: '2.5rem',
              letterSpacing: '1px',
              lineHeight: '1.3'
            }}>
              Nuestra Historia
            </h1>
            
            <p className="lead mb-4" style={{ 
              fontWeight: 300,
              lineHeight: '1.8'
            }}>
              Desde 2010 ofreciendo experiencias únicas en contacto con la naturaleza.
            </p>
            
            <p style={{ 
              fontWeight: 300,
              lineHeight: '1.8',
              marginBottom: '2rem'
            }}>
              Fundada por amantes de la montaña, nuestras cabañas combinan confort y aventura. 
              Cada detalle ha sido cuidadosamente diseñado para que tu estadía sea inolvidable.
            </p>
            
            <div className="d-flex align-items-center" style={{ fontWeight: 300 }}>
              <div className="border-end pe-3 me-3">
                <div className="fs-1">10+</div>
                <div>Años de experiencia</div>
              </div>
              <div>
                <div className="fs-1">50+</div>
                <div>Clientes satisfechos</div>
              </div>
            </div>
          </Col>

          {/* Columna de imagen */}
          <Col md={6}>
            <div className="nosotros-image-container">
              <Image 
                src="/images/nosotros.jpg" // Asegúrate de tener la imagen en public/images
                fluid
                alt="Equipo de Cabañas del Bosque"
                className="img-fluid"
                style={{ 
                  width: '100%',
                  height: 'auto',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/default-nosotros.jpg';
                }}
              />
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
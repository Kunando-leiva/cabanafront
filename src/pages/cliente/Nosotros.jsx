import { Container, Row, Col, Image } from 'react-bootstrap';
import PublicNavbar from '../../components/PublicNavbar';
import Footer from '../../components/admin/Footer';
import './Nosotros.css'; // Archivo para estilos adicionales
import nosotrosimg from '../../assets/images/IMG_5538.jpg'; // Asegúrate de tener la imagen en esta ruta

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
              Desde hace más de 5 años ofrecemos experiencias únicas en un lugar especial,
               creado para que disfrutes de la tranquilidad y el contacto con la naturaleza.
            </p>
            
            <p style={{ 
              fontWeight: 300,
              lineHeight: '1.8',
              marginBottom: '2rem'
            }}>
Nuestras cabañas fueron pensadas con amor y dedicación para quienes valoran los detalles. 
Cada espacio combina comodidad, calidez y ese toque de aventura que transforma cada estadía en un recuerdo inolvidable.
            </p>
            
            
          </Col>

          {/* Columna de imagen */}
          <Col md={6}>
            <div className="nosotros-image-container">
              <Image 
                src={nosotrosimg}
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
      <Footer />
    </div>
  );
}
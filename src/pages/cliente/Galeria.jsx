import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Spinner, Alert, Modal, Button } from 'react-bootstrap';
import axios from 'axios';
import { API_URL } from '../../config';
import Navbar from '../../components/PublicNavbar';
import './Galeria.css';
import Footer from '../../components/admin/Footer';

// Imágenes locales
import localImage1 from '../../assets/images/IMG_4740.jpg';
import localImage2 from '../../assets/images/IMG_4741.jpg';
import localImage3 from '../../assets/images/IMG_4747.jpg';
import localImage4 from '../../assets/images/IMG_4759.jpg';
import localImage5 from '../../assets/images/IMG_4763.jpg';
import localImage6 from '../../assets/images/IMG_4779.jpg';
import localImage7 from '../../assets/images/IMG_4828.jpg';
import localImage8 from '../../assets/images/IMG_4829.jpg';
import localImage9 from '../../assets/images/IMG_4831.jpg';
import localImage10 from '../../assets/images/IMG_4833.jpg';
import localImage11 from '../../assets/images/IMG_5513.jpg';
import localImage12 from '../../assets/images/IMG_5523.jpg';
import localImage13 from '../../assets/images/IMG_5529.jpg';
import localImage14 from '../../assets/images/IMG_5538.jpg';

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const navigate = useNavigate();

  // Imágenes locales fijas
  const localImages = [
    { id: 'local-1', url: localImage1 },
    { id: 'local-2', url: localImage2 },
    { id: 'local-3', url: localImage3 },
    { id: 'local-4', url: localImage4 },
    { id: 'local-5', url: localImage5 },
    { id: 'local-6', url: localImage6 },
    { id: 'local-7', url: localImage7 },
    { id: 'local-8', url: localImage8 },
    { id: 'local-9', url: localImage9 },
    { id: 'local-10', url: localImage10 },
    { id: 'local-11', url: localImage11 },
    { id: 'local-12', url: localImage12 },
    { id: 'local-13', url: localImage13 },
    { id: 'local-14', url: localImage14 }
  ];

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/images`, {
          params: {
            populate: 'relatedCabana'
          }
        });
        
        if (!response.data.success) {
          throw new Error(response.data.error || 'Respuesta inesperada del servidor');
        }

        const processedImages = response.data.data.map(img => ({
          id: img._id,
          url: img.fullUrl || `${API_URL}${img.url}`,
          cabanaName: img.relatedCabana?.nombre || '',
        }));

        // Combina las imágenes locales con las de la API
        const allImages = [...localImages, ...processedImages];
        setImages(allImages);
        setError(null);
      } catch (err) {
        console.error('Error al cargar imágenes:', err);
        // En caso de error, mostrar solo las imágenes locales
        setImages(localImages);
        setError(err.response?.data?.error || err.message || 'Error al cargar la galería');
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  const renderContent = () => {
    if (loading && images.length === 0) {
      return (
        <div className="text-center my-5 py-5">
          <Spinner animation="border" role="status" style={{ color: '#333' }} />
          <p className="mt-3" style={{ fontWeight: 300 }}>Cargando imágenes...</p>
        </div>
      );
    }

    if (error && images.length === 0) {
      return (
        <Container className="my-5">
          <Alert variant="light" className="border">
            <p className="mb-3" style={{ fontWeight: 300 }}>{error}</p>
            <div className="d-flex gap-2">
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline-dark"
                className="rounded-0 px-3"
                style={{ fontWeight: 300, letterSpacing: '1px' }}
              >
                Reintentar
              </Button>
              <Button 
                onClick={() => navigate("/")} 
                variant="outline-secondary"
                className="rounded-0 px-3"
                style={{ 
                  fontWeight: 300,
                  backgroundColor: '#eaac25',
                  borderColor: '#eaac25',
                }}
              >
                Volver
              </Button>
            </div>
          </Alert>
        </Container>
      );
    }

    if (images.length === 0) {
      return (
        <Container className="my-5">
          <Alert variant="light" className="border text-center">
            <p style={{ fontWeight: 300 }}>No hay imágenes disponibles</p>
            <Button 
              onClick={() => navigate(-1)} 
              variant="outline-dark"
              className="rounded-0 px-3 mt-2"
              style={{ 
                fontWeight: 300,
                backgroundColor: '#eaac25',
                borderColor: '#eaac25',
              }}
            >
              Volver
            </Button>
          </Alert>
        </Container>
      );
    }

    return (
      <Row xs={2} sm={3} md={4} className="g-3">
        {images.map((image) => (
          <Col key={image.id} className="mb-4">
            <div 
              className="gallery-item"
              onClick={() => setSelectedImage(image)}
            >
              <img
                src={image.url}
                alt={image.cabanaName}
                className="img-fluid w-100"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `${API_URL}/default-image.jpg`;
                }}
              />
            </div>
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <div className="gallery-page">
      <Navbar />
      
      <Container className="py-5">
        <div className="d-flex justify-content-between align-items-center mb-5">
          <h1 className="mb-0 fw-light" style={{ letterSpacing: '1px' }}>
            Galería
          </h1>
          <Button 
            onClick={() => navigate("/")} 
            variant="outline-dark"
            className="rounded-0 px-3"
            style={{ 
              fontWeight: 300,
              backgroundColor: '#eaac25',
              borderColor: '#eaac25',
            }}
          >
            Volver
          </Button>
        </div>
        
        {renderContent()}

        {/* Modal para imagen seleccionada */}
        <Modal
          show={!!selectedImage}
          onHide={() => setSelectedImage(null)}
          centered
          size="xl"
          className="gallery-modal"
        >
          <Modal.Header closeButton className="border-0">
            <Modal.Title style={{ fontWeight: 300 }}>
              {selectedImage?.cabanaName}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-0">
            <img
              src={selectedImage?.url}
              alt={`Cabaña ${selectedImage?.cabanaName}`}
              className="img-fluid w-100"
              style={{ maxHeight: '90vh', objectFit: 'contain' }}
            />
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button 
              variant="outline-dark" 
              onClick={() => setSelectedImage(null)}
              className="rounded-0 px-3"
              style={{ 
                fontWeight: 300,
                backgroundColor: '#eaac25',
                borderColor: '#eaac25',
              }}
            >
              Cerrar
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
      <Footer />
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Spinner, Alert, Modal, Button } from 'react-bootstrap';
import axios from 'axios';
import { API_URL } from '../../config';
import Navbar from '../../components/PublicNavbar'; // Asegúrate de importar tu componente Navbar

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/images`);
        
        // Verificar la estructura de respuesta
        console.log('Respuesta completa:', response);
        
        // Manejar tanto la estructura antigua como la nueva
        let imagesData = response.data;
        
        if (response.data && response.data.data) {
          imagesData = response.data.data;
        }
        else if (Array.isArray(response.data)) {
          imagesData = response.data;
        }
        
        // Validar que cada imagen tenga los campos requeridos
        const validatedImages = imagesData.map(img => ({
          _id: img._id || img.id,
          url: img.url || `${API_URL}/api/images/${img._id || img.fileId}`,
          cabanaName: img.cabanaName || img.relatedCabana?.name || 'Cabaña', // Asume que viene el nombre de la cabaña
          createdAt: img.createdAt || new Date().toISOString(),
          ...img
        }));

        setImages(validatedImages);
      } catch (err) {
        console.error('Error al cargar imágenes:', {
          error: err,
          response: err.response
        });
        setError(err.response?.data?.error || err.message || 'Error al cargar la galería');
        setImages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="text-center my-5">
          <Spinner animation="border" />
          <p className="mt-2">Cargando imágenes...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <Container className="my-5">
          <Alert variant="danger">
            <Alert.Heading>Error</Alert.Heading>
            <p>{error}</p>
            <div className="d-flex gap-2">
              <Button onClick={() => window.location.reload()} variant="primary">
                Reintentar
              </Button>
              <Button onClick={() => navigate(-1)} variant="outline-secondary">
                Volver atrás
              </Button>
            </div>
          </Alert>
        </Container>
      </>
    );
  }

  if (images.length === 0) {
    return (
      <>
        <Navbar />
        <Container className="my-5">
          <Alert variant="info">
            No hay imágenes disponibles
            <div className="mt-3">
              <Button onClick={() => navigate(-1)} variant="outline-primary">
                Volver atrás
              </Button>
            </div>
          </Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container className="my-5 gallery-container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">Galería de Cabañas</h2>
          <Button 
            onClick={() => navigate(-1)} 
            variant="outline-secondary"
            className="d-flex align-items-center"
          >
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </Button>
        </div>
        
        <Row xs={1} sm={2} md={3} lg={4} className="g-4">
          {images.map((image) => (
            <Col key={image._id}>
              <Card className="h-100 shadow-sm gallery-card">
                <div 
                  className="ratio ratio-16x9 card-img-top"
                  onClick={() => setSelectedImage(image)}
                  style={{ cursor: 'pointer' }}
                >
                  <img
                    src={image.url}
                    alt={image.cabanaName}
                    className="img-fluid"
                    style={{ objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `${API_URL}/default-image.jpg`;
                    }}
                  />
                </div>
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="text-center mb-auto">
                    {image.cabanaName}
                  </Card.Title>
                  <small className="text-muted text-center">
                    {new Date(image.createdAt).toLocaleDateString()}
                  </small>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Modal para vista ampliada */}
        <Modal
          show={!!selectedImage}
          onHide={() => setSelectedImage(null)}
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>{selectedImage?.cabanaName}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-center p-0">
            <img
              src={selectedImage?.url}
              alt={`Cabaña ${selectedImage?.cabanaName}`}
              className="img-fluid"
              style={{ maxHeight: '70vh', width: '100%', objectFit: 'contain' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `${API_URL}/default-image.jpg`;
              }}
            />
          </Modal.Body>
          <Modal.Footer className="d-flex justify-content-between">
            <small className="text-muted">
              Subido el: {selectedImage && new Date(selectedImage.createdAt).toLocaleDateString()}
            </small>
            <Button variant="secondary" onClick={() => setSelectedImage(null)}>
              Cerrar
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </>
  );
}
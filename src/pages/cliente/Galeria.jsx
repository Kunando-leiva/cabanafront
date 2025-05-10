// components/Gallery.jsx
import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Spinner, Modal } from 'react-bootstrap';
import axios from 'axios';
import { API_URL } from '../../config';

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/images`);
        setImages(res.data.images);
      } catch (err) {
        console.error('Error fetching images:', err);
        setError('Error al cargar las imágenes. Intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (images.length === 0) {
    return (
      <Container className="my-5">
        <Alert variant="info">No hay imágenes disponibles</Alert>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <h2 className="mb-4 text-center">Galería de Cabañas</h2>
      
      <Row xs={1} sm={2} md={3} lg={4} className="g-4">
        {images.map((image) => (
          <Col key={image.id || image._id}>
            <Card 
              className="h-100 shadow-sm" 
              onClick={() => setSelectedImage(image)}
              style={{ cursor: 'pointer' }}
            >
              <Card.Img
                variant="top"
                src={image.url}
                alt={image.cabana?.nombre || image.filename || 'Imagen de cabaña'}
                style={{ 
                  height: '200px', 
                  objectFit: 'cover',
                  backgroundColor: '#f8f9fa' // fondo mientras carga
                }}
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = 'https://via.placeholder.com/300x200?text=Imagen+no+disponible';
                }}
              />
              <Card.Body>
                <Card.Title className="text-truncate">
                  {image.cabana?.nombre || image.filename || 'Imagen'}
                </Card.Title>
                {image.size && (
                  <Card.Text className="text-muted small">
                    {(image.size / 1024).toFixed(1)} KB
                  </Card.Text>
                )}
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
          <Modal.Title>
            {selectedImage?.cabana?.nombre || selectedImage?.filename || 'Imagen'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <img
            src={selectedImage?.url}
            alt="Vista ampliada"
            className="img-fluid"
            style={{ 
              maxHeight: '70vh',
              maxWidth: '100%'
            }}
            onError={(e) => {
              e.target.onerror = null; 
              e.target.src = 'https://via.placeholder.com/800x600?text=Imagen+no+disponible';
            }}
          />
          <div className="mt-3">
            {selectedImage?.cabana?.descripcion && (
              <p>{selectedImage.cabana.descripcion}</p>
            )}
            {selectedImage?.createdAt && (
              <small className="text-muted">
                Subida el: {new Date(selectedImage.createdAt).toLocaleDateString()}
              </small>
            )}
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
}
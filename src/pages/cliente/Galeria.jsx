import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Spinner, Alert, Modal, Button } from 'react-bootstrap';
import axios from 'axios';
import { API_URL } from '../../config';
import Navbar from '../../components/PublicNavbar';

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/images`, {
          params: {
            limit: pagination.limit,
            offset: (pagination.page - 1) * pagination.limit,
            populate: 'relatedCabana' // Solicitar población de la cabaña relacionada
          }
        });
        
        if (!response.data.success) {
          throw new Error(response.data.error || 'Respuesta inesperada del servidor');
        }

        // Procesar imágenes con el nombre correcto de la cabaña
        const processedImages = response.data.data.map(img => ({
          id: img._id,
          fileId: img.fileId,
          url: img.fullUrl || `${API_URL}${img.url}`,
          filename: img.filename,
          cabanaName: img.relatedCabana?.nombre || 'Sin nombre', // Usamos 'nombre' en español
          uploadedByName: img.uploadedBy?.name || 'Usuario',
          createdAt: img.createdAt,
          isPublic: img.isPublic
        }));

        setImages(processedImages);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0
        }));
        setError(null);
      } catch (err) {
        console.error('Error al cargar imágenes:', {
          error: err,
          response: err.response?.data
        });
        setError(err.response?.data?.error || err.message || 'Error al cargar la galería');
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [pagination.page, pagination.limit]);

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const renderContent = () => {
    if (loading && images.length === 0) {
      return (
        <div className="text-center my-5">
          <Spinner animation="border" />
          <p className="mt-2">Cargando imágenes...</p>
        </div>
      );
    }

    if (error) {
      return (
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
      );
    }

    if (images.length === 0) {
      return (
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
      );
    }

    return (
      <>
        <Row xs={2} sm={3} md={4} className="g-2"> {/* Reduje el gutter (g-2) para más espacio */}
  {images.map((image) => (
    <Col key={image.id} className="p-1"> {/* Padding reducido */}
      <div 
        className="gallery-image-wrapper"
        onClick={() => setSelectedImage(image)}
        style={{ 
          cursor: 'pointer',
          height: '100%',
          position: 'relative'
        }}
      >
        <img
          src={image.url}
          alt={image.cabanaName}
          className="img-fluid w-100"
          style={{ 
            objectFit: 'cover',
            height: '200px', // Altura fija para uniformidad
            width: '100%',
            borderRadius: '8px',
            transition: 'transform 0.3s ease'
          }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `${API_URL}/default-image.jpg`;
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        />
      </div>
    </Col>
  ))}
</Row>

        {pagination.total > pagination.limit && (
          <div className="d-flex justify-content-center mt-4">
            <nav>
              <ul className="pagination">
                <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    Anterior
                  </button>
                </li>
                
                {[...Array(Math.ceil(pagination.total / pagination.limit)).keys()].map(num => (
                  <li key={num + 1} className={`page-item ${pagination.page === num + 1 ? 'active' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => handlePageChange(num + 1)}
                    >
                      {num + 1}
                    </button>
                  </li>
                ))}
                
                <li className={`page-item ${pagination.page * pagination.limit >= pagination.total ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    Siguiente
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </>
    );
  };

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
        
        {renderContent()}

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
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setSelectedImage(null)}>
              Cerrar
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </>
  );
}
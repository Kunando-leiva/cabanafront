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
            offset: (pagination.page - 1) * pagination.limit
          }
        });
        
        // Adaptación a la estructura de respuesta del backend
        const responseData = response.data;
        let imagesData = [];
        let total = 0;

        if (responseData.data && Array.isArray(responseData.data)) {
          imagesData = responseData.data;
          total = responseData.pagination?.total || imagesData.length;
        } else if (Array.isArray(responseData)) {
          imagesData = responseData;
          total = responseData.length;
        }

        // Mapeo de datos para asegurar consistencia
        const formattedImages = imagesData.map(img => ({
          id: img._id || img.id,
          fileId: img.fileId || img._id,
          url: img.fullUrl || img.url || `${API_URL}/api/images/${img.fileId || img._id}`,
          filename: img.filename,
          cabanaName: img.relatedCabana?.name || 'Cabaña sin nombre',
          createdAt: img.createdAt,
          uploadedBy: img.uploadedBy?.name || 'Usuario desconocido',
          isPublic: img.isPublic !== undefined ? img.isPublic : true
        }));

        setImages(formattedImages);
        setPagination(prev => ({ ...prev, total }));
        setError(null);
      } catch (err) {
        console.error('Error fetching images:', {
          error: err,
          response: err.response
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
        <Row xs={1} sm={2} md={3} lg={4} className="g-4">
          {images.map((image) => (
            <Col key={image.id}>
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
                    Subido por: {image.uploadedBy}<br />
                    {new Date(image.createdAt).toLocaleDateString()}
                  </small>
                </Card.Body>
              </Card>
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
            <div>
              <small className="text-muted d-block">
                Subido por: {selectedImage?.uploadedBy}
              </small>
              <small className="text-muted">
                Fecha: {selectedImage && new Date(selectedImage.createdAt).toLocaleDateString()}
              </small>
            </div>
            <Button variant="secondary" onClick={() => setSelectedImage(null)}>
              Cerrar
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </>
  );
}
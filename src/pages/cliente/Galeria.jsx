import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Spinner, Alert, Modal, Button } from 'react-bootstrap';
import axios from 'axios';
import { API_URL } from '../../config';
import Navbar from '../../components/PublicNavbar';
import './Galeria.css'; // Archivo para estilos adicionales
import Footer from '../../components/admin/Footer';

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
            populate: 'relatedCabana'
          }
        });
        
        if (!response.data.success) {
          throw new Error(response.data.error || 'Respuesta inesperada del servidor');
        }

        const processedImages = response.data.data.map(img => ({
          id: img._id,
          url: img.fullUrl || `${API_URL}${img.url}`,
          cabanaName: img.relatedCabana?.nombre || 'Sin nombre',
        }));

        setImages(processedImages);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0
        }));
        setError(null);
      } catch (err) {
        console.error('Error al cargar imágenes:', err);
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
        <div className="text-center my-5 py-5">
          <Spinner animation="border" role="status" style={{ color: '#333' }} />
          <p className="mt-3" style={{ fontWeight: 300 }}>Cargando imágenes...</p>
        </div>
      );
    }

    if (error) {
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
                style={{  fontWeight: 300,
            lineHeight: '1.6', // Interlineado ajustado
            marginBottom: '1.5rem',
            backgroundColor: '#eaac25',
            borderColor: '#eaac25', }}
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
              style={{ fontWeight: 300,
            lineHeight: '1.6', // Interlineado ajustado
            marginBottom: '1.5rem',
            backgroundColor: '#eaac25',
            borderColor: '#eaac25', }}
            >
              Volver
            </Button>
          </Alert>
        </Container>
      );
    }

    return (
      <>
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

        {pagination.total > pagination.limit && (
          <div className="d-flex justify-content-center mt-5">
            <nav>
              <ul className="pagination">
                <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                  <button 
                    className="page-link rounded-0" 
                    onClick={() => handlePageChange(pagination.page - 1)}
                    style={{ fontWeight: 300 }}
                  >
                    &larr; Anterior
                  </button>
                </li>
                
                {[...Array(Math.ceil(pagination.total / pagination.limit)).keys()].map(num => (
                  <li key={num + 1} className={`page-item ${pagination.page === num + 1 ? 'active' : ''}`}>
                    <button 
                      className="page-link rounded-0" 
                      onClick={() => handlePageChange(num + 1)}
                      style={{ fontWeight: 300 }}
                    >
                      {num + 1}
                    </button>
                  </li>
                ))}
                
                <li className={`page-item ${pagination.page * pagination.limit >= pagination.total ? 'disabled' : ''}`}>
                  <button 
                    className="page-link rounded-0" 
                    onClick={() => handlePageChange(pagination.page + 1)}
                    style={{ fontWeight: 300 }}
                  >
                    Siguiente &rarr;
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
    <div className="gallery-page">
      <Navbar />
      
      <Container className="py-5">
        <div className="d-flex justify-content-between align-items-center mb-5">
          <h1 className="mb-0 fw-light" style={{ letterSpacing: '1px' }}>
            Galería
          </h1>
          <Button 
            onClick={() => navigate(-1)} 
            variant="outline-dark"
            className="rounded-0 px-3"
            style={{ fontWeight: 300,
            lineHeight: '1.6', // Interlineado ajustado
            marginBottom: '1.5rem',
            backgroundColor: '#eaac25',
            borderColor: '#eaac25', }}
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
              style={{ maxHeight: '70vh', objectFit: 'contain' }}
            />
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button 
              variant="outline-dark" 
              onClick={() => setSelectedImage(null)}
              className="rounded-0 px-3"
              style={{ fontWeight: 300, letterSpacing: '1px' }}
            >
              Cerrar
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>.
      <Footer />

    </div>
  );
}
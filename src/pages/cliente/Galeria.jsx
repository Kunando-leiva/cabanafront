import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Modal, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import PublicNavbar from '../../components/PublicNavbar';
import { API_URL } from '../../config'; // Asegúrate de que la ruta sea correcta

export default function Galeria() {
  const [cabanas, setCabanas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedImg, setSelectedImg] = useState({ url: '', nombreCabana: '' });

  useEffect(() => {
    const fetchCabanas = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/cabanas`
);
       // 1. Validar la estructura de respuesta
    const rawData = response.data;
    let cabanasData = [];

    if (Array.isArray(rawData)) {
      // Caso 1: La API devuelve un array directo
      cabanasData = rawData;
    } else if (rawData && Array.isArray(rawData.data)) {
      // Caso 2: La API devuelve { data: [...] }
      cabanasData = rawData.data;
    } else if (rawData && Array.isArray(rawData.result)) {
      // Caso 3: La API devuelve { result: [...] }
      cabanasData = rawData.result;
    } else {
      throw new Error('Formato de respuesta no soportado');
    }
        
        // Procesar imágenes con sus cabañas correspondientes
        const cabanasConImagenes = cabanasData.map(cabana => ({
          _id: cabana._id || Math.random().toString(36).substr(2, 9), // ID de respaldo
          nombre: cabana.nombre || 'Sin nombre',
          imagenes: Array.isArray(cabana.imagenes) 
            ? cabana.imagenes.map(img => 
                img.startsWith('http://') 
                  ? img.replace('http://', 'https://') 
                  : img.startsWith('https://')
                    ? img
                    : `${API_URL}/uploads/${img}`
              )
            : [],
        }));

        setCabanas(cabanasConImagenes);
      } catch (err) {
        setError('Error al cargar la galería');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCabanas();
  }, []);

  // Obtener todas las imágenes con sus cabañas
  const imagenesConCabana = cabanas.flatMap(cabana => 
    cabana.imagenes.map(imgUrl => ({
      url: imgUrl,
      nombreCabana: cabana.nombre,
      cabanaId: cabana._id
    }))
  );

  if (loading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <p className="mt-2">Cargando galería...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <PublicNavbar />
      <h1 className="text-center mb-4">Galería de Cabañas</h1>
      
      {imagenesConCabana.length === 0 ? (
        <Alert variant="info" className="text-center">
          No hay imágenes disponibles
        </Alert>
      ) : (
        <Row xs={1} sm={2} md={3} lg={4} className="g-4">
          {imagenesConCabana.map((img, index) => (
            <Col key={`${img.cabanaId}-${index}`}>
              <Card 
                className="h-100 shadow-sm" 
                onClick={() => {
                  setSelectedImg({
                    url: img.url,
                    nombreCabana: img.nombreCabana
                  });
                  setShowModal(true);
                }}
                style={{ cursor: 'pointer' }}
              >
                <Card.Img
                  variant="top"
                  src={img.url}
                  alt={`Cabaña ${img.nombreCabana}`}
                  style={{ 
                    height: '200px', 
                    objectFit: 'cover',
                    backgroundColor: '#f8f9fa' // Fondo para imágenes con transparencia
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder-cabana.jpg';
                  }}
                />
                <Card.Body className="text-center">
                  <Card.Text className="fw-bold">
                    {img.nombreCabana}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Modal para vista ampliada */}
      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{selectedImg.nombreCabana || 'Vista ampliada'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-0">
          <img
            src={selectedImg.url}
            alt={`Cabaña ${selectedImg.nombreCabana}`}
            className="img-fluid"
            style={{ 
              maxHeight: '70vh',
              width: '100%',
              objectFit: 'contain'
            }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/placeholder-cabana.jpg';
            }}
          />
        </Modal.Body>
      </Modal>
    </Container>
  );
}
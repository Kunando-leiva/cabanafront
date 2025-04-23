import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Container, Form, Row, Col, Card, Button, Alert, Spinner, Modal, InputGroup } from 'react-bootstrap';
import { 
  FaWifi, FaSwimmingPool, FaSnowflake, FaUtensils, FaParking, FaTv,
  FaDollarSign, FaUserFriends, FaHome, FaImage, FaBroom, FaCoffee, FaDog, 
  FaBed,
  FaShower,
  FaUmbrellaBeach,
  FaTemperatureHigh,
  FaKey,
  FaCouch,
  FaTshirt,
  FaGlassWhiskey,
  FaArchive,
  FaCamera,
  FaFan,
  FaImages,
  } from 'react-icons/fa';
  import { BiFridge, BiMicrophone } from 'react-icons/bi';
import { GiElectric } from 'react-icons/gi';

const CreateCabana = () => {
  const SERVICIOS = [
    // Servicios originales
    { nombre: 'Wifi', icono: <FaWifi className="me-2" style={{ color: '#3498db', fontSize: '1.2rem' }} /> },
    { nombre: 'Piscina', icono: <FaSwimmingPool className="me-2" /> },
    { nombre: 'Aire acondicionado', icono: <FaSnowflake className="me-2" /> },
    { nombre: 'Cocina', icono: <FaUtensils className="me-2" /> },
    { nombre: 'Estacionamiento', icono: <FaParking className="me-2" /> },
    { nombre: 'TV', icono: <FaTv className="me-2" /> },
    { nombre: 'Mascotas permitidas', icono: <FaDog className="me-2" /> },
    { nombre: 'Desayuno incluido', icono: <FaCoffee className="me-2" /> },
    { nombre: 'Servicio de limpieza', icono: <FaBroom className="me-2" /> },
    
    // Nuevos servicios con íconos
    { nombre: 'Ropa de cama', icono: <FaBed className="me-2" /> },
    { nombre: 'Artículos de aseo', icono: <FaShower className="me-2" /> },
    { nombre: 'Balcón o terraza', icono: <FaUmbrellaBeach className="me-2" /> },
    { nombre: 'Calefacción', icono: <FaTemperatureHigh className="me-2" /> },
    { nombre: 'Cocina equipada', icono: <FaUtensils className="me-2" /> },
    { nombre: 'Solárium o reposeras', icono: <FaUmbrellaBeach className="me-2" /> },
    { nombre: 'Ducha', icono: <FaShower className="me-2" /> },
    { nombre: 'Secadora', icono: <GiElectric className="me-2" /> }, // Alternativo
    { nombre: 'Cama doble', icono: <FaBed className="me-2" /> },
    { nombre: 'Heladera', icono: <BiFridge className="me-2" /> },
    { nombre: 'Microondas', icono: <BiMicrophone className="me-2" /> }, // Alternativo
    { nombre: 'Ingreso con llave o tarjeta', icono: <FaKey className="me-2" /> },
    { nombre: 'Pava eléctrica', icono: <GiElectric className="me-2" /> },
    { nombre: 'Televisión', icono: <FaTv className="me-2" /> },
    { nombre: 'Sofá', icono: <FaCouch className="me-2" /> },
    { nombre: 'Toallas', icono: <FaTshirt className="me-2" /> },
    { nombre: 'Vajilla', icono: <FaGlassWhiskey className="me-2" /> },
    { nombre: 'Placard o armario', icono: <FaArchive className="me-2" /> },
    { nombre: 'Seguridad (cámara o vigilancia)', icono: <FaCamera className="me-2" /> },
    { nombre: 'Ventiladores', icono: <FaFan className="me-2" /> },
    { nombre: 'Otros', icono: <FaImages className="me-2" /> }
  ];

  const { token, isAuthenticated, logout } = useAuth();
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    capacidad: '',
    imagenes: [],
    servicios: []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const navigate = useNavigate();
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  if (!isAuthenticated) {
    navigate('/login', { state: { from: '/admin/cabanas/crear' } });
    return null;
  }

  const handleServicioChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      servicios: checked
        ? [...prev.servicios, value]
        : prev.servicios.filter(s => s !== value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación mejorada
    if (!formData.nombre || !formData.descripcion || !formData.precio || !formData.capacidad) {
      setError('Todos los campos marcados con * son obligatorios');
      return;
    }

    if (isNaN(formData.precio) || isNaN(formData.capacidad)) {
      setError('Precio y capacidad deben ser números válidos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Preparar datos para el backend
      const cabanaData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: Number(formData.precio),
        capacidad: Number(formData.capacidad),
        servicios: formData.servicios,
        imagenes: formData.imagenes.map(img => 
          img.startsWith('http') ? img.split('/uploads/')[1] : img
        )
      };

      const response = await fetch('http://localhost:5000/api/cabanas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cabanaData)
      });

      if (response.status === 401) {
        logout();
        throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear la cabaña');
      }

      const result = await response.json();
      console.log('Cabaña creada:', result);
      
      navigate('/admin/cabanas', { 
        state: { success: 'Cabaña creada exitosamente' },
        replace: true
      });

    } catch (error) {
      console.error('Error al crear cabaña:', error);
      setError(error.message || 'Ocurrió un error al guardar la cabaña');
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleImageUpload = async (e) => {
    if (!e.target.files?.length) return;
    
    setUploadingImages(true);
    setError('');

    try {
      const uploadPromises = Array.from(e.target.files).map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('http://localhost:5000/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al subir imagen');
        }

        return response.json();
      });

      const results = await Promise.all(uploadPromises);
      const uploadedImages = results.map(result => result.url);

      setFormData(prev => ({
        ...prev,
        imagenes: [...prev.imagenes, ...uploadedImages]
      }));

    } catch (error) {
      console.error('Error al subir imágenes:', error);
      setError(error.message || 'Error al subir imágenes');
    } finally {
      setUploadingImages(false);
    }
  };

  const confirmRemoveImage = (index) => {
    setImageToDelete(index);
    setShowDeleteModal(true);
  };

  const removeImage = () => {
    setShowDeleteModal(false);
    setFormData(prev => ({
      ...prev,
      imagenes: prev.imagenes.filter((_, i) => i !== imageToDelete)
    }));
    setImageToDelete(null);
  };

  return (
    <Container className="mt-4">
      <h2 className="text-center mb-4">Crear Nueva Cabaña</h2>
      
      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label><FaHome className="me-2" /> Nombre *</Form.Label>
              <Form.Control 
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                required
                placeholder="Nombre de la cabaña"
              />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label><FaUserFriends className="me-2" /> Capacidad *</Form.Label>
              <Form.Control
                type="number"
                min="1"
                value={formData.capacidad}
                onChange={(e) => setFormData({...formData, capacidad: e.target.value})}
                required
                placeholder="Número de personas"
              />
            </Form.Group>
          </Col>

          <Col md={12}>
            <Form.Group className="mb-3">
              <Form.Label>Descripción *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                required
                placeholder="Describe la cabaña, sus comodidades y atractivos"
              />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label><FaDollarSign className="me-2" /> Precio por noche *</Form.Label>
              <InputGroup>
                <InputGroup.Text><FaDollarSign /></InputGroup.Text>
                <Form.Control
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.precio}
                  onChange={(e) => setFormData({...formData, precio: e.target.value})}
                  required
                  placeholder="0.00"
                />
              </InputGroup>
            </Form.Group>
          </Col>

          <Col md={12}>
          <Form.Group className="mb-3">
            <Form.Label>Servicios</Form.Label>
            <Row>
              {SERVICIOS.map((servicio) => (
                <Col key={`servicio-${servicio.nombre}`} xs={6} md={4} lg={3}>
                  <Form.Check
                    type="checkbox"
                    id={`servicio-${servicio.nombre}`}
                    label={<>{servicio.icono} {servicio.nombre}</>}
                    value={servicio.nombre}
                    checked={formData.servicios.includes(servicio.nombre)}
                    onChange={handleServicioChange}
                  />
                </Col>
              ))}
            </Row>
          </Form.Group>
        </Col>

          <Col md={12}>
            <Form.Group className="mb-3">
              <Form.Label><FaImage className="me-2" /> Imágenes</Form.Label>
              <Form.Control 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={handleImageUpload} 
                className="mb-3"
                disabled={uploadingImages}
              />
              
              {uploadingImages && (
                <div className="mb-3">
                  <Spinner animation="border" size="sm" className="me-2" />
                  Subiendo imágenes...
                </div>
              )}

              <Row>
                {formData.imagenes.map((img, index) => (
                  <Col 
                    key={`img-${index}-${img.split('/').pop()}`}
                    xs={6} 
                    md={4} 
                    lg={3} 
                    className="mb-3"
                  >
                    <Card>
                      <Card.Img 
                        variant="top" 
                        src={img.startsWith('http') ? img : `http://localhost:5000/uploads/${img}`}
                        style={{ height: '150px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder-image.jpg';
                        }}
                      />
                      <Card.Body className="p-2 text-center">
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => confirmRemoveImage(index)}
                        >
                          Eliminar
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Form.Group>
          </Col>
        </Row>

        <div className="text-end">
          <Button 
            variant="primary" 
            type="submit" 
            disabled={loading || uploadingImages}
            className="px-4 py-2"
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Guardando...
              </>
            ) : 'Guardar Cabaña'}
          </Button>
        </div>
      </Form>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>¿Estás seguro que deseas eliminar esta imagen?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={removeImage}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CreateCabana;
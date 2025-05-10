import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Container, Form, Row, Col, Card, Button, Alert, Spinner, Modal, InputGroup } from 'react-bootstrap';
import { 
  FaWifi, FaSwimmingPool, FaSnowflake, FaUtensils, FaParking, FaTv,
  FaDollarSign, FaUserFriends, FaHome, FaImage, FaBroom, FaCoffee, FaDog, 
  FaBed, FaShower, FaUmbrellaBeach, FaTemperatureHigh, FaKey, FaCouch,
  FaTshirt, FaGlassWhiskey, FaArchive, FaCamera, FaFan, FaImages
} from 'react-icons/fa';
import { BiFridge, BiMicrophone } from 'react-icons/bi';
import { GiElectric } from 'react-icons/gi';
import { API_URL } from '../../config';
import ErrorBoundary from '../../components/ErrorBoundary';
import axios from 'axios';

const SERVICIOS = [
  { nombre: 'Wifi', icono: <FaWifi className="me-2" style={{ color: '#3498db', fontSize: '1.2rem' }} /> },
  { nombre: 'Piscina', icono: <FaSwimmingPool className="me-2" /> },
  { nombre: 'Aire acondicionado', icono: <FaSnowflake className="me-2" /> },
  { nombre: 'Cocina', icono: <FaUtensils className="me-2" /> },
  { nombre: 'Estacionamiento', icono: <FaParking className="me-2" /> },
  { nombre: 'Televisión', icono: <FaTv className="me-2" /> },
  { nombre: 'Mascotas permitidas', icono: <FaDog className="me-2" /> },
  { nombre: 'Desayuno incluido', icono: <FaCoffee className="me-2" /> },
  { nombre: 'Servicio de limpieza', icono: <FaBroom className="me-2" /> },
  { nombre: 'Ropa de cama', icono: <FaBed className="me-2" /> },
  { nombre: 'Artículos de aseo', icono: <FaShower className="me-2" /> },
  { nombre: 'Balcón', icono: <FaUmbrellaBeach className="me-2" /> },
  { nombre: 'Calefacción', icono: <FaTemperatureHigh className="me-2" /> },
  { nombre: 'Cocina equipada', icono: <FaUtensils className="me-2" /> },
  { nombre: 'reposeras', icono: <FaUmbrellaBeach className="me-2" /> },
  { nombre: 'Ducha', icono: <FaShower className="me-2" /> },
  { nombre: 'Secadora', icono: <GiElectric className="me-2" /> },
  { nombre: 'Cama doble', icono: <FaBed className="me-2" /> },
  { nombre: 'Heladera', icono: <BiFridge className="me-2" /> },
  { nombre: 'Microondas', icono: <BiMicrophone className="me-2" /> },
  { nombre: 'Pava eléctrica', icono: <GiElectric className="me-2" /> },
  { nombre: 'Sofá', icono: <FaCouch className="me-2" /> },
  { nombre: 'Toallas', icono: <FaTshirt className="me-2" /> },
  { nombre: 'Vajilla', icono: <FaGlassWhiskey className="me-2" /> },
  { nombre: 'Armario', icono: <FaArchive className="me-2" /> },
  { nombre: 'Seguridad', icono: <FaCamera className="me-2" /> },
  { nombre: 'Ventiladores', icono: <FaFan className="me-2" /> },
  { nombre: 'Otros', icono: <FaImages className="me-2" /> }
];

const CreateCabana = () => {
  const { token, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const isMounted = useRef(true);
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    capacidad: '',
    servicios: []
  });
  
  const [uploadedImages, setUploadedImages] = useState([]); // Array de objetos {fileId, url}
  const [previewImages, setPreviewImages] = useState([]); // URLs para previsualización
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);

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
  
    if (!formData.nombre || !formData.descripcion || !formData.precio || !formData.capacidad) {
      setError('Todos los campos marcados con * son obligatorios');
      return;
    }
  
    if (isNaN(formData.precio) || isNaN(formData.capacidad)) {
      setError('Precio y capacidad deben ser números válidos');
      return;
    }
  
    const cabanaData = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      precio: Number(formData.precio),
      capacidad: Number(formData.capacidad),
      servicios: formData.servicios,
      images: uploadedImages.map(img => ({ fileId: img.fileId })) // Enviamos solo los fileIds
    };
  
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/cabanas`, cabanaData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      console.log('Cabaña creada:', response.data);
      navigate('/admin/cabanas', {
        state: { success: 'Cabaña creada exitosamente' },
        replace: true
      });
  
    } catch (error) {
      if (error.response?.status === 401) {
        logout();
        setError('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
      } else {
        console.error('Error al crear cabaña:', error);
        setError(error.response?.data?.error || 'Ocurrió un error al guardar la cabaña');
        
        // Opcional: Eliminar imágenes subidas si falla la creación
        if (uploadedImages.length > 0) {
          await Promise.all(
            uploadedImages.map(img => 
              axios.delete(`${API_URL}/api/images/${img.fileId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              }).catch(e => console.error('Error al eliminar imagen:', e))
            )
          );
          setUploadedImages([]);
          setPreviewImages([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    if (!e.target.files?.length) return;
  
    setUploadingImages(true);
    setError('');
  
    try {
      const files = Array.from(e.target.files);
      const invalidFiles = files.filter(file =>
        !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024
      );
  
      if (invalidFiles.length > 0) {
        throw new Error(
          `Archivos no válidos: ${invalidFiles.map(f => f.name).join(', ')}\n` +
          'Formatos aceptados: JPEG, JPG, PNG, GIF (Máx. 5MB)'
        );
      }
  
      const uploadPromises = files.map(async (file) => {
        try {
          const formData = new FormData();
          formData.append('image', file);
  
          const response = await axios.post(`${API_URL}/api/images/upload`, formData, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          });
  
          return {
            fileId: response.data.image.fileId || response.data.image._id,
            url: URL.createObjectURL(file),
            originalName: file.name
          };
        } catch (uploadError) {
          if (uploadError.response?.data?.error?.includes('E11000 duplicate key error')) {
            // Preguntar al usuario si quiere reemplazar la imagen
            const shouldReplace = window.confirm(
              `Ya existe una imagen con el nombre "${file.name}". ¿Deseas reemplazarla?`
            );
            
            if (shouldReplace) {
              // Primero eliminar la imagen existente
              await axios.delete(`${API_URL}/api/images/by-name/${encodeURIComponent(file.name)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              
              // Volver a intentar la subida
              const retryResponse = await axios.post(`${API_URL}/api/images/upload`, formData, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'multipart/form-data'
                }
              });
              
              return {
                fileId: retryResponse.data.image.fileId || retryResponse.data.image._id,
                url: URL.createObjectURL(file),
                originalName: file.name
              };
            } else {
              return null; // Saltar esta imagen
            }
          }
          throw uploadError;
        }
      });
  
      const results = (await Promise.all(uploadPromises)).filter(Boolean);
      
      if (!isMounted.current) return;
  
      setUploadedImages(prev => [...prev, ...results]);
      setPreviewImages(prev => [...prev, ...results.map(r => ({ url: r.url, id: r.fileId }))]);
  
    } catch (error) {
      console.error('Error en handleImageUpload:', error);
      setError(
        error.message.includes('Network Error')
          ? 'Error de conexión con el servidor'
          : error.response?.data?.error || error.message
      );
    } finally {
      if (isMounted.current) {
        setUploadingImages(false);
        e.target.value = '';
      }
    }
  };

  const confirmRemoveImage = (index) => {
    setImageToDelete(index);
    setShowDeleteModal(true);
  };

  const removeImage = async () => {
    if (imageToDelete === null) return;
    
    try {
      const imageToRemove = uploadedImages[imageToDelete];
      
      // Eliminar del backend
      await axios.delete(`${API_URL}/api/images/${imageToRemove.fileId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Actualizar estados
      setUploadedImages(prev => prev.filter((_, i) => i !== imageToDelete));
      setPreviewImages(prev => prev.filter((_, i) => i !== imageToDelete));
      
    } catch (error) {
      console.error('Error al eliminar imagen:', error);
      setError('No se pudo eliminar la imagen. Inténtalo de nuevo.');
    } finally {
      setShowDeleteModal(false);
      setImageToDelete(null);
    }
  };

  return (
    <ErrorBoundary>
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
                  maxLength="100"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label><FaUserFriends className="me-2" /> Capacidad *</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  max="20"
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
                  maxLength="500"
                />
                <Form.Text muted>{formData.descripcion.length}/500 caracteres</Form.Text>
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
                accept="image/jpeg, image/png, image/webp" 
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
                {previewImages.map((img, index) => (
                  <Col key={`img-${img.id}`} xs={6} md={4} lg={3} className="mb-3">
                    <Card className="h-100">
                      <div style={{ height: '150px', overflow: 'hidden' }}>
                        <img
                          src={img.url}
                          alt={`Imagen ${index + 1}`}
                          style={{ 
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/placeholder-image.jpg';
                            e.target.style.objectFit = 'contain';
                          }}
                        />
                        </div>
                        <Card.Body className="p-2 text-center">
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => confirmRemoveImage(index)}
                          disabled={uploadingImages}
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
    </ErrorBoundary>
  );
};

export default CreateCabana;
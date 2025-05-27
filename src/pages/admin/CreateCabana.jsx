import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Container, Form, Row, Col, Card, Button, 
  Alert, Spinner, InputGroup 
} from 'react-bootstrap';
import { 
  FaWifi, FaSwimmingPool, FaSnowflake, FaUtensils, 
  FaParking, FaTv, FaDollarSign, FaUserFriends, 
  FaHome, FaImage, FaBroom, FaCoffee, FaDog, 
  FaBed, FaShower, FaUmbrellaBeach, FaTemperatureHigh, 
  FaKey, FaCouch, FaTshirt, FaGlassWhiskey, 
  FaArchive, FaCamera, FaFan, FaImages 
} from 'react-icons/fa';
import { BiFridge, BiMicrophone } from 'react-icons/bi';
import { GiElectric } from 'react-icons/gi';
import { IoIosBonfire } from "react-icons/io";
import { API_URL } from '../../config';
import axios from 'axios';

const SERVICIOS = [
  { nombre: 'Piscina', icono: <FaSwimmingPool className="me-2" style={{ color: '#3498db' }} /> },
  { nombre: 'Cocina', icono: <FaUtensils className="me-2" style={{ color: '#e74c3c' }} /> },
  { nombre: 'Estacionamiento', icono: <FaParking className="me-2" style={{ color: '#2ecc71' }} /> },
  { nombre: 'Ropa de cama', icono: <FaBed className="me-2" style={{ color: '#9b59b6' }} /> },
  { nombre: 'Artículos de aseo', icono: <FaShower className="me-2" style={{ color: '#1abc9c' }} /> },
  { nombre: 'Balcón o terraza', icono: <FaUmbrellaBeach className="me-2" style={{ color: '#f39c12' }} /> },
  { nombre: 'Baños', icono: <FaShower className="me-2" style={{ color: '#1abc9c' }} /> },
  { nombre: 'Cama doble', icono: <FaBed className="me-2" style={{ color: '#9b59b6' }} /> },
  { nombre: 'Heladera', icono: <BiFridge className="me-2" style={{ color: '#3498db' }} /> },
  { nombre: 'Pava eléctrica', icono: <GiElectric className="me-2" style={{ color: '#e74c3c' }} /> },
  { nombre: 'Toallones', icono: <FaTshirt className="me-2" style={{ color: '#3498db' }} /> },
  { nombre: 'Vasos', icono: <FaGlassWhiskey className="me-2" style={{ color: '#2ecc71' }} /> },
  { nombre: 'Platos', icono: <FaGlassWhiskey className="me-2" style={{ color: '#f39c12' }} /> },
  { nombre: 'Cubiertos', icono: <FaUtensils className="me-2" style={{ color: '#e74c3c' }} /> },
  { nombre: 'Wi-Fi', icono: <FaWifi className="me-2" style={{ color: '#3498db' }} /> },
  { nombre: 'Ventiladores', icono: <FaFan className="me-2" style={{ color: '#1abc9c' }} /> },
  { nombre: 'TV', icono: <FaTv className="me-2" style={{ color: '#9b59b6' }} /> },
  { nombre: 'Ollas', icono: <FaUtensils className="me-2" style={{ color: '#e74c3c' }} /> },
  { nombre: 'Fuentes para horno', icono: <FaUtensils className="me-2" style={{ color: '#e74c3c' }} /> },
  { nombre: 'Parrillas', icono: <FaUtensils className="me-2" style={{ color: '#e74c3c' }} /> },
  { nombre: 'Desayuno seco', icono: <FaCoffee className="me-2" style={{ color: '#f39c12' }} /> },
  { nombre: 'Fogón', icono: <IoIosBonfire className="me-2" style={{ color: '#e74c3c' }} /> },
  { nombre: 'Parque', icono: <FaUmbrellaBeach className="me-2" style={{ color: '#2ecc71' }} /> },
  { nombre: 'Cancha de fútbol', icono: <FaSwimmingPool className="me-2" style={{ color: '#3498db' }} /> },
];

const CreateCabana = () => {
  const { token, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    capacidad: '',
    servicios: []
  });
  
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Verificar autenticación y rol al cargar
  useEffect(() => {
    if (!isAuthenticated || user?.rol !== 'admin') {
      navigate('/login', { state: { from: '/admin/cabanas/crear' } });
    }
  }, [isAuthenticated, user, navigate]);

  // Limpieza de URLs al desmontar
  useEffect(() => {
    return () => {
      images.forEach(img => {
        if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
      });
    };
  }, [images]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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
  setLoading(true);
  setError('');

  // Validación básica
  if (!formData.nombre || !formData.descripcion || !formData.precio || !formData.capacidad) {
    setError('Todos los campos obligatorios deben estar completos');
    setLoading(false);
    return;
  }

  try {
    const formDataToSend = new FormData();
    
    // Agregar campos del formulario
    formDataToSend.append('nombre', formData.nombre);
    formDataToSend.append('descripcion', formData.descripcion);
    formDataToSend.append('precio', formData.precio);
    formDataToSend.append('capacidad', formData.capacidad);
    formDataToSend.append('servicios', JSON.stringify(formData.servicios));

    // Agregar imágenes
    images.forEach(img => {
      if (img.file) {
        formDataToSend.append('images', img.file);
      }
    });

    const response = await axios.post(`${API_URL}/api/cabanas`, formDataToSend, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response.data.success) {
      navigate('/admin/cabanas', {
        state: { 
          success: '¡Cabaña creada exitosamente!',
          cabanaId: response.data.data._id
        }
      });
    } else {
      throw new Error(response.data.error || 'Error al crear cabaña');
    }
  } catch (error) {
    console.error('Error al crear cabaña:', error);
    
    // Manejar específicamente el error de duplicado
    if (error.response?.data?.error?.includes('E11000 duplicate key error')) {
      const duplicateFilename = error.response.data.error.match(/{ filename: "(.+)" }/)?.[1] || 'una imagen';
      setError(`Ya existe una imagen con el nombre "${duplicateFilename}". Por favor, cambia el nombre del archivo antes de subirlo.`);
    } else {
      setError(error.response?.data?.error || error.message || 'Error al procesar la solicitud');
    }
  } finally {
    setLoading(false);
  }
};

const triggerFileInput = () => {
  fileInputRef.current.click();
};

  const handleImageUpload = (e) => {
  if (!e.target.files?.length) return;

  const newFiles = Array.from(e.target.files)
    .filter(file => 
      file.type.startsWith('image/') && 
      file.size <= 10 * 1024 * 1024
    );

  if (newFiles.length !== e.target.files.length) {
    setError('Algunos archivos no son válidos (solo imágenes hasta 10MB)');
  }

  // Verificar nombres duplicados
  const duplicateNames = newFiles.some(newFile => 
    images.some(img => img.file.name === newFile.name)
  );

  if (duplicateNames) {
    setError('Algunos archivos tienen el mismo nombre que imágenes ya seleccionadas. Por favor, renómbralos antes de subirlos.');
    e.target.value = '';
    return;
  }

  const newImages = newFiles.map(file => ({
    file,
    previewUrl: URL.createObjectURL(file)
  }));

  setImages(prev => [...prev, ...newImages].slice(0, 5));
  e.target.value = '';
};

  return (
    <Container  className="mt-4" style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
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
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
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
                name="capacidad"
                min="1"
                max="20"
                value={formData.capacidad}
                onChange={handleChange}
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
                name="descripcion"
                rows={4}
                value={formData.descripcion}
                onChange={handleChange}
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
                  name="precio"
                  min="0"
                  step="0.01"
                  value={formData.precio}
                  onChange={handleChange}
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
              <Form.Label><FaImage className="me-2" /> Imágenes (Máx. 5)</Form.Label>
              
              <div className="d-flex align-items-center mb-3">
                <Button 
                  variant="outline-primary" 
                  onClick={triggerFileInput}
                  disabled={images.length >= 5 || loading}
                >
                  <FaImage className="me-2" />
                  {images.length >= 5 ? 'Límite alcanzado' : 'Seleccionar imágenes'}
                </Button>
                <Form.Control 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="d-none"
                  ref={fileInputRef}
                  disabled={images.length >= 5 || loading}
                />
                <span className="ms-3 text-muted">
                  {images.length} / 5 imágenes seleccionadas
                </span>
              </div>
              
              <Row>
                {images.map((img, index) => (
  <Col key={`img-${index}`} xs={6} md={4} lg={3} className="mb-3">
    <Card className="h-100">
      <div style={{ height: '150px', overflow: 'hidden' }}>
        <img
          src={img.previewUrl}
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
        <Form.Control
          type="text"
          value={img.file.name}
          onChange={(e) => {
            const newImages = [...images];
            const newFile = new File([img.file], e.target.value, { type: img.file.type });
            newImages[index] = {
              ...newImages[index],
              file: newFile
            };
            setImages(newImages);
          }}
          className="mb-2"
        />
        <Button 
          variant="danger" 
          size="sm"
          onClick={() => removeImage(index)}
          disabled={loading}
          className="mt-2"
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

        <div className="d-flex justify-content-between mt-4">
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate('/admin/cabanas')}
            disabled={loading}
          >
            Cancelar
          </Button>
          
          <Button 
            variant="primary" 
            type="submit" 
            disabled={loading}
            className="px-4"
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
    </Container>
  );
};

export default CreateCabana;
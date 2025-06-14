import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';
import { Form, Button, Alert, Spinner, Card, Row, Col, Image } from 'react-bootstrap';
import { FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import { Modal } from 'antd';
import 'bootstrap/dist/css/bootstrap.min.css';




export default function EditCabana() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState({ initial: true, saving: false });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');


  // Estado inicial con todos los campos necesarios
  const [cabanaData, setCabanaData] = useState({
    nombre: '',
    descripcion: '',
    capacidad: 2,
    precio: 0,
    servicios: [],
    imagenes: [],
    isFeatured: false,
    disponibilidad: true,
    reglas: '',
    dimensiones: '',
    habitaciones: 1
  });

  // Servicios disponibles
  const serviciosDisponibles = [
    'Piscina', 'Cocina', 'Estacionamiento', 'Ropa de cama', 'Artículos de aseo', 'Balcón o terraza', 'Baños',
            'Cama doble', 'Heladera','Pava eléctrica', 'Toallones', 'Vasos', 'Platos', 'Cubiertos', 'Wi-Fi', 'Ventiladores', 
            'TV', 'Ollas', 'Fuentes para horno', 'Parrillas', 'Desayuno seco', 'Fogón', 'Parque', 'Cancha de fútbol',
  ];

  // Cargar datos de la cabaña al montar el componente
  useEffect(() => {
    const fetchCabana = async () => {
      try {
        setLoading({ initial: true, saving: false });
        setError('');
        
        const response = await axios.get(`${API_URL}/api/cabanas/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('Respuesta del backend:', response.data);

        if (!response.data.success || !response.data.data) {
          throw new Error('Estructura de respuesta inválida');
        }

        const cabana = response.data.data;

        // Procesar imágenes para asegurar URLs completas
        const imagenesProcesadas = (cabana.images || cabana.imagenes || []).map(img => {
          // Si es string (ID), crear objeto con URL completa
          if (typeof img === 'string') {
            return {
              _id: img,
              url: `${API_URL}/api/images/${img}`
            };
          }
          // Si es objeto pero no tiene URL completa
          if (img && !img.url.startsWith('http')) {
            return {
              ...img,
              url: `${API_URL}${img.url.startsWith('/') ? '' : '/'}${img.url}`
            };
          }
          return img;
        });

        setCabanaData({
          nombre: cabana.nombre || '',
          descripcion: cabana.descripcion || '', 
          capacidad: cabana.capacidad || 2,
          precio: cabana.precio || 0,
          servicios: cabana.servicios || [],
          imagenes: imagenesProcesadas,
          isFeatured: cabana.isFeatured || false,
          disponibilidad: cabana.disponibilidad !== false,
          reglas: cabana.reglas || '',
          dimensiones: cabana.dimensiones || '',
          habitaciones: cabana.habitaciones || 1
        });

      } catch (error) {
        console.error('Error al cargar cabaña:', error);
        setError(error.response?.data?.message || error.message || 'Error al cargar datos');
      } finally {
        setLoading({ initial: false, saving: false });
      }
    };

    fetchCabana();
  }, [id, token]);

  // Manejar cambios en los inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCabanaData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Manejar cambios en los servicios
  const handleServiciosChange = (e) => {
    const { value, checked } = e.target;
    setCabanaData(prev => {
      const servicios = checked
        ? [...prev.servicios, value]
        : prev.servicios.filter(s => s !== value);
      return { ...prev, servicios };
    });
  };

  // Manejar eliminación de imagen
  const handleDeleteImage = async (imageData, index) => {
  try {
    setLoading({ ...loading, saving: true });
    setError('');
    
    // Obtener el ID correcto (usar fileId si existe, sino el id de la URL)
    const fileId = imageData.fileId || 
                  imageData.url.split('/').pop() || 
                  imageData._id || 
                  imageData.id;

    if (!fileId) {
      throw new Error('No se pudo identificar la imagen a eliminar');
    }

    console.log('IDs de imagen:', {
      docId: imageData._id || imageData.id,  // ID del documento
      fileId: imageData.fileId,              // ID en GridFS
      urlId: imageData.url.split('/').pop()  // ID en la URL
    });

    Modal.confirm({
      title: '¿Eliminar esta imagen?',
      content: 'Esta acción no se puede deshacer.',
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          // Eliminar visualmente primero
          setCabanaData(prev => ({
            ...prev,
            imagenes: prev.imagenes.filter((_, i) => i !== index)
          }));

          // Enviar AMBOS IDs al backend
          const response = await axios.delete(
            `${API_URL}/api/images`,
            {
              data: {
                docId: imageData._id || imageData.id,
                fileId: imageData.fileId || imageData.url.split('/').pop()
              },
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (!response.data.success) {
            throw new Error(response.data.message || 'Error al eliminar imagen');
          }

          setSuccess('Imagen eliminada correctamente');
        } catch (error) {
          console.error('Detalles del error:', {
            error: error.message,
            response: error.response?.data,
            config: error.config
          });
          setError('Error al eliminar: ' + (error.response?.data?.error || error.message));
          setCabanaData(prev => ({ ...prev })); // Revertir cambios
        } finally {
          setLoading({ ...loading, saving: false });
        }
      },
      onCancel: () => {
        setLoading({ ...loading, saving: false });
      }
    });
  } catch (error) {
    console.error('Error en el flujo de eliminación:', error);
    setError(error.message);
    setLoading({ ...loading, saving: false });
  }
};

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading({ initial: false, saving: true });
      setError('');
      setSuccess('');

      // Preparar datos para enviar (convertir imágenes a IDs)
      const dataToSend = {
        nombre: cabanaData.nombre,
        descripcion: cabanaData.descripcion,
        capacidad: cabanaData.capacidad,
        precio: cabanaData.precio,
        servicios: cabanaData.servicios,
        images: cabanaData.imagenes.map(img => img._id),
        isFeatured: cabanaData.isFeatured,
        disponibilidad: cabanaData.disponibilidad,
        reglas: cabanaData.reglas,
        dimensiones: cabanaData.dimensiones,
        habitaciones: cabanaData.habitaciones
      };

      const response = await axios.put(
        `${API_URL}/api/cabanas/${id}`,
        dataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al actualizar');
      }

      setSuccess('Cabaña actualizada correctamente');
      setTimeout(() => navigate('/admin/cabanas'), 1500);
    } catch (error) {
      console.error('Error al actualizar cabaña:', error);
      setError(error.response?.data?.error || error.message || 'Error al actualizar la cabaña');
    } finally {
      setLoading({ initial: false, saving: false });
    }
  };

  if (loading.initial) {
    return (
      <AdminLayout>
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Cargando datos de la cabaña...</span>
          </Spinner>
          <p className="mt-2">Cargando datos de la cabaña...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <Alert variant="danger" className="m-4">
          {error}
          <Button 
            variant="outline-danger" 
            className="ms-3" 
            onClick={() => navigate('/admin/cabanas')}
          >
            <FaTimes className="me-1" /> Volver a cabañas
          </Button>
        </Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container-fluid mt-4">
        <Card className="shadow">
          <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
            <h2 className="mb-0">Editando: {cabanaData.nombre}</h2>
            <Button 
              variant="outline-light" 
              size="sm"
              onClick={() => navigate('/admin/cabanas')}
            >
              <FaTimes className="me-1" /> Cancelar
            </Button>
          </Card.Header>
          
          <Card.Body>
            {success && <Alert variant="success">{success}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              <h4 className="mb-4 border-bottom pb-2">Información Básica</h4>
              
              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nombre de la cabaña *</Form.Label>
                    <Form.Control
                      name="nombre"
                      value={cabanaData.nombre}
                      onChange={handleChange}
                      required
                      disabled={loading.saving}
                    />
                  </Form.Group>
                </Col>
                
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Destacada</Form.Label>
                    <div className="mt-2">
                      <Form.Check
                        type="switch"
                        id="featured-switch"
                        name="isFeatured"
                        label={cabanaData.isFeatured ? 'Sí' : 'No'}
                        checked={cabanaData.isFeatured}
                        onChange={handleChange}
                        disabled={loading.saving}
                      />
                    </div>
                  </Form.Group>
                </Col>
                
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Descripción *</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      name="descripcion"
                      value={cabanaData.descripcion}
                      onChange={handleChange}
                      required
                      disabled={loading.saving}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <h4 className="mb-4 mt-4 border-bottom pb-2">Detalles</h4>
              
              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Capacidad (personas) *</Form.Label>
                    <Form.Control
                      type="number"
                      name="capacidad"
                      value={cabanaData.capacidad}
                      onChange={handleChange}
                      min="1"
                      required
                      disabled={loading.saving}
                    />
                  </Form.Group>
                </Col>
              
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Precio por noche ($) *</Form.Label>
                    <Form.Control
                      type="number"
                      name="precio"
                      value={cabanaData.precio}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      required
                      disabled={loading.saving}
                    />
                  </Form.Group>
                </Col>
                
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Habitaciones</Form.Label>
                    <Form.Control
                      type="number"
                      name="habitaciones"
                      value={cabanaData.habitaciones}
                      onChange={handleChange}
                      min="1"
                      required
                      disabled={loading.saving}
                    />
                  </Form.Group>
                </Col>
                
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Disponibilidad</Form.Label>
                    <div className="mt-2">
                      <Form.Check
                        type="switch"
                        id="disponibilidad-switch"
                        name="disponibilidad"
                        label={cabanaData.disponibilidad ? 'Disponible' : 'No disponible'}
                        checked={cabanaData.disponibilidad}
                        onChange={handleChange}
                        disabled={loading.saving}
                      />
                    </div>
                  </Form.Group>
                </Col>
              </Row>

              <h4 className="mb-4 mt-4 border-bottom pb-2">Servicios</h4>
              
              <Row>
                {serviciosDisponibles.map((servicio, index) => (
                  <Col key={index} md={4} className="mb-2">
                    <Form.Check
                      type="checkbox"
                      id={`servicio-${index}`}
                      label={servicio}
                      value={servicio}
                      checked={cabanaData.servicios.includes(servicio)}
                      onChange={handleServiciosChange}
                      disabled={loading.saving}
                    />
                  </Col>
                ))}
              </Row>

              <h4 className="mb-4 mt-4 border-bottom pb-2">Reglas y Dimensiones</h4>
              

              <h4 className="mb-4 mt-4 border-bottom pb-2">Imágenes</h4>
              
              <Row className="mb-4">
                {cabanaData.imagenes.map((img, index) => (
  <Col key={`img-${index}`} xs={6} md={3} className="mb-3">
    <Image 
      src={img.url.startsWith('http') ? img.url : `${API_URL}${img.url}`}
      thumbnail
      fluid
      className="w-100"
      style={{ height: '150px', objectFit: 'cover' }}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = `${API_URL}/default-cabana.jpg`;
      }}
    />
    
  </Col>
))}
              </Row>

              <div className="d-flex justify-content-end gap-3 mt-4">
                <Button 
                  variant="outline-secondary" 
                  onClick={() => navigate('/admin/cabanas')}
                  disabled={loading.saving}
                >
                  <FaTimes className="me-1" /> Cancelar
                </Button>
                
                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={loading.saving}
                >
                  {loading.saving ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <FaSave className="me-1" /> Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </AdminLayout>
  );
}
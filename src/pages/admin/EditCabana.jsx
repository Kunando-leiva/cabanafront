import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';
import { Form, Button, Alert, Spinner, Card, Row, Col, Image as BootstrapImage } from 'react-bootstrap';
import { FaTrash, FaSave, FaTimes, FaPlus, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { Modal, message } from 'antd';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function EditCabana() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState({ initial: true, saving: false, deleting: false });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);

  // Estado inicial
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
    'Piscina', 'Cocina', 'Estacionamiento', 'Ropa de cama', 'Artículos de aseo', 
    'Balcón o terraza', 'Baños', 'Cama doble', 'Heladera', 'Pava eléctrica', 
    'Toallones', 'Vasos', 'Platos', 'Cubiertos', 'Wi-Fi', 'Ventiladores', 
    'TV', 'Ollas', 'Fuentes para horno', 'Parrillas', 'Desayuno seco', 
    'Fogón', 'Parque', 'Cancha de fútbol',
  ];

  // Cargar datos de la cabaña
  useEffect(() => {
    const fetchCabana = async () => {
      try {
        setLoading({ initial: true, saving: false, deleting: false });
        setError('');
        
        const response = await axios.get(`${API_URL}/api/cabanas/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.data.success || !response.data.data) {
          throw new Error('Estructura de respuesta inválida');
        }

        const cabana = response.data.data;
        console.log('Cabaña cargada:', cabana);

        // Procesar imágenes
        const imagenesProcesadas = (cabana.images || cabana.imagenes || []).map(img => {
          if (!img) return null;
          
          // Si es string (ID)
          if (typeof img === 'string') {
            return {
              _id: img,
              url: `${API_URL}/api/images/${img}`,
              filename: `Imagen ${img.substring(0, 8)}...`
            };
          }
          
          // Si es objeto
          return {
            _id: img._id || img.id,
            fileId: img.fileId,
            url: img.url?.startsWith('http') ? img.url : `${API_URL}${img.url?.startsWith('/') ? '' : '/'}${img.url || ''}`,
            filename: img.filename || `Imagen ${(img._id || img.id).substring(0, 8)}...`,
            isNew: img.isNew || false
          };
        }).filter(img => img !== null);

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
        setLoading({ initial: false, saving: false, deleting: false });
      }
    };

    fetchCabana();
  }, [id, token]);

  // Manejar cambios en los inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCabanaData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              (type === 'number' ? parseFloat(value) || 0 : value)
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
      setLoading({ ...loading, deleting: true });
      setError('');
      
      Modal.confirm({
        title: '¿Eliminar esta imagen?',
        content: 'Esta acción no se puede deshacer.',
        okText: 'Eliminar',
        okType: 'danger',
        cancelText: 'Cancelar',
        onOk: async () => {
          try {
            console.log('Eliminando imagen:', imageData);
            
            // Eliminar usando la ruta específica de cabaña
            const response = await axios.delete(
              `${API_URL}/api/cabanas/${id}/images/${imageData._id}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );

            if (!response.data.success) {
              throw new Error(response.data.error || 'Error al eliminar imagen');
            }

            // Actualizar estado local
            setCabanaData(prev => ({
              ...prev,
              imagenes: prev.imagenes.filter((_, i) => i !== index)
            }));

            message.success('Imagen eliminada correctamente');
            setSuccess('Imagen eliminada correctamente');
          } catch (error) {
            console.error('Error al eliminar imagen:', error);
            message.error(error.response?.data?.error || error.message || 'Error al eliminar imagen');
            setError('Error al eliminar imagen');
          } finally {
            setLoading({ ...loading, deleting: false });
          }
        },
        onCancel: () => {
          setLoading({ ...loading, deleting: false });
        }
      });
    } catch (error) {
      console.error('Error en el flujo de eliminación:', error);
      setError(error.message);
      setLoading({ ...loading, deleting: false });
    }
  };

  // Subir nuevas imágenes
  const handleImageUpload = async (file) => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('images', file);
      
      // ✅ SOLUCIÓN CRÍTICA: Enviar imagesToKeep como string JSON válido
      const imagesToKeepIds = cabanaData.imagenes
        .filter(img => img._id && !img.isNew && !img._id.startsWith('temp-'))
        .map(img => img._id);
      
      formData.append('imagesToKeep', JSON.stringify(imagesToKeepIds));

      console.log('📤 Subiendo imagen con datos:', {
        imagesToKeep: imagesToKeepIds.length,
        fileName: file.name,
        fileSize: file.size
      });

      const response = await axios.post(
        `${API_URL}/api/cabanas/${id}/agregar-imagenes`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            // NOTA: No establecer 'Content-Type', axios lo maneja automáticamente para FormData
          },
          timeout: 30000
        }
      );

      if (response.data.success) {
        // Actualizar las imágenes en el estado
        const nuevasImagenes = response.data.data.imagenes || [];
        setCabanaData(prev => ({
          ...prev,
          imagenes: nuevasImagenes.map(img => ({
            _id: img._id,
            fileId: img.fileId,
            url: img.url,
            filename: img.filename,
            isNew: img.isNew || false
          }))
        }));
        
        message.success(`Imagen agregada correctamente`);
        setSuccess('Imagen agregada correctamente');
      }
    } catch (error) {
      console.error('Error al subir imagen:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      message.error(error.response?.data?.error || 'Error al subir imagen');
      setError('Error al subir imagen');
    } finally {
      setUploading(false);
    }
    return false;
  };

  // Manejar selección de archivos
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Limitar a 10 imágenes máximo
    const totalImages = cabanaData.imagenes.length + files.length;
    if (totalImages > 10) {
      message.error(`Máximo 10 imágenes permitidas. Ya tienes ${cabanaData.imagenes.length}`);
      return;
    }

    // Subir cada archivo
    files.forEach(file => {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        message.error(`${file.name} no es una imagen válida`);
        return;
      }

      // Validar tamaño (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        message.error(`${file.name} es muy grande (máximo 10MB)`);
        return;
      }

      handleImageUpload(file);
    });

    // Limpiar input
    e.target.value = '';
  };

  // Reordenar imágenes
  const moveImage = (index, direction) => {
    const newImages = [...cabanaData.imagenes];
    if (direction === 'up' && index > 0) {
      [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];
    } else if (direction === 'down' && index < newImages.length - 1) {
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    }
    setCabanaData(prev => ({ ...prev, imagenes: newImages }));
  };

  // Guardar reordenamiento
  const saveImageOrder = async () => {
    try {
      setLoading({ ...loading, saving: true });
      
      const response = await axios.patch(
        `${API_URL}/api/cabanas/${id}/reordenar-imagenes`,
        {
          imageIds: cabanaData.imagenes.map(img => img._id)
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        message.success('Orden de imágenes guardado');
        setSuccess('Orden de imágenes actualizado');
      }
    } catch (error) {
      message.error('Error al guardar el orden');
      console.error('Error:', error);
    } finally {
      setLoading({ ...loading, saving: false });
    }
  };

  // ✅✅✅ SOLUCIÓN DEFINITIVA: Enviar formulario completo
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading({ initial: false, saving: true, deleting: false });
      setError('');
      setSuccess('');

      // ============================================
      // 1. PREPARAR FORM DATA - SOLUCIÓN CRÍTICA
      // ============================================
      const formData = new FormData();
      
      // Datos básicos como strings
      const camposTexto = {
        nombre: cabanaData.nombre,
        descripcion: cabanaData.descripcion,
        capacidad: cabanaData.capacidad.toString(),
        precio: cabanaData.precio.toString(),
        servicios: JSON.stringify(cabanaData.servicios || []),
        isFeatured: cabanaData.isFeatured.toString(),
        disponibilidad: cabanaData.disponibilidad.toString(),
        reglas: cabanaData.reglas || '',
        dimensiones: cabanaData.dimensiones || '',
        habitaciones: cabanaData.habitaciones.toString(),
        // ✅✅✅ ENVIAR SIEMPRE COMO STRING JSON VÁLIDO
        imagesToDelete: '[]', // Array vacío si no hay imágenes para eliminar
        imagesToKeep: JSON.stringify(
          cabanaData.imagenes
            .filter(img => img._id && !img._id.startsWith('temp-'))
            .map(img => img._id)
        )
      };
      
      // Agregar cada campo al FormData
      Object.entries(camposTexto).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      // Agregar nuevas imágenes si las hay
      cabanaData.imagenes
        .filter(img => img.isNew && img.file)
        .forEach((img, index) => {
          formData.append('newImages', img.file);
        });
      
      console.log('📤 Datos a enviar para actualizar:', {
        imagesToKeep: JSON.parse(camposTexto.imagesToKeep).length,
        imagesToDelete: 0,
        nuevasImagenes: cabanaData.imagenes.filter(img => img.isNew && img.file).length,
        totalCampos: Object.keys(camposTexto).length
      });
      
      // ============================================
      // 2. ENVIAR AL BACKEND
      // ============================================
      const response = await axios.put(
        `${API_URL}/api/cabanas/${id}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
            // ✅ NO establecer 'Content-Type' - axios lo hace automáticamente para FormData
          },
          timeout: 30000
        }
      );
      
      // ============================================
      // 3. MANEJAR RESPUESTA
      // ============================================
      if (response.data.success) {
        message.success(response.data.message || '¡Cabaña actualizada correctamente!');
        
        // Mostrar resumen si viene en la respuesta
        if (response.data.summary) {
          console.log('📊 Resumen de actualización:', response.data.summary);
        }
        
        // Redirigir después de mostrar el mensaje
        setTimeout(() => {
          navigate('/admin/cabanas');
        }, 2000);
      } else {
        throw new Error(response.data.error || 'Error desconocido');
      }
      
    } catch (error) {
      console.error('🔥 ERROR en handleSubmit:', {
        mensaje: error.message,
        respuesta: error.response?.data,
        estado: error.response?.status,
        configuracion: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      // Mensajes de error amigables
      let mensajeError = 'Error al guardar los cambios';
      
      if (error.response?.data?.error) {
        mensajeError = error.response.data.error;
      } else if (error.message?.includes('timeout')) {
        mensajeError = 'La operación tardó demasiado. Intenta con menos imágenes.';
      } else if (error.response?.status === 400) {
        mensajeError = 'Datos inválidos. Verifica la información.';
      } else if (error.response?.status === 401) {
        mensajeError = 'No autorizado. Inicia sesión nuevamente.';
      } else if (error.response?.status === 404) {
        mensajeError = 'Cabaña no encontrada.';
      }
      
      message.error(mensajeError);
      setError(mensajeError);
      
    } finally {
      setLoading({ initial: false, saving: false, deleting: false });
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
            {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>
              {success}
            </Alert>}
            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>
              {error}
            </Alert>}

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
              
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Reglas de la cabaña</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="reglas"
                      value={cabanaData.reglas}
                      onChange={handleChange}
                      disabled={loading.saving}
                      placeholder="Ej: No se permiten mascotas, No fumar, Check-in después de las 14:00..."
                    />
                  </Form.Group>
                </Col>
                
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Dimensiones</Form.Label>
                    <Form.Control
                      type="text"
                      name="dimensiones"
                      value={cabanaData.dimensiones}
                      onChange={handleChange}
                      disabled={loading.saving}
                      placeholder="Ej: 8m x 6m, 50m² total..."
                    />
                  </Form.Group>
                </Col>
              </Row>

              <h4 className="mb-4 mt-4 border-bottom pb-2">Imágenes ({cabanaData.imagenes.length}/10)</h4>
              
              {/* Área para agregar nuevas imágenes */}
              <div className="mb-4 p-3 border rounded bg-light">
                <h5>Agregar nuevas imágenes</h5>
                <p className="text-muted small mb-3">
                  Puedes agregar hasta {10 - cabanaData.imagenes.length} imágenes más. 
                  Formatos: JPEG, PNG, WEBP. Máx 10MB por imagen.
                </p>
                
                <div className="d-flex align-items-center gap-3">
                  <label className="btn btn-primary mb-0" htmlFor="image-upload">
                    <FaPlus className="me-2" />
                    Seleccionar imágenes
                    <input
                      id="image-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                      disabled={uploading || cabanaData.imagenes.length >= 10}
                    />
                  </label>
                  
                  {uploading && (
                    <div className="d-flex align-items-center">
                      <Spinner animation="border" size="sm" className="me-2" />
                      <span>Subiendo...</span>
                    </div>
                  )}
                  
                  {cabanaData.imagenes.length > 0 && (
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={saveImageOrder}
                      disabled={loading.saving}
                    >
                      Guardar orden
                    </Button>
                  )}
                </div>
              </div>

              {/* Grid de imágenes existentes */}
              <Row className="mb-4">
                {cabanaData.imagenes.map((img, index) => (
                  <Col key={`img-${img._id || index}`} xs={12} md={4} lg={3} className="mb-4">
                    <Card className="h-100">
                      <div className="position-relative">
                        <BootstrapImage 
                          src={img.url}
                          thumbnail
                          fluid
                          className="w-100"
                          style={{ height: '200px', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `${API_URL}/default-cabana.jpg`;
                          }}
                        />
                        
                        {/* Indicador de nueva imagen */}
                        {img.isNew && (
                          <span className="position-absolute top-0 start-0 badge bg-success m-2">
                            Nueva
                          </span>
                        )}
                        
                        {/* Indicador de imagen principal */}
                        {index === 0 && (
                          <span className="position-absolute top-0 end-0 badge bg-primary m-2">
                            Principal
                          </span>
                        )}
                        
                        {/* Controles */}
                        <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 p-2 d-flex justify-content-center gap-2">
                          <Button
                            variant="outline-light"
                            size="sm"
                            onClick={() => moveImage(index, 'up')}
                            disabled={index === 0 || loading.saving}
                            title="Mover arriba"
                          >
                            <FaArrowUp />
                          </Button>
                          
                          <Button
                            variant="outline-light"
                            size="sm"
                            onClick={() => moveImage(index, 'down')}
                            disabled={index === cabanaData.imagenes.length - 1 || loading.saving}
                            title="Mover abajo"
                          >
                            <FaArrowDown />
                          </Button>
                          
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteImage(img, index)}
                            disabled={loading.deleting || loading.saving}
                            title="Eliminar imagen"
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </div>
                      
                      <Card.Body className="p-2">
                        <small className="text-muted d-block text-truncate" title={img.filename}>
                          {img.filename}
                        </small>
                        {img.isNew && (
                          <small className="text-success d-block">
                            (Se guardará al actualizar)
                          </small>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
                
                {cabanaData.imagenes.length === 0 && (
                  <Col xs={12}>
                    <Alert variant="info" className="text-center">
                      Esta cabaña no tiene imágenes. ¡Agrega algunas!
                    </Alert>
                  </Col>
                )}
              </Row>

              <div className="d-flex justify-content-end gap-3 mt-4">
                <Button 
                  variant="outline-secondary" 
                  onClick={() => navigate('/admin/cabanas')}
                  disabled={loading.saving || loading.deleting}
                >
                  <FaTimes className="me-1" /> Cancelar
                </Button>
                
                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={loading.saving || loading.deleting || uploading}
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
          
          <Card.Footer className="text-muted small">
            <div className="d-flex justify-content-between">
              <span>
                Total imágenes: {cabanaData.imagenes.length} / 10
              </span>
              <span>
                Última actualización: {new Date().toLocaleDateString()}
              </span>
            </div>
          </Card.Footer>
        </Card>
      </div>
    </AdminLayout>
  );
}
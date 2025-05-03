import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Container, Form, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { API_URL } from '../../config';

const CrearReservaAdmin = () => {
  const { user, token, isAuthenticated, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [cabanas, setCabanas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const processCabanasData = (data) => {
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    if (data?.cabanas && Array.isArray(data.cabanas)) return data.cabanas;
    return [];
  };

  const [formData, setFormData] = useState({
    cabanaId: '',
    fechaInicio: null,
    fechaFin: null,
    precioTotal: 0,
    huesped: {
      nombre: '',
      apellido: '',
      dni: '',
      direccion: '',
      telefono: '',
      email: ''
    }
  });

  // Redirigir si no está autenticado o no es admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { 
        state: { 
          from: '/admin/reservas/crear',
          message: 'Debes iniciar sesión para acceder a esta página' 
        } 
      });
      return;
    }

    if (!isAdmin()) {
      navigate('/dashboard', { 
        state: { 
          error: 'No tienes permisos para acceder a esta sección' 
        } 
      });
    }
  }, [isAuthenticated, navigate, isAdmin]);

  // Obtener cabañas al cargar
  useEffect(() => {
    const fetchCabanas = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch(`${API_URL}/api/cabanas`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
    
        if (response.status === 401) {
          logout();
          throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
        }
    
        if (!response.ok) {
          throw new Error('No se pudieron cargar las cabañas. Intenta nuevamente.');
        }
    
        const data = await response.json();
        console.log('Datos recibidos de cabañas:', data); // Para debug
        
        const processedCabanas = processCabanasData(data);
        console.log('Cabañas procesadas:', processedCabanas); // Para debug
        
        if (!Array.isArray(processedCabanas)) {
          throw new Error('Formato de datos inesperado');
        }
    
        setCabanas(processedCabanas);
      } catch (err) {
        console.error('Error al cargar cabañas:', err);
        setError(err.message);
        setCabanas([]); // Asegurar que siempre sea un array
      } finally {
        setLoading(false);
      }
    };
    

    if (isAuthenticated && isAdmin() && token) {
      fetchCabanas();
    }
  }, [token, isAuthenticated, logout, isAdmin]);

  // Calcular precio cuando cambian fechas o cabaña
  useEffect(() => {
    if (formData.cabanaId && formData.fechaInicio && formData.fechaFin) {
      const cabana = cabanas.find(c => c._id === formData.cabanaId);
      if (cabana) {
        const diffTime = Math.abs(new Date(formData.fechaFin) - new Date(formData.fechaInicio));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const total = diffDays * cabana.precio;
        
        setFormData(prev => ({ 
          ...prev, 
          precioTotal: total > 0 ? total : 0 
        }));
      }
    }
  }, [formData.fechaInicio, formData.fechaFin, formData.cabanaId, cabanas]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validar campos obligatorios
      const requiredFields = {
        cabanaId: 'Cabaña',
        fechaInicio: 'Fecha de inicio',
        fechaFin: 'Fecha de fin',
        'huesped.nombre': 'Nombre del huésped',
        'huesped.apellido': 'Apellido del huésped',
        'huesped.dni': 'DNI del huésped',
        'huesped.telefono': 'Teléfono del huésped',
        'huesped.email': 'Email del huésped'
      };
      
      const missingFields = [];
      for (const [field, label] of Object.entries(requiredFields)) {
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          if (!formData[parent]?.[child]) missingFields.push(label);
        } else if (!formData[field]) {
          missingFields.push(label);
        }
      }

      if (missingFields.length > 0) {
        throw new Error(`Faltan campos obligatorios: ${missingFields.join(', ')}`);
      }

      // Validar fechas
      if (new Date(formData.fechaInicio) >= new Date(formData.fechaFin)) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }

      // Validar DNI
      if (!/^\d+$/.test(formData.huesped.dni)) {
        throw new Error('El DNI debe contener solo números');
      }

      // Crear payload
      const payload = {
        cabanaId: formData.cabanaId,
        fechaInicio: formData.fechaInicio.toISOString(),
        fechaFin: formData.fechaFin.toISOString(),
        huesped: {
          nombre: formData.huesped.nombre.trim(),
          apellido: formData.huesped.apellido.trim(),
          dni: formData.huesped.dni.trim(),
          direccion: formData.huesped.direccion.trim(),
          telefono: formData.huesped.telefono.trim(),
          email: formData.huesped.email.trim()
        }
      };

      const response = await fetch(`${API_URL}/api/reservas/admin/crear`, {

        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Error al crear la reserva');
      }

      navigate('/admin/reservas', { 
        state: { 
          success: `Reserva creada exitosamente! ID: ${responseData.data._id}` 
        } 
      });

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleHuespedChange = (field, value) => {
    setFormData({
      ...formData,
      huesped: {
        ...formData.huesped,
        [field]: value
      }
    });
  };

  if (!isAuthenticated || !isAdmin()) {
    return null;
  }

  return (
    <Container className="mt-4">
      <h2 className="text-center mb-4">Crear Reserva Manual</h2>
      
      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
        </Alert>
      )}

      <Card className="p-4">
        <Form onSubmit={handleSubmit}>
          <Row>
            {/* Sección: Datos del Huésped */}
            <Col md={12}>
              <h4 className="mb-3 border-bottom pb-2">Datos del Huésped</h4>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Nombre <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  value={formData.huesped.nombre}
                  onChange={(e) => handleHuespedChange('nombre', e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Apellido <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  value={formData.huesped.apellido}
                  onChange={(e) => handleHuespedChange('apellido', e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>DNI <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  value={formData.huesped.dni}
                  onChange={(e) => handleHuespedChange('dni', e.target.value)}
                  required
                  pattern="\d*"
                  title="Solo se permiten números"
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Teléfono <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="tel"
                  value={formData.huesped.telefono}
                  onChange={(e) => handleHuespedChange('telefono', e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Dirección</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.huesped.direccion}
                  onChange={(e) => handleHuespedChange('direccion', e.target.value)}
                />
              </Form.Group>
            </Col>
            
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="email"
                  value={formData.huesped.email}
                  onChange={(e) => handleHuespedChange('email', e.target.value)}
                  required
                />
              </Form.Group>
            </Col>

            {/* Sección: Datos de la Reserva */}
            <Col md={12}>
              <h4 className="mb-3 mt-4 border-bottom pb-2">Datos de la Reserva</h4>
            </Col>
            
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Cabaña <span className="text-danger">*</span></Form.Label>
                <Form.Select
  value={formData.cabanaId}
  onChange={(e) => setFormData({...formData, cabanaId: e.target.value})}
  required
  disabled={loading || cabanas.length === 0}
>
  <option value="">
    {loading ? 'Cargando cabañas...' : 
     cabanas.length === 0 ? 'No hay cabañas disponibles' : 'Seleccionar cabaña...'}
  </option>
  {Array.isArray(cabanas) && cabanas.map((cabana) => (
    <option key={cabana._id} value={cabana._id}>
      {cabana.nombre} (${cabana.precio?.toFixed(2) || '0.00'}/noche)
    </option>
  ))}
</Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Fecha de Inicio <span className="text-danger">*</span></Form.Label>
                <DatePicker
                  selected={formData.fechaInicio}
                  onChange={(date) => setFormData({...formData, fechaInicio: date})}
                  selectsStart
                  startDate={formData.fechaInicio}
                  endDate={formData.fechaFin}
                  minDate={new Date()}
                  className="form-control"
                  required
                  disabled={loading}
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Fecha de Fin <span className="text-danger">*</span></Form.Label>
                <DatePicker
                  selected={formData.fechaFin}
                  onChange={(date) => setFormData({...formData, fechaFin: date})}
                  selectsEnd
                  startDate={formData.fechaInicio}
                  endDate={formData.fechaFin}
                  minDate={formData.fechaInicio || new Date()}
                  className="form-control"
                  required
                  disabled={loading || !formData.fechaInicio}
                />
              </Form.Group>
            </Col>
            
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Precio Total</Form.Label>
                <Form.Control
                  type="text"
                  value={`$${formData.precioTotal.toFixed(2)}`}
                  readOnly
                  className="fw-bold"
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-between mt-4">
            <Button 
              variant="outline-secondary" 
              onClick={() => navigate('/admin/reservas')}
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
                  Creando reserva...
                </>
              ) : 'Confirmar Reserva'}
            </Button>
          </div>
        </Form>
      </Card>
    </Container>
  );
};

export default CrearReservaAdmin;
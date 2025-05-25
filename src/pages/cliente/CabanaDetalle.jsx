import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Row, Col, Card, Button, Alert, Badge, Carousel, Spinner
} from 'react-bootstrap';
import { 
  FaArrowLeft, FaCalendarAlt, FaUsers, FaMoneyBillWave,
  FaWifi, FaSwimmingPool, FaSnowflake, FaParking, FaTv,
  FaUtensils, FaBed, FaShower, FaUmbrellaBeach, FaTemperatureHigh
} from 'react-icons/fa';
import { BiFridge } from 'react-icons/bi';
import { GiElectric } from 'react-icons/gi';
import { IoIosBonfire } from "react-icons/io";
import axios from 'axios';
import CalendarFull from '../../components/CalendarFull';
import { API_URL } from '../../config';
import "./CabanaDetalle.css";

const SERVICIOS = [
  { nombre: 'Piscina', icono: <FaSwimmingPool /> },
  { nombre: 'Cocina', icono: <FaUtensils /> },
  { nombre: 'Estacionamiento', icono: <FaParking /> },
  { nombre: 'Ropa de cama', icono: <FaBed /> },
  { nombre: 'Artículos de aseo', icono: <FaShower /> },
  { nombre: 'Balcón o terraza', icono: <FaUmbrellaBeach /> },
  { nombre: 'Baños', icono: <FaShower /> },
  { nombre: 'Cama doble', icono: <FaBed /> },
  { nombre: 'Heladera', icono: <BiFridge /> }, // Alternativa: podrías importar BiFridge de react-icons/bi
  { nombre: 'Pava eléctrica', icono: <FaTemperatureHigh /> }, // Alternativa: podrías importar GiElectric de react-icons/gi
  { nombre: 'Toallones', icono: <FaShower /> },
  { nombre: 'Vasos', icono: <FaUtensils /> },
  { nombre: 'Platos', icono: <FaUtensils /> },
  { nombre: 'Cubiertos', icono: <FaUtensils /> },
  { nombre: 'Wi-Fi', icono: <FaWifi /> },
  { nombre: 'Ventiladores', icono: <FaTemperatureHigh /> }, // Alternativa: podrías importar FaFan de react-icons/fa
  { nombre: 'TV', icono: <FaTv /> },
  { nombre: 'Ollas', icono: <FaUtensils /> },
  { nombre: 'Fuentes para horno', icono: <FaUtensils /> },
  { nombre: 'Parrillas', icono: <FaUtensils /> },
  { nombre: 'Desayuno seco', icono: <FaUtensils /> }, // Alternativa: podrías importar FaCoffee de react-icons/fa
  { nombre: 'Fogón', icono: <IoIosBonfire /> },
  { nombre: 'Parque', icono: <FaUmbrellaBeach /> },
  { nombre: 'Cancha de fútbol', icono: <FaSwimmingPool /> },
  { nombre: 'Aire acondicionado', icono: <FaSnowflake /> },
  { nombre: 'Calefacción', icono: <FaTemperatureHigh /> }
];

export default function CabanaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cabana, setCabana] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDates, setSelectedDates] = useState({ start: null, end: null });
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  // Función para calcular noches entre fechas
  const calcularNoches = (start, end) => {
  if (!start || !end || start >= end) return 0;
  
  // Normaliza las fechas (misma hora para ambas)
  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);

  // Diferencia en milisegundos
  const diffTime = endDate - startDate;
  
  // Convierte a días (86400000 ms = 1 día)
  return Math.floor(diffTime / 86400000); // Usa Math.floor en lugar de Math.ceil
};
  // Función para calcular precio total
  const calcularPrecioTotal = () => {
    const noches = calcularNoches(selectedDates.start, selectedDates.end);
    if (!cabana?.precio || noches <= 0) return 0;
    return (noches * cabana.precio).toFixed(2);
  };

  // Cargar datos de la cabaña
  useEffect(() => {
    const fetchCabana = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Validar ID primero
        if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
          throw new Error('ID de cabaña no válido');
        }

        // 1. Obtener datos principales
        const cabanaResponse = await axios.get(`${API_URL}/api/cabanas/${id}`);
        
        if (!cabanaResponse.data?.success) {
          throw new Error(cabanaResponse.data?.error || 'Error al obtener cabaña');
        }

        const cabanaData = cabanaResponse.data.data;

        // 2. Obtener imágenes si no vinieron en la respuesta
        let imagenes = cabanaData.images || [];
        if (imagenes.length === 0) {
          try {
            const imagesResponse = await axios.get(`${API_URL}/api/cabanas/${id}/images`);
            if (imagesResponse.data?.success) {
              imagenes = imagesResponse.data.data;
            }
          } catch (imgError) {
            console.warn('Error obteniendo imágenes adicionales:', imgError.message);
          }
        }

        // Formatear URLs de imágenes
        const formatImageUrl = (img) => {
          if (!img?.url) return `${API_URL}/default-cabana.jpg`;
          return img.url.startsWith('http') ? img.url : `${API_URL}${img.url.startsWith('/') ? '' : '/'}${img.url}`;
        };

        setCabana({
          ...cabanaData,
          imagenes: imagenes.length > 0 
            ? imagenes.map(img => ({
                ...img,
                url: formatImageUrl(img)
              }))
            : [{ url: `${API_URL}/default-cabana.jpg`, filename: 'default.jpg', isDefault: true }],
          imagenPrincipal: formatImageUrl(cabanaData.imagenPrincipal || imagenes[0])
        });

      } catch (err) {
        console.error('Error al cargar cabaña:', {
          message: err.message,
          response: err.response?.data,
          config: err.config
        });
        setError(err.response?.data?.error || err.message || 'Error al cargar la cabaña');
      } finally {
        setLoading(false);
      }
    };

    fetchCabana();
  }, [id]);

  // Manejar reserva
  const handleReservar = () => {
    if (!selectedDates.start || !selectedDates.end) {
      setError('Selecciona un rango de fechas válido');
      return;
    }
    
    if (new Date(selectedDates.start) < new Date()) {
      setError('No puedes reservar fechas pasadas');
      return;
    }

    navigate(`/reservar/${id}`, {
      state: {
        cabanaId: id,
        cabanaNombre: cabana.nombre,
        fechaInicio: selectedDates.start,
        fechaFin: selectedDates.end,
        precioTotal: calcularPrecioTotal(),
        imagenPrincipal: cabana.imagenPrincipal
      }
    });
  };

  // Estados de carga
  if (loading) return (
    <div className="text-center my-5">
      <Spinner animation="border" variant="primary" />
      <p className="mt-2">Cargando información de la cabaña...</p>
    </div>
  );

  // Manejo de errores
  if (error || !cabana) return (
    <Container className="my-5">
      <Alert variant="danger" className="text-center">
        <Alert.Heading>ups cabaña ya reservada para esa fecha</Alert.Heading>
        <p>{error}</p>
        <div className="mt-3">
          <Button 
            variant="primary" 
            onClick={() => navigate('/cabanas')}
            className="me-2"
          >
            Ver cabañas disponibles
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </Button>
        </div>
      </Alert>
    </Container>
  );

  const noches = calcularNoches(selectedDates.start, selectedDates.end);
  const precioTotal = calcularPrecioTotal();

  return (
    <Container className="my-4">
      <Button 
        variant="outline-primary" 
        onClick={() => navigate(-1)} 
        className="mb-4"
        style={{  fontWeight: 300,
            lineHeight: '1.6', // Interlineado ajustado
            marginBottom: '1.5rem',
            backgroundColor: '#eaac25',
            borderColor: '#eaac25', }}
      >
        <FaArrowLeft 
        className="me-2"
         /> Volver
      </Button>

      <Row className="g-4">
        {/* Sección de imágenes */}
        <Col lg={6}>
          <Card className="shadow-sm">
            <Carousel 
              activeIndex={activeImgIndex} 
              onSelect={setActiveImgIndex}
              interval={null}
              indicators={cabana.imagenes.length > 1}
            >
              {cabana.imagenes.map((img, index) => (
                <Carousel.Item key={index}>
                  <div className="ratio ratio-16x9">
                    <img
                      src={img.url}
                      alt={`${cabana.nombre} - Imagen ${index + 1}`}
                      className="img-fluid rounded-top"
                      style={{ objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `${API_URL}/default-cabana.jpg`;
                      }}
                    />
                  </div>
                </Carousel.Item>
              ))}
            </Carousel>

            {cabana.imagenes.length > 1 && (
              <Card.Footer className="p-3 bg-light">
                <Row className="g-2">
                  {cabana.imagenes.map((img, index) => (
                    <Col xs={3} key={`thumb-${index}`}>
                      <img
                        src={img.url}
                        alt={`Miniatura ${index + 1}`}
                        className={`img-thumbnail cursor-pointer ${activeImgIndex === index ? 'border-primary border-2' : 'opacity-75'}`}
                        onClick={() => setActiveImgIndex(index)}
                        style={{ height: '80px', objectFit: 'cover', width: '100%' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `${API_URL}/default-cabana-thumb.jpg`;
                        }}
                      />
                    </Col>
                  ))}
                </Row>
              </Card.Footer>
            )}
          </Card>
        </Col>

        {/* Sección de detalles */}
        <Col lg={6}>
          <Card className="shadow-sm h-100">
            <Card.Body className="d-flex flex-column">
              <Card.Title as="h1" className="mb-3">{cabana.nombre}</Card.Title>
              <Card.Text className="text-muted mb-4">{cabana.descripcion}</Card.Text>

              <Row className="mb-4 g-3">
                <Col md={6}>
                  <div className="d-flex align-items-center p-3 bg-light rounded h-100">
                    <FaUsers className="text-primary me-3 fs-4" />
                    <div>
                      <small className="text-muted">Capacidad</small>
                      <div className="fs-5"><strong>{cabana.capacidad} personas</strong></div>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-center p-3 bg-light rounded h-100">
                    <FaMoneyBillWave className="text-success me-3 fs-4" />
                    <div>
                      <small className="text-muted">Precio por noche</small>
                      <div className="fs-5">
                        <strong>${cabana.precio?.toLocaleString('es-AR') || '0'}</strong>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>

              {cabana.servicios?.length > 0 && (
                <div className="mb-4">
                  <h5 className="d-flex align-items-center mb-3">
                    <FaWifi className="me-2 text-primary" />
                    Servicios incluidos
                  </h5>
                  <div className="d-flex flex-wrap gap-2">
                    {cabana.servicios.map((servicio, i) => {
                      const servicioInfo = SERVICIOS.find(s => s.nombre === servicio) || { nombre: servicio };
                      return (
                        <Badge 
                          key={`servicio-${i}`} 
                          pill 
                          bg="light" 
                          text="dark" 
                          className="border d-flex align-items-center"
                        >
                          {servicioInfo.icono && React.cloneElement(servicioInfo.icono, { className: 'me-1' })}
                          {servicioInfo.nombre}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <h5 className="d-flex align-items-center mb-3">
                  <FaCalendarAlt className="me-2 text-primary" />
                  Disponibilidad
                </h5>
                <CalendarFull 
                  cabanaId={id}
                  onDatesSelected={(start, end) => {
                    setSelectedDates({ start, end });
                    setError('');
                  }}
                />

                {selectedDates.start && selectedDates.end && (
                  <Alert variant="info" className="mt-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Desde: {new Date(selectedDates.start).toLocaleDateString('es-ES')}</span>
                      <span>Hasta: {new Date(selectedDates.end).toLocaleDateString('es-ES')}</span>
                    </div>
                    <div className="d-flex justify-content-between fw-bold">
                      <span>Noches: {noches}</span>
                      <span>Total: ${precioTotal}</span>
                    </div>
                  </Alert>
                )}

                {error && (
                  <Alert variant="danger" className="mt-3">
                    {error}
                  </Alert>
                )}
              </div>

              <div className="mt-auto">
                <Button
                  variant="primary"
                  size="lg"
                  className="boton-detalle w-100 py-3 fw-bold"
                  onClick={handleReservar}
                  disabled={!selectedDates.start || !selectedDates.end}
                  style={{ fontSize: '1rem', // Tamaño reducido para móviles
            fontWeight: 300,
            lineHeight: '1.6', // Interlineado ajustado
            marginBottom: '1.5rem',
            backgroundColor: '#eaac25',
            borderColor: '#eaac25',

          }}
                >
                  Reservar ahora
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
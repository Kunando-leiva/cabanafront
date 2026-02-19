import React, { useState, useEffect, useMemo } from 'react';
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
import { calcularPrecioReserva, formatearPrecioArgentino, getOccupiedDates } from '../../config';
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
  { nombre: 'Heladera', icono: <BiFridge /> },
  { nombre: 'Pava eléctrica', icono: <FaTemperatureHigh /> },
  { nombre: 'Toallones', icono: <FaShower /> },
  { nombre: 'Vasos', icono: <FaUtensils /> },
  { nombre: 'Platos', icono: <FaUtensils /> },
  { nombre: 'Cubiertos', icono: <FaUtensils /> },
  { nombre: 'Wi-Fi', icono: <FaWifi /> },
  { nombre: 'Ventiladores', icono: <FaTemperatureHigh /> },
  { nombre: 'TV', icono: <FaTv /> },
  { nombre: 'Ollas', icono: <FaUtensils /> },
  { nombre: 'Fuentes para horno', icono: <FaUtensils /> },
  { nombre: 'Parrillas', icono: <FaUtensils /> },
  { nombre: 'Desayuno seco', icono: <FaUtensils /> },
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
  const [calculandoPrecio, setCalculandoPrecio] = useState(false);
  const [error, setError] = useState('');
  const [selectedDates, setSelectedDates] = useState({ start: null, end: null });
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [precioCalculado, setPrecioCalculado] = useState({
    total: 0,
    desglose: [],
    desgloseAgrupado: [],
    totalDias: 0,
    precioFormateado: '$0'
  });

  const [occupiedDates, setOccupiedDates] = useState([]);
  const [loadingOccupiedDates, setLoadingOccupiedDates] = useState(true);

  const calcularNoches = (start, end) => {
    if (!start || !end || start >= end) return 0;
    
    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(end);
    endDate.setHours(0, 0, 0, 0);

    const diffTime = endDate - startDate;
    return Math.floor(diffTime / 86400000);
  };

  const calcularPrecioDinamico = async (fechaInicio, fechaFin) => {
    if (!fechaInicio || !fechaFin || fechaInicio >= fechaFin) {
      setPrecioCalculado({
        total: 0,
        desglose: [],
        desgloseAgrupado: [],
        totalDias: 0,
        precioFormateado: '$0'
      });
      return;
    }

    try {
      setCalculandoPrecio(true);
      console.log('🧮 Calculando precio para:', {
        fechaInicio: new Date(fechaInicio).toISOString().split('T')[0],
        fechaFin: new Date(fechaFin).toISOString().split('T')[0]
      });
      
      const precioData = await calcularPrecioReserva(fechaInicio, fechaFin);
      
      const desgloseAgrupado = [];
      const agrupadoPorTipo = {};
      
      if (precioData.desglose && precioData.desglose.length > 0) {
        precioData.desglose.forEach(dia => {
          const tipo = dia.tipo;
          if (!agrupadoPorTipo[tipo]) {
            agrupadoPorTipo[tipo] = {
              tipo,
              cantidad: 0,
              precioUnitario: dia.precioUnitario || dia.precio || 0,
              subtotal: 0
            };
          }
          agrupadoPorTipo[tipo].cantidad++;
          agrupadoPorTipo[tipo].subtotal += dia.precioUnitario || dia.precio || 0;
        });
        
        Object.values(agrupadoPorTipo).forEach(agrupado => {
          if (agrupado.cantidad > 0) {
            desgloseAgrupado.push(agrupado);
          }
        });
      }
      
      console.log('✅ Precio calculado:', {
        total: precioData.precioTotal,
        noches: precioData.totalNoches,
        desglose: desgloseAgrupado
      });
      
      setPrecioCalculado({
        total: precioData.precioTotal || 0,
        desglose: precioData.desglose || [],
        desgloseAgrupado,
        totalDias: precioData.totalNoches || 0,
        precioFormateado: formatearPrecioArgentino(precioData.precioTotal)
      });
      
      setError('');
    } catch (err) {
      console.error('❌ Error calculando precio:', err);
      setPrecioCalculado({
        total: 0,
        desglose: [],
        desgloseAgrupado: [],
        totalDias: 0,
        precioFormateado: '$0'
      });
    } finally {
      setCalculandoPrecio(false);
    }
  };

  // 🔥 FETCH OCUPADOS CORREGIDO CON MEJOR LOGGING
  useEffect(() => {
    const fetchOccupiedDates = async () => {
      if (!id) return;
      
      try {
        setLoadingOccupiedDates(true);
        console.log(`📡 Obteniendo fechas ocupadas para cabaña: ${id}`);
        
        const dates = await getOccupiedDates(id);
        
        console.log(`📊 Fechas ocupadas recibidas: ${dates.length} noches ocupadas`);
        console.log('📋 Noches ocupadas (días donde se duerme):', dates);

        // Verificación detallada para febrero 2026
        const feb2026 = dates.filter(d => d.startsWith('2026-02'));
        console.log('📅 Febrero 2026 - Noches ocupadas:', feb2026);
        
        if (feb2026.includes('2026-02-20')) {
          console.log('⚠️ La noche del 20/02/2026 está ocupada');
        }
        
        setOccupiedDates(dates);
        
      } catch (error) {
        console.error('❌ Error obteniendo fechas ocupadas:', error);
        setOccupiedDates([]);
      } finally {
        setLoadingOccupiedDates(false);
      }
    };
    
    fetchOccupiedDates();
  }, [id]);

  useEffect(() => {
    calcularPrecioDinamico(selectedDates.start, selectedDates.end);
  }, [selectedDates.start, selectedDates.end]);

  useEffect(() => {
    const fetchCabana = async () => {
      try {
        setLoading(true);
        setError('');
        
        if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
          throw new Error('ID de cabaña no válido');
        }

        console.log(`📡 Cargando cabaña ID: ${id}`);
        
        const cabanaResponse = await axios.get(`${API_URL}/api/cabanas/${id}`);
        
        if (!cabanaResponse.data?.success) {
          throw new Error(cabanaResponse.data?.error || 'Error al obtener cabaña');
        }

        const cabanaData = cabanaResponse.data.data;

        let imagenes = cabanaData.images || [];
        if (imagenes.length === 0) {
          try {
            const imagesResponse = await axios.get(`${API_URL}/api/cabanas/${id}/images`);
            if (imagesResponse.data?.success) {
              imagenes = imagesResponse.data.data;
            }
          } catch (imgError) {
            console.warn('⚠️ Error obteniendo imágenes adicionales:', imgError.message);
          }
        }

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

        console.log('✅ Cabaña cargada:', cabanaData.nombre);

      } catch (err) {
        console.error('❌ Error al carga cabaña:', {
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

  // 🔥 HANDLE RESERVAR CORREGIDO
  const handleReservar = () => {
    if (!selectedDates.start || !selectedDates.end) {
      setError('Selecciona un rango de fechas válido');
      return;
    }
    
    const startDate = new Date(selectedDates.start);
    const endDate = new Date(selectedDates.end);
    
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log('🔄 Validando reserva:', {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      noches: calcularNoches(startDate, endDate)
    });
    
    if (startDate < today) {
      setError('No puedes reservar fechas pasadas');
      return;
    }

    if (precioCalculado.total <= 0) {
      setError('El precio calculado no es válido');
      return;
    }

    // 🔥 VALIDACIÓN CORREGIDA - Solo noches que se van a dormir
    console.log('🔍 Validando disponibilidad contra fechas ocupadas:', occupiedDates);
    
    let tieneConflicto = false;
    let fechaConflicto = null;
    const current = new Date(startDate);
    
    // ✅ Validar desde startDate HASTA endDate-1 (noches que se duermen)
    while (current < endDate) {
      const dateStr = current.toISOString().split('T')[0];
      
      // Si esta noche está ocupada, hay conflicto
      if (occupiedDates.includes(dateStr)) {
        tieneConflicto = true;
        fechaConflicto = dateStr;
        console.log(`❌ Conflicto: La noche del ${dateStr} está ocupada`);
        break;
      }
      
      console.log(`✅ Noche del ${dateStr} disponible`);
      current.setDate(current.getDate() + 1);
    }
    
    if (tieneConflicto) {
      setError(`La noche del ${fechaConflicto} ya está reservada. Selecciona otras fechas.`);
      return;
    }

    console.log('✅ Todas las noches están disponibles');
    
    navigate(`/reservar/${id}`, {
      state: {
        cabanaId: id,
        cabanaNombre: cabana.nombre,
        fechaInicio: selectedDates.start,
        fechaFin: selectedDates.end,
        precioTotal: precioCalculado.total,
        precioDesglose: precioCalculado.desglose,
        imagenPrincipal: cabana.imagenPrincipal
      }
    });
  };

  if (loading || loadingOccupiedDates) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="text-carga mt-2">Cargando información de la cabaña...</p>
      </div>
    );
  }

  if (error || !cabana) return (
    <Container className="my-5">
      <Alert variant="danger" className="text-center">
        <Alert.Heading>Error al cargar la cabaña</Alert.Heading>
        <p>{error}</p>
        <div className="mt-3">
          <Button 
            variant="primary" 
            onClick={() => navigate('/cabanas')}
            className="me-2"
            style={{
              backgroundColor: '#eaac25',
              borderColor: '#eaac25'
            }}
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

  return (
    <Container className="cabanas-detalle my-4">
      <Button 
        variant="outline-primary" 
        onClick={() => navigate(-1)} 
        className="mb-4"
        style={{  
          fontWeight: 300,
          lineHeight: '1.6',
          marginBottom: '1.5rem',
          backgroundColor: '#eaac25',
          borderColor: '#eaac25',
        }}
      >
        <FaArrowLeft className="me-2" /> Volver
      </Button>
      
      <h1 className="text-center mb-4" style={{ color: '#fff' }}>{cabana.nombre}</h1>
      
      <Row className="g-4">
        <Col lg={6}>
          <Card className="shadow-sm" style={{ backgroundColor: '#444', color: '#fff' }}>
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
              <Card.Footer className="p-3" style={{ backgroundColor: '#555' }}>
                <Row className="g-2">
                  {cabana.imagenes.map((img, index) => (
                    <Col xs={3} key={`thumb-${index}`}>
                      <img
                        src={img.url}
                        alt={`Miniatura ${index + 1}`}
                        className={`img-thumbnail cursor-pointer ${activeImgIndex === index ? 'border-warning border-2' : 'opacity-75'}`}
                        onClick={() => setActiveImgIndex(index)}
                        style={{ 
                          height: '80px', 
                          objectFit: 'cover', 
                          width: '100%',
                          backgroundColor: '#666'
                        }}
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
            
            <Card.Body>
              <Card.Text className="text-white" style={{ fontWeight: 300 }}>
                {cabana.descripcion}
              </Card.Text>
              
              {cabana.servicios?.length > 0 && (
                <div className="mt-4">
                  <h5 className="d-flex align-items-center mb-3" style={{ color: '#eaac25' }}>
                    <FaWifi className="me-2" />
                    Servicios incluidos
                  </h5>
                  <div className="d-flex flex-wrap gap-2">
                    {cabana.servicios.map((servicio, i) => {
                      const servicioInfo = SERVICIOS.find(s => s.nombre === servicio) || { nombre: servicio };
                      return (
                        <Badge 
                          key={`servicio-${i}`} 
                          pill 
                          style={{ 
                            backgroundColor: '#666',
                            color: '#fff',
                            border: '1px solid #888'
                          }} 
                          className="d-flex align-items-center"
                        >
                          {servicioInfo.icono && React.cloneElement(servicioInfo.icono, { 
                            className: 'me-1',
                            style: { color: '#eaac25' }
                          })}
                          {servicioInfo.nombre}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="shadow-sm h-100" style={{ backgroundColor: '#444', color: '#fff' }}>
            <Card.Body className="d-flex flex-column">
              <div className="mb-4">
                <h4 style={{ color: '#eaac25' }}>Detalles de la cabaña</h4>
                <Row className="g-3">
                  <Col md={6}>
                    <div className="d-flex align-items-center p-3 rounded h-100" style={{ backgroundColor: '#555' }}>
                      <FaUsers className="text-warning me-3 fs-4" />
                      <div>
                        <small className="text-muted">Capacidad</small>
                        <div className="fs-5"><strong>{cabana.capacidad} personas</strong></div>
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="d-flex align-items-center p-3 rounded h-100" style={{ backgroundColor: '#555' }}>
                      <FaMoneyBillWave className="text-success me-3 fs-4" />
                      <div>
                        <small className="text-muted">Precio por noche desde</small>
                        <div className="fs-5">
                          <strong style={{ color: '#eaac25' }}>
                            {formatearPrecioArgentino(cabana.precio || 0)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>

              <div className="mb-4">
                <h5 className="d-flex align-items-center mb-3" style={{ color: '#eaac25' }}>
                  <FaCalendarAlt className="me-2" />
                  Disponibilidad y Reserva
                </h5>
                
                <div className="mb-3">
                  <CalendarFull 
                    cabanaId={id}
                    onDatesSelected={(start, end) => {
                      console.log('📅 Fechas seleccionadas en calendario:', {
                        start: start ? new Date(start).toISOString().split('T')[0] : null,
                        end: end ? new Date(end).toISOString().split('T')[0] : null
                      });
                      
                      if (start && end) {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        
                        if (start < today) {
                          setError('No puedes seleccionar fechas pasadas');
                          return;
                        }
                        
                        if (start >= end) {
                          setError('La fecha de fin debe ser posterior al inicio');
                          return;
                        }
                        
                        setSelectedDates({ start, end });
                        setError('');
                      }
                    }}
                    precioPorNoche={cabana?.precio || 0}
                    showTotal={false}
                  />
                </div>
                
                <div className="calendar-legend mt-3">
                  <div className="legend-item">
                    <div className="legend-color legend-occupied"></div>
                    <span>Días reservados</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color legend-selected"></div>
                    <span>Días seleccionados</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color legend-today"></div>
                    <span>Hoy</span>
                  </div>
                </div>

                {selectedDates.start && selectedDates.end && (
                  <Alert variant="info" className="mt-3" style={{ backgroundColor: '#555', borderColor: '#666' }}>
                    {calculandoPrecio ? (
                      <div className="text-center">
                        <Spinner size="sm" animation="border" className="me-2" style={{ color: '#eaac25' }} />
                        <span className="text-white">Calculando precio...</span>
                      </div>
                    ) : (
                      <>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-white">Desde:</span>
                          <span className="text-white">
                            {new Date(selectedDates.start).toLocaleDateString('es-ES', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-white">Hasta:</span>
                          <span className="text-white">
                            {new Date(selectedDates.end).toLocaleDateString('es-ES', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <hr className="my-2" style={{ borderColor: '#666' }} />
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-white">Estadía:</span>
                          <span className="text-white">{noches} noche{noches !== 1 ? 's' : ''}</span>
                        </div>
                        {precioCalculado.desgloseAgrupado && precioCalculado.desgloseAgrupado.length > 0 && (
                          <div className="small mb-2">
                            {precioCalculado.desgloseAgrupado.map((agrupado, index) => (
                              <div key={index} className="text-white d-flex justify-content-between">
                                <span>{agrupado.cantidad} {agrupado.tipo === 'semana' ? 'días semana' : agrupado.tipo === 'fin de semana' ? 'fines de semana' : 'feriados'}</span>
                                <span>{formatearPrecioArgentino(agrupado.subtotal)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="d-flex justify-content-between fw-bold mt-2 pt-2 border-top" style={{ borderColor: '#666' }}>
                          <span className="text-white">Total:</span>
                          <span className="fs-5" style={{ color: '#eaac25' }}>{precioCalculado.precioFormateado}</span>
                        </div>
                      </>
                    )}
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
                  disabled={!selectedDates.start || !selectedDates.end || calculandoPrecio || precioCalculado.total <= 0}
                  style={{ 
                    fontSize: '1rem',
                    fontWeight: 300,
                    lineHeight: '1.6',
                    marginBottom: '1.5rem',
                    backgroundColor: '#eaac25',
                    borderColor: '#eaac25',
                    color: '#333'
                  }}
                >
                  {calculandoPrecio ? 'Calculando precio...' : 'Reservar ahora'}
                </Button>
                
                {occupiedDates.length > 0 && (
                  <div className="text-center mt-2">
                    <small className="text-muted">
                      {occupiedDates.length} noche{occupiedDates.length !== 1 ? 's' : ''} ocupada{occupiedDates.length !== 1 ? 's' : ''} en el calendario
                    </small>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
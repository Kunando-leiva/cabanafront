// import { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { Container, Row, Col, Card, Button, Spinner, Alert, Badge, Carousel } from 'react-bootstrap';
// import { 
//   FaArrowLeft, 
//   FaCalendarAlt, 
//   FaUsers, 
//   FaMoneyBillWave, 
//   FaWifi, 
//   FaSwimmingPool, 
//   FaSnowflake, 
//   FaParking, 
//   FaTv,
//   FaHome
// } from 'react-icons/fa';
// import axios from 'axios';
// import CalendarFull from '../../components/CalendarFull';

// export default function CabanaDetalle() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [cabana, setCabana] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [selectedDates, setSelectedDates] = useState({ 
//     start: null, 
//     end: null 
//   });
//   const [activeImgIndex, setActiveImgIndex] = useState(0);

//   // Mapeo de iconos para servicios
//   const servicioIcono = {
//     'Wifi': <FaWifi className="me-2" />,
//     'Piscina': <FaSwimmingPool className="me-2" />,
//     'Aire acondicionado': <FaSnowflake className="me-2" />,
//     'Estacionamiento': <FaParking className="me-2" />,
//     'TV': <FaTv className="me-2" />,
//   };

//   useEffect(() => {
//     const fetchCabana = async () => {
//       try {
//         const response = await axios.get(`http://localhost:5000/api/cabanas/${id}`);
//         // Asegurar URLs completas para las imágenes
//         const cabanaData = {
//           ...response.data,
//           imagenes: response.data.imagenes?.map(img => 
//             img.startsWith('http') ? img : `${window.location.origin}/uploads/${img}`
//           ) || []
//         };
//         setCabana(cabanaData);
//       } catch (err) {
//         setError('No se pudo cargar la información de la cabaña');
//         console.error('Error:', err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCabana();
//   }, [id]);

//   const handleReservar = () => {
//     if (!selectedDates.start || !selectedDates.end) {
//       setError('Selecciona un rango de fechas válido');
//       return;
//     }
//     navigate(`/reservar/${id}`, {
//       state: {
//         cabanaId: id,
//         cabanaNombre: cabana.nombre,
//         fechaInicio: selectedDates.start,
//         fechaFin: selectedDates.end,
//         precioTotal: calcularPrecioTotal()
//       }
//     });
//   };

//   const calcularPrecioTotal = () => {
//     if (!selectedDates.start || !selectedDates.end || !cabana) return 0;
//     const diffTime = Math.abs(selectedDates.end - selectedDates.start);
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//     return diffDays * cabana.precio;
//   };

//   if (loading) {
//     return (
//       <Container className="text-center my-5 py-5">
//         <Spinner animation="border" variant="primary" />
//         <p className="mt-3">Cargando información de la cabaña...</p>
//       </Container>
//     );
//   }

//   if (error || !cabana) {
//     return (
//       <Container className="my-5">
//         <Alert variant="danger" className="text-center">
//           {error || 'La cabaña no existe o no está disponible'}
//           <div className="mt-3">
//             <Button variant="primary" onClick={() => navigate('/cabanas')}>
//               <FaHome className="me-2" />
//               Ver todas las cabañas
//             </Button>
//           </div>
//         </Alert>
//       </Container>
//     );
//   }

//   return (
//     <Container className="my-4">
//       <Button 
//         variant="outline-primary" 
//         onClick={() => navigate(-1)}
//         className="mb-4 d-flex align-items-center"
//       >
//         <FaArrowLeft className="me-2" />
//         Volver al listado
//       </Button>

//       <Row className="g-4">
//         {/* Sección de Galería de Imágenes */}
//         <Col lg={6}>
//           <Card className="shadow-sm h-100">
//             {cabana.imagenes?.length > 0 ? (
//               <>
//                 <Carousel 
//                   activeIndex={activeImgIndex}
//                   onSelect={setActiveImgIndex}
//                   interval={null}
//                   indicators={cabana.imagenes.length > 1}
//                   controls={cabana.imagenes.length > 1}
//                 >
//                   {cabana.imagenes.map((img, index) => (
//                     <Carousel.Item key={index}>
//                       <div 
//                         className="ratio ratio-16x9"
//                         style={{ backgroundColor: '#f8f9fa' }}
//                       >
//                         <img
//                           src={img}
//                           alt={`Vista ${index + 1} de ${cabana.nombre}`}
//                           className="d-block w-100 img-fluid"
//                           style={{ objectFit: 'contain' }}
//                           onError={(e) => {
//                             e.target.src = 'https://via.placeholder.com/800x450?text=Imagen+no+disponible';
//                             e.target.style.objectFit = 'cover';
//                           }}
//                         />
//                       </div>
//                     </Carousel.Item>
//                   ))}
//                 </Carousel>
//                 {cabana.imagenes.length > 1 && (
//                   <div className="p-3">
//                     <Row xs={4} className="g-2">
//                       {cabana.imagenes.map((img, index) => (
//                         <Col key={index}>
//                           <Button
//                             variant={activeImgIndex === index ? 'primary' : 'outline-secondary'}
//                             className="w-100 p-0 border-0"
//                             onClick={() => setActiveImgIndex(index)}
//                           >
//                             <img
//                               src={img}
//                               alt={`Miniatura ${index + 1}`}
//                               className="img-fluid"
//                               style={{
//                                 height: '60px',
//                                 width: '100%',
//                                 objectFit: 'cover'
//                               }}
//                             />
//                           </Button>
//                         </Col>
//                       ))}
//                     </Row>
//                   </div>
//                 )}
//               </>
//             ) : (
//               <div className="text-center p-5 bg-light">
//                 <img
//                   src="https://via.placeholder.com/800x450?text=Imagen+no+disponible"
//                   alt="Placeholder"
//                   className="img-fluid"
//                 />
//               </div>
//             )}
//           </Card>
//         </Col>

//         {/* Sección de Detalles y Calendario */}
//         <Col lg={6}>
//           <Card className="shadow-sm h-100">
//             <Card.Body>
//               <Card.Title as="h1" className="mb-3">{cabana.nombre}</Card.Title>
              
//               <Card.Text className="lead mb-4">
//                 {cabana.descripcion || 'Descripción no disponible'}
//               </Card.Text>

//               <Row className="mb-4 g-3">
//                 <Col md={6}>
//                   <div className="d-flex align-items-center bg-light p-3 rounded">
//                     <FaUsers className="text-primary me-3" size={24} />
//                     <div>
//                       <small className="text-muted d-block">Capacidad</small>
//                       <strong>{cabana.capacidad} personas</strong>
//                     </div>
//                   </div>
//                 </Col>
//                 <Col md={6}>
//                   <div className="d-flex align-items-center bg-light p-3 rounded">
//                     <FaMoneyBillWave className="text-success me-3" size={24} />
//                     <div>
//                       <small className="text-muted d-block">Precio por noche</small>
//                       <strong>${cabana.precio?.toLocaleString() || '0'}</strong>
//                     </div>
//                   </div>
//                 </Col>
//               </Row>

//               {cabana.servicios?.length > 0 && (
//                 <div className="mb-4">
//                   <h5 className="d-flex align-items-center mb-3">
//                     <FaWifi className="me-2 text-primary" />
//                     Servicios incluidos
//                   </h5>
//                   <div className="d-flex flex-wrap gap-2">
//                     {cabana.servicios.map((servicio, index) => (
//                       <Badge 
//                         key={index} 
//                         pill 
//                         bg="light" 
//                         text="dark"
//                         className="d-flex align-items-center py-2 px-3 border"
//                       >
//                         {servicioIcono[servicio] || <FaWifi className="me-2" />}
//                         {servicio}
//                       </Badge>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               <div className="mb-4">
//                 <h5 className="d-flex align-items-center mb-3">
//                   <FaCalendarAlt className="me-2 text-primary" />
//                   Disponibilidad
//                 </h5>
//                 <div className="mb-3">
//                   <CalendarFull 
//                     onSelectDates={(start, end) => {
//                       setSelectedDates({ start, end });
//                       setError('');
//                     }}
//                   />
//                 </div>
                
//                 {selectedDates.start && selectedDates.end && (
//                   <Alert variant="info" className="mt-3">
//                     <div className="d-flex justify-content-between">
//                       <span>
//                         <strong>Seleccionado:</strong> {selectedDates.start.toLocaleDateString()} 
//                         {' - '} 
//                         {selectedDates.end.toLocaleDateString()}
//                       </span>
//                       <span>
//                         <strong>Total:</strong> ${calcularPrecioTotal().toLocaleString()}
//                       </span>
//                     </div>
//                   </Alert>
//                 )}

//                 {error && <Alert variant="danger" className="mt-2">{error}</Alert>}
//               </div>

//               <Button 
//                 variant="primary" 
//                 size="lg" 
//                 className="w-100 py-3"
//                 onClick={handleReservar}
//                 disabled={!selectedDates.start || !selectedDates.end}
//               >
//                 Reservar ahora
//               </Button>
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>
//     </Container>
//   );
// }













import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Row, Col, Card, Button, Alert, Badge, Carousel 
} from 'react-bootstrap';
import { 
  FaArrowLeft, FaCalendarAlt, FaUsers, FaMoneyBillWave, 
  FaWifi, FaSwimmingPool, FaSnowflake, FaParking, FaTv, FaHome
} from 'react-icons/fa';
import axios from 'axios';
import CalendarFull from '../../components/CalendarFull';

export default function CabanaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cabana, setCabana] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDates, setSelectedDates] = useState({ start: null, end: null });
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  const calcularNoches = (start, end) => {
    if (!start || !end || start >= end) return 0;
    const diffTime = new Date(end) - new Date(start);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const calcularPrecioTotal = () => {
    const noches = calcularNoches(selectedDates.start, selectedDates.end);
    if (!cabana?.precio || noches <= 0) return '0.00';
    return (noches * cabana.precio).toFixed(2);
  };

  useEffect(() => {
    const fetchCabana = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/cabanas/${id}`);
        
        // Procesamiento de imágenes compatible con el backend
        const cabanaData = {
          ...response.data,
          imagenes: response.data.imagenes?.map(img => {
            // Si es solo el nombre del archivo (como se guarda en el backend)
            if (!img.startsWith('http')) {
              return `http://localhost:5000/uploads/${img}`;
            }
            return img;
          }) || []
        };
        
        setCabana(cabanaData);
      } catch (err) {
        console.error('Error cargando cabaña:', err);
        setError('No se pudo cargar la información de la cabaña');
      } finally {
        setLoading(false);
      }
    };
    fetchCabana();
  }, [id]);

  const handleReservar = () => {
    if (!selectedDates.start || !selectedDates.end) {
      setError('Selecciona un rango de fechas válido');
      return;
    }
    navigate(`/reservar/${id}`, {
      state: {
        cabanaId: id,
        cabanaNombre: cabana.nombre,
        fechaInicio: selectedDates.start,
        fechaFin: selectedDates.end,
        precioTotal: calcularPrecioTotal(),
        imagenPrincipal: cabana.imagenes?.[0] || ''
      }
    });
  };

  if (loading) return (
    <div className="text-center my-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Cargando...</span>
      </div>
      <p className="mt-2">Cargando información de la cabaña...</p>
    </div>
  );

  if (error || !cabana) return (
    <Alert variant="danger" className="text-center my-5">
      {error || 'La cabaña no existe'}
      <Button 
        variant="primary" 
        onClick={() => navigate('/cabanas')} 
        className="mt-3"
      >
        <FaHome className="me-2" /> Ver cabañas disponibles
      </Button>
    </Alert>
  );

  const noches = calcularNoches(selectedDates.start, selectedDates.end);
  const precioTotal = calcularPrecioTotal();

  return (
    <Container className="my-4">
      <Button variant="outline-primary" onClick={() => navigate(-1)} className="mb-4">
        <FaArrowLeft className="me-2" /> Volver
      </Button>

      <Row className="g-4">
        {/* Sección de Imágenes - Mejorado */}
        <Col lg={6}>
          <Card className="shadow-sm">
            {cabana.imagenes?.length > 0 ? (
              <>
                <Carousel activeIndex={activeImgIndex} onSelect={setActiveImgIndex}>
                  {cabana.imagenes.map((img, index) => (
                    <Carousel.Item key={`carousel-${index}`}>
                      <div className="ratio ratio-16x9">
                        <img
                          src={img}
                          alt={`Cabaña ${cabana.nombre} - Imagen ${index + 1}`}
                          className="img-fluid"
                          style={{ objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/placeholder-cabana.jpg';
                          }}
                        />
                      </div>
                    </Carousel.Item>
                  ))}
                </Carousel>
                
                {cabana.imagenes.length > 1 && (
                  <div className="p-3">
                    <Row>
                      {cabana.imagenes.map((img, index) => (
                        <Col xs={3} key={`thumb-${index}`}>
                          <img
                            src={img}
                            alt={`Miniatura ${index + 1}`}
                            className={`img-thumbnail cursor-pointer ${activeImgIndex === index ? 'border-primary' : ''}`}
                            onClick={() => setActiveImgIndex(index)}
                            style={{ 
                              height: '80px', 
                              objectFit: 'cover',
                              borderWidth: activeImgIndex === index ? '3px' : '1px'
                            }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/placeholder-thumb.jpg';
                            }}
                          />
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center p-5 bg-light">
                <img
                  src="/placeholder-cabana.jpg"
                  alt="Imagen no disponible"
                  className="img-fluid"
                  style={{ maxHeight: '400px' }}
                />
                <p className="text-muted mt-2">Esta cabaña no tiene imágenes</p>
              </div>
            )}
          </Card>
        </Col>

        {/* Sección de Detalles */}
        <Col lg={6}>
          <Card className="shadow-sm h-100">
            <Card.Body>
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
                      <div className="fs-5"><strong>${cabana.precio.toLocaleString()}</strong></div>
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
                    {cabana.servicios.map((servicio, i) => (
                      <Badge key={`servicio-${i}`} pill bg="light" text="dark" className="border">
                        {servicio}
                      </Badge>
                    ))}
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

              <Button
                variant="primary"
                size="lg"
                className="w-100 py-3 fw-bold"
                onClick={handleReservar}
                disabled={!selectedDates.start || !selectedDates.end}
              >
                Reservar ahora
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
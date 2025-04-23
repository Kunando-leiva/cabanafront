import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Card, Row, Col, Spinner, Alert } from 'react-bootstrap';
import PublicNavbar from '../../components/PublicNavbar';
import { FaWifi, FaSwimmingPool, FaSnowflake, FaUtensils, FaParking, FaTv } from 'react-icons/fa';

export default function CabanasPublico() {
  const [cabanas, setCabanas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCabanas = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/cabanas');
        setCabanas(response.data);
      } catch (error) {
        setError('Error al cargar las cabañas. Intenta nuevamente.');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCabanas();
  }, []);

  // Iconos para servicios (optimizado)
  const servicioIcono = {
    'Wifi': <FaWifi className="me-1" />,
    'Piscina': <FaSwimmingPool className="me-1" />,
    'Aire acondicionado': <FaSnowflake className="me-1" />,
    'Parqueadero': <FaParking className="me-1" />,
    'TV': <FaTv className="me-1" />,
    'Cocina': <FaUtensils className="me-1" />,
  };

  if (loading) return <Spinner animation="border" className="d-block mx-auto mt-5" />;
  if (error) return <Alert variant="danger" className="mt-4">{error}</Alert>;

  return (
    <div className="container py-5">
      <PublicNavbar />
      <h1 className="text-center mb-4">Nuestras Cabañass</h1>
      <Row xs={1} md={2} lg={3} className="g-4">
        {cabanas.map((cabana) => (
          <Col key={cabana._id}>
            <Card className="h-100 shadow-sm">
              {/* Manejo seguro de imágenes */}
              {cabana.imagenes?.[0] && (
                <Card.Img 
                  variant="top" 
                  src={cabana.imagenes[0].startsWith('http') 
                    ? cabana.imagenes[0] 
                    : `http://localhost:5000/uploads/${cabana.imagenes[0]}`
                  } 
                  style={{ height: '200px', objectFit: 'cover' }} 
                />
              )}
              <Card.Body>
                <Card.Title>{cabana.nombre}</Card.Title>
                <Card.Text>
                  <small className="text-muted">
                    Capacidad: {cabana.capacidad} personas<br />
                    Precio: ${cabana.precio} por noche
                  </small>
                </Card.Text>
                <div className="mb-3">
                  {cabana.servicios?.map((servicio, i) => (
                    <span key={i} className="badge bg-light text-dark me-1 mb-1">
                      {servicioIcono[servicio] || servicio} {/* Fallback si no hay ícono */}
                    </span>
                  ))}
                </div>
                {/* Botón de reserva mejorado */}
                <Link 
  to={`/cabanas/${cabana._id}`}  // Ruta que muestra el componente CabanaDetalle
  className="btn btn-primary w-100"
>
  Ver detalles y reservar
</Link>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
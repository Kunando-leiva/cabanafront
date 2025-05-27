import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import {
  FaSwimmingPool, FaUtensils, FaParking, FaBed,
  FaShower, FaUmbrellaBeach, FaTshirt, FaGlassWhiskey,
  FaWifi, FaFan, FaTv, FaCoffee, FaSnowflake
} from 'react-icons/fa';
import { BiFridge } from 'react-icons/bi';
import { GiElectric, GiBunkBeds,GiVolleyballBall,GiGreekTemple,GiKidSlide  } from 'react-icons/gi';
import { TbSoccerField} from "react-icons/tb";
import { FaToiletsPortable } from "react-icons/fa6";
import { PiParkFill, PiArmchairFill } from "react-icons/pi";
import { IoIosBonfire } from 'react-icons/io';
import { MdTableRestaurant, MdBalcony, MdKingBed } from "react-icons/md";
import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/PublicNavbar';
import Footer from '../../components/admin/Footer';
import './ServiciosPage.css' 


const ServiciosPage = () => {
    const COLORES = {
    marronClaro: '#333',
    }

 
  const SERVICIOS = [
    { nombre: 'Piscina', icono: <FaSwimmingPool />, categoria: 'Exterior', color: COLORES.marronClaro },
    { nombre: 'Parque amplio', icono: <PiParkFill />, categoria: 'Exterior', color: COLORES.marronClaro },
    { nombre: 'juegos de exterior', icono: <GiKidSlide />, categoria: 'Exterior', color: COLORES.marronClaro },
    { nombre: 'cancha de Futbol', icono: <TbSoccerField />, categoria: 'Exterior', color: COLORES.marronClaro },
    { nombre: 'cancha de Voley', icono: <GiVolleyballBall />, categoria: 'Exterior', color: COLORES.marronClaro },
    { nombre: 'Pérgola de madera', icono: <GiGreekTemple />, categoria: 'Exterior', color: COLORES.marronClaro },
    { nombre: 'Mesas', icono: <MdTableRestaurant />, categoria: 'Exterior', color: COLORES.marronClaro },
    { nombre: 'sillones', icono: <PiArmchairFill />, categoria: 'Exterior', color: COLORES.marronClaro },
    { nombre: 'Cocina equipada', icono: <FaUtensils />, categoria: 'Interior', color: COLORES.marronClaro },
    { nombre: 'Estacionamiento', icono: <FaParking />, categoria: 'Exterior', color: COLORES.marronClaro },
    { nombre: 'Ropa de cama', icono: <FaBed />, categoria: 'Habitación', color: COLORES.marronClaro },
    { nombre: 'Artículos de aseo', icono: <FaToiletsPortable />, categoria: 'Baño', color: COLORES.marronClaro },
    { nombre: 'Balcón o terraza', icono: <MdBalcony />, categoria: 'Exterior', color: COLORES.marronClaro },
    { nombre: 'Baños privados', icono: <FaShower />, categoria: 'Baño', color: COLORES.marronClaro },
    { nombre: 'Cama doble', icono: <MdKingBed />, categoria: 'Habitación', color: COLORES.marronClaro },
    { nombre: 'Heladera', icono: <BiFridge />, categoria: 'Cocina', color: COLORES.marronClaro },
    { nombre: 'Pava eléctrica', icono: <GiElectric />, categoria: 'Cocina', color: COLORES.marronClaro },
    { nombre: 'Toallones', icono: <FaTshirt />, categoria: 'Baño', color: COLORES.marronClaro },
    { nombre: 'Vajilla completa', icono: <FaGlassWhiskey />, categoria: 'Cocina', color: COLORES.marronClaro },
    { nombre: 'Wi-Fi premium', icono: <FaWifi />, categoria: 'Comodidades', color: COLORES.marronClaro },
    { nombre: 'Ventiladores', icono: <FaFan />, categoria: 'Habitación', color: COLORES.marronClaro },
    { nombre: 'TV Smart', icono: <FaTv />, categoria: 'Entretenimiento', color: COLORES.marronClaro },
    { nombre: 'Desayuno seco', icono: <FaCoffee />, categoria: 'Servicios', color: COLORES.marronClaro },
    { nombre: 'Fogón exterior', icono: <IoIosBonfire />, categoria: 'Exterior', color: COLORES.marronClaro },
    { nombre: 'Cama Litera', icono: <GiBunkBeds />, categoria: 'Habitación', color: COLORES.marronClaro },
  ];

  // Agrupar servicios por categoría
  const serviciosPorCategoria = SERVICIOS.reduce((acc, servicio) => {
    if (!acc[servicio.categoria]) {
      acc[servicio.categoria] = [];
    }
    acc[servicio.categoria].push(servicio);
    return acc;
  }, {});

  return (
    <div className="home-publico">
        <PublicNavbar />
      {/* Hero Section */}
      <section className="hero-section bg-dark text-white text-center py-5 position-relative">
        <Container className="position-relative z-index-1">
          <h1 className="display-4 fw-bold mb-4">Nuestros Servicios</h1>
          <p className="lead mb-4">Todo lo que necesitas para una estadía perfecta</p>
        </Container>
      </section>

      {/* Main Content */}
      <section className="py-5" style={{ backgroundColor: '#2a2722', color: 'white' }}>
        <Container>
          <h2 className="text-center mb-5" style={{ fontWeight: 300, letterSpacing: '1px' }}>
            Descubre todas nuestras comodidades
          </h2>

          {Object.entries(serviciosPorCategoria).map(([categoria, servicios]) => (
            <div key={categoria} className="mb-5">
              <h3 className="mb-4 pb-2" style={{ 
                borderBottom: '1px solid #444',
                fontWeight: 300,
                fontSize: '1.5rem'
              }}>
                {categoria}
              </h3>
              
              <Row xs={1} sm={2} md={3} lg={4} className="g-4">
                {servicios.map((servicio, index) => (
                  <Col key={index}>
                    <Card className="h-100 border-0 shadow-sm" 
                      style={{ 
                        backgroundColor: '#eaac25',
                        
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                      }}>
                      <Card.Body className="text-center p-4">
                        <div className="mb-3" style={{ fontSize: '2rem', color: servicio.color }}>
                          {servicio.icono}
                        </div>
                        <h5 style={{ 
                          fontWeight: 300,
                          fontSize: '1.1rem',
                          marginBottom: '0.5rem'
                        }}>
                          {servicio.nombre}
                        </h5>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          ))}

          <div className="text-center mt-5">
            <h3 className="mb-4" style={{ fontWeight: 300 }}>¿Necesitas algo especial?</h3>
            <p className="mb-4" style={{ fontWeight: 300 }}>
              Contáctanos para consultar sobre servicios adicionales o necesidades específicas.
            </p>
            <Button 
              as={Link} 
              to="/ubicacion" 
              variant="outline-light"
              style={{
                padding: '10px 25px',
                fontWeight: 300,
                letterSpacing: '1px',
                borderRadius: '0',
                textTransform: 'uppercase'
              }}
            >
              Contactar
            </Button>
          </div>
        </Container>
      </section>

     
      <Footer />

    </div>
  );
};

export default ServiciosPage;
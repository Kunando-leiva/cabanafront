import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Card, Alert, Button } from 'react-bootstrap';
import { FaWhatsapp, FaEnvelope, FaCheckCircle } from 'react-icons/fa';

export default function ConfirmacionReserva() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const mensajeWhatsapp = `Hola, quiero confirmar mi reserva:
  *Nombre:* ${state?.nombre}
  *DNI:* ${state?.dni}
  *Teléfono:* ${state?.telefono}
  *Dirección:* ${state?.direccion}
  *Ciudad:* ${state?.ciudad}
  *Cabaña:* ${state?.cabanaNombre}
  *Email:* ${state?.email}
  *Fechas:* ${new Date(state?.fechaInicio).toLocaleDateString()} al ${new Date(state?.fechaFin).toLocaleDateString()}
  *Total:* $${state?.total?.toLocaleString()}
  *check-in:* $${"12:00 PM"}
  *check-out:* $${"10:00 AM"}
  `

  const asuntoEmail = `Confirmación de Reserva - ${state?.cabanaNombre}`;
  const cuerpoEmail = `Detalles de mi reserva:
  Cabaña: ${state?.cabanaNombre}
  Fechas: ${new Date(state?.fechaInicio).toLocaleDateString()} al ${new Date(state?.fechaFin).toLocaleDateString()}
  Total: $${state?.total?.toLocaleString()}
  
  Mis datos:
  Nombre: ${state?.nombre}
  Email: ${state?.email}
  Teléfono: ${state?.telefono}
  DNI: ${state?.dni}
  Dirección: ${state?.direccion}
  Ciudad: ${state?.ciudad}
  
  
  Comentarios: ${state?.comentarios || 'Ninguno'}`;

  return (
    <Container className="my-5">
      <Card className="shadow text-center">
        <Card.Body>
          <FaCheckCircle size={48} className="text-success mb-3" />
          <h2>¡Tu solicitud de reserva esta generada!</h2>
          <p className="lead">Eleji el metodo por donde te queres comunicar con nosotros para finalizar: </p>
          
          <Alert variant="info" className="text-start text-center my-4">
            <h5>Detalles:</h5>
            <p><strong>Cabaña:</strong> {state?.cabanaNombre}</p>
            <p><strong>Fechas:</strong> {new Date(state?.fechaInicio).toLocaleDateString()} - {new Date(state?.fechaFin).toLocaleDateString()}</p>
            <p><strong>Total:</strong> ${state?.total?.toLocaleString()}</p>
            <p><strong>Nombre:</strong> {state?.nombre}</p>
            <p><strong>Email:</strong> {state?.email}</p>
            <p><strong>Teléfono:</strong> {state?.telefono}</p>
            <p><strong>DNI:</strong> {state?.dni}</p>
            <p><strong>check-in:</strong> {"12:00 PM"}</p>
            <p><strong>check-out:</strong> {"10:00 AM"}</p>
          </Alert>

          <div className="mb-4">
            
            <div className="d-flex justify-content-center gap-3 mt-3">
              <Button 
                variant="success" 
                size="lg"
                href={`https://wa.me/+5491164680413?text=${encodeURIComponent(mensajeWhatsapp)}`}
                target="_blank"
              >
                <FaWhatsapp className="me-2" /> WhatsApp
              </Button>
              <Button
                variant="primary"
                size="lg"
                href={`mailto:Nathanquarta427@gmail.com?subject=${encodeURIComponent(asuntoEmail)}&body=${encodeURIComponent(cuerpoEmail)}`}
              >
                <FaEnvelope className="me-2" /> Email
              </Button>
            </div>
          </div>

          <Button variant="outline-secondary" onClick={() => navigate('/')}>
            Volver al inicio
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
}
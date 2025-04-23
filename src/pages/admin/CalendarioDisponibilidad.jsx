// src/components/admin/CalendarioDisponibilidad.jsx
import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';

const locales = { 'es': require('date-fns/locale/es') };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export default function CalendarioDisponibilidad({ cabanaId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Obtener fechas ocupadas de la cabaña seleccionada
  useEffect(() => {
    if (!cabanaId) return;

    const fetchFechasOcupadas = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/reservas/ocupadas?cabanaId=${cabanaId}`);
        const fechasOcupadas = response.data.map((reserva) => ({
          title: 'Ocupado',
          start: new Date(reserva.fechaInicio),
          end: new Date(reserva.fechaFin),
          allDay: true,
          color: '#ff6b6b',
        }));
        setEvents(fechasOcupadas);
      } catch (err) {
        setError('Error al cargar fechas ocupadas');
      } finally {
        setLoading(false);
      }
    };

    fetchFechasOcupadas();
  }, [cabanaId]);

  // Estilos personalizados para eventos
  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: event.color,
      borderRadius: '4px',
      border: 'none',
    },
  });

  return (
    <div className="mt-4">
      <h4>Disponibilidad de Cabaña</h4>
      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500 }}
          eventPropGetter={eventStyleGetter}
          defaultView="month"
          messages={{
            today: 'Hoy',
            previous: 'Anterior',
            next: 'Siguiente',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
          }}
        />
      )}
    </div>
  );
}
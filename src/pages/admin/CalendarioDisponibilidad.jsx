// src/components/admin/CalendarioDisponibilidad.jsx - VERSIÓN CON react-calendar
import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import axios from 'axios';
import { API_URL } from '../../config';

export default function CalendarioDisponibilidad({ cabanaId }) {
  const [occupiedDates, setOccupiedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Obtener fechas ocupadas
  useEffect(() => {
    if (!cabanaId) {
      setLoading(false);
      return;
    }

    const fetchFechasOcupadas = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/reservas/ocupadas?cabanaId=${cabanaId}`, {
          timeout: 10000
        });
        
        if (response.data.success && Array.isArray(response.data.data)) {
          const occupiedSet = new Set();
          
          response.data.data.forEach((reserva) => {
            try {
              const startDate = new Date(reserva.fechaInicio);
              const endDate = new Date(reserva.fechaFin);
              
              if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return;
              
              const current = new Date(startDate);
              
              while (current < endDate) {
                const dateStr = current.toISOString().split('T')[0];
                occupiedSet.add(dateStr);
                current.setDate(current.getDate() + 1);
              }
            } catch (err) {
              console.warn('Error procesando reserva:', err);
            }
          });
          
          setOccupiedDates(Array.from(occupiedSet));
        }
      } catch (err) {
        console.error('Error cargando fechas ocupadas:', err);
        setError('Error al cargar la disponibilidad. Intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchFechasOcupadas();
  }, [cabanaId]);

  // Marcar fechas ocupadas
  const tileDisabled = ({ date, view }) => {
    if (view !== 'month') return false;
    
    const dateStr = date.toISOString().split('T')[0];
    return occupiedDates.includes(dateStr);
  };

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return '';
    
    const dateStr = date.toISOString().split('T')[0];
    if (occupiedDates.includes(dateStr)) {
      return 'occupied-date';
    }
    return '';
  };

  if (loading) {
    return (
      <div className="mt-4 p-4 border rounded">
        <h4 className="mb-3">Disponibilidad de Cabaña</h4>
        <div className="text-center py-4">
          <div className="spinner-border spinner-border-sm text-primary me-2"></div>
          Cargando disponibilidad...
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 border rounded">
      <h4 className="mb-3">Disponibilidad de Cabaña</h4>
      
      {error && (
        <div className="alert alert-warning alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}
      
      {!cabanaId ? (
        <div className="alert alert-info">
          Selecciona una cabaña para ver su disponibilidad
        </div>
      ) : (
        <>
          <div className="mb-3">
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              tileDisabled={tileDisabled}
              tileClassName={tileClassName}
              locale="es"
              minDetail="year"
              navigationLabel={({ date }) => (
                <span className="calendar-month-label">
                  {date.toLocaleString('es', { month: 'long' })} {date.getFullYear()}
                </span>
              )}
              formatShortWeekday={(locale, date) => 
                ['D', 'L', 'M', 'M', 'J', 'V', 'S'][date.getDay()]
              }
            />
          </div>
          
          <div className="mt-3">
            <div className="d-flex align-items-center mb-2">
              <div className="occupied-sample me-2" style={{
                width: '20px',
                height: '20px',
                backgroundColor: '#ff6b6b',
                borderRadius: '4px'
              }}></div>
              <span className="small">Fechas ocupadas</span>
            </div>
            
            {occupiedDates.length === 0 ? (
              <div className="alert alert-success mb-0">
                <strong>¡Disponible!</strong> No hay reservas para esta cabaña.
              </div>
            ) : (
              <div className="alert alert-info mb-0">
                <strong>{occupiedDates.length} días ocupados</strong> en el calendario.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
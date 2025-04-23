import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarFull.css';

const CalendarFull = ({ cabanaId, onDatesSelected, precioPorNoche }) => {
  const [dateRange, setDateRange] = useState([null, null]);
  const [occupiedRanges, setOccupiedRanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchOccupiedDates = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/reservas/ocupadas${cabanaId ? `?cabanaId=${cabanaId}` : ''}`
        );
        
        if (!response.ok) throw new Error('Error al obtener fechas ocupadas');
        
        const fechasOcupadas = await response.json();
        setOccupiedRanges(fechasOcupadas.map(date => new Date(date)));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOccupiedDates();
  }, [cabanaId]);

  const calcularTotal = (start, end) => {
    if (!start || !end || !precioPorNoche) return 0;
    
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos días
    return diffDays * precioPorNoche;
  };

  const handleDateChange = (newDateRange) => {
    const [start, end] = newDateRange;
    
    // Validaciones
    if (start && end) {
      if (start > end) {
        setError('La fecha de fin debe ser posterior a la de inicio');
        return;
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (start < today) {
        setError('No puedes seleccionar fechas pasadas');
        return;
      }
      
      // Verificar disponibilidad
      const isOccupied = occupiedRanges.some(occupiedDate => {
        const selectedStart = start;
        const selectedEnd = end;
        return (
          (selectedStart <= occupiedDate && occupiedDate <= selectedEnd)
        );
      });
      
      if (isOccupied) {
        setError('Algunas fechas seleccionadas están ocupadas');
        return;
      }
      
      setError(null);
      const calculatedTotal = calcularTotal(start, end);
      setTotal(calculatedTotal);
      
      // Notificar al componente padre
      if (onDatesSelected) {
        onDatesSelected(start, end, calculatedTotal);
      }
    }
    
    setDateRange(newDateRange);
  };

  const tileDisabled = ({ date, view }) => {
    if (view !== 'month') return false;
    
    return occupiedRanges.some(occupiedDate => {
      return (
        date.getFullYear() === occupiedDate.getFullYear() &&
        date.getMonth() === occupiedDate.getMonth() &&
        date.getDate() === occupiedDate.getDate()
      );
    });
  };

  if (loading) return <div className="loading-text">Cargando fechas...</div>;

  return (
    <div className="calendar-container">
      <Calendar
        onChange={handleDateChange}
        value={dateRange}
        selectRange={true}
        tileDisabled={tileDisabled}
        tileClassName={({ date, view }) => 
          view === 'month' && tileDisabled({ date, view }) 
            ? 'occupied-date' 
            : null
        }
        minDate={new Date()}
        maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)}
        locale="es-ES"
      />
      
      
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
};

export default CalendarFull;
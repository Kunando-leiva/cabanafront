import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarFull.css';
import axios from 'axios';
import { Spinner, Alert, Badge } from 'react-bootstrap';
import { FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { API_URL } from '../config';

const CalendarFull = ({ 
  cabanaId, 
  onDatesSelected, 
  precioPorNoche,
  showInline = false,
  showTotal = true
}) => {
  const [dateRange, setDateRange] = useState([null, null]);
  const [occupiedRanges, setOccupiedRanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchOccupiedDates = async () => {
  try {
    setLoading(true);
    
    const response = await axios.get(
      `${API_URL}/api/reservas/ocupadas${cabanaId ? `?cabanaId=${cabanaId}` : ''}`
    );

    if (response.data.success) {
      setOccupiedRanges(
        response.data.data
          .map(dateStr => new Date(dateStr))
          .filter(date => !isNaN(date.getTime()))
      );
    }
  } catch (err) {
    console.error('Error al obtener fechas ocupadas:', err);
  } finally {
    setLoading(false);
  }
};


    fetchOccupiedDates();
  }, [cabanaId]);

  const calcularTotal = (start, end) => {
    if (!start || !end || !precioPorNoche) return 0;
    
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays * precioPorNoche;
  };

  const handleDateChange = (newDateRange) => {
    const [start, end] = newDateRange;
    setError(null);
    setSuccess(null);
    
    if (start && end) {
      // Validaciones mejoradas
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (start > end) {
        setError('La fecha de fin debe ser posterior a la de inicio');
        return;
      }
      
      if (start < today) {
        setError('No puedes seleccionar fechas pasadas');
        return;
      }
      
      // Verificación de disponibilidad más precisa
      const isOccupied = occupiedRanges.some(occupiedDate => {
        const occupiedTime = occupiedDate.getTime();
        return (
          (start.getTime() <= occupiedTime && occupiedTime <= end.getTime())
        );
      });
      
      if (isOccupied) {
        setError('Las fechas seleccionadas incluyen periodos ocupados');
        return;
      }
      
      // Calcular total y notificar
      const calculatedTotal = calcularTotal(start, end);
      setTotal(calculatedTotal);
      setSuccess('Fechas disponibles para reserva');
      
      if (onDatesSelected) {
        // Asegurar que las fechas sean inicio/fin de día
        const startDate = new Date(start);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        
        onDatesSelected(startDate, endDate, calculatedTotal);
      }
    }
    
  setDateRange([...newDateRange]);
  };

  

  const tileDisabled = ({ date, view }) => {
    if (view !== 'month') return false;
    
    return occupiedRanges.some(occupiedDate => {
      return date.getTime() === occupiedDate.setHours(0, 0, 0, 0);
    });
  };

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return null;
    
    const classes = [];
    const dateTime = date.getTime();
    
    // Marcar fechas ocupadas
    if (occupiedRanges.some(d => d.setHours(0, 0, 0, 0) === dateTime)) {
      classes.push('occupied-date');
    }
    
    // Marcar rango seleccionado
    if (dateRange[0] && dateRange[1]) {
      const startTime = dateRange[0].getTime();
      const endTime = dateRange[1].getTime();
      
      if (dateTime === startTime) classes.push('selected-range-start');
      if (dateTime === endTime) classes.push('selected-range-end');
      if (dateTime > startTime && dateTime < endTime) classes.push('selected-range-middle');
    }
    
    return classes.join(' ');
  };

  if (loading) {
    return (
      <div className="text-center my-3">
        <Spinner animation="border" size="sm" />
        <p>Cargando calendario...</p>
      </div>
    );
  }

  return (
    <div className={`calendar-container ${showInline ? 'inline-calendar' : ''}`}>
      <Calendar
        onChange={handleDateChange}
        value={dateRange}
        selectRange={true}
        tileDisabled={tileDisabled}
        tileClassName={tileClassName}
        minDate={new Date()}
        maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)} // 1 año en el futuro
        locale="es"
        prev2Label={null}
        next2Label={null}
        navigationLabel={({ date }) => (
          <span>
            {date.toLocaleString('es', { month: 'long' })} {date.getFullYear()}
          </span>
        )}
      />
      
      {/* Mensajes de estado */}
      <div className="calendar-messages mt-3">
        {error && (
          <Alert variant="danger" className="d-flex align-items-center py-2">
            <FaExclamationTriangle className="me-2" />
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" className="d-flex align-items-center py-2">
            <FaCheckCircle className="me-2" />
            {success}
          </Alert>
        )}
      </div>
      
      {/* Mostrar total si corresponde */}
      {showTotal && total > 0 && (
        <div className="total-container mt-3 p-3 bg-light rounded">
          <h5 className="text-center">
            <Badge bg="primary">
              Total estimado: ${total.toFixed(2)}
            </Badge>
          </h5>
          <p className="text-center text-muted small mt-1">
            ({Math.ceil(total/precioPorNoche)} noches)
          </p>
        </div>
      )}
    </div>
  );
};

export default CalendarFull;
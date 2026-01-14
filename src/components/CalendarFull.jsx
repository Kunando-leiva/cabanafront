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
  const [occupiedDates, setOccupiedDates] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [success, setSuccess] = useState(null);

  // Función para normalizar fecha (sin horas)
  const normalizeDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Función para convertir a string de fecha (YYYY-MM-DD)
  const dateToYMD = (date) => {
    const d = normalizeDate(date);
    return d.toISOString().split('T')[0];
  };

  useEffect(() => {
    const fetchOccupiedDates = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Fetching occupied dates for cabanaId:', cabanaId);
        
        const url = `${API_URL}/api/reservas/ocupadas${cabanaId ? `?cabanaId=${cabanaId}` : ''}`;
        
        const response = await axios.get(url);
        
        if (response.data.success && response.data.data) {
          const occupiedSet = new Set();
          
          response.data.data.forEach((range) => {
            try {
              const startDate = new Date(range.fechaInicio);
              const endDate = new Date(range.fechaFin);
              
              if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                console.warn('Fecha inválida en rango:', range);
                return;
              }
              
              const start = normalizeDate(startDate);
              const end = normalizeDate(endDate);
              
              const current = new Date(start);
              
              // IMPORTANTE: La fecha de fin es el día de CHECKOUT
              // NO se debe incluir en las fechas ocupadas
              // Solo ocupamos desde start hasta end-1 día
              while (current < end) {
                const dateStr = dateToYMD(current);
                occupiedSet.add(dateStr);
                current.setDate(current.getDate() + 1);
              }
              
            } catch (err) {
              console.error('Error procesando rango:', err);
            }
          });
          
          console.log('Fechas ocupadas:', Array.from(occupiedSet).sort());
          setOccupiedDates(occupiedSet);
          
        } else {
          console.warn('Respuesta sin datos:', response.data);
          setOccupiedDates(new Set());
        }
      } catch (err) {
        console.error('Error al obtener fechas ocupadas:', err);
        setError('Error al cargar las fechas ocupadas');
        setOccupiedDates(new Set());
      } finally {
        setLoading(false);
      }
    };

    fetchOccupiedDates();
  }, [cabanaId]);

  const calcularTotal = (start, end) => {
    if (!start || !end || !precioPorNoche || precioPorNoche <= 0) return 0;
    
    const startDate = normalizeDate(start);
    const endDate = normalizeDate(end);
    
    if (startDate >= endDate) return 0;
    
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays * precioPorNoche;
  };

  const handleDateChange = (newDateRange) => {
    const [start, end] = newDateRange;
    setError(null);
    setSuccess(null);
    setDateRange(newDateRange);
    
    if (!start || !end) return;
    
    // Validaciones
    const today = normalizeDate(new Date());
    const startDate = normalizeDate(start);
    const endDate = normalizeDate(end);
    
    if (startDate >= endDate) {
      setError('La fecha de fin debe ser posterior a la de inicio');
      return;
    }
    
    if (startDate < today) {
      setError('No puedes seleccionar fechas pasadas');
      return;
    }
    
    // Verificar disponibilidad
    let hasConflict = false;
    const current = new Date(startDate);
    
    while (current < endDate) {
      if (occupiedDates.has(dateToYMD(current))) {
        hasConflict = true;
        break;
      }
      current.setDate(current.getDate() + 1);
    }
    
    if (hasConflict) {
      setError('Las fechas seleccionadas incluyen días ocupados');
      return;
    }
    
    // Calcular total
    const calculatedTotal = calcularTotal(startDate, endDate);
    setTotal(calculatedTotal);
    setSuccess('Fechas disponibles para reserva');
    
    if (onDatesSelected) {
      onDatesSelected(startDate, endDate, calculatedTotal);
    }
  };

  const tileDisabled = ({ date, view }) => {
    if (view !== 'month') return false;
    
    // Deshabilitar fechas pasadas
    const today = normalizeDate(new Date());
    const currentDate = normalizeDate(date);
    if (currentDate < today) return true;
    
    // Deshabilitar fechas ocupadas
    return occupiedDates.has(dateToYMD(date));
  };

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return null;
    
    const classes = [];
    const currentDate = normalizeDate(date);
    
    // Marcar fechas ocupadas
    if (occupiedDates.has(dateToYMD(date))) {
      classes.push('occupied-date');
    }
    
    // Marcar rango seleccionado
    if (dateRange[0] && dateRange[1]) {
      const start = normalizeDate(dateRange[0]);
      const end = normalizeDate(dateRange[1]);
      
      if (currentDate.getTime() === start.getTime()) {
        classes.push('selected-range-start');
      } else if (currentDate.getTime() === end.getTime()) {
        classes.push('selected-range-end');
      } else if (currentDate > start && currentDate < end) {
        classes.push('selected-range-middle');
      }
    }
    
    return classes.join(' ');
  };

  // Calcular noches para mostrar
  const noches = dateRange[0] && dateRange[1] 
    ? Math.ceil(Math.abs(dateRange[1] - dateRange[0]) / (1000 * 60 * 60 * 24))
    : 0;

  if (loading) {
    return (
      <div className="text-center my-3">
        <Spinner animation="border" size="sm" />
        <p>Cargando disponibilidad...</p>
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
        maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)}
        locale="es"
        prev2Label={null}
        next2Label={null}
        navigationLabel={({ date }) => (
          <span>
            {date.toLocaleString('es', { month: 'long' })} {date.getFullYear()}
          </span>
        )}
      />
      
      <div className="calendar-messages mt-3">
        {error && (
          <Alert variant="danger" className="d-flex align-items-center py-2">
            <FaExclamationTriangle className="me-2" />
            <small>{error}</small>
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" className="d-flex align-items-center py-2">
            <FaCheckCircle className="me-2" />
            <small>{success}</small>
          </Alert>
        )}
      </div>
      
      {showTotal && total > 0 && precioPorNoche > 0 && (
        <div className="total-container mt-3 p-3 bg-light rounded">
          <h5 className="text-center mb-2">
            <Badge bg="primary" className="px-3 py-2">
              Total estimado: ${total.toFixed(2)}
            </Badge>
          </h5>
          <p className="text-center text-muted small mb-0">
            {noches} {noches === 1 ? 'noche' : 'noches'} × ${precioPorNoche.toFixed(2)} por noche
          </p>
        </div>
      )}
    </div>
  );
};

export default CalendarFull;
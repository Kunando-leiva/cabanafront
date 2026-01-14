import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const [occupiedDates, setOccupiedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [success, setSuccess] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const calendarContainerRef = useRef(null);
  
  // Usar useCallback para funciones estables
  const normalizeDate = useCallback((date) => {
    if (!date) return null;
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const dateToYMD = useCallback((date) => {
    const d = normalizeDate(date);
    if (!d) return '';
    return d.toISOString().split('T')[0];
  }, [normalizeDate]);

  // Función memoizada para calcular total
  const calcularTotal = useCallback((start, end) => {
    if (!start || !end || !precioPorNoche || precioPorNoche <= 0) return 0;
    
    const startDate = normalizeDate(start);
    const endDate = normalizeDate(end);
    
    if (!startDate || !endDate || startDate >= endDate) return 0;
    
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays * precioPorNoche;
  }, [precioPorNoche, normalizeDate]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchOccupiedDates = async () => {
      if (!isMounted) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const url = `${API_URL}/api/reservas/ocupadas${cabanaId ? `?cabanaId=${cabanaId}` : ''}`;
        console.log('Fetching from:', url);
        
        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!isMounted) return;
        
        if (response.data.success && Array.isArray(response.data.data)) {
          const occupiedSet = new Set();
          
          response.data.data.forEach((range) => {
            try {
              const startDate = normalizeDate(range.fechaInicio);
              const endDate = normalizeDate(range.fechaFin);
              
              if (!startDate || !endDate || startDate >= endDate) return;
              
              const current = new Date(startDate);
              
              // Excluir el día de checkout
              while (current < endDate) {
                const dateStr = dateToYMD(current);
                occupiedSet.add(dateStr);
                current.setDate(current.getDate() + 1);
              }
            } catch (err) {
              console.warn('Error procesando rango:', err);
            }
          });
          
          setOccupiedDates(Array.from(occupiedSet));
        } else {
          setOccupiedDates([]);
        }
        
        if (isMounted) {
          setIsInitialized(true);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error al obtener fechas ocupadas:', err);
        setError('Error al cargar disponibilidad');
        setOccupiedDates([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOccupiedDates();
    
    return () => {
      isMounted = false;
    };
  }, [cabanaId, normalizeDate, dateToYMD]);

  const handleDateChange = useCallback((newDateRange) => {
    const [start, end] = newDateRange;
    
    // Limpiar estados previos
    setError(null);
    setSuccess(null);
    setDateRange(newDateRange);
    
    if (!start || !end) {
      setTotal(0);
      if (onDatesSelected) onDatesSelected(null, null, 0);
      return;
    }
    
    // Validaciones
    const today = normalizeDate(new Date());
    const startDate = normalizeDate(start);
    const endDate = normalizeDate(end);
    
    if (!startDate || !endDate) {
      setError('Fechas inválidas');
      return;
    }
    
    if (startDate >= endDate) {
      setError('La fecha de fin debe ser posterior a la de inicio');
      return;
    }
    
    if (startDate < today) {
      setError('No puedes seleccionar fechas pasadas');
      return;
    }
    
    // Verificar disponibilidad usando Set para mejor performance
    const occupiedSet = new Set(occupiedDates);
    const current = new Date(startDate);
    let hasConflict = false;
    
    while (current < endDate) {
      if (occupiedSet.has(dateToYMD(current))) {
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
  }, [occupiedDates, onDatesSelected, normalizeDate, dateToYMD, calcularTotal]);

  // Usar useMemo para funciones que no cambien frecuentemente
  const tileDisabled = useCallback(({ date, view }) => {
    if (view !== 'month') return false;
    
    const today = normalizeDate(new Date());
    const currentDate = normalizeDate(date);
    
    if (currentDate < today) return true;
    
    return occupiedDates.includes(dateToYMD(date));
  }, [occupiedDates, normalizeDate, dateToYMD]);

  const tileClassName = useCallback(({ date, view }) => {
    if (view !== 'month') return '';
    
    const classes = [];
    const currentDate = normalizeDate(date);
    const dateStr = dateToYMD(date);
    
    if (occupiedDates.includes(dateStr)) {
      classes.push('occupied-date');
    }
    
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
  }, [occupiedDates, dateRange, normalizeDate, dateToYMD]);

  const noches = React.useMemo(() => {
    if (!dateRange[0] || !dateRange[1]) return 0;
    
    const start = normalizeDate(dateRange[0]);
    const end = normalizeDate(dateRange[1]);
    
    if (!start || !end || start >= end) return 0;
    
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [dateRange, normalizeDate]);

  if (loading) {
    return (
      <div className="text-center my-3" ref={calendarContainerRef}>
        <Spinner animation="border" size="sm" />
        <p className="mt-2">Cargando disponibilidad...</p>
      </div>
    );
  }

  return (
    <div 
      ref={calendarContainerRef}
      className={`calendar-container ${showInline ? 'inline-calendar' : ''}`}
      key={`calendar-container-${cabanaId}-${isInitialized}`}
    >
      <Calendar
        key={`calendar-${cabanaId}-${occupiedDates.length}`}
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
      
      <div className="calendar-messages mt-3">
        {error && (
          <Alert 
            variant="danger" 
            className="d-flex align-items-center py-2"
            onClose={() => setError(null)} 
            dismissible
          >
            <FaExclamationTriangle className="me-2 flex-shrink-0" />
            <small className="flex-grow-1">{error}</small>
          </Alert>
        )}
        
        {success && (
          <Alert 
            variant="success" 
            className="d-flex align-items-center py-2"
            onClose={() => setSuccess(null)} 
            dismissible
          >
            <FaCheckCircle className="me-2 flex-shrink-0" />
            <small className="flex-grow-1">{success}</small>
          </Alert>
        )}
      </div>
      
      {showTotal && total > 0 && precioPorNoche > 0 && (
        <div className="total-container mt-3 p-3 bg-light rounded">
          <h5 className="text-center mb-2">
            <Badge bg="primary" className="px-3 py-2">
              Total estimado: ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Badge>
          </h5>
          <p className="text-center text-muted small mb-0">
            {noches} {noches === 1 ? 'noche' : 'noches'} × 
            ${precioPorNoche.toLocaleString('es-AR', { minimumFractionDigits: 2 })} por noche
          </p>
          {noches > 1 && (
            <p className="text-center text-muted small mt-1">
              (${precioPorNoche.toLocaleString('es-AR')} × {noches} noches)
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Memoizar el componente para evitar re-renders innecesarios
export default React.memo(CalendarFull);
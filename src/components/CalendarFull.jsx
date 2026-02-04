// src/components/CalendarFull.jsx - VERSIÓN CORREGIDA CON LÓGICA HOTELERA
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarFull.css';
import { Spinner, Alert, Badge } from 'react-bootstrap';
import { FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { getOccupiedDates } from '../config';

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
  const [success, setSuccess] = useState(null);
  
  const isMounted = useRef(true);
  const calendarRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const normalizeDate = useCallback((date) => {
    if (!date) return null;
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return null;
      d.setHours(0, 0, 0, 0);
      return d;
    } catch {
      return null;
    }
  }, []);

  const dateToYMD = useCallback((date) => {
    const d = normalizeDate(date);
    return d ? d.toISOString().split('T')[0] : '';
  }, [normalizeDate]);

  // 🔥 NUEVA FUNCIÓN: Verificar disponibilidad con lógica hotelera
  const checkAvailabilityWithTimes = useCallback((startDate, endDate) => {
    try {
      console.log('🏨 Frontend: Verificando disponibilidad con lógica hotelera');
      
      const today = normalizeDate(new Date());
      const start = normalizeDate(startDate);
      const end = normalizeDate(endDate);
      
      if (!start || !end) {
        return { available: false, error: 'Fechas inválidas' };
      }
      
      if (start >= end) {
        return { available: false, error: 'La fecha de fin debe ser posterior a la de inicio' };
      }
      
      if (start < today) {
        return { available: false, error: 'No puedes seleccionar fechas pasadas' };
      }
      
      // Lógica hotelera: check-out 10:00 AM, check-in 12:00 PM
      // El backend NO incluye el día de check-out en occupiedDates
      const occupiedSet = new Set(occupiedDates);
      let hasConflict = false;
      let conflictedDate = null;
      
      // Solo verificar las noches que realmente estarán ocupadas
      const current = new Date(start);
      current.setHours(0, 0, 0, 0);
      
      while (current < end) {
        const dateStr = dateToYMD(current);
        
        // Si está en occupiedSet, realmente está ocupada (noche no disponible)
        if (occupiedSet.has(dateStr)) {
          hasConflict = true;
          conflictedDate = dateStr;
          console.log(`❌ Frontend: Conflicto real en ${dateStr}`);
          break;
        }
        
        console.log(`✅ Frontend: ${dateStr} disponible`);
        current.setDate(current.getDate() + 1);
      }
      
      if (hasConflict) {
        return { 
          available: false, 
          error: `El ${conflictedDate} ya está reservado` 
        };
      }
      
      return { available: true, error: null };
    } catch (err) {
      console.error('Error en checkAvailabilityWithTimes:', err);
      return { available: false, error: 'Error al verificar disponibilidad' };
    }
  }, [occupiedDates, normalizeDate, dateToYMD]);

  useEffect(() => {
    if (!isMounted.current) return;

    const fetchOccupiedDates = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`📅 CalendarFull: Obteniendo ocupadas para cabaña ${cabanaId || 'todas'}`);
        
        const occupiedData = await getOccupiedDates(cabanaId);
        
        if (!isMounted.current) return;
        
        if (Array.isArray(occupiedData)) {
          setOccupiedDates(occupiedData);
          console.log(`📊 CalendarFull: ${occupiedData.length} fechas ocupadas recibidas`);
          console.log('📅 Fechas ocupadas:', occupiedData);
        } else {
          console.warn('⚠️ CalendarFull: Formato de datos inesperado:', occupiedData);
          setOccupiedDates([]);
        }
        
      } catch (err) {
        if (!isMounted.current) return;
        
        console.error('❌ CalendarFull: Error al obtener fechas ocupadas:', err);
        setError('Error al cargar disponibilidad. Intenta nuevamente.');
        setOccupiedDates([]);
      } finally {
        if (isMounted.current) {
          timeoutRef.current = setTimeout(() => {
            if (isMounted.current) {
              setLoading(false);
              console.log('✅ CalendarFull: Carga completada');
            }
          }, 100);
        }
      }
    };

    fetchOccupiedDates();
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [cabanaId]);

  // 🔥 handleDateChange MODIFICADO
  const handleDateChange = useCallback((newDateRange) => {
    if (!isMounted.current) return;
    
    const [start, end] = newDateRange;
    
    console.log('📅 CalendarFull: Cambio de fechas', {
      start: start ? dateToYMD(start) : null,
      end: end ? dateToYMD(end) : null
    });
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setDateRange(newDateRange);
    setError(null);
    setSuccess(null);
    
    if (!start || !end) {
      if (onDatesSelected) onDatesSelected(null, null);
      return;
    }
    
    timeoutRef.current = setTimeout(() => {
      if (!isMounted.current) return;
      
      try {
        const result = checkAvailabilityWithTimes(start, end);
        
        if (!result.available) {
          setError(result.error);
          return;
        }
        
        console.log('✅ CalendarFull: Fechas válidas y disponibles');
        setSuccess('Fechas disponibles para reserva');
        
        if (onDatesSelected) {
          onDatesSelected(start, end);
        }
        
      } catch (err) {
        console.error('❌ CalendarFull: Error en handleDateChange:', err);
        setError('Error al procesar fechas');
      }
    }, 50);
  }, [checkAvailabilityWithTimes, onDatesSelected]);

  const tileDisabled = useMemo(() => {
    return ({ date, view }) => {
      if (view !== 'month') return false;
      
      try {
        const today = normalizeDate(new Date());
        const currentDate = normalizeDate(date);
        
        if (!currentDate || currentDate < today) {
          return true;
        }
        
        // Solo deshabilitar si realmente está ocupada
        const isOccupied = occupiedDates.includes(dateToYMD(date));
        return isOccupied;
      } catch {
        return false;
      }
    };
  }, [occupiedDates, normalizeDate, dateToYMD]);

  // Resto del código se mantiene igual...
  const tileClassName = useMemo(() => {
    return ({ date, view }) => {
      if (view !== 'month') return '';
      
      try {
        const classes = [];
        const currentDate = normalizeDate(date);
        const dateStr = dateToYMD(date);
        
        if (!currentDate) return '';
        
        if (occupiedDates.includes(dateStr)) {
          classes.push('occupied-date');
        }
        
        if (dateRange[0] && dateRange[1]) {
          const start = normalizeDate(dateRange[0]);
          const end = normalizeDate(dateRange[1]);
          
          if (start && end) {
            if (currentDate.getTime() === start.getTime()) {
              classes.push('selected-range-start');
            } else if (currentDate.getTime() === end.getTime()) {
              classes.push('selected-range-end');
            } else if (currentDate > start && currentDate < end) {
              classes.push('selected-range-middle');
            }
          }
        }
        
        return classes.join(' ');
      } catch {
        return '';
      }
    };
  }, [occupiedDates, dateRange, normalizeDate, dateToYMD]);

  const noches = useMemo(() => {
    if (!dateRange[0] || !dateRange[1]) return 0;
    
    try {
      const start = normalizeDate(dateRange[0]);
      const end = normalizeDate(dateRange[1]);
      
      if (!start || !end || start >= end) return 0;
      
      const diffTime = Math.abs(end - start);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  }, [dateRange, normalizeDate]);

  if (loading) {
    return (
      <div className="text-center my-3" style={{ minHeight: '350px' }}>
        <Spinner animation="border" size="sm" />
        <p className="mt-2">Cargando disponibilidad...</p>
      </div>
    );
  }

  return (
    <div 
      className={`calendar-container ${showInline ? 'inline-calendar' : ''}`}
      ref={calendarRef}
    >
      <Calendar
        key={`calendar-${cabanaId || 'public'}`}
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
        nextLabel="›"
        prevLabel="‹"
        minDetail="year"
        navigationLabel={({ date }) => (
          <span className="calendar-month-label">
            {date.toLocaleString('es', { month: 'long' })} {date.getFullYear()}
          </span>
        )}
        formatShortWeekday={(locale, date) => 
          ['D', 'L', 'M', 'M', 'J', 'V', 'S'][date.getDay()]
        }
        showNeighboringMonth={false}
        showFixedNumberOfWeeks={true}
        tileKey={({ date }) => date.toISOString()}
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
      
      {showTotal && dateRange[0] && dateRange[1] && (
        <div className="calendar-summary mt-3 p-3 bg-light rounded">
          <div className="d-flex justify-content-between">
            <span>Estadía:</span>
            <strong>{noches} noche{noches !== 1 ? 's' : ''}</strong>
          </div>
          {precioPorNoche && (
            <div className="d-flex justify-content-between mt-2">
              <span>Precio estimado:</span>
              <strong>${(precioPorNoche * noches).toLocaleString('es-AR')}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(CalendarFull);
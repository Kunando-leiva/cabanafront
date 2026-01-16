import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarFull.css';
import { Spinner, Alert, Badge } from 'react-bootstrap';
import { FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { getOccupiedDates } from '../config';

// Componente optimizado y seguro
const CalendarFull = ({ 
  cabanaId, 
  onDatesSelected, 
  precioPorNoche,
  showInline = false,
  showTotal = true
}) => {
  // Estados básicos
  const [dateRange, setDateRange] = useState([null, null]);
  const [occupiedDates, setOccupiedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Refs para control de montaje y timeout
  const isMounted = useRef(true);
  const calendarRef = useRef(null);
  const timeoutRef = useRef(null);

  // Efecto de montaje/desmontaje
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Función SEGURA para normalizar fechas
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

  // Función SEGURA para convertir a YMD
  const dateToYMD = useCallback((date) => {
    const d = normalizeDate(date);
    return d ? d.toISOString().split('T')[0] : '';
  }, [normalizeDate]);

  // Obtener fechas ocupadas - VERSIÓN SEGURA
  useEffect(() => {
    if (!isMounted.current) return;

    const fetchOccupiedDates = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const occupiedData = await getOccupiedDates(cabanaId);
        
        if (!isMounted.current) return;
        
        if (Array.isArray(occupiedData)) {
          const occupiedSet = new Set();
          
          occupiedData.forEach((item) => {
            try {
              let startDate, endDate;
              
              // Manejar diferentes formatos del backend
              if (item && typeof item === 'object') {
                if (item.fechaInicio && item.fechaFin) {
                  startDate = normalizeDate(item.fechaInicio);
                  endDate = normalizeDate(item.fechaFin);
                } else if (item.start && item.end) {
                  startDate = normalizeDate(item.start);
                  endDate = normalizeDate(item.end);
                }
              }
              
              if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                const current = new Date(startDate);
                const end = new Date(endDate);
                
                while (current <= end) {
                  const dateStr = dateToYMD(current);
                  occupiedSet.add(dateStr);
                  current.setDate(current.getDate() + 1);
                }
              }
            } catch (err) {
              console.warn('Error procesando fecha ocupada:', err);
            }
          });
          
          setOccupiedDates(Array.from(occupiedSet));
        }
        
      } catch (err) {
        if (!isMounted.current) return;
        
        console.error('Error al obtener fechas ocupadas:', err);
        setError('Error al cargar disponibilidad. Intenta nuevamente.');
        setOccupiedDates([]);
      } finally {
        if (isMounted.current) {
          // Delay para asegurar que React ha terminado de renderizar
          timeoutRef.current = setTimeout(() => {
            if (isMounted.current) {
              setLoading(false);
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
  }, [cabanaId, normalizeDate, dateToYMD]);

  // Handler de fechas - VERSIÓN SEGURA (sin re-renderizaciones)
  const handleDateChange = useCallback((newDateRange) => {
    if (!isMounted.current) return;
    
    const [start, end] = newDateRange;
    
    // Limpiar timeout previo
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Actualizar estado inmediato
    setDateRange(newDateRange);
    setError(null);
    setSuccess(null);
    
    if (!start || !end) {
      if (onDatesSelected) onDatesSelected(null, null);
      return;
    }
    
    // Usar timeout para separar el cálculo del render
    timeoutRef.current = setTimeout(() => {
      if (!isMounted.current) return;
      
      try {
        const today = normalizeDate(new Date());
        const startDate = normalizeDate(start);
        const endDate = normalizeDate(end);
        
        // Validaciones
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
        
        // Verificar disponibilidad de forma segura
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
        
        setSuccess('Fechas disponibles para reserva');
        
        // Llamar callback después de validar
        if (onDatesSelected) {
          onDatesSelected(startDate, endDate);
        }
        
      } catch (err) {
        console.error('Error en handleDateChange:', err);
        setError('Error al procesar fechas');
      }
    }, 50); // Pequeño delay
  }, [occupiedDates, onDatesSelected, normalizeDate, dateToYMD]);

  // Funciones de tile MEMOIZADAS y SEGURAS
  const tileDisabled = useMemo(() => {
    return ({ date, view }) => {
      if (view !== 'month') return false;
      
      try {
        const today = normalizeDate(new Date());
        const currentDate = normalizeDate(date);
        
        if (!currentDate || currentDate < today) return true;
        
        return occupiedDates.includes(dateToYMD(date));
      } catch {
        return false;
      }
    };
  }, [occupiedDates, normalizeDate, dateToYMD]);

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

  // Calcular noches de forma segura
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

  // Mostrar estado de carga
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
        // Propiedades críticas para evitar errores
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
    </div>
  );
};

// Exportar con memo pero sin comparación profunda
export default React.memo(CalendarFull, () => true);
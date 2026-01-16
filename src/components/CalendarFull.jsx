import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarFull.css';
import { Spinner, Alert, Badge } from 'react-bootstrap';
import { FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { API_URL, getOccupiedDates } from '../config';

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
  const [isCalculating, setIsCalculating] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  
  // Efecto de montaje/desmontaje
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Función optimizada para normalizar fechas
  const normalizeDate = useCallback((date) => {
    if (!date) return null;
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Función memoizada para convertir a string YMD
  const dateToYMD = useCallback((date) => {
    const d = normalizeDate(date);
    return d ? d.toISOString().split('T')[0] : '';
  }, [normalizeDate]);

  // Calcular total MEMOIZADO
  const calcularTotal = useCallback((start, end) => {
    if (!start || !end || !precioPorNoche || precioPorNoche <= 0) return 0;
    
    const startDate = normalizeDate(start);
    const endDate = normalizeDate(end);
    
    if (!startDate || !endDate || startDate >= endDate) return 0;
    
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays * precioPorNoche;
  }, [precioPorNoche, normalizeDate]);

  // Obtener fechas ocupadas UNA SOLA VEZ
  // En CalendarFull.jsx - actualiza el useEffect de fetchOccupiedDates:
useEffect(() => {
  if (!isMounted) return;
  
  let abortController = new AbortController();

  const fetchOccupiedDates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const occupiedData = await getOccupiedDates(cabanaId);
      
      if (!isMounted) return;
      
      if (Array.isArray(occupiedData)) {
        const occupiedSet = new Set();
        
        occupiedData.forEach((item) => {
          try {
            // El backend devuelve objetos con fechaInicio y fechaFin
            let startDate, endDate;
            
            if (item.fechaInicio && item.fechaFin) {
              // Formato: { fechaInicio: "2024-01-01", fechaFin: "2024-01-05" }
              startDate = normalizeDate(item.fechaInicio);
              endDate = normalizeDate(item.fechaFin);
            } else if (typeof item === 'string') {
              // Formato: "2024-01-01"
              startDate = normalizeDate(item);
              endDate = normalizeDate(item); // Mismo día
            }
            
            if (!startDate || !endDate) return;
            
            const current = new Date(startDate);
            
            while (current <= endDate) {
              const dateStr = dateToYMD(current);
              occupiedSet.add(dateStr);
              current.setDate(current.getDate() + 1);
            }
          } catch (err) {
            console.warn('Error procesando fecha:', err);
          }
        });
        
        setOccupiedDates(Array.from(occupiedSet));
      }
      
    } catch (err) {
      if (!isMounted) return;
      
      console.error('Error al obtener fechas ocupadas:', err);
      
      if (err.name === 'AbortError') return;
      
      setError('Error al cargar disponibilidad. Intenta nuevamente.');
      setOccupiedDates([]);
    } finally {
      if (isMounted) {
        setLoading(false);
        setIsCalculating(false);
      }
    }
  };

  fetchOccupiedDates();
  
  return () => {
    abortController.abort();
  };
}, [cabanaId, normalizeDate, dateToYMD, isMounted]);

  // Handler de fechas OPTIMIZADO (sin re-renderizaciones innecesarias)
  // En la función handleDateChange:
const handleDateChange = useCallback((newDateRange) => {
  if (!isMounted) return;
  
  const [start, end] = newDateRange;
  
  // Limpiar estados previos
  setError(null);
  setSuccess(null);
  setDateRange(newDateRange);
  setIsCalculating(true);
  
  if (!start || !end) {
    setIsCalculating(false);
    // Llama a onDatesSelected con null, null (sin tercer parámetro)
    if (onDatesSelected) onDatesSelected(null, null);
    return;
  }
  
  // Usar setTimeout para no bloquear el renderizado
  setTimeout(() => {
    try {
      // Validaciones
      const today = normalizeDate(new Date());
      const startDate = normalizeDate(start);
      const endDate = normalizeDate(end);
      
      if (!startDate || !endDate) {
        setError('Fechas inválidas');
        setIsCalculating(false);
        return;
      }
      
      if (startDate >= endDate) {
        setError('La fecha de fin debe ser posterior a la de inicio');
        setIsCalculating(false);
        return;
      }
      
      if (startDate < today) {
        setError('No puedes seleccionar fechas pasadas');
        setIsCalculating(false);
        return;
      }
      
      // Verificar disponibilidad
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
        setIsCalculating(false);
        return;
      }
      
      // Calcular total (opcional)
      const calculatedTotal = calcularTotal(startDate, endDate);
      
      setSuccess('Fechas disponibles para reserva');
      setIsCalculating(false);
      
      // Llama a onDatesSelected solo con startDate y endDate
      if (onDatesSelected) {
        onDatesSelected(startDate, endDate);
      }
    } catch (err) {
      console.error('Error en handleDateChange:', err);
      setError('Error al procesar fechas');
      setIsCalculating(false);
    }
  }, 10);
}, [occupiedDates, onDatesSelected, normalizeDate, dateToYMD, calcularTotal, isMounted]);

  // Funciones de tile MEMOIZADAS (CRÍTICO para evitar errores)
  const tileDisabled = useMemo(() => {
    return ({ date, view }) => {
      if (view !== 'month') return false;
      
      const today = normalizeDate(new Date());
      const currentDate = normalizeDate(date);
      
      if (currentDate < today) return true;
      
      return occupiedDates.includes(dateToYMD(date));
    };
  }, [occupiedDates, normalizeDate, dateToYMD]);

  const tileClassName = useMemo(() => {
    return ({ date, view }) => {
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
    };
  }, [occupiedDates, dateRange, normalizeDate, dateToYMD]);

  // Calcular noches MEMOIZADO
  const noches = useMemo(() => {
    if (!dateRange[0] || !dateRange[1]) return 0;
    
    const start = normalizeDate(dateRange[0]);
    const end = normalizeDate(dateRange[1]);
    
    if (!start || !end || start >= end) return 0;
    
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [dateRange, normalizeDate]);

  // Calcular total actual MEMOIZADO
  const total = useMemo(() => {
    if (!dateRange[0] || !dateRange[1]) return 0;
    return calcularTotal(dateRange[0], dateRange[1]);
  }, [dateRange, calcularTotal]);

  if (loading) {
    return (
      <div className="text-center my-3">
        <Spinner animation="border" size="sm" />
        <p className="mt-2">Cargando disponibilidad...</p>
      </div>
    );
  }

  return (
    <div className={`calendar-container ${showInline ? 'inline-calendar' : ''}`}>
      <Calendar
        key={`calendar-${cabanaId || 'public'}-${occupiedDates.length}`}
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
        showNeighboringMonth={false}
        showFixedNumberOfWeeks={false}
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
        
        {success && !isCalculating && (
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
        
        {isCalculating && (
          <Alert variant="info" className="py-2">
            <Spinner animation="border" size="sm" className="me-2" />
            <small>Calculando disponibilidad...</small>
          </Alert>
        )}
      </div>
      
      {showTotal && total > 0 && precioPorNoche > 0 && !isCalculating && (
        <div className="total-container mt-3 p-3 bg-light rounded">
          <h5 className="text-center mb-2">
            <Badge bg="primary" className="px-3 py-2">
              Total estimado: ${total.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
            </Badge>
          </h5>
          <p className="text-center text-muted small mb-0">
            {noches} {noches === 1 ? 'noche' : 'noches'} × 
            ${precioPorNoche.toLocaleString('es-AR', { minimumFractionDigits: 0 })} por noche
          </p>
        </div>
      )}
    </div>
  );
};

export default React.memo(CalendarFull);
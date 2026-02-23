// src/components/CalendarFull.jsx - VERSIÓN QUE MUESTRA OCUPACIÓN GLOBAL
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarFull.css';
import { Spinner, Alert } from 'react-bootstrap';
import { FaExclamationTriangle } from 'react-icons/fa';
import { getOccupiedDates } from '../config';
import api from '../config';

const CalendarFull = ({ 
  cabanaId, // 🔥 Puede ser: ID real, "todas", o null/undefined
  onDatesSelected, 
  precioPorNoche,
  showInline = false,
  showTotal = true
}) => {
  const [dateRange, setDateRange] = useState([null, null]);
  const [occupiedNights, setOccupiedNights] = useState([]);
  const [checkInDays, setCheckInDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const isMounted = useRef(true);
  const timeoutRef = useRef(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
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

  // 🔥 VERSIÓN MEJORADA - Obtiene fechas ocupadas de TODAS las cabañas si no hay ID específico
  useEffect(() => {
    const fetchOccupiedDates = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 🔥 Si hay cabanaId específico, obtener solo de esa cabaña
        // Si no hay cabanaId o es "todas", obtener de todas las cabañas
        const idToFetch = cabanaId && cabanaId !== "todas" ? cabanaId : null;
        
        console.log(`📡 Obteniendo fechas ocupadas ${idToFetch ? `para cabaña ${idToFetch}` : 'para TODAS las cabañas'}`);
        
        const occupiedData = await getOccupiedDates(idToFetch);
        
        if (!isMounted.current) return;
        
        if (Array.isArray(occupiedData) && occupiedData.length > 0) {
          console.log(`📊 ${occupiedData.length} fechas ocupadas:`, occupiedData);
          
          // 🔥 PROCESAR LAS FECHAS PARA IDENTIFICAR CHECK-INS
          const noches = new Set(occupiedData);
          const checkIns = new Set();
          
          occupiedData.sort().forEach((fecha, index, array) => {
            const fechaDate = new Date(fecha + 'T12:00:00Z');
            const diaAnterior = new Date(fechaDate);
            diaAnterior.setDate(diaAnterior.getDate() - 1);
            const diaAnteriorStr = diaAnterior.toISOString().split('T')[0];
            
            if (!array.includes(diaAnteriorStr)) {
              checkIns.add(fecha);
              noches.delete(fecha);
              console.log(`🔓 Día de check-in detectado: ${fecha}`);
            }
          });
          
          console.log('📊 RESULTADO FINAL:');
          console.log('   - Noches ocupadas (se bloquean):', Array.from(noches).sort());
          console.log('   - Días check-in (disponibles):', Array.from(checkIns).sort());
          
          setOccupiedNights(Array.from(noches));
          setCheckInDays(Array.from(checkIns));
          
          // Verificación específica para el 20 de febrero 2026
          if (checkIns.has('2026-02-20')) {
            console.log('✅ 2026-02-20 es día de check-in → DISPONIBLE para check-out');
          }
          if (noches.has('2026-02-20')) {
            console.log('❌ 2026-02-20 es noche ocupada → NO DISPONIBLE');
          }
          
        } else {
          setOccupiedNights([]);
          setCheckInDays([]);
        }
        
      } catch (err) {
        if (!isMounted.current) return;
        console.error('❌ Error:', err);
        setError('Error al cargar la disponibilidad');
        setOccupiedNights([]);
        setCheckInDays([]);
      } finally {
        if (isMounted.current) {
          timeoutRef.current = setTimeout(() => {
            if (isMounted.current) setLoading(false);
          }, 100);
        }
      }
    };

    fetchOccupiedDates();
  }, [cabanaId]);

  // ✅ VALIDACIÓN - Solo verifica noches ocupadas
  const isValidRange = useCallback((start, end) => {
    if (!start || !end) return false;
    
    const startDate = normalizeDate(start);
    const endDate = normalizeDate(end);
    
    if (!startDate || !endDate) return false;
    if (startDate >= endDate) return false;
    
    const today = normalizeDate(new Date());
    if (startDate < today) return false;
    
    // Verificar que NINGUNA noche en el rango esté ocupada
    const occupiedSet = new Set(occupiedNights);
    const current = new Date(startDate);
    
    while (current < endDate) {
      const dateStr = dateToYMD(current);
      if (occupiedSet.has(dateStr)) {
        console.log(`❌ Noche ocupada encontrada: ${dateStr}`);
        return false;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return true;
  }, [occupiedNights, normalizeDate, dateToYMD]);

  const handleDateChange = useCallback((newDateRange) => {
    if (!isMounted.current) return;
    
    const [start, end] = newDateRange;
    
    console.log('📅 Nuevo rango:', {
      start: start ? dateToYMD(start) : null,
      end: end ? dateToYMD(end) : null,
      modo: cabanaId ? 'por cabaña' : 'global'
    });
    
    setDateRange(newDateRange);
    setError(null);
    
    if (!start || !end) {
      if (onDatesSelected) onDatesSelected(null, null);
      return;
    }
    
    if (isValidRange(start, end)) {
      console.log('✅ Rango válido - todas las noches disponibles');
      if (onDatesSelected) onDatesSelected(start, end);
    } else {
      console.log('❌ Rango inválido - hay noches ocupadas');
      setError('Las fechas seleccionadas no están disponibles');
      if (onDatesSelected) onDatesSelected(null, null);
    }
  }, [isValidRange, onDatesSelected, dateToYMD, cabanaId]);

  // 🔥 TILE DISABLED - Bloquea noches ocupadas
  const tileDisabled = useCallback(({ date, view }) => {
    if (view !== 'month') return false;
    
    const currentDate = normalizeDate(date);
    const today = normalizeDate(new Date());
    
    if (!currentDate) return true;
    if (currentDate < today) return true;
    
    const dateStr = dateToYMD(date);
    
    // ✅ Bloquear si es una noche ocupada
    return occupiedNights.includes(dateStr);
    
  }, [occupiedNights, normalizeDate, dateToYMD]);

  // 🎨 Clases CSS
  // 🎨 Clases CSS - CORREGIDA CON past-day
const tileClassName = useCallback(({ date, view }) => {
  if (view !== 'month') return '';
  
  const classes = [];
  const dateStr = dateToYMD(date);
  const currentDate = normalizeDate(date);
  const today = normalizeDate(new Date());
  
  // ✅ DÍAS ANTERIORES A HOY - SIEMPRE GRISES (AGREGAR ESTO)
  if (currentDate && currentDate < today) {
    classes.push('past-day');
  }
  
  if (occupiedNights.includes(dateStr)) {
    classes.push('occupied-night');
  } else if (checkInDays.includes(dateStr)) {
    classes.push('checkin-day');
  }
  
  if (dateRange[0] && dateRange[1]) {
    const start = normalizeDate(dateRange[0]);
    const end = normalizeDate(dateRange[1]);
    const current = normalizeDate(date);
    
    if (start && end && current) {
      if (current.getTime() === start.getTime()) {
        classes.push('selected-range-start');
      } else if (current.getTime() === end.getTime()) {
        classes.push('selected-range-end');
      } else if (current > start && current < end) {
        classes.push('selected-range-middle');
      }
    }
  }
  
  return classes.join(' ');
}, [occupiedNights, checkInDays, dateRange, normalizeDate, dateToYMD]);

  const noches = useMemo(() => {
    if (!dateRange[0] || !dateRange[1]) return 0;
    
    const start = normalizeDate(dateRange[0]);
    const end = normalizeDate(dateRange[1]);
    
    if (!start || !end || start >= end) return 0;
    
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
      </div>
      
      {/* Leyenda siempre visible */}
      <div className="calendar-legend mt-3">
        <div className="d-flex flex-wrap gap-3 justify-content-center small">
          <div className="d-flex align-items-center">
            <div className="legend-color legend-occupied"></div>
            <span>Noche ocupada</span>
          </div>
          <div className="d-flex align-items-center">
            <div className="legend-color legend-checkin"></div>
            <span>Día de check-in (disponible)</span>
          </div>
          <div className="d-flex align-items-center">
            <div className="legend-color legend-selected"></div>
            <span>Seleccionado</span>
          </div>
        </div>
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
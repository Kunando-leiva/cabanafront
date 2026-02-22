// src/components/CalendarFull.jsx - VERSIÓN CORREGIDA PARA MODO GLOBAL
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarFull.css';
import { Spinner, Alert } from 'react-bootstrap';
import { FaExclamationTriangle } from 'react-icons/fa';
import { getOccupiedDates } from '../config';

const CalendarFull = ({ 
  cabanaId, // 🔥 Puede ser: ID real, "todas", o null/undefined
  onDatesSelected, 
  precioPorNoche,
  showInline = false,
  showTotal = true,
  modo = "normal" // 👈 "normal" para CabanaDetalle, "global" para HomePublico
}) => {
  const [dateRange, setDateRange] = useState([null, null]);
  const [occupiedNights, setOccupiedNights] = useState([]);
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

  // Obtiene fechas ocupadas
  useEffect(() => {
    const fetchOccupiedDates = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const idToFetch = cabanaId && cabanaId !== "todas" ? cabanaId : null;
        
        console.log(`📡 Obteniendo fechas ocupadas ${idToFetch ? `para cabaña ${idToFetch}` : 'para TODAS las cabañas'}`);
        
        const occupiedData = await getOccupiedDates(idToFetch);
        
        if (!isMounted.current) return;
        
        if (Array.isArray(occupiedData) && occupiedData.length > 0) {
          console.log(`📊 ${occupiedData.length} fechas ocupadas:`, occupiedData);
          setOccupiedNights(occupiedData);
        } else {
          setOccupiedNights([]);
        }
        
      } catch (err) {
        if (!isMounted.current) return;
        console.error('❌ Error:', err);
        setError('Error al cargar la disponibilidad');
        setOccupiedNights([]);
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

  // ✅ VALIDACIÓN - En modo global SIEMPRE acepta el rango
  const isValidRange = useCallback((start, end) => {
    if (!start || !end) return false;
    
    const startDate = normalizeDate(start);
    const endDate = normalizeDate(end);
    
    if (!startDate || !endDate) return false;
    if (startDate >= endDate) return false;
    
    const today = normalizeDate(new Date());
    if (startDate < today) return false;
    
    // 🚫 En modo global, SIEMPRE aceptamos el rango
    if (modo === "global") {
      return true;
    }
    
    // Verificar que NINGUNA noche en el rango esté ocupada (solo para modo normal)
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
  }, [occupiedNights, normalizeDate, dateToYMD, modo]);

  const handleDateChange = useCallback((newDateRange) => {
    if (!isMounted.current) return;
    
    const [start, end] = newDateRange;
    
    console.log('📅 Nuevo rango:', {
      start: start ? dateToYMD(start) : null,
      end: end ? dateToYMD(end) : null,
      modo: modo
    });
    
    setDateRange(newDateRange);
    setError(null);
    
    if (!start || !end) {
      if (onDatesSelected) onDatesSelected(null, null);
      return;
    }
    
    // 🚫 En modo global, SIEMPRE llamamos a onDatesSelected sin validar
    if (modo === "global") {
      console.log('✅ Modo global - aceptando cualquier rango');
      if (onDatesSelected) onDatesSelected(start, end);
      return;
    }
    
    // Solo validamos en modo normal
    if (isValidRange(start, end)) {
      console.log('✅ Rango válido');
      if (onDatesSelected) onDatesSelected(start, end);
    } else {
      console.log('❌ Rango inválido');
      setError('Las fechas seleccionadas no están disponibles');
      if (onDatesSelected) onDatesSelected(null, null);
    }
  }, [isValidRange, onDatesSelected, dateToYMD, modo]);

  // 🔥 TILE DISABLED
  const tileDisabled = useCallback(({ date, view }) => {
    if (view !== 'month') return false;
    
    const currentDate = normalizeDate(date);
    const today = normalizeDate(new Date());
    
    if (!currentDate) return true;
    
    // BLOQUEAR FECHAS PASADAS (siempre)
    if (currentDate < today) return true;

    // En modo global, NO bloqueamos noches ocupadas
    if (modo === "global") {
      return false;
    }
    
    const dateStr = dateToYMD(date);
    
    // Bloquear si es una noche ocupada (solo para modo normal)
    return occupiedNights.includes(dateStr);
    
  }, [occupiedNights, normalizeDate, dateToYMD, modo]);

  // 🎨 Clases CSS
  const tileClassName = useCallback(({ date, view }) => {
    if (view !== 'month') return '';
    
    const classes = [];
    const dateStr = dateToYMD(date);
    const currentDate = normalizeDate(date);
    const today = normalizeDate(new Date());
    
    // PRIORIDAD 1: Fecha pasada (siempre gris)
    if (currentDate && currentDate < today) {
      classes.push('past-date');
    }

    // Solo pintar noches ocupadas si NO es modo global
    if (modo !== "global") {
      if (occupiedNights.includes(dateStr) && !(currentDate && currentDate < today)) {
        classes.push('occupied-night');
      }
    }
    
    // Rango seleccionado
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
  }, [occupiedNights, dateRange, normalizeDate, dateToYMD, modo]);

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
        {error && modo !== "global" && ( // Solo mostrar error en modo normal
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
      
      {/* LEYENDA */}
      <div className="calendar-legend mt-3">
        <div className="d-flex flex-wrap gap-3 justify-content-center small">
          <div className="d-flex align-items-center">
            <div className="legend-color legend-past"></div>
            <span>Fechas pasadas</span>
          </div>
          
          {/* Solo mostrar "Noche ocupada" si NO es modo global */}
          {modo !== "global" && (
            <div className="d-flex align-items-center">
              <div className="legend-color legend-occupied"></div>
              <span>Noche ocupada</span>
            </div>
          )}
          
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
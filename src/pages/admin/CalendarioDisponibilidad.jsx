// src/components/admin/CalendarioDisponibilidad.jsx (VERSIÓN CORREGIDA)
import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { getOccupiedDates } from '../../config';
import api from '../../config';

export default function CalendarioDisponibilidad({ cabanaId }) {
  const [occupiedNights, setOccupiedNights] = useState([]); // Noches ocupadas (días donde se duerme)
  const [checkInDays, setCheckInDays] = useState([]); // Días de check-in (disponibles para check-out)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (!cabanaId) {
      setLoading(false);
      return;
    }

    const fetchDisponibilidad = async () => {
      try {
        setLoading(true);
        
        // 🔥 Obtener TODAS las reservas para tener contexto completo
        console.log('📡 Obteniendo reservas para cabaña:', cabanaId);
        const reservasResponse = await api.get(`/api/reservas?cabanaId=${cabanaId}`);
        
        // Obtener noches ocupadas del backend (solo para referencia)
        const nochesOcupadas = await getOccupiedDates(cabanaId);
        
        console.log('📊 Respuesta reservas:', reservasResponse.data);
        
        let reservas = [];
        if (reservasResponse.data?.success && Array.isArray(reservasResponse.data.data)) {
          reservas = reservasResponse.data.data;
        } else if (Array.isArray(reservasResponse.data)) {
          reservas = reservasResponse.data;
        }
        
        // 🔥 PROCESAR RESERVAS MANUALMENTE
        const noches = new Set();   // Noches ocupadas (días donde se duerme)
        const checkIns = new Set(); // Días de check-in (disponibles para check-out)
        
        reservas.forEach(reserva => {
          try {
            const fechaInicio = new Date(reserva.fechaInicio);
            const fechaFin = new Date(reserva.fechaFin);
            
            // Normalizar fechas
            const inicioDate = new Date(Date.UTC(
              fechaInicio.getUTCFullYear(),
              fechaInicio.getUTCMonth(),
              fechaInicio.getUTCDate()
            ));
            
            const finDate = new Date(Date.UTC(
              fechaFin.getUTCFullYear(),
              fechaFin.getUTCMonth(),
              fechaFin.getUTCDate()
            ));
            
            const inicioStr = inicioDate.toISOString().split('T')[0];
            const finStr = finDate.toISOString().split('T')[0];
            
            console.log(`📅 Procesando reserva: ${inicioStr} → ${finStr}`);
            
            // 🔥 REGLA DE NEGOCIO:
            // 1. Las NOCHES OCUPADAS son desde fechaInicio HASTA fechaFin-1
            // 2. El día de CHECK-IN (fechaInicio) está disponible para CHECK-OUT
            
            // Marcar noches ocupadas (días donde se duerme)
            let fechaActual = new Date(inicioDate);
            while (fechaActual.toISOString().split('T')[0] < finStr) {
              const fechaStr = fechaActual.toISOString().split('T')[0];
              noches.add(fechaStr);
              console.log(`   🛌 Noche ocupada: ${fechaStr}`);
              fechaActual.setUTCDate(fechaActual.getUTCDate() + 1);
            }
            
            // El día de check-in NO es una noche ocupada, lo quitamos si se agregó
            if (noches.has(inicioStr)) {
              noches.delete(inicioStr);
              console.log(`   ✅ ${inicioStr} es check-in, se quita de noches ocupadas`);
            }
            
            // Guardar día de check-in (disponible para check-out)
            checkIns.add(inicioStr);
            console.log(`   🔓 Día check-in: ${inicioStr} (disponible para check-out)`);
            
          } catch (err) {
            console.warn('⚠️ Error procesando reserva:', err);
          }
        });
        
        console.log('📊 RESULTADO FINAL:');
        console.log('   - Noches ocupadas:', Array.from(noches).sort());
        console.log('   - Días check-in:', Array.from(checkIns).sort());
        
        setOccupiedNights(Array.from(noches));
        setCheckInDays(Array.from(checkIns));
        
        // Verificación específica para el 20 de febrero
        if (checkIns.has('2026-02-20')) {
          console.log('✅ 2026-02-20 es día de check-in → DISPONIBLE para check-out');
        }
        if (noches.has('2026-02-20')) {
          console.log('❌ 2026-02-20 es noche ocupada → NO DISPONIBLE');
        }
        
      } catch (err) {
        console.error('❌ Error cargando disponibilidad:', err);
        setError('Error al cargar la disponibilidad');
      } finally {
        setLoading(false);
      }
    };

    fetchDisponibilidad();
  }, [cabanaId]);

  // Normalizar fecha para comparación
  const dateToYMD = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split('T')[0];
  };

  // 🔥 NUEVA LÓGICA: Una fecha está deshabilitada SOLO si es una noche ocupada
  const tileDisabled = ({ date, view }) => {
    if (view !== 'month') return false;
    
    const dateStr = dateToYMD(date);
    const isOccupiedNight = occupiedNights.includes(dateStr);
    
    // Los días de check-in NO están deshabilitados
    return isOccupiedNight;
  };

  // Clases CSS para diferentes tipos de fechas
  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return '';
    
    const dateStr = dateToYMD(date);
    
    if (occupiedNights.includes(dateStr)) {
      return 'occupied-night'; // Noche ocupada (rojo)
    }
    
    if (checkInDays.includes(dateStr)) {
      return 'checkin-day'; // Día de check-in (amarillo - disponible)
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
                backgroundColor: '#dc3545',
                borderRadius: '4px'
              }}></div>
              <span className="small">
                <strong>Noche ocupada</strong> (no disponible)
              </span>
            </div>
            
            <div className="d-flex align-items-center mb-2">
              <div className="checkin-sample me-2" style={{
                width: '20px',
                height: '20px',
                backgroundColor: '#ffc107',
                borderRadius: '4px'
              }}></div>
              <span className="small">
                <strong>Día de check-in</strong> (disponible para check-out hasta 10AM)
              </span>
            </div>
            
            <div className="d-flex align-items-center mb-2">
              <div className="available-sample me-2" style={{
                width: '20px',
                height: '20px',
                backgroundColor: '#ffffff',
                border: '1px solid #dee2e6',
                borderRadius: '4px'
              }}></div>
              <span className="small">
                <strong>Día disponible</strong>
              </span>
            </div>
            
            <div className="mt-3 p-2 bg-light rounded">
              <strong>📊 Resumen:</strong>
              <ul className="mb-0 mt-1 small">
                <li>{occupiedNights.length} noches ocupadas</li>
                <li>{checkInDays.length} días con check-in programado</li>
                {checkInDays.includes('2026-02-20') && (
                  <li className="text-success fw-bold">
                    ✅ 20/02/2026 está disponible para check-out
                  </li>
                )}
              </ul>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        :global(.occupied-night) {
          background-color: #dc3545 !important;
          color: white !important;
          border-radius: 50%;
          text-decoration: none;
        }
        :global(.checkin-day) {
          background-color: #ffc107 !important;
          color: black !important;
          border-radius: 50%;
          position: relative;
        }
        :global(.checkin-day:hover)::after {
          content: "Disponible para check-out hasta 10AM";
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: #333;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          z-index: 1000;
        }
      `}</style>
    </div>
  );
}
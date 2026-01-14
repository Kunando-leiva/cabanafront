import axios from 'axios';

// Configura la URL base de tu backend
const API_URL = 'https://backendcabana.onrender.com';

// Configurar axios globalmente
axios.defaults.baseURL = API_URL;

// ============================================
// 1. FUNCIÓN PARA CALCULAR PRECIOS DINÁMICOS
// ============================================
export const calcularPrecioReserva = async (fechaInicio, fechaFin) => {
  try {
    // Formatear fechas para la API
    const formatDateForAPI = (date) => {
      if (!date) return null;
      if (date instanceof Date) {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
      }
      return date;
    };

    const response = await axios.post('/api/reservas/calcular-precio', {
      fechaInicio: formatDateForAPI(fechaInicio),
      fechaFin: formatDateForAPI(fechaFin)
    });
    
    return response.data;
  } catch (error) {
    console.error('Error calculando precio:', error.response?.data || error.message);
    throw error;
  }
};

// ============================================
// 2. FUNCIÓN PARA FORMATEAR PRECIOS ARGENTINOS
// ============================================
export const formatearPrecioArgentino = (precio) => {
  if (!precio && precio !== 0) return '$0';
  
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(precio);
};

// ============================================
// 3. FUNCIÓN PARA OBTENER FECHAS OCUPADAS (EXISTENTE)
// ============================================
export const getOccupiedDates = async () => {
  try {
    const response = await axios.get('/api/reservas/ocupadas');
    return response.data.map(date => new Date(date));
  } catch (error) {
    console.error("Error fetching occupied dates:", error.response?.data || error.message);
    return [];
  }
};

// ============================================
// 4. FUNCIÓN PARA OBTENER DESGLOSE DE PRECIOS POR DÍA
// ============================================
export const obtenerDesglosePrecio = async (fechaInicio, fechaFin) => {
  try {
    const precioData = await calcularPrecioReserva(fechaInicio, fechaFin);
    return {
      precioTotal: precioData.precioTotal,
      precioFormateado: formatearPrecioArgentino(precioData.precioTotal),
      desglose: precioData.desglose || [],
      totalDias: precioData.totalDias || 0
    };
  } catch (error) {
    console.error('Error obteniendo desglose:', error);
    throw error;
  }
};

// ============================================
// 5. FUNCIÓN PARA MOSTRAR RESUMEN DE PRECIOS
// ============================================
export const mostrarResumenPrecios = (desglose) => {
  if (!desglose || desglose.length === 0) {
    return { feriados: 0, finSemana: 0, semana: 0, total: 0 };
  }
  
  const resumen = {
    feriados: 0,
    finSemana: 0,
    semana: 0,
    total: 0
  };
  
  desglose.forEach(dia => {
    resumen[dia.tipo.replace('fin de semana', 'finSemana').replace(' ', '')] += 1;
  });
  
  return resumen;
};
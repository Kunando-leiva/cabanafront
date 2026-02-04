// src/config.js - VERSIÓN CON LOGGING
export const API_URL = process.env.REACT_APP_API_URL || 'https://backendcabana.onrender.com';

import axios from 'axios';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('La solicitud tardó demasiado. Intenta nuevamente.'));
    }
    
    if (!error.response) {
      return Promise.reject(new Error('Error de conexión. Verifica tu internet.'));
    }
    
    return Promise.reject(error);
  }
);

// 🔥 FUNCIÓN MEJORADA CON LOGGING DETALLADO
export const getOccupiedDates = async (cabanaId = null) => {
   console.log('📍 getOccupiedDates llamado con cabanaId:', cabanaId);
  try {
    const url = cabanaId 
      ? `/api/reservas/ocupadas?cabanaId=${cabanaId}`
      : '/api/reservas/ocupadas';
    
    console.log('📡 Obteniendo fechas ocupadas de:', url);
    
    const response = await api.get(url, {
      timeout: 8000
    });
    
    console.log('✅ Respuesta del servidor:', {
      success: response.data?.success,
      dataLength: response.data?.data?.length || response.data?.length,
      total: response.data?.total,
      mensaje: response.data?.mensaje
    });

    let dates = [];
    
    if (response.data?.success) {
      if (Array.isArray(response.data.data)) {
        dates = response.data.data;
        console.log(`📅 Formato 1: ${dates.length} fechas recibidas directamente`);
      } 
      else if (response.data.data && Array.isArray(response.data.data)) {
        dates = response.data.data.map(item => item.fecha || item);
        console.log(`📅 Formato 2: ${dates.length} fechas extraídas de objetos`);
      }
    } else if (Array.isArray(response.data)) {
      dates = response.data;
      console.log(`📅 Formato 3: ${dates.length} fechas en array directo`);
    } else if (response.data && response.data.reservas) {
      dates = response.data.reservas;
      console.log(`📅 Formato 4: ${dates.length} fechas de reservas`);
    }

    const formattedDates = dates.map(date => {
      try {
        if (typeof date === 'string') {
          if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return date;
          }
          const d = new Date(date);
          if (isNaN(d.getTime())) return null;
          return d.toISOString().split('T')[0];
        } else if (date && typeof date === 'object') {
          if (date.fecha) {
            return date.fecha;
          } else if (date.date) {
            return date.date;
          }
        }
        return null;
      } catch (error) {
        console.warn('⚠️ Error procesando fecha:', date);
        return null;
      }
    }).filter(Boolean);

    console.log(`📊 Total fechas ocupadas procesadas: ${formattedDates.length}`);
    if (formattedDates.length > 0) {
      console.log('📋 Fechas ocupadas:', formattedDates.slice(0, 10));
      if (formattedDates.length > 10) {
        console.log(`... y ${formattedDates.length - 10} más`);
      }
    }
    
    return formattedDates;
    
  } catch (error) {
    console.error("❌ Error fetching occupied dates:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    return [];
  }
};

export const calcularPrecioReserva = async (fechaInicio, fechaFin, cabanaId) => {
   console.log('📍 calcularPrecioReserva llamado:', {
    fechaInicio: fechaInicio ? new Date(fechaInicio).toISOString().split('T')[0] : null,
    fechaFin: fechaFin ? new Date(fechaFin).toISOString().split('T')[0] : null,
    cabanaId
  });
  try {
    const formatDateForAPI = (date) => {
      if (!date) return null;
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d.toISOString().split('T')[0];
    };

    console.log('🧮 Calculando precio para fechas:', {
      fechaInicio: formatDateForAPI(fechaInicio),
      fechaFin: formatDateForAPI(fechaFin)
    });

    const response = await api.post('/api/reservas/calcular-precio', {
      fechaInicio: formatDateForAPI(fechaInicio),
      fechaFin: formatDateForAPI(fechaFin),
      cabanaId: cabanaId || undefined
    });
    
    if (response.data && response.data.success) {
      console.log('✅ Precio calculado:', {
        total: response.data.precioTotal,
        noches: response.data.totalNoches,
        mensaje: response.data.mensaje
      });
      return response.data;
    } else {
      throw new Error(response.data?.error || 'Error calculando precio');
    }
  } catch (error) {
    console.error('❌ Error calculando precio:', error);
    throw error;
  }
};

export const formatearPrecioArgentino = (precio) => {
  if (precio === null || precio === undefined || isNaN(precio)) return '$0';
  
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(precio);
};

const cabanasCache = {
  data: null,
  timestamp: 0,
  ttl: 5 * 60 * 1000
};

export const obtenerCabanas = async (forceRefresh = false) => {
  const now = Date.now();
  
  if (!forceRefresh && cabanasCache.data && (now - cabanasCache.timestamp) < cabanasCache.ttl) {
    console.log('📦 Usando cache de cabañas');
    return cabanasCache.data;
  }
  
  try {
    console.log('📡 Obteniendo cabañas desde servidor');
    const response = await api.get('/api/cabanas', {
      timeout: 12000
    });
    
    let data = [];
    
    if (response.data && response.data.success) {
      data = response.data.data || [];
    } else if (Array.isArray(response.data)) {
      data = response.data;
    }
    
    console.log(`✅ ${data.length} cabañas obtenidas`);
    
    cabanasCache.data = data;
    cabanasCache.timestamp = now;
    
    return data;
  } catch (error) {
    console.error('❌ Error obteniendo cabañas:', error);
    
    if (cabanasCache.data) {
      console.log('⚠️ Usando datos cacheados por error');
      return cabanasCache.data;
    }
    
    return [];
  }
};

export default api;
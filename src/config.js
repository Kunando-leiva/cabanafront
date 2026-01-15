// src/config.js
export const API_URL = 'https://backendcabana.onrender.com';

import axios from 'axios';

// Instancia principal de axios
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // Reducido de 20000 a 10000
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Interceptors
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // NO agregar Cache-Control manualmente
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

// ================= FUNCIONES ESPECÍFICAS =================

// 1. FUNCIÓN PARA CALCULAR PRECIOS DINÁMICOS
export const calcularPrecioReserva = async (fechaInicio, fechaFin, cabanaId) => {
  try {
    const formatDateForAPI = (date) => {
      if (!date) return null;
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d.toISOString().split('T')[0];
    };

    const response = await api.post('/api/reservas/calcular-precio', {
      fechaInicio: formatDateForAPI(fechaInicio),
      fechaFin: formatDateForAPI(fechaFin),
      cabanaId: cabanaId || undefined
    });
    
    return response.data;
  } catch (error) {
    console.error('Error calculando precio:', error);
    throw error;
  }
};

// 2. FUNCIÓN PARA FORMATEAR PRECIOS ARGENTINOS
export const formatearPrecioArgentino = (precio) => {
  if (precio === null || precio === undefined || isNaN(precio)) return '$0';
  
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(precio);
};

// 3. FUNCIÓN PARA OBTENER FECHAS OCUPADAS (OPTIMIZADA)
export const getOccupiedDates = async (cabanaId = null) => {
  try {
    const url = cabanaId 
      ? `/api/reservas/ocupadas?cabanaId=${cabanaId}`
      : '/api/reservas/ocupadas';
    
    const response = await api.get(url, {
      timeout: 8000 // Timeout específico para esta ruta
    });
    
    const data = response.data?.data || response.data || [];
    
    if (!Array.isArray(data)) {
      console.warn('Respuesta inesperada:', data);
      return [];
    }
    
    return data.map(item => {
      if (item.fechaInicio && item.fechaFin) {
        return {
          fechaInicio: new Date(item.fechaInicio),
          fechaFin: new Date(item.fechaFin)
        };
      }
      return new Date(item);
    });
  } catch (error) {
    console.error("Error fetching occupied dates:", error);
    return [];
  }
};

// 4. FUNCIÓN PARA CREAR RESERVA
export const crearReserva = async (reservaData) => {
  try {
    const response = await api.post('/api/reservas', reservaData);
    return response.data;
  } catch (error) {
    console.error('Error creando reserva:', error);
    throw error;
  }
};

// 5. FUNCIÓN PARA OBTENER CABANAS (CON CACHE)
const cabanasCache = {
  data: null,
  timestamp: 0,
  ttl: 5 * 60 * 1000 // 5 minutos
};

export const obtenerCabanas = async (forceRefresh = false) => {
  // Verificar cache
  const now = Date.now();
  if (!forceRefresh && cabanasCache.data && (now - cabanasCache.timestamp) < cabanasCache.ttl) {
    return cabanasCache.data;
  }
  
  try {
    const response = await api.get('/api/cabanas', {
      timeout: 12000
    });
    
    const data = response.data?.data || response.data || [];
    
    // Actualizar cache
    cabanasCache.data = data;
    cabanasCache.timestamp = now;
    
    return data;
  } catch (error) {
    console.error('Error obteniendo cabañas:', error);
    
    // Si hay cache, usarlo como fallback
    if (cabanasCache.data) {
      console.warn('Usando datos cacheados debido a error');
      return cabanasCache.data;
    }
    
    return [];
  }
};

// 6. FUNCIÓN PARA LIMPIAR CACHE
export const limpiarCacheCabanas = () => {
  cabanasCache.data = null;
  cabanasCache.timestamp = 0;
};

export default api;
// src/config.js - VERSIÓN CORREGIDA
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

// Interceptor de request
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

// Interceptor de response
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

// 1. FUNCIÓN PARA CALCULAR PRECIOS DINÁMICOS - CORREGIDA
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
    
    if (response.data && response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data?.error || 'Error calculando precio');
    }
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

// 3. FUNCIÓN PARA OBTENER FECHAS OCUPADAS
export const getOccupiedDates = async (cabanaId = null) => {
  try {
    const url = cabanaId 
      ? `/api/reservas/ocupadas?cabanaId=${cabanaId}`
      : '/api/reservas/ocupadas';
    
    const response = await api.get(url, {
      timeout: 8000
    });
    
    const data = response.data?.data || response.data || [];
    
    if (!Array.isArray(data)) {
      console.warn('Respuesta inesperada:', data);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching occupied dates:", error);
    return [];
  }
};

// 4. FUNCIÓN PARA OBTENER CABANAS CON CACHE
const cabanasCache = {
  data: null,
  timestamp: 0,
  ttl: 5 * 60 * 1000
};

export const obtenerCabanas = async (forceRefresh = false) => {
  const now = Date.now();
  
  if (!forceRefresh && cabanasCache.data && (now - cabanasCache.timestamp) < cabanasCache.ttl) {
    return cabanasCache.data;
  }
  
  try {
    const response = await api.get('/api/cabanas', {
      timeout: 12000
    });
    
    let data = [];
    
    if (response.data && response.data.success) {
      data = response.data.data || [];
    } else if (Array.isArray(response.data)) {
      data = response.data;
    }
    
    cabanasCache.data = data;
    cabanasCache.timestamp = now;
    
    return data;
  } catch (error) {
    console.error('Error obteniendo cabañas:', error);
    
    if (cabanasCache.data) {
      return cabanasCache.data;
    }
    
    return [];
  }
};

export default api;
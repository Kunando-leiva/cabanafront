// src/config.js - VERSIÓN SIN LOGS
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

// 🔥 VERSIÓN SIMPLIFICADA - Confía en el backend
export const getOccupiedDates = async (cabanaId = null) => {
  try {
    const url = cabanaId 
      ? `/api/reservas/ocupadas?cabanaId=${cabanaId}`
      : '/api/reservas/ocupadas';
    
    const response = await api.get(url, {
      timeout: 8000
    });

    let fechas = [];
    
    // El backend puede enviar en diferentes formatos
    if (response.data?.success) {
      if (Array.isArray(response.data.fechas)) {
        fechas = response.data.fechas;
      } else if (Array.isArray(response.data.data)) {
        fechas = response.data.data;
      }
    }

    return fechas;
    
  } catch (error) {
    return [];
  }
};


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
    
    if (cabanasCache.data) {
      return cabanasCache.data;
    }
    
    return [];
  }
};

export default api;
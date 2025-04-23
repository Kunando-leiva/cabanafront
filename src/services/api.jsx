import axios from 'axios';

// Configura la URL base de tu backend (ajusta el puerto si es necesario)
const API_URL = 'http://localhost:5000/api';

export const getOccupiedDates = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/reservas/ocupadas');
    return response.data.map(date => new Date(date));
  } catch (error) {
    console.error("Error fetching occupied dates:", error.response?.data || error.message);
    return []; // Retorna array vacío como fallback
  }
};
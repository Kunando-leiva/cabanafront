// src/components/AdminDatePicker.jsx
import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getOccupiedDates } from '../config';

export const AdminDatePicker = ({ onDatesSelected }) => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [occupiedDates, setOccupiedDates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDates = async () => {
      try {
        setLoading(true);
        const dates = await getOccupiedDates();
        setOccupiedDates(dates.map(date => new Date(date)));
      } catch (error) {
        console.error('Error cargando fechas ocupadas:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDates();
  }, []);

  // Notificar cuando se seleccionan ambas fechas
  useEffect(() => {
    if (startDate && endDate && onDatesSelected) {
      onDatesSelected(startDate, endDate);
    }
  }, [startDate, endDate, onDatesSelected]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Ver Disponibilidad</h2>
        <p className="text-gray-600">Cargando fechas ocupadas...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Ver Disponibilidad (Admin)</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Fecha de inicio</label>
          <DatePicker
            selected={startDate}
            onChange={date => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            excludeDates={occupiedDates}
            placeholderText="Selecciona fecha de inicio"
            className="w-full p-2 border rounded"
            dateFormat="dd/MM/yyyy"
            isClearable
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Fecha de fin</label>
          <DatePicker
            selected={endDate}
            onChange={date => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            excludeDates={occupiedDates}
            placeholderText="Selecciona fecha de fin"
            className="w-full p-2 border rounded"
            dateFormat="dd/MM/yyyy"
            isClearable
            disabled={!startDate}
          />
        </div>
      </div>
      {occupiedDates.length > 0 && (
        <p className="mt-3 text-sm text-gray-600">
          ❌ Las fechas marcadas en rojo están ocupadas.
        </p>
      )}
      {startDate && endDate && (
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <p className="font-medium">
            Fechas seleccionadas: {startDate.toLocaleDateString('es-ES')} - {endDate.toLocaleDateString('es-ES')}
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminDatePicker;
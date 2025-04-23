import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getOccupiedDates } from '../services/api';

export const Calendar = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [occupiedDates, setOccupiedDates] = useState([]);

  useEffect(() => {
    const fetchDates = async () => {
      const dates = await getOccupiedDates();
      setOccupiedDates(dates.map(date => new Date(date)));
    };
    fetchDates();
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Ver Disponibilidad</h2>
      <div className="space-y-4">
        <DatePicker
          selected={startDate}
          onChange={date => setStartDate(date)}
          selectsStart
          startDate={startDate}
          endDate={endDate}
          excludeDates={occupiedDates}
          placeholderText="Fecha de inicio"
          className="w-full p-2 border rounded"
        />
        <DatePicker
          selected={endDate}
          onChange={date => setEndDate(date)}
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          minDate={startDate}
          excludeDates={occupiedDates}
          placeholderText="Fecha de fin"
          className="w-full p-2 border rounded"
        />
      </div>
      {occupiedDates.length > 0 && (
        <p className="mt-3 text-sm text-gray-600">
          ❌ Las fechas marcadas están ocupadas.
        </p>
      )}
    </div>
  );
};
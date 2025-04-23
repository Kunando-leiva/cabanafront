import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export const AdminCalendar = () => {
  const [date, setDate] = useState(new Date());

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Calendario de Reservas</h2>
      <Calendar 
        onChange={setDate} 
        value={date}
        className="mx-auto border rounded shadow p-2"
      />
      {/* Listado de reservas para la fecha seleccionada */}
      <div className="mt-4">
        <h3 className="text-xl font-semibold">Reservas para {date.toLocaleDateString()}</h3>
        {/* Aquí iría la lista de reservas */}
      </div>
    </div>
  );
};
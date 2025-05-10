import { useAuth } from '../../context/AuthContext';
import AdminNav from '../../components/admin/AdminNav';
import { Outlet } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="bg-gray-100 text-center min-h-screen flex flex-col">
      <div className="p-6 flex-grow">
        {/* Encabezado */}
        <div className="flex justify-between  items-center mb-6">
          <h1 className="text-2xl text-center font-bold">Panel de Administración</h1>
        </div>
        

        {/* Contenido dinámico */}
        <div className="mb-8">
          <Outlet />
        </div>
      </div>

      {/* Mensaje de bienvenida grande en la parte inferior */}
      <div className="bg-white py-4 shadow-inner">
        <h2 className="text-3xl text-center text-gray-700 font-medium">
          Bienvenido, <span className="font-bold text-blue-600">{user?.nombre}</span>
        </h2>
      </div>
        <AdminNav />
    </div>
  );
}
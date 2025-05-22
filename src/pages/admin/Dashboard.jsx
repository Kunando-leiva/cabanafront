import { useAuth } from '../../context/AuthContext';
import AdminNav from '../../components/admin/AdminNav';
import { Outlet } from 'react-router-dom';
import { FaHome, FaBed, FaCalendarAlt, FaImages, FaSignOutAlt } from 'react-icons/fa';

export default function Dashboard() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    // 1. Elimina los datos de autenticación
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // 2. Redirige al login y recarga para limpiar estados
    window.location.href = '/login';
  };

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
        <div className="hidden sm:ml-6 sm:flex sm:items-center">
                    <button
                      onClick={handleLogout}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
                    >
                      <FaSignOutAlt className="mr-2" />
                      Cerrar sesión
                    </button>
                  </div>
    </div>
    
  );
}
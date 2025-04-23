import { useAuth } from '../../context/AuthContext';
import AdminNav from '../../components/admin/AdminNav';
import { Outlet } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="bg-gray-100 min-h-screen">
      <AdminNav />
      
      <div className="p-6">
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Panel de Administración</h1>
          <div className="text-sm text-gray-600">
            Bienvenido, <span className="font-semibold">{user?.nombre}</span>
          </div>
        </div>

        {/* Contenido dinámico */}
        <Outlet />
      </div>
    </div>
  );
}
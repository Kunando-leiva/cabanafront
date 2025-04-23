import { Outlet } from 'react-router-dom';
import AdminNav from '../components/admin/AdminNav';
import { useAuth } from '../context/AuthContext';

const AdminLayout = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Cargando...</div>;
  
  return (
    <div className="d-flex">
      
      {/* Contenido principal */}
      <div className="flex-grow-1 p-4">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
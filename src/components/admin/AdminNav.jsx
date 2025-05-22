import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaBed, FaCalendarAlt, FaImages, FaSignOutAlt } from 'react-icons/fa';

export default function AdminNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/admin/Dashboard', name: 'Inicio', icon: <FaHome /> },
    { path: '/admin/cabanas', name: 'Cabañas', icon: <FaBed /> },
    { path: '/admin/reservas', name: 'Reservas', icon: <FaCalendarAlt /> },
    { path: '/admin/imagenes', name: 'Imágenes', icon: <FaImages /> }
  ];


  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Sección izquierda (enlaces) */}
          <div className="flex">
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location.pathname === item.path
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-500 hover:border-red-600 hover:text-red-600'
                  }`}
                >
                  <span className={`mr-2 text-xl ${
                    location.pathname === item.path
                      ? 'text-red-600'
                      : 'text-gray-400 group-hover:text-red-600'
                  }`}>
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          
        </div>
      </div>
    </nav>
  );
}
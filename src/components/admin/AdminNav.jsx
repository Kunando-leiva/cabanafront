import { Link, useLocation } from 'react-router-dom';

export default function AdminNav() {
  const location = useLocation();
  
  const navItems = [
    { path: '/admin/Dashboard', name: 'Inicio', icon: '🏠' },
    { path: '/admin/cabanas', name: 'Cabañas', icon: '🏡' },
    { path: '/admin/reservas', name: 'Reservas', icon: '📅' },
    { path: '/admin/usuarios', name: 'Usuarios', icon: '👥' },
    { path: '/admin/finanzas', name: 'Finanzas', icon: '💰' }
  ];

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold">Admin</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`${
                    location.pathname === item.path
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <span className="mr-2">{item.icon}</span>
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
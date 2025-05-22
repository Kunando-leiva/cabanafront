import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Verificación de carga
  if (loading) {
    return <div className="text-center p-4">Cargando...</div>;
  }

  // Verificación segura de autenticación
  const authenticated = typeof isAuthenticated === 'function' 
    ? isAuthenticated() 
    : isAuthenticated;

  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificación segura de roles
  const userRole = user?.rol;
  if (allowedRoles && (!userRole || !allowedRoles.includes(userRole))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
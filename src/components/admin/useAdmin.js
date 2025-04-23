// src/hooks/useAdmin.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Cambiado a import único
export const useAdmin = () => {
  const { user, loading } = useAuth(); // Usa Auth.use()
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    
    if (!user || user.rol !== 'admin') {
      navigate('/login', { replace: true });
      console.warn('Acceso denegado: Se requiere rol de administrador');
    }
  }, [user, loading, navigate]);

  return { isAdmin: user?.rol === 'admin', loading };
};
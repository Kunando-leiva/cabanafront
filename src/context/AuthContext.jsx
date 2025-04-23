import { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);
  

  // Cargar usuario al iniciar
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser && isMounted.current) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Error al cargar usuario:", error);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };
    loadUser();

    return () => { isMounted.current = false; };
  }, []);

  // Función de login
  const login = (userData, token) => {
    if (isMounted.current) {
      localStorage.setItem('user', JSON.stringify({
        ...userData,
        id: userData._id || userData.id // Normaliza el ID
      }));
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
    }
  };

  // Función de logout
  const logout = () => {
    if (isMounted.current) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    }
  };

  // Verifica autenticación (EN TIEMPO REAL)
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    if (!token || !user) return false; // Si no hay token o usuario
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const tokenValido = payload.exp * 1000 > Date.now();
      return tokenValido;
    } catch (error) {
      console.error("Error al verificar token:", error);
      return false;
    }
  };

  // Verifica si es admin
  const isAdmin = () => user?.rol === 'admin';

  return (
    <AuthContext.Provider value={{ 
      user,
      loading,
      login,
      logout,
      isAuthenticated, // <- Función
      isAdmin,         // <- Función
      token: localStorage.getItem('token'),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
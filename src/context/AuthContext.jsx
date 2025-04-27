import { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Crear el contexto primero
const AuthContext = createContext();

// Componente proveedor como exportación por defecto
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

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

  const login = (userData, token) => {
    if (isMounted.current) {
      localStorage.setItem('user', JSON.stringify({
        ...userData,
        id: userData._id || userData.id
      }));
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
    }
  };

  const logout = () => {
    if (isMounted.current) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    }
  };

  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    if (!token || !user) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch (error) {
      console.error("Error al verificar token:", error);
      return false;
    }
  };

  const isAdmin = () => user?.rol === 'admin';

  return (
    <AuthContext.Provider value={{ 
      user,
      loading,
      login,
      logout,
      isAuthenticated,
      isAdmin,
      token: localStorage.getItem('token'),
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook como exportación nombrada
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};

export default AuthProvider;
export { AuthContext, useAuth };
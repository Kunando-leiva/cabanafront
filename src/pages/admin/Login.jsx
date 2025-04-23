import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Credenciales incorrectas');
      }

      const { user, token } = await response.json();
      
      if (!user || !token) {
        throw new Error('Formato de respuesta inválido del servidor');
      }

      if (!token.startsWith('eyJ') || token.split('.').length !== 3) {
        throw new Error('Token con formato inválido');
      }

      let payload;
      try {
        payload = JSON.parse(atob(token.split('.')[1]));
      } catch (e) {
        throw new Error('Token corrupto o inválido');
      }

      const remainingTime = payload.exp * 1000 - Date.now();
      if (remainingTime <= 0) {
        throw new Error('Token ya expirado');
      }

      console.log('Token válido recibido. Tiempo restante:', Math.floor(remainingTime/1000), 'segundos');

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      const storedToken = localStorage.getItem('token');
      if (storedToken !== token) {
        throw new Error('Error al almacenar el token');
      }

      login(user, token);

      const redirectPath = determineRedirectPath(user.rol, location);
      window.location.href = redirectPath;

    } catch (err) {
      console.error('Error en login:', err);
      setError(err.message);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const determineRedirectPath = (rol, location) => {
    const from = location.state?.from?.pathname || '/';
    
    if (from !== '/' && from !== '/login') {
      return from;
    }
    
    switch(rol) {
      case 'admin':
        return '/admin/Dashboard';
      case 'user':
        return '/user/home';
      default:
        return '/';
    }
  };

  return (
    <div className="container-fluid d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div className="card shadow col-md-6 col-lg-4">
        <div className="card-header bg-primary text-white">
          <h2 className="h4 mb-0 text-center">Iniciar Sesión</h2>
        </div>
        
        <div className="card-body">
          {location.state?.from && (
            <div className="alert alert-warning text-center">
              Debes iniciar sesión para acceder a esta página
            </div>
          )}

          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-control"
                placeholder="tu@email.com"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-control"
                placeholder="••••••••"
              />
            </div>

            <div className="d-grid gap-2">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Procesando...
                  </>
                ) : 'Iniciar Sesión'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
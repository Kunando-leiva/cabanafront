import 'bootstrap/dist/css/bootstrap.min.css';
import { useAuth } from '../../context/AuthContext';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaSignOutAlt, 
  FaCalendarDay, 
  FaClock, 
  FaUser, 
  FaSun,
  FaNewspaper,
  FaDollarSign,
  FaCloudSun,
  FaThermometerHalf,
  FaWind,
  FaTachometerAlt,
  FaHotel,
  FaCalendarCheck,
  FaImages,
  FaCloud,
  FaCloudRain,
  FaSnowflake,
  FaCloudShowersHeavy,
  FaMapMarkerAlt,
  FaSyncAlt,
  FaExclamationTriangle,
  FaTemperatureHigh,
  FaTint
} from 'react-icons/fa';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clima, setClima] = useState(null);
  const [loadingClima, setLoadingClima] = useState(false);
  const [errorClima, setErrorClima] = useState(null);
  const [ciudad, setCiudad] = useState('Buenos Aires');
  const [dolar, setDolar] = useState(null);
  const [noticias, setNoticias] = useState([]);

  // TU API KEY REAL DE OPENWEATHERMAP
  const API_KEY = '22347c6e54b5d4167b420870fe929910';
  
  const navItems = [
    { path: '/admin/Dashboard', name: 'Inicio', icon: <FaTachometerAlt /> },
    { path: '/admin/cabanas', name: 'Cabañas', icon: <FaHotel /> },
    { path: '/admin/reservas', name: 'Reservas', icon: <FaCalendarCheck /> },
    { path: '/admin/imagenes', name: 'Imágenes', icon: <FaImages /> }
  ];

  // Función para obtener ícono según código de OpenWeatherMap
  const getWeatherIcon = (iconCode, temp) => {
    const iconMap = {
      '01d': { icon: <FaSun className="text-warning" />, color: 'bg-warning' },
      '01n': { icon: <FaSun className="text-warning" />, color: 'bg-warning' },
      '02d': { icon: <FaCloudSun className="text-warning" />, color: 'bg-warning' },
      '02n': { icon: <FaCloudSun className="text-warning" />, color: 'bg-warning' },
      '03d': { icon: <FaCloud className="text-secondary" />, color: 'bg-secondary' },
      '03n': { icon: <FaCloud className="text-secondary" />, color: 'bg-secondary' },
      '04d': { icon: <FaCloud className="text-secondary" />, color: 'bg-secondary' },
      '04n': { icon: <FaCloud className="text-secondary" />, color: 'bg-secondary' },
      '09d': { icon: <FaCloudRain className="text-info" />, color: 'bg-info' },
      '09n': { icon: <FaCloudRain className="text-info" />, color: 'bg-info' },
      '10d': { icon: <FaCloudShowersHeavy className="text-info" />, color: 'bg-info' },
      '10n': { icon: <FaCloudShowersHeavy className="text-info" />, color: 'bg-info' },
      '11d': { icon: <FaCloudShowersHeavy className="text-danger" />, color: 'bg-danger' },
      '11n': { icon: <FaCloudShowersHeavy className="text-danger" />, color: 'bg-danger' },
      '13d': { icon: <FaSnowflake className="text-info" />, color: 'bg-info' },
      '13n': { icon: <FaSnowflake className="text-info" />, color: 'bg-info' },
      '50d': { icon: <FaCloud className="text-secondary" />, color: 'bg-secondary' },
      '50n': { icon: <FaCloud className="text-secondary" />, color: 'bg-secondary' },
    };
    
    const result = iconMap[iconCode] || { icon: <FaCloudSun className="text-warning" />, color: 'bg-warning' };
    
    // Color basado en temperatura
    if (temp > 30) result.color = 'bg-danger';
    else if (temp > 20) result.color = 'bg-warning';
    else if (temp > 10) result.color = 'bg-success';
    else result.color = 'bg-info';
    
    return result;
  };

  // Función para obtener clima real
  const fetchClimaReal = async (ciudadNombre = 'Buenos Aires') => {
    try {
      setLoadingClima(true);
      setErrorClima(null);

      // API de OpenWeatherMap con TU KEY
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${ciudadNombre}&appid=${API_KEY}&units=metric&lang=es`
      );

      const data = response.data;
      const weatherIcon = getWeatherIcon(data.weather[0].icon, data.main.temp);
      
      setClima({
        temperatura: Math.round(data.main.temp),
        descripcion: data.weather[0].description,
        humedad: data.main.humidity,
        viento: `${Math.round(data.wind.speed * 3.6)} km/h`,
        ciudad: data.name,
        pais: data.sys.country,
        icono: weatherIcon.icon,
        iconColor: weatherIcon.color,
        sensacion: Math.round(data.main.feels_like),
        presion: data.main.pressure,
        minTemp: Math.round(data.main.temp_min),
        maxTemp: Math.round(data.main.temp_max),
        visibilidad: (data.visibility / 1000).toFixed(1),
        actualizado: new Date().toLocaleTimeString('es-ES'),
        lat: data.coord.lat,
        lon: data.coord.lon,
        amanecer: new Date(data.sys.sunrise * 1000).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'}),
        atardecer: new Date(data.sys.sunset * 1000).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})
      });

      // Actualizar ciudad si es diferente
      if (ciudadNombre !== ciudad) {
        setCiudad(data.name);
      }

    } catch (error) {
      console.error('Error obteniendo clima:', error);
      
      if (error.response?.status === 401) {
        setErrorClima('API Key inválida. Verifica tu clave de OpenWeatherMap');
      } else if (error.response?.status === 404) {
        setErrorClima(`Ciudad "${ciudad}" no encontrada. Intenta con otra.`);
      } else if (error.response?.status === 429) {
        setErrorClima('Límite de consultas excedido. Intenta más tarde.');
      } else {
        setErrorClima('Error al conectar con el servicio del clima');
      }
      
      // Datos de respaldo
      setClima(getClimaSimulado(ciudadNombre));
    } finally {
      setLoadingClima(false);
    }
  };

  // Datos simulados para respaldo
  const getClimaSimulado = (ciudadNombre) => {
    const temp = 22 + Math.floor(Math.random() * 15);
    return {
      temperatura: temp,
      descripcion: 'Parcialmente nublado',
      humedad: 60 + Math.floor(Math.random() * 30),
      viento: `${10 + Math.floor(Math.random() * 20)} km/h`,
      ciudad: ciudadNombre,
      icono: <FaCloudSun className="text-warning" />,
      iconColor: temp > 25 ? 'bg-warning' : 'bg-success',
      sensacion: temp + 2,
      presion: 1013,
      minTemp: temp - 3,
      maxTemp: temp + 5,
      actualizado: 'Datos simulados'
    };
  };

  // Obtener ubicación automática
  const obtenerUbicacionAuto = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // Reverse geocoding para obtener ciudad
            const geoResponse = await axios.get(
              `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`
            );
            
            if (geoResponse.data && geoResponse.data.length > 0) {
              const ciudadEncontrada = geoResponse.data[0].name;
              setCiudad(ciudadEncontrada);
              fetchClimaReal(ciudadEncontrada);
            }
          } catch (error) {
            console.log('Usando ciudad por defecto');
            fetchClimaReal();
          }
        },
        (error) => {
          console.log('Permiso de ubicación denegado');
          fetchClimaReal();
        },
        { timeout: 5000 }
      );
    } else {
      fetchClimaReal();
    }
  };

  // Función para obtener dólar (simulado por ahora)
  const fetchDolar = () => {
    // Datos simulados del dólar
    const dolarSimulado = {
      oficial_compra: 850,
      oficial_venta: 900,
      blue_compra: 980,
      blue_venta: 1000,
      variacion_blue: '+1.5%',
      actualizado: new Date().toLocaleTimeString('es-ES')
    };
    setDolar(dolarSimulado);
  };

  // Datos de noticias simuladas
  const cargarNoticias = () => {
    const noticiasSimuladas = [
      { id: 1, titulo: 'Mercado en alza', fuente: 'Económico', hora: '10:30', cambio: '+2.5%' },
      { id: 2, titulo: 'Nuevas medidas económicas', fuente: 'Finanzas', hora: '09:15', cambio: 'Análisis' },
      { id: 3, titulo: 'Sector turístico crece 15%', fuente: 'Turismo', hora: '08:45', cambio: 'Turismo' }
    ];
    setNoticias(noticiasSimuladas);
  };

  // Buscar clima por ciudad
  const handleBuscarClima = (e) => {
    e.preventDefault();
    if (ciudad.trim()) {
      fetchClimaReal(ciudad);
    }
  };

  // Recargar clima automáticamente cada 10 minutos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Cargar datos iniciales
    obtenerUbicacionAuto();
    fetchDolar();
    cargarNoticias();

    // Recargar clima cada 10 minutos
    const climaTimer = setInterval(() => {
      if (ciudad) {
        fetchClimaReal(ciudad);
      }
    }, 600000);

    return () => {
      clearInterval(timer);
      clearInterval(climaTimer);
    };
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <nav className="navbar navbar-light bg-white shadow-sm">
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1 fw-bold text-dark">Panel de Administración</span>
          <div className="d-flex align-items-center">
            <div className="me-4 d-none d-md-block">
              <small className="text-muted me-3">
                <FaCalendarDay className="me-1" />
                {formatDate(currentTime)}
              </small>
              <small className="text-muted">
                <FaClock className="me-1" />
                {currentTime.toLocaleTimeString('es-ES', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </small>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-outline-dark btn-sm d-flex align-items-center"
            >
              <FaSignOutAlt className="me-2" />
              Salir
            </button>
          </div>
        </div>
      </nav>

      <div className="container-fluid mt-3">
        <div className="row">
          {/* Columna izquierda - Widgets */}
          <div className="col-lg-4">
            {/* Widget Clima Actual */}
            <div className="card mb-3 border shadow-sm">
              <div className="card-header bg-white d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0 d-flex align-items-center">
                  <FaCloudSun className="me-2 text-primary" />
                  Clima en Tiempo Real
                  {loadingClima && <span className="spinner-border spinner-border-sm ms-2 text-primary"></span>}
                </h5>
                <button 
                  onClick={() => fetchClimaReal(ciudad)}
                  className="btn btn-sm btn-outline-primary"
                  disabled={loadingClima}
                  title="Actualizar"
                >
                  <FaSyncAlt className={loadingClima ? 'fa-spin' : ''} />
                </button>
              </div>
              
              <div className="card-body">
                {/* Buscador */}
                <form onSubmit={handleBuscarClima} className="mb-3">
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <FaMapMarkerAlt className="text-primary" />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Buscar ciudad..."
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                      disabled={loadingClima}
                    />
                    <button 
                      className="btn btn-primary" 
                      type="submit"
                      disabled={loadingClima || !ciudad.trim()}
                    >
                      {loadingClima ? 'Buscando...' : 'Buscar'}
                    </button>
                  </div>
                </form>

                {errorClima && (
                  <div className="alert alert-warning d-flex align-items-center mb-3 py-2">
                    <FaExclamationTriangle className="me-2" />
                    <small className="flex-grow-1">{errorClima}</small>
                  </div>
                )}

                {clima && (
                  <>
                    {/* Temperatura principal */}
                    <div className="text-center mb-4">
                      <div className={`d-inline-flex align-items-center justify-content-center ${clima.iconColor} text-white rounded-circle mb-3`} 
                           style={{ width: '120px', height: '120px' }}>
                        <div className="text-center">
                          <div className="display-4 fw-bold">{clima.temperatura}°</div>
                          <div className="small">C</div>
                        </div>
                      </div>
                      
                      <h4 className="text-dark mb-2 text-capitalize">
                        {clima.descripcion}
                      </h4>
                      
                      <div className="d-flex justify-content-center align-items-center mb-3">
                        <FaMapMarkerAlt className="me-2 text-danger" />
                        <span className="fw-bold text-dark">{clima.ciudad}</span>
                        {clima.pais && <span className="text-muted ms-1">, {clima.pais}</span>}
                      </div>
                    </div>

                    {/* Detalles del clima */}
                    <div className="row g-3">
                      <div className="col-6">
                        <div className="p-3 border rounded bg-light">
                          <div className="d-flex align-items-center mb-2">
                            <FaThermometerHalf className="text-info me-2" />
                            <div className="small text-muted">Sensación</div>
                          </div>
                          <div className="h4 fw-bold text-dark">{clima.sensacion}°C</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-3 border rounded bg-light">
                          <div className="d-flex align-items-center mb-2">
                            <FaTint className="text-primary me-2" />
                            <div className="small text-muted">Humedad</div>
                          </div>
                          <div className="h4 fw-bold text-dark">{clima.humedad}%</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-3 border rounded bg-light">
                          <div className="d-flex align-items-center mb-2">
                            <FaWind className="text-success me-2" />
                            <div className="small text-muted">Viento</div>
                          </div>
                          <div className="h4 fw-bold text-dark">{clima.viento}</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-3 border rounded bg-light">
                          <div className="d-flex align-items-center mb-2">
                            <FaTemperatureHigh className="text-warning me-2" />
                            <div className="small text-muted">Presión</div>
                          </div>
                          <div className="h4 fw-bold text-dark">{clima.presion} hPa</div>
                        </div>
                      </div>
                    </div>

                    {/* Temperaturas min/max */}
                    <div className="mt-4 p-3 border rounded bg-white">
                      <div className="row text-center">
                        <div className="col-6">
                          <div className="text-muted small">Mínima</div>
                          <div className="h3 fw-bold text-info">{clima.minTemp}°C</div>
                        </div>
                        <div className="col-6">
                          <div className="text-muted small">Máxima</div>
                          <div className="h3 fw-bold text-danger">{clima.maxTemp}°C</div>
                        </div>
                      </div>
                    </div>

                    {/* Última actualización */}
                    <div className="mt-3 text-center">
                      <small className="text-muted">
                        <FaClock className="me-1" />
                        Actualizado: {clima.actualizado}
                      </small>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Widget Noticias y Dólar */}
            <div className="card mb-3 border shadow-sm">
              <div className="card-header bg-white">
                <h5 className="card-title mb-0 d-flex align-items-center">
                  <FaNewspaper className="me-2 text-primary" />
                  Noticias Económicas
                </h5>
              </div>
              <div className="card-body p-0">
                <div className="list-group list-group-flush">
                  {noticias.map((noticia) => (
                    <div key={noticia.id} className="list-group-item border-bottom">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1 text-dark">{noticia.titulo}</h6>
                          <small className="text-muted">{noticia.fuente} • {noticia.hora}</small>
                        </div>
                        <span className={`badge ${
                          noticia.cambio === '+2.5%' ? 'bg-success' :
                          noticia.cambio === 'Análisis' ? 'bg-warning' : 'bg-info'
                        }`}>
                          {noticia.cambio}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Sección Dólar */}
                {dolar && (
                  <div className="p-3 border-top">
                    <h6 className="d-flex align-items-center mb-3 text-dark">
                      <FaDollarSign className="me-2 text-success" />
                      Dólar Hoy
                      <small className="text-muted ms-2">({dolar.actualizado})</small>
                    </h6>
                    <div className="row g-2">
                      <div className="col-6">
                        <div className="p-2 border rounded text-center">
                          <small className="text-muted d-block">Blue Compra</small>
                          <h5 className="fw-bold mt-1 text-dark">${dolar.blue_compra}</h5>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-2 border rounded text-center">
                          <small className="text-muted d-block">Blue Venta</small>
                          <h5 className="fw-bold mt-1 text-dark">${dolar.blue_venta}</h5>
                        </div>
                      </div>
                      <div className="col-12 mt-2">
                        <div className={`p-2 border rounded text-center ${dolar.variacion_blue.startsWith('+') ? 'border-success' : 'border-danger'}`}>
                          <small className="text-muted d-block">Variación Blue</small>
                          <h6 className={`fw-bold mt-1 ${dolar.variacion_blue.startsWith('+') ? 'text-success' : 'text-danger'}`}>
                            {dolar.variacion_blue}
                          </h6>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Widget Último acceso */}
            <div className="card mb-3 border shadow-sm">
              <div className="card-body text-center">
                <h5 className="card-title mb-3 text-dark">Último acceso</h5>
                <div className="p-3 border rounded bg-white">
                  <div className="h4 fw-bold text-dark mb-2">
                    {currentTime.toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="text-muted">
                    {currentTime.toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div className="mt-3 small text-muted">
                  Sesión activa
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha - Contenido principal */}
          <div className="col-lg-8">
            {/* Bienvenida */}
            <div className="card mb-3 border shadow-sm">
              <div className="card-body text-center py-4">
                <h3 className="card-title text-muted mb-3">Bienvenido</h3>
                <div className="bg-primary text-white d-inline-block px-5 py-2 rounded">
                  <h2 className="fw-bold mb-0">{user?.nombre}</h2>
                </div>
              </div>
            </div>

            {/* Vista General - Botones de navegación */}
            <div className="card mb-3 border shadow-sm">
              <div className="card-header bg-white">
                <h5 className="card-title mb-0">Vista General</h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  {navItems.map((item) => (
                    <div key={item.path} className="col-md-3 col-6">
                      <button
                        onClick={() => handleNavigation(item.path)}
                        className={`btn w-100 d-flex flex-column align-items-center p-3 ${
                          location.pathname === item.path 
                            ? 'btn-primary' 
                            : 'btn-outline-primary'
                        }`}
                      >
                        <span className="fs-3 mb-2">
                          {item.icon}
                        </span>
                        <span>{item.name}</span>
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Contenido dinámico */}
                <div className="mt-4 border rounded p-4 bg-white">
                  <Outlet />
                </div>
              </div>
            </div>

            {/* Navegación estilo barra */}
            <div className="card border shadow-sm">
              <div className="card-body p-0">
                <div className="bg-white">
                  <div className="d-flex justify-content-around py-2">
                    {navItems.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => handleNavigation(item.path)}
                        className={`btn btn-link text-decoration-none d-flex flex-column align-items-center ${
                          location.pathname === item.path 
                            ? 'text-primary' 
                            : 'text-secondary'
                        }`}
                      >
                        <span className="fs-5 mb-1">
                          {item.icon}
                        </span>
                        <small>{item.name}</small>
                        {location.pathname === item.path && (
                          <div className="mt-1" style={{ height: '3px', width: '20px', backgroundColor: '#0d6efd' }}></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Estadísticas rápidas */}
            <div className="card border shadow-sm mt-3">
              <div className="card-body">
                <h5 className="card-title mb-3">Estadísticas</h5>
                <div className="row text-center">
                  <div className="col-md-3 col-6 mb-3 mb-md-0">
                    <div className="p-2 border rounded bg-white">
                      <div className="fs-2 fw-bold text-primary">12</div>
                      <div className="text-muted">Cabañas</div>
                    </div>
                  </div>
                  <div className="col-md-3 col-6 mb-3 mb-md-0">
                    <div className="p-2 border rounded bg-white">
                      <div className="fs-2 fw-bold text-success">8</div>
                      <div className="text-muted">Reservas Hoy</div>
                    </div>
                  </div>
                  <div className="col-md-3 col-6">
                    <div className="p-2 border rounded bg-white">
                      <div className="fs-2 fw-bold text-warning">24</div>
                      <div className="text-muted">Total Reservas</div>
                    </div>
                  </div>
                  <div className="col-md-3 col-6">
                    <div className="p-2 border rounded bg-white">
                      <div className="fs-2 fw-bold text-info">95%</div>
                      <div className="text-muted">Ocupación</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
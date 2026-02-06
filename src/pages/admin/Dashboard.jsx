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
  FaTint,
  FaArrowUp,
  FaArrowDown,
  FaChartLine,
  FaExchangeAlt
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
  const [dolarData, setDolarData] = useState(null);
  const [loadingDolar, setLoadingDolar] = useState(false);
  const [errorDolar, setErrorDolar] = useState(null);
  const [noticias, setNoticias] = useState([]);

  // API Key OpenWeatherMap (mañana revisamos si ya funciona)
  const API_KEY = '22347c6e54b5d4167b420870fe929910';
  
  // API GRATIS de Dólar Argentina - SIN API KEY NECESARIO
  const DOLLAR_API_URL = 'https://dolarapi.com/v1/dolares';
  
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

  // Función para obtener datos del dólar EN TIEMPO REAL (API GRATIS)
  const fetchDolarData = async () => {
    try {
      setLoadingDolar(true);
      setErrorDolar(null);

      console.log('Obteniendo datos del dólar desde API...');
      const response = await axios.get(DOLLAR_API_URL, {
        timeout: 5000 // 5 segundos timeout
      });
      
      const data = response.data;
      console.log('Datos de dólar recibidos:', data);
      
      // Buscar los diferentes tipos de dólar en la respuesta
      const dolarBlue = data.find(d => d.nombre === 'Blue' || d.casa === 'blue');
      const dolarOficial = data.find(d => d.nombre === 'Oficial' || d.casa === 'oficial');
      const dolarBolsa = data.find(d => d.nombre === 'Bolsa' || d.casa === 'bolsa');
      const dolarContadoLiqui = data.find(d => d.nombre === 'Contado con liqui' || d.casa === 'contadoliqui');
      
      if (dolarBlue && dolarOficial) {
        // Calcular la brecha cambiaria
        const brecha = ((dolarBlue.venta / dolarOficial.venta - 1) * 100).toFixed(1);
        const diferencia = (dolarBlue.venta - dolarOficial.venta).toFixed(2);
        
        setDolarData({
          blue_compra: dolarBlue.compra,
          blue_venta: dolarBlue.venta,
          oficial_compra: dolarOficial.compra,
          oficial_venta: dolarOficial.venta,
          bolsa: dolarBolsa?.venta || 0,
          contado_liqui: dolarContadoLiqui?.venta || 0,
          fecha_actualizacion: dolarBlue.fechaActualizacion,
          actualizado: new Date().toLocaleTimeString('es-ES'),
          variacion: `+${brecha}%`,
          brecha: `${brecha}%`,
          diferencia: diferencia,
          fuente: 'DolarAPI'
        });
        
        console.log('Dólar blue actualizado:', dolarBlue.venta);
      } else {
        throw new Error('No se encontraron datos del dólar blue en la respuesta');
      }

    } catch (error) {
      console.error('Error obteniendo dólar:', error);
      setErrorDolar('Error temporal obteniendo datos del dólar. Reintentando...');
      
      // Datos simulados como respaldo temporal
      const datosSimulados = {
        blue_compra: 980,
        blue_venta: 1000,
        oficial_compra: 850,
        oficial_venta: 900,
        bolsa: 950,
        contado_liqui: 970,
        actualizado: new Date().toLocaleTimeString('es-ES'),
        variacion: '+11.1%',
        brecha: '11.1%',
        diferencia: '100.00',
        fuente: 'Datos simulados'
      };
      
      setDolarData(datosSimulados);
      
      // Reintentar en 30 segundos si hay error
      setTimeout(() => {
        fetchDolarData();
      }, 30000);
    } finally {
      setLoadingDolar(false);
    }
  };

  // Función para obtener clima real
  const fetchClimaReal = async (ciudadNombre = 'Buenos Aires') => {
    try {
      setLoadingClima(true);
      setErrorClima(null);

      // API de OpenWeatherMap
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

  // Datos de noticias simuladas (económicas realistas)
  const cargarNoticias = () => {
    const noticiasSimuladas = [
      { id: 1, titulo: 'BCRA anuncia nuevas medidas monetarias', fuente: 'Ámbito Financiero', hora: '10:30', cambio: '+2.5%', color: 'success' },
      { id: 2, titulo: 'Dólar blue sube $5 tras anuncio económico', fuente: 'Infobae', hora: '09:15', cambio: 'Análisis', color: 'warning' },
      { id: 3, titulo: 'Sector turístico crece 15% este trimestre', fuente: 'Clarín', hora: '08:45', cambio: 'Turismo', color: 'info' },
      { id: 4, titulo: 'Mercados reaccionan positivamente a reformas', fuente: 'La Nación', hora: '07:30', cambio: 'Alza', color: 'success' },
      { id: 5, titulo: 'Reservas del BCRA muestran recuperación', fuente: 'Reuters', hora: '06:20', cambio: 'Estable', color: 'secondary' }
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

  // Refrescar datos del dólar
  const handleRefreshDolar = () => {
    fetchDolarData();
  };

  // Recargar datos automáticamente
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Cargar datos iniciales
    obtenerUbicacionAuto();
    fetchDolarData(); // ¡ESTA ES LA API GRATIS DEL DÓLAR!
    cargarNoticias();

    // Recargar clima cada 10 minutos
    const climaTimer = setInterval(() => {
      if (ciudad) {
        fetchClimaReal(ciudad);
      }
    }, 600000);

    // Recargar dólar cada 5 minutos
    const dolarTimer = setInterval(() => {
      fetchDolarData();
    }, 300000);

    return () => {
      clearInterval(timer);
      clearInterval(climaTimer);
      clearInterval(dolarTimer);
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
            {/* Widget Dólar Argentina EN TIEMPO REAL */}
           {/* Widget Dólar Argentina - Visualización Mejorada */}
<div className="card mb-3 border shadow-sm">
  <div className="card-header bg-white d-flex justify-content-between align-items-center">
    <div className="d-flex align-items-center">
      <FaDollarSign className="me-2 text-success fs-5" />
      <h5 className="card-title mb-0 fw-bold">Dólar Hoy</h5>
      {loadingDolar && (
        <span className="spinner-border spinner-border-sm ms-2 text-success"></span>
      )}
    </div>
    <div className="d-flex align-items-center gap-2">
      <span className="badge bg-secondary fs-6">
        {dolarData?.actualizado || '--:--'}
      </span>
      <button 
        onClick={handleRefreshDolar}
        className="btn btn-sm btn-outline-success"
        disabled={loadingDolar}
        title="Actualizar"
      >
        <FaSyncAlt className={loadingDolar ? 'fa-spin' : ''} />
      </button>
    </div>
  </div>
  
  <div className="card-body p-0">
    {errorDolar && (
      <div className="alert alert-warning m-3 py-2 d-flex align-items-center">
        <FaExclamationTriangle className="me-2" />
        <small className="flex-grow-1">{errorDolar}</small>
      </div>
    )}

    {dolarData ? (
      <div className="p-3">
        {/* CABECERA PRINCIPAL - Dólar Blue */}
        <div className="text-center mb-4">
          <div className="position-relative d-inline-block">
            {/* Círculo con valor principal */}
            <div 
               className="rounded mb-3 d-flex align-items-center justify-content-center shadow"
      style={{ 
        width: '200px', 
        height: '100px',
        background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'
      }}
            >
              <div className="text-center text-white">
                <div className="display-3 fw-bold">${dolarData.blue_venta}</div>
                <div className="small opacity-90 mt-1">Blue Venta</div>
              </div>
            </div>
            
            {/* Badge de variación */}
            <div className="position-absolute top-0 end-0 translate-middle">
              <span className={`badge ${dolarData.variacion?.includes('+') ? 'bg-danger' : 'bg-success'} fs-6 px-3 py-2`}>
                {dolarData.variacion || '+0.0%'}
              </span>
            </div>
          </div>
          
          {/* Compra/Venta Blue */}
          <div className="d-flex justify-content-center gap-4 mb-4">
            <div className="text-center">
              <div className="text-muted small mb-1">Compra</div>
              <div className="fs-4 fw-bold text-dark">${dolarData.blue_compra}</div>
              <small className="text-muted">Blue</small>
            </div>
            <div className="vr"></div>
            <div className="text-center">
              <div className="text-muted small mb-1">Venta</div>
              <div className="fs-4 fw-bold text-success">${dolarData.blue_venta}</div>
              <small className="text-muted">Blue</small>
            </div>
          </div>
        </div>

        {/* COMPARACIÓN DE TIPOS DE DÓLAR - Grid de 3 columnas */}
        <div className="row g-3 mb-4">
          {/* Dólar Oficial */}
          <div className="col-md-4">
            <div className="card border h-100">
              <div className="card-header bg-white py-2">
                <h6 className="mb-0 d-flex align-items-center">
                  <FaDollarSign className="me-2 text-primary" />
                  Dólar Oficial
                </h6>
              </div>
              <div className="card-body text-center py-3">
                <div className="fs-2 fw-bold text-primary mb-2">${dolarData.oficial_venta}</div>
                <div className="text-muted small mb-3">Venta</div>
                <div className="d-flex justify-content-around">
                  <div>
                    <div className="text-muted small">Compra</div>
                    <div className="fw-bold">${dolarData.oficial_compra}</div>
                  </div>
                  <div className="vr"></div>
                  <div>
                    <div className="text-muted small">Dif.</div>
                    <div className={`fw-bold ${dolarData.diferencia > 0 ? 'text-danger' : 'text-success'}`}>
                      ${dolarData.diferencia}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dólar MEP / Bolsa */}
          <div className="col-md-4">
            <div className="card border h-100">
              <div className="card-header bg-white py-2">
                <h6 className="mb-0 d-flex align-items-center">
                  <FaChartLine className="me-2 text-warning" />
                  Dólar MEP
                </h6>
              </div>
              <div className="card-body text-center py-3">
                <div className="fs-2 fw-bold text-warning mb-2">${dolarData.bolsa}</div>
                <div className="text-muted small mb-3">Bolsa</div>
                <div className="d-flex justify-content-around">
                  <div>
                    <div className="text-muted small">Brecha</div>
                    <div className="fw-bold text-warning">{dolarData.brecha}</div>
                  </div>
                  <div className="vr"></div>
                  <div>
                    <div className="text-muted small">Vs. Oficial</div>
                    <div className={`fw-bold ${dolarData.variacion?.includes('+') ? 'text-danger' : 'text-success'}`}>
                      {dolarData.variacion}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dólar CCL */}
          <div className="col-md-4">
            <div className="card border h-100">
              <div className="card-header bg-white py-2">
                <h6 className="mb-0 d-flex align-items-center">
                  <FaExchangeAlt className="me-2 text-info" />
                  Dólar CCL
                </h6>
              </div>
              <div className="card-body text-center py-3">
                <div className="fs-2 fw-bold text-info mb-2">${dolarData.contado_liqui}</div>
                <div className="text-muted small mb-3">Contado con Liqui</div>
                <div className="d-flex justify-content-around">
                  <div>
                    <div className="text-muted small">Tipo</div>
                    <div className="fw-bold">CCL</div>
                  </div>
                  <div className="vr"></div>
                  <div>
                    <div className="text-muted small">Mercado</div>
                    <div className="fw-bold text-info">Capitales</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RESUMEN DE COMPARACIÓN */}
        <div className="card border">
          <div className="card-body p-3">
            <div className="row text-center">
              <div className="col-4 border-end">
                <div className="text-muted small mb-1">Blue vs. Oficial</div>
                <div className="h5 fw-bold text-warning">{dolarData.brecha}</div>
                <div className="small text-muted">Brecha</div>
              </div>
              <div className="col-4 border-end">
                <div className="text-muted small mb-1">Diferencia</div>
                <div className="h5 fw-bold text-danger">${dolarData.diferencia}</div>
                <div className="small text-muted">Entre Blue y Oficial</div>
              </div>
              <div className="col-4">
                <div className="text-muted small mb-1">Variación</div>
                <div className="h5 fw-bold text-success">{dolarData.variacion}</div>
                <div className="small text-muted">Último movimiento</div>
              </div>
            </div>
          </div>
        </div>

        {/* INFORMACIÓN DE ACTUALIZACIÓN */}
        <div className="mt-3 text-center">
          <div className="d-flex justify-content-center align-items-center text-muted small">
            <FaClock className="me-2" />
            <span>Actualizado: {dolarData.actualizado}</span>
          </div>
          <div className="mt-1">
            <small className={`badge ${dolarData.fuente?.includes('simulados') ? 'bg-warning' : 'bg-success'}`}>
              Fuente: {dolarData.fuente}
            </small>
          </div>
        </div>
      </div>
    ) : (
      <div className="text-center py-5">
        <div className="spinner-border text-success mb-3" style={{width: '3rem', height: '3rem'}}></div>
        <p className="text-muted mb-0">Cargando cotizaciones...</p>
      </div>
    )}
  </div>
</div>

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

            {/* Widget Noticias Económicas */}
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
                        <span className={`badge bg-${noticia.color}`}>
                          {noticia.cambio}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
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
          </div>
        </div>
      </div>
    </div>
  );
} 
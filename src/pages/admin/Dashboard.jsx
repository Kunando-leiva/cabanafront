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
  FaExchangeAlt,
  FaMoon,
  FaCloudMoon,
  FaBolt,
  FaSmog,
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
  const [pronostico, setPronostico] = useState([]);
  const [loadingPronostico, setLoadingPronostico] = useState(false);
  const [errorPronostico, setErrorPronostico] = useState(null);

  // API Key OpenWeatherMap
  const API_KEY = '22347c6e54b5d4167b420870fe929910';
  
  // API GRATIS de Dólar Argentina
  const DOLLAR_API_URL = 'https://dolarapi.com/v1/dolares';
  
  const navItems = [
    { path: '/admin/Dashboard', name: 'Inicio', icon: <FaTachometerAlt /> },
    { path: '/admin/cabanas', name: 'Cabañas', icon: <FaHotel /> },
    { path: '/admin/reservas', name: 'Reservas', icon: <FaCalendarCheck /> },
    { path: '/admin/imagenes', name: 'Imágenes', icon: <FaImages /> }
  ];

  // Función para obtener ícono según código de OpenWeatherMap y hora del día
  const getWeatherIcon = (iconCode, temp, horaActual = null) => {
    // Determinar si es de noche basado en la hora actual (si se proporciona)
    const esNoche = horaActual ? 
      (horaActual.getHours() >= 20 || horaActual.getHours() < 6) : 
      iconCode.includes('n');
    
    const iconMap = {
      '01d': { icon: <FaSun className="text-warning" />, color: 'bg-warning', desc: 'Soleado' },
      '01n': { icon: <FaMoon className="text-secondary" />, color: 'bg-secondary', desc: 'Despejado' },
      '02d': { icon: <FaCloudSun className="text-warning" />, color: 'bg-warning', desc: 'Parcialmente nublado' },
      '02n': { icon: <FaCloudMoon className="text-secondary" />, color: 'bg-secondary', desc: 'Parcialmente nublado' },
      '03d': { icon: <FaCloud className="text-secondary" />, color: 'bg-secondary', desc: 'Nublado' },
      '03n': { icon: <FaCloud className="text-secondary" />, color: 'bg-secondary', desc: 'Nublado' },
      '04d': { icon: <FaCloud className="text-secondary" />, color: 'bg-secondary', desc: 'Muy nublado' },
      '04n': { icon: <FaCloud className="text-secondary" />, color: 'bg-secondary', desc: 'Muy nublado' },
      '09d': { icon: <FaCloudRain className="text-info" />, color: 'bg-info', desc: 'Lluvia ligera' },
      '09n': { icon: <FaCloudRain className="text-info" />, color: 'bg-info', desc: 'Lluvia ligera' },
      '10d': { icon: <FaCloudShowersHeavy className="text-info" />, color: 'bg-info', desc: 'Lluvia' },
      '10n': { icon: <FaCloudShowersHeavy className="text-info" />, color: 'bg-info', desc: 'Lluvia' },
      '11d': { icon: <FaBolt className="text-danger" />, color: 'bg-danger', desc: 'Tormenta' },
      '11n': { icon: <FaBolt className="text-danger" />, color: 'bg-danger', desc: 'Tormenta' },
      '13d': { icon: <FaSnowflake className="text-info" />, color: 'bg-info', desc: 'Nieve' },
      '13n': { icon: <FaSnowflake className="text-info" />, color: 'bg-info', desc: 'Nieve' },
      '50d': { icon: <FaSmog className="text-secondary" />, color: 'bg-secondary', desc: 'Niebla' },
      '50n': { icon: <FaSmog className="text-secondary" />, color: 'bg-secondary', desc: 'Niebla' },
    };
    
    let result = iconMap[iconCode];
    
    if (!result) {
      if (esNoche) {
        result = { 
          icon: <FaMoon className="text-secondary" />, 
          color: 'bg-secondary', 
          desc: 'Despejado' 
        };
      } else {
        result = { 
          icon: <FaSun className="text-warning" />, 
          color: 'bg-warning', 
          desc: 'Soleado' 
        };
      }
    }
    
    // Ajustar color basado en temperatura
    if (esNoche) {
      if (temp > 25) result.color = 'bg-info';
      else if (temp > 15) result.color = 'bg-primary';
      else if (temp > 5) result.color = 'bg-secondary';
      else result.color = 'bg-dark';
    } else {
      if (temp > 30) result.color = 'bg-danger';
      else if (temp > 20) result.color = 'bg-warning';
      else if (temp > 10) result.color = 'bg-success';
      else result.color = 'bg-info';
    }
    
    return result;
  };

  // Función para obtener pronóstico semanal
  const fetchPronosticoSemanal = async (ciudadNombre = 'Buenos Aires') => {
    try {
      setLoadingPronostico(true);
      setErrorPronostico(null);

      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${ciudadNombre}&appid=${API_KEY}&units=metric&lang=es&cnt=40`
      );

      const data = response.data;
      const pronosticoPorDia = [];
      const diasProcesados = new Set();
      
      data.list.forEach(item => {
        const fecha = new Date(item.dt * 1000);
        const dia = fecha.toLocaleDateString('es-ES', { weekday: 'short' });
        const diaCompleto = fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' });
        const hora = fecha.getHours();
        
        if (hora >= 11 && hora <= 14 && !diasProcesados.has(diaCompleto)) {
          const weatherIcon = getWeatherIcon(item.weather[0].icon, item.main.temp, fecha);
          
          pronosticoPorDia.push({
            dia: dia,
            diaCompleto: diaCompleto,
            fecha: fecha,
            temperatura: Math.round(item.main.temp),
            temp_min: Math.round(item.main.temp_min),
            temp_max: Math.round(item.main.temp_max),
            descripcion: item.weather[0].description,
            icono: weatherIcon.icon,
            iconColor: weatherIcon.color,
            humedad: item.main.humidity,
            viento: `${Math.round(item.wind.speed * 3.6)} km/h`,
          });
          
          diasProcesados.add(diaCompleto);
        }
      });
      
      setPronostico(pronosticoPorDia.slice(0, 5));

    } catch (error) {
      console.error('Error obteniendo pronóstico:', error);
      setErrorPronostico('Error al obtener pronóstico semanal');
      setPronostico(generarPronosticoSimulado());
    } finally {
      setLoadingPronostico(false);
    }
  };

  // Generar pronóstico simulado
  const generarPronosticoSimulado = () => {
    const descripciones = [
      'Soleado', 'Parcialmente nublado', 'Nublado', 'Lluvias ligeras', 'Lluvias intensas'
    ];
    
    const pronosticoSimulado = [];
    const hoy = new Date();
    
    for (let i = 1; i <= 5; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      
      const temp = 20 + Math.floor(Math.random() * 15);
      const descIndex = Math.floor(Math.random() * descripciones.length);
      
      pronosticoSimulado.push({
        dia: fecha.toLocaleDateString('es-ES', { weekday: 'short' }),
        diaCompleto: fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' }),
        fecha: fecha,
        temperatura: temp,
        temp_min: temp - 3,
        temp_max: temp + 5,
        descripcion: descripciones[descIndex],
        icono: descIndex === 0 ? <FaSun className="text-warning" /> : 
               descIndex <= 2 ? <FaCloudSun className="text-warning" /> : 
               <FaCloudRain className="text-info" />,
        iconColor: temp > 25 ? 'bg-warning' : 'bg-info',
      });
    }
    
    return pronosticoSimulado;
  };

  // Función para obtener datos del dólar
  const fetchDolarData = async () => {
    try {
      setLoadingDolar(true);
      setErrorDolar(null);

      const response = await axios.get(DOLLAR_API_URL, {
        timeout: 5000
      });
      
      const data = response.data;
      
      const dolarBlue = data.find(d => d.nombre === 'Blue' || d.casa === 'blue');
      const dolarOficial = data.find(d => d.nombre === 'Oficial' || d.casa === 'oficial');
      const dolarBolsa = data.find(d => d.nombre === 'Bolsa' || d.casa === 'bolsa');
      const dolarContadoLiqui = data.find(d => d.nombre === 'Contado con liqui' || d.casa === 'contadoliqui');
      
      if (dolarBlue && dolarOficial) {
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
      } else {
        throw new Error('No se encontraron datos del dólar blue');
      }

    } catch (error) {
      console.error('Error obteniendo dólar:', error);
      setErrorDolar('Error temporal obteniendo datos del dólar. Reintentando...');
      
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

      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${ciudadNombre}&appid=${API_KEY}&units=metric&lang=es`
      );

      const data = response.data;
      const weatherIcon = getWeatherIcon(data.weather[0].icon, data.main.temp, new Date());
      const ahora = new Date();
      const esNoche = ahora.getHours() >= 20 || ahora.getHours() < 6;
      
      setClima({
        temperatura: Math.round(data.main.temp),
        descripcion: data.weather[0].description,
        humedad: data.main.humidity,
        viento: `${Math.round(data.wind.speed * 3.6)} km/h`,
        ciudad: data.name,
        esNoche: esNoche,
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
            
            const geoResponse = await axios.get(
              `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`
            );
            
            if (geoResponse.data && geoResponse.data.length > 0) {
              const ciudadEncontrada = geoResponse.data[0].name;
              setCiudad(ciudadEncontrada);
              fetchClimaReal(ciudadEncontrada);
              fetchPronosticoSemanal(ciudadEncontrada);
            }
          } catch (error) {
            console.log('Usando ciudad por defecto');
            fetchClimaReal();
            fetchPronosticoSemanal();
          }
        },
        (error) => {
          console.log('Permiso de ubicación denegado');
          fetchClimaReal();
          fetchPronosticoSemanal();
        },
        { timeout: 5000 }
      );
    } else {
      fetchClimaReal();
      fetchPronosticoSemanal();
    }
  };

  // Datos de noticias simuladas
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
      fetchPronosticoSemanal(ciudad);
    }
  };

  // Refrescar datos del dólar
  const handleRefreshDolar = () => {
    fetchDolarData();
  };

  // Refrescar pronóstico
  const handleRefreshPronostico = () => {
    fetchPronosticoSemanal(ciudad);
  };

  // Recargar datos automáticamente
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    obtenerUbicacionAuto();
    fetchDolarData();
    cargarNoticias();

    const climaTimer = setInterval(() => {
      if (ciudad) {
        fetchClimaReal(ciudad);
      }
    }, 600000);

    const dolarTimer = setInterval(() => {
      fetchDolarData();
    }, 300000);

    const pronosticoTimer = setInterval(() => {
      if (ciudad) {
        fetchPronosticoSemanal(ciudad);
      }
    }, 600000);

    return () => {
      clearInterval(timer);
      clearInterval(climaTimer);
      clearInterval(dolarTimer);
      clearInterval(pronosticoTimer);
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
            {/* Widget Dólar Argentina */}
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

                    {/* COMPARACIÓN DE TIPOS DE DÓLAR */}
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

                      {/* Dólar MEP */}
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
                  onClick={() => {
                    fetchClimaReal(ciudad);
                    fetchPronosticoSemanal(ciudad);
                  }}
                  className="btn btn-sm btn-outline-primary"
                  disabled={loadingClima || loadingPronostico}
                  title="Actualizar"
                >
                  <FaSyncAlt className={loadingClima || loadingPronostico ? 'fa-spin' : ''} />
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
                    {/* Temperatura principal - CON INDICADOR DÍA/NOCHE */}
                    <div className="text-center mb-4">
                      <div className="position-relative">
                        <div className={`d-inline-flex align-items-center justify-content-center ${clima.iconColor} text-white rounded-circle mb-3`} 
                             style={{ width: '120px', height: '120px' }}>
                          <div className="text-center">
                            <div className="display-4 fw-bold">{clima.temperatura}°</div>
                            <div className="small">C</div>
                          </div>
                        </div>
                        
                        {/* Indicador día/noche */}
                        {clima && (
                          <div className="position-absolute top-0 end-0 translate-middle">
                            <span className={`badge ${clima.esNoche ? 'bg-dark' : 'bg-warning'} px-2 py-1`}>
                              {clima.esNoche ? (
                                <>
                                  <FaMoon className="me-1" /> Noche
                                </>
                              ) : (
                                <>
                                  <FaSun className="me-1" /> Día
                                </>
                              )}
                            </span>
                          </div>
                        )}
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

            {/* Widget Pronóstico Semanal */}
            <div className="card mb-3 border shadow-sm">
              <div className="card-header bg-white d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0 d-flex align-items-center">
                  <FaCalendarDay className="me-2 text-info" />
                  Pronóstico 5 Días
                  {loadingPronostico && <span className="spinner-border spinner-border-sm ms-2 text-info"></span>}
                </h5>
                <div className="text-muted small">
                  {ciudad}
                </div>
              </div>
              
              <div className="card-body">
                {errorPronostico && (
                  <div className="alert alert-warning d-flex align-items-center mb-3 py-2">
                    <FaExclamationTriangle className="me-2" />
                    <small className="flex-grow-1">{errorPronostico}</small>
                  </div>
                )}

                {pronostico.length > 0 ? (
                  <>
                    {/* Días en línea para pantallas grandes */}
                    <div className="d-none d-md-block">
                      <div className="row g-2 text-center">
                        {pronostico.map((dia, index) => (
                          <div key={index} className="col">
                            <div className={`card border-0 ${index === 0 ? 'bg-light' : 'bg-white'}`}>
                              <div className="card-body py-3">
                                <div className="fw-bold text-dark mb-2">{dia.dia}</div>
                                <div className="small text-muted mb-2">
                                  {dia.diaCompleto.split(',')[1]}
                                </div>
                                <div className="my-3 fs-2">
                                  {dia.icono}
                                </div>
                                <div className="h4 fw-bold text-dark mb-1">
                                  {dia.temperatura}°
                                </div>
                                <div className="small text-muted text-capitalize">
                                  {dia.descripcion}
                                </div>
                                <div className="mt-2 d-flex justify-content-center gap-2">
                                  <div className="small text-info">
                                    <FaArrowDown className="me-1" />
                                    {dia.temp_min}°
                                  </div>
                                  <div className="small text-danger">
                                    <FaArrowUp className="me-1" />
                                    {dia.temp_max}°
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Versión compacta para móviles */}
                    <div className="d-md-none">
                      <div className="list-group list-group-flush">
                        {pronostico.map((dia, index) => (
                          <div key={index} className="list-group-item border-bottom">
                            <div className="d-flex justify-content-between align-items-center">
                              <div className="d-flex align-items-center">
                                <div className="me-3">
                                  <div className="fw-bold text-dark">{dia.dia}</div>
                                  <div className="small text-muted">
                                    {dia.diaCompleto.split(',')[1]}
                                  </div>
                                </div>
                                <div className="me-3 fs-4">
                                  {dia.icono}
                                </div>
                                <div>
                                  <div className="fw-bold text-dark">{dia.temperatura}°</div>
                                  <div className="small text-muted text-capitalize">
                                    {dia.descripcion}
                                  </div>
                                </div>
                              </div>
                              <div className="text-end">
                                <div className="d-flex gap-3">
                                  <div className="small text-info">
                                    <FaArrowDown className="me-1" />
                                    {dia.temp_min}°
                                  </div>
                                  <div className="small text-danger">
                                    <FaArrowUp className="me-1" />
                                    {dia.temp_max}°
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Leyenda */}
                    <div className="mt-3 pt-3 border-top text-center">
                      <div className="row small text-muted">
                        <div className="col-4">
                          <FaSun className="me-1 text-warning" />
                          Soleado
                        </div>
                        <div className="col-4">
                          <FaCloudSun className="me-1 text-secondary" />
                          Nublado
                        </div>
                        <div className="col-4">
                          <FaCloudRain className="me-1 text-info" />
                          Lluvia
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    {loadingPronostico ? (
                      <>
                        <div className="spinner-border text-info mb-3"></div>
                        <p className="text-muted">Cargando pronóstico...</p>
                      </>
                    ) : (
                      <p className="text-muted">No hay datos de pronóstico disponibles</p>
                    )}
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
          </div>
        </div>
      </div>
    </div>
  );
}
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import { Home } from './pages/Home';
// import './App.css';

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<Home />} />
//         {/* Agrega más rutas aquí */}
//       </Routes>
//     </Router>
//   );
// }

// export default App;
// src/App.js
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthRoute from './components/AuthRoute';
import AdminLayout from './components/AdminLayout'; // Crea este componente
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Importaciones de páginas
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Cabanas from './pages/admin/Cabanas';
import CreateCabana from './pages/admin/CreateCabana';
import EditCabana from './pages/admin/EditCabana';
import ReservasAdmin from './pages/admin/ReservasAdmin';
import CrearReservaAdmin from './pages/admin/CrearReservaAdmin';
import EditarReservaAdmin from './pages/admin/EditarReservaAdmin';
import AdminImages from './pages/admin/AdminImages'; // Asegúrate de crear este componente


// Páginas públicas
import HomePublico from './pages/cliente/HomePublico';
import CabanasPublico from './pages/cliente/CabanasPublico';
import CabanaDetalle from './pages/cliente/CabanaDetalle';
import Reservar from './pages/cliente/Reservar';
import ConfirmacionReserva from './pages/cliente/ConfirmacionReserva';
import Nosotros from './pages/cliente/Nosotros';
import Ubicacion from './pages/cliente/Ubicacion';
import Galeria from './pages/cliente/Galeria';
import Register from './pages/admin/Register'; // Asegúrate de crear este componente

function App() {
  return (
    
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<HomePublico />} />
        <Route path="/cabanas" element={<CabanasPublico />} />
        <Route path="/cabanas/:id" element={<CabanaDetalle />} />
        <Route path="/reservar/:id" element={<Reservar />} />
        <Route path="/confirmacion-reserva" element={<ConfirmacionReserva />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/ubicacion" element={<Ubicacion />} />
        <Route path="/galeria" element={<Galeria />} />
        
        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* register */}
        <Route path="/register" element={<Register />} />

        {/* Rutas protegidas */}
        
        {/* Área de administración */}
        <Route path="/admin" element={
          <AuthRoute allowedRoles={['admin']}>
            <AdminLayout />
          </AuthRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="cabanas" element={<Cabanas />} />
          <Route path="cabanas/crear" element={<CreateCabana />} />
          <Route path="cabanas/editar/:id" element={<EditCabana />} />
          <Route path="reservas" element={<ReservasAdmin />} />
          <Route path="reservas/crear" element={<CrearReservaAdmin />} />
          <Route path="/admin/reservas/crear" element={<CrearReservaAdmin />} />
          <Route path="/admin/reservas/editar/:id" element={<EditarReservaAdmin />} />
          <Route path="/admin/imagenes" element={<AdminImages />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
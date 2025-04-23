import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config'; // Asegúrate de que la ruta sea correcta

export default function EditCabana() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cabana, setCabana] = useState({
    nombre: '',
    descripcion: '',
    capacidad: 2,
    precio: 0,
    servicios: [],
    imagenes: []
  });

  useEffect(() => {
    const fetchCabana = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/cabanas/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setCabana({
          ...response.data,
          servicios: response.data.servicios || []
        });
      } catch (error) {
        alert('Error al cargar la cabaña');
        console.error('Error:', error);
        navigate('/admin/cabanas');
      } finally {
        setLoading(false);
      }
    };

    fetchCabana();
  }, [id, navigate, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCabana(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleServiciosChange = (e) => {
    const { value, checked } = e.target;
    setCabana(prev => {
      const currentServicios = prev.servicios || [];
      const servicios = checked 
        ? [...currentServicios, value]
        : currentServicios.filter(s => s !== value);
      return { ...prev, servicios };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.put(
        `${API_URL}/api/cabanas/${id}`,
        cabana,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      alert('Cabaña actualizada correctamente');
      navigate('/admin/cabanas');
    } catch (error) {
      alert('Error al actualizar la cabaña');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const serviciosDisponibles = [
    'Wifi',
    'Piscina',
    'Aire acondicionado',
    'Cocina',
    'Estacionamiento',
    'TV'
  ];

  return (
    <AdminLayout>
      <div className="container-fluid mt-4">
        <div className="card shadow">
          <div className="card-header bg-primary text-white">
            <h2 className="mb-0">Editar Cabaña</h2>
          </div>
          
          <div className="card-body">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    value={cabana.nombre}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Descripción</label>
                  <textarea
                    name="descripcion"
                    value={cabana.descripcion}
                    onChange={handleChange}
                    className="form-control"
                    rows={3}
                    required
                  />
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Capacidad</label>
                    <input
                      type="number"
                      name="capacidad"
                      value={cabana.capacidad}
                      onChange={handleChange}
                      min="1"
                      className="form-control"
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Precio por noche</label>
                    <input
                      type="number"
                      name="precio"
                      value={cabana.precio}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="form-control"
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label mb-2">Servicios</label>
                  <div className="row">
                    {serviciosDisponibles.map((servicio, index) => (
                      <div key={index} className="col-md-4 mb-2">
                        <div className="form-check">
                          <input
                            type="checkbox"
                            id={`servicio-${index}`}
                            value={servicio}
                            checked={cabana.servicios?.includes(servicio)}
                            onChange={handleServiciosChange}
                            className="form-check-input"
                          />
                          <label htmlFor={`servicio-${index}`} className="form-check-label">
                            {servicio}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/admin/cabanas')}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                        Guardando...
                      </>
                    ) : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
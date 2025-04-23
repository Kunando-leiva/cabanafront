import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

export default function DeleteCabana({ cabanaId, onSuccess, buttonLabel = '' }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { token } = useAuth();

  const handleDelete = async () => {
    const result = window.confirm(
      '¿Estás seguro? ¡No podrás revertir esta acción!'
    );

    if (result) {
      setIsDeleting(true);
      try {
        await axios.delete(`http://localhost:5000/api/cabanas/${cabanaId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        onSuccess(cabanaId);
        alert('La cabaña ha sido eliminada.');
      } catch (err) {
        alert(err.response?.data?.error || 'No se pudo eliminar la cabaña');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <button
      onClick={handleDelete}
      className={`btn btn-sm btn-danger ${buttonLabel ? 'px-3' : ''}`}
      disabled={isDeleting}
      title="Eliminar"
      style={{
        backgroundColor: '#dc3545',
        borderColor: '#dc3545',
        color: 'white',
        transition: 'all 0.3s',
      }}
    >
      {isDeleting ? (
        <>
          <span className="spinner-border spinner-border-sm me-1" role="status"></span>
          {buttonLabel && <span>Eliminando...</span>}
        </>
      ) : (
        <>
          <i className="fas fa-trash me-1"></i>
          {buttonLabel}
        </>
      )}
    </button>
  );
}

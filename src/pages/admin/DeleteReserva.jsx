import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Modal, Button } from 'react-bootstrap';

export default function DeleteReserva({ reservaId, onSuccess }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token } = useAuth();

  const handleDelete = async () => {
    setLoading(true);
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/reservas/admin/eliminar/${reservaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onSuccess(reservaId);
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        variant="danger" 
        size="sm" 
        onClick={() => setShowModal(true)}
        title="Eliminar"
        disabled={loading}
      >
        <i className="fas fa-trash"></i>
      </Button>

      <Modal show={showModal} onHide={() => !loading && setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Estás seguro de eliminar esta reserva? Esta acción no se puede deshacer.
          {error && <div className="alert alert-danger mt-2">{error}</div>}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowModal(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDelete} 
            disabled={loading}
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
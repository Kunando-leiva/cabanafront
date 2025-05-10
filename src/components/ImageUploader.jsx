import { useState } from 'react';
import { Button, Spinner, Alert, Form } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config'; // Asegúrate de importar API_URL

export default function ImageUploader({ cabanaId, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Por favor selecciona un archivo');
      return;
    }

    // Validación simple del cliente
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Formato no soportado. Use JPEG, PNG o GIF');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    if (cabanaId) formData.append('cabanaId', cabanaId);

    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.post(`${API_URL}/api/images/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      onUploadSuccess(res.data.image);
    } catch (err) {
      const serverError = err.response?.data?.error;
      const fileSizeError = err.message.includes('large');
      
      setError(
        serverError || 
        (fileSizeError ? 'El archivo es muy grande (máx 5MB)' : 'Error al subir imagen')
      );
      
      console.error('Error detallado:', err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group controlId="formImage" className="mb-3">
        <Form.Label>Seleccionar imagen</Form.Label>
        <Form.Control 
          type="file" 
          onChange={(e) => setFile(e.target.files[0])} 
          accept="image/jpeg, image/png, image/gif"
          required
        />
        <Form.Text muted>Formatos soportados: JPEG, PNG, GIF (Máx. 5MB)</Form.Text>
      </Form.Group>
      
      <Button variant="primary" type="submit" disabled={loading}>
        {loading ? <><Spinner size="sm" /> Subiendo...</> : 'Subir Imagen'}
      </Button>
      
      {error && (
        <Alert variant="danger" className="mt-3" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
    </Form>
  );
}
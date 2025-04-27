import React, { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { 
    hasError: false,
    error: null,       // Asegurar que error esté definido en el estado
    errorInfo: null 
  };

  static getDerivedStateFromError(error) {
    // Ignorar errores específicos de DOM
    if (error.message.includes("insertBefore") || 
        error.message.includes("removeChild")) {
      console.warn("Error de DOM ignorado:", error);
      return null; // No actualizar el estado para estos errores
    }
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Solo registrar errores importantes
    if (!error.message.includes("insertBefore") && 
        !error.message.includes("removeChild")) {
      console.error("Error capturado:", error, errorInfo);
    }
  }

  handleReload = () => window.location.reload();

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#ffecec',
          borderRadius: '8px',
          margin: '2rem'
        }}>
          <h2 style={{ color: '#d32f2f' }}>Error en la aplicación</h2>
          <p style={{ margin: '1rem 0' }}>Por favor recarga la página para continuar</p>
          <button
            onClick={this.handleReload}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#d32f2f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Recargar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
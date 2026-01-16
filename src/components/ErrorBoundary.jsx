import React, { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { 
    hasError: false,
    error: null,
    errorInfo: null,
    componentStack: '',
    timestamp: null,
    errorType: '',
    componentName: 'Desconocido'
  };

  static getDerivedStateFromError(error) {
    // NO ignorar ningún error - vamos a diagnosticar todos
    return { 
      hasError: true,
      error: error,
      errorType: error.name || 'UnknownError',
      timestamp: new Date().toISOString()
    };
  }

  componentDidCatch(error, errorInfo) {
    // DIAGNÓSTICO DETALLADO
    console.group('🚨 ERROR DETALLADO - ErrorBoundary');
    console.error('Mensaje:', error.message);
    console.error('Tipo:', error.name);
    console.error('Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();
    
    // Extraer nombre del componente que falló
    const componentMatch = errorInfo.componentStack.match(/at\s+(\w+)/);
    const componentName = componentMatch ? componentMatch[1] : 'Desconocido';
    
    // Capturar información para el estado
    this.setState({
      errorInfo: errorInfo,
      componentStack: errorInfo.componentStack,
      componentName: componentName
    });
    
    // Enviar a analytics (opcional)
    this.sendErrorToAnalytics(error, errorInfo, componentName);
  }

  sendErrorToAnalytics = (error, errorInfo, componentName) => {
    // Puedes enviar esto a tu servicio de monitoreo
    const errorData = {
      type: 'react_error',
      component: componentName,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };
    
    console.log('📊 Error para analytics:', errorData);
    
    // Ejemplo: enviar a tu backend
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorData)
    // });
  };

  // Función para diagnosticar errores de DOM específicos
  diagnoseDOMError = (error) => {
    const diagnostics = {
      isInsertBeforeError: error.message.includes('insertBefore'),
      isRemoveChildError: error.message.includes('removeChild'),
      isReactCalendar: this.state.componentName.includes('Calendar') || 
                       this.state.componentStack.includes('Calendar'),
      isDatePicker: this.state.componentName.includes('DatePicker') || 
                    this.state.componentStack.includes('DatePicker'),
      probableCause: ''
    };
    
    if (diagnostics.isInsertBeforeError || diagnostics.isRemoveChildError) {
      if (diagnostics.isReactCalendar || diagnostics.isDatePicker) {
        diagnostics.probableCause = 'Problema con react-calendar o react-datepicker. Posible conflicto de estado o re-renderizaciones.';
      } else {
        diagnostics.probableCause = 'Error de manipulación DOM. Componente intentó actualizar nodos removidos.';
      }
    }
    
    return diagnostics;
  };

  // Función para reparar errores específicos
  attemptFix = () => {
    const diagnostics = this.diagnoseDOMError(this.state.error);
    
    if (diagnostics.isReactCalendar) {
      // Solución específica para react-calendar
      console.log('🛠️ Intentando reparar react-calendar...');
      
      // 1. Limpiar localStorage/sessionStorage relacionado
      localStorage.removeItem('react-calendar-state');
      sessionStorage.removeItem('selected-dates');
      
      // 2. Forzar recarga del componente
      this.setState({ hasError: false }, () => {
        console.log('✅ ErrorBoundary reseteado. Recargando componente...');
        
        // Pequeño delay antes de recargar
        setTimeout(() => {
          window.location.reload();
        }, 100);
      });
      
      return true;
    }
    
    return false;
  };

  handleReload = () => {
    // Intentar reparar antes de recargar
    if (!this.attemptFix()) {
      window.location.reload();
    }
  };

  handleResetError = () => {
    // Resetear solo el ErrorBoundary (sin recargar toda la página)
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      componentStack: '',
      componentName: 'Desconocido'
    });
  };

  renderErrorDetails = () => {
    const { error, errorInfo, componentName, timestamp, componentStack } = this.state;
    const diagnostics = this.diagnoseDOMError(error);
    
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: '#fff5f5',
        borderRadius: '8px',
        margin: '2rem',
        border: '1px solid #fed7d7',
        maxWidth: '800px',
        marginLeft: 'auto',
        marginRight: 'auto'
      }}>
        <h2 style={{ color: '#c53030', marginBottom: '1rem' }}>
          ⚠️ Error en: <span style={{ color: '#2d3748' }}>{componentName}</span>
        </h2>
        
        <div style={{
          backgroundColor: 'white',
          padding: '1rem',
          borderRadius: '6px',
          marginBottom: '1rem',
          textAlign: 'left',
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          overflow: 'auto',
          maxHeight: '200px'
        }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Tipo:</strong> {error?.name || 'Unknown'}
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Mensaje:</strong> {error?.message || 'No message'}
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Hora:</strong> {timestamp ? new Date(timestamp).toLocaleString() : 'N/A'}
          </div>
          
          {diagnostics.probableCause && (
            <div style={{
              backgroundColor: '#feebc8',
              padding: '0.75rem',
              borderRadius: '4px',
              marginTop: '1rem',
              borderLeft: '4px solid #dd6b20'
            }}>
              <strong>🎯 Diagnóstico:</strong> {diagnostics.probableCause}
            </div>
          )}
          
          {process.env.NODE_ENV === 'development' && componentStack && (
            <details style={{ marginTop: '1rem' }}>
              <summary style={{ cursor: 'pointer', color: '#4a5568' }}>
                Ver detalles técnicos
              </summary>
              <pre style={{
                marginTop: '0.5rem',
                padding: '0.75rem',
                backgroundColor: '#f7fafc',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '0.75rem'
              }}>
                {componentStack}
              </pre>
            </details>
          )}
        </div>
        
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={this.handleReload}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#c53030',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#9b2c2c'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#c53030'}
          >
            🔄 Recargar página
          </button>
          
          {diagnostics.isReactCalendar && (
            <button
              onClick={() => {
                // Limpiar caché específica del calendario
                localStorage.removeItem('calendar-selection');
                localStorage.removeItem('occupied-dates');
                this.handleReload();
              }}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#2b6cb0',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2c5282'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#2b6cb0'}
            >
              🗓️ Limpiar calendario
            </button>
          )}
          
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={this.handleResetError}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#38a169',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#276749'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#38a169'}
            >
              🚀 Reintentar (dev)
            </button>
          )}
          
          <button
            onClick={() => window.history.back()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#4a5568',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#2d3748'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#4a5568'}
          >
            ↩️ Volver atrás
          </button>
        </div>
        
        <div style={{
          marginTop: '1.5rem',
          fontSize: '0.875rem',
          color: '#718096'
        }}>
          <p>
            <strong>💡 Sugerencias:</strong>
            <br />
            1. Intenta limpiar el caché del navegador
            <br />
            2. Verifica tu conexión a internet
            <br />
            3. Intenta en una ventana de incógnito
          </p>
        </div>
      </div>
    );
  };

  render() {
    if (this.state.hasError) {
      // En producción, mostrar mensaje amigable
      if (process.env.NODE_ENV === 'production') {
        return (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: '#ffecec',
            borderRadius: '8px',
            margin: '2rem'
          }}>
            <h2 style={{ color: '#d32f2f' }}>Algo salió mal</h2>
            <p style={{ margin: '1rem 0' }}>
              Estamos experimentando problemas técnicos. Por favor, recarga la página.
            </p>
            <button
              onClick={this.handleReload}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#d32f2f',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Recargar página
            </button>
          </div>
        );
      }
      
      // En desarrollo, mostrar detalles completos
      return this.renderErrorDetails();
    }

    return this.props.children;
  }
}
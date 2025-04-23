// src/components/ErrorBoundary.jsx
import React, { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg mx-auto my-8 max-w-md">
          <h2 className="text-xl font-bold mb-2">Algo salió mal</h2>
          <p>Por favor recarga la página o intenta nuevamente más tarde.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Recargar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
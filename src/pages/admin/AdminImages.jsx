import React, { useState, useEffect, useMemo } from 'react';
import { 
  Table, Button, Modal, message, Space, Card, Tag, Input, Pagination, 
  Image as AntImage, Tooltip, Badge, Select, Typography, Alert, Collapse 
} from 'antd';
import { 
  DeleteOutlined, EyeOutlined, SearchOutlined, LinkOutlined, 
  InfoCircleOutlined, ReloadOutlined, ExclamationCircleOutlined,
  BugOutlined, ApiOutlined, DatabaseOutlined 
} from '@ant-design/icons';
import axios from 'axios';
import { API_URL } from '../../config';
import AdminNav from '../../components/admin/AdminNav';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { Text } = Typography;
const { confirm } = Modal;
const { Panel } = Collapse;

const AdminImages = () => {
  // Estados del componente
  const [imagenes, setImagenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0
  });
  const [searchText, setSearchText] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [imageDetails, setImageDetails] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterVisibility, setFilterVisibility] = useState('all');
  const [diagnosticResults, setDiagnosticResults] = useState(null);
  const [testingEndpoints, setTestingEndpoints] = useState(false);

  // Función para formatear tamaño de archivo
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Función para formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return dayjs(dateString).format('DD/MM/YYYY HH:mm');
  };

  // 🔥🔥🔥 FUNCIÓN DE DIAGNÓSTICO - NUEVA
  // 🔥🔥🔥 FUNCIÓN DE DIAGNÓSTICO CORREGIDA
// 🔥🔥🔥 FUNCIÓN DE DIAGNÓSTICO MEJORADA Y ROBUSTA
const runDiagnostic = async () => {
  setTestingEndpoints(true);
  setDiagnosticResults(null);
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      message.error('No hay token de autenticación. Inicia sesión primero.');
      return;
    }

    message.info('🔍 Iniciando diagnóstico de endpoints...');
    
    // Usar IDs reales de las imágenes disponibles
    const sampleImages = imagenes.slice(0, 2); // Tomar primeras 2 imágenes
    const testEndpoints = [];

    // Endpoints GET (siempre deberían funcionar)
    testEndpoints.push(
      { method: 'GET', url: '/api/cabanas/images/all', description: 'Obtener todas las imágenes' }
    );

    // Si hay imágenes, probar endpoints específicos
    if (sampleImages.length > 0) {
      const firstImage = sampleImages[0];
      
      testEndpoints.push(
        { 
          method: 'GET', 
          url: `/api/images/${firstImage._id}`, 
          description: 'Obtener imagen específica por ID' 
        },
        { 
          method: 'DELETE', 
          url: `/api/images/${firstImage._id}`, 
          description: 'Eliminar imagen por ID (método principal)' 
        }
      );

      // Si la imagen está asignada a una cabaña, probar ese endpoint
      if (firstImage.cabanaId) {
        testEndpoints.push({
          method: 'DELETE', 
          url: `/api/cabanas/${firstImage.cabanaId}/images/${firstImage._id}`, 
          description: 'Eliminar imagen desde cabaña' 
        });
      }
    }

    // Endpoints alternativos
    testEndpoints.push(
      { 
        method: 'POST', 
        url: '/api/images/delete', 
        data: { docId: 'test-id', fileId: 'test-id' },
        description: 'Eliminar con POST (alternativa)' 
      },
      { 
        method: 'DELETE', 
        url: '/api/images', 
        data: { docId: 'test-id', fileId: 'test-id' },
        description: 'Eliminar con body en DELETE' 
      }
    );

    const results = [];
    
    for (const endpoint of testEndpoints) {
      let startTime = Date.now();
      let responseTime = 0;
      
      try {
        const config = {
          method: endpoint.method,
          url: `${API_URL}${endpoint.url}`,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 8000
        };

        // Agregar data solo si existe
        if (endpoint.data) {
          config.data = endpoint.data;
        }

        const response = await axios(config);
        responseTime = Date.now() - startTime;
        
        results.push({
          method: endpoint.method,
          url: endpoint.url,
          description: endpoint.description,
          status: '✅ FUNCIONA',
          statusCode: response.status,
          responseTime: `${responseTime}ms`,
          success: response.data?.success,
          message: response.data?.message || 'OK'
        });
        
      } catch (error) {
        responseTime = Date.now() - startTime;
        
        const errorData = {
          method: endpoint.method,
          url: endpoint.url,
          description: endpoint.description,
          status: '❌ FALLA',
          statusCode: error.response?.status || 0,
          responseTime: `${responseTime}ms`,
          error: error.response?.data?.error || error.message,
          errorType: error.code || 'Unknown'
        };

        // Clasificar el error
        if (error.response?.status === 404) {
          errorData.errorCategory = 'ENDPOINT_NO_ENCONTRADO';
          errorData.solution = 'El endpoint no existe. Verifica la ruta en el backend.';
        } else if (error.response?.status === 401 || error.response?.status === 403) {
          errorData.errorCategory = 'SIN_PERMISOS';
          errorData.solution = 'Falta autenticación o permisos insuficientes.';
        } else if (error.code === 'ECONNABORTED') {
          errorData.errorCategory = 'TIMEOUT';
          errorData.solution = 'El servidor tardó demasiado en responder.';
        } else if (!error.response) {
          errorData.errorCategory = 'SIN_CONEXION';
          errorData.solution = 'No hay conexión con el servidor.';
        }

        results.push(errorData);
      }
      
      // Pequeña pausa para no saturar el servidor
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    // Analizar resultados
    const workingEndpoints = results.filter(r => r.status === '✅ FUNCIONA');
    const deleteEndpoints = results.filter(r => r.method === 'DELETE');
    const workingDeleteEndpoints = deleteEndpoints.filter(r => r.status === '✅ FUNCIONA');

    // Generar recomendaciones
    const recommendations = [];
    
    if (workingDeleteEndpoints.length === 0) {
      recommendations.push({
        type: 'error',
        title: 'CRÍTICO: No hay endpoints DELETE funcionando',
        action: 'Necesitas agregar un endpoint DELETE en el backend.',
        code: `// En imageRoutes.js agrega:
router.delete('/:id', auth, isAdmin, deleteImage);`
      });
    } else {
      workingDeleteEndpoints.forEach(ep => {
        recommendations.push({
          type: 'success',
          title: `Usar este endpoint: ${ep.method} ${ep.url}`,
          action: `El frontend debería usar: ${ep.url}`
        });
      });
    }

    // Preparar reporte final
    const diagnosticReport = {
      timestamp: new Date().toLocaleString(),
      totalTests: testEndpoints.length,
      successfulTests: workingEndpoints.length,
      failedTests: results.length - workingEndpoints.length,
      deleteEndpointsWorking: workingDeleteEndpoints.length,
      deleteEndpointsTotal: deleteEndpoints.length,
      results: results,
      recommendations: recommendations,
      summary: `✅ ${workingEndpoints.length}/${results.length} endpoints funcionan`
    };

    setDiagnosticResults(diagnosticReport);
    
    // Mostrar alerta con resumen
    if (workingDeleteEndpoints.length > 0) {
      Modal.success({
        title: '✅ Diagnóstico completado',
        content: (
          <div>
            <p><strong>Resultado:</strong> {diagnosticReport.summary}</p>
            <p><strong>Endpoints DELETE funcionando:</strong> {workingDeleteEndpoints.length}</p>
            <p>Usa el endpoint: <code>{workingDeleteEndpoints[0]?.method} {workingDeleteEndpoints[0]?.url}</code></p>
          </div>
        )
      });
    } else {
      Modal.error({
        title: '❌ Problema detectado',
        width: 700,
        content: (
          <div>
            <p><strong>Ningún endpoint DELETE funciona.</strong></p>
            <p>Esto impide eliminar imágenes desde el panel de administración.</p>
            
            <div style={{ marginTop: 16, padding: 12, background: '#fff2e8', borderRadius: 4 }}>
              <h4>🔧 Solución:</h4>
              <p>Agrega este código a <code>imageRoutes.js</code>:</p>
              <pre style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '12px', 
                borderRadius: '4px',
                fontSize: '11px',
                overflow: 'auto'
              }}>
{`// Agrega esta línea a tus rutas:
router.delete('/:id', auth, isAdmin, deleteImage);

// Y asegúrate que deleteImage en imageController.js use:
// const { id } = req.params; // ✅ Correcto
// NO: const { docId, fileId } = req.body; // ❌ Incorrecto`}</pre>
            </div>
          </div>
        )
      });
    }

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    message.error(`Error: ${error.message}`);
  } finally {
    setTestingEndpoints(false);
  }
};

  // Generar recomendaciones basadas en los resultados
  const generateRecommendations = (results) => {
    const recommendations = [];
    
    // Verificar endpoints DELETE
    const deleteEndpoints = results.filter(r => r.method === 'DELETE');
    const workingDelete = deleteEndpoints.filter(r => r.status === '✅ FUNCIONA');
    
    if (workingDelete.length === 0) {
      recommendations.push({
        type: 'critical',
        message: '⚠️ NINGÚN endpoint DELETE funciona. Necesitas crear uno en el backend.',
        action: 'Agregar ruta DELETE /api/images/:id en imageRoutes.js'
      });
    } else {
      workingDelete.forEach(endpoint => {
        recommendations.push({
          type: 'success',
          message: `✅ Usa este endpoint: ${endpoint.method} ${endpoint.url}`,
          action: `Configurar frontend para usar: ${endpoint.url}`
        });
      });
    }
    
    // Verificar si hay imágenes sin cabaña
    const unassignedImages = imagenes.filter(img => !img.cabanaId && !img.cabanaNombre);
    if (unassignedImages.length > 0) {
      recommendations.push({
        type: 'warning',
        message: `ℹ️ Hay ${unassignedImages.length} imágenes sin asignar a cabañas`,
        action: 'Estas imágenes no se pueden eliminar con /api/cabanas/:id/images/:id'
      });
    }
    
    return recommendations;
  };

  // Definición de las columnas de la tabla
  const columns = useMemo(() => [
    {
      title: 'Miniatura',
      dataIndex: 'url',
      key: 'thumbnail',
      width: 100,
      render: (url, record) => (
        <div style={{ width: 80, height: 60, display: 'flex', alignItems: 'center', position: 'relative' }}>
          <AntImage
            src={url}
            width="100%"
            height="100%"
            style={{ 
              objectFit: 'cover', 
              borderRadius: 4,
              cursor: 'pointer'
            }}
            placeholder={
              <div style={{ 
                background: '#f0f0f0', 
                width: '100%', 
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4
              }}>
                <span style={{ color: '#999', fontSize: '10px' }}>Cargando...</span>
              </div>
            }
            fallback={
              <div style={{ 
                background: '#ffccc7', 
                width: '100%', 
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4
              }}>
                <span style={{ color: '#d4380d', fontSize: '10px' }}>Error</span>
              </div>
            }
            onClick={() => {
              setPreviewImage(url);
              setImageDetails(record);
              setPreviewVisible(true);
            }}
          />
          {record.isNew && (
            <Badge 
              count="Nueva" 
              style={{ 
                position: 'absolute',
                top: -8,
                right: -8,
                fontSize: '8px',
                padding: '0 4px',
                height: '16px',
                lineHeight: '16px'
              }} 
            />
          )}
        </div>
      )
    },
    {
      title: 'Nombre',
      dataIndex: 'filename',
      key: 'filename',
      sorter: (a, b) => (a.filename || '').localeCompare(b.filename || ''),
      render: (filename, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{filename || 'sin-nombre.jpg'}</div>
          {record.originalName && record.originalName !== filename && (
            <div style={{ fontSize: '11px', color: '#666' }}>
              Original: {record.originalName}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Tamaño',
      dataIndex: 'size',
      key: 'size',
      width: 100,
      render: (size) => (
        <Tooltip title={`${size || 0} bytes`}>
          <span>{formatFileSize(size)}</span>
        </Tooltip>
      ),
      sorter: (a, b) => (a.size || 0) - (b.size || 0)
    },
    {
      title: 'Tipo',
      dataIndex: 'mimeType',
      key: 'mimeType',
      width: 100,
      render: (mimeType) => {
        const type = mimeType?.split('/')[1]?.toUpperCase() || 'N/A';
        return <Tag color="blue">{type}</Tag>;
      }
    },
    {
      title: 'Visibilidad',
      dataIndex: 'isPublic',
      key: 'isPublic',
      width: 100,
      render: (isPublic) => (
        <Tag color={isPublic ? 'green' : 'orange'}>
          {isPublic ? 'Pública' : 'Privada'}
        </Tag>
      )
    },
    {
      title: 'Fecha',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => formatDate(date),
      sorter: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    },
    {
      title: 'Cabaña',
      dataIndex: 'cabanaNombre',
      key: 'cabanaNombre',
      width: 120,
      render: (cabanaNombre, record) => (
        <div>
          {cabanaNombre || record.relatedCabana ? (
            <Tooltip title={record.cabanaId ? `ID: ${record.cabanaId}` : ''}>
              <Tag color="purple">
                <LinkOutlined /> {cabanaNombre || record.relatedCabana?.nombre || 'Cabaña'}
              </Tag>
            </Tooltip>
          ) : (
            <Tag color="default">Sin asignar</Tag>
          )}
        </div>
      )
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Ver detalles">
            <Button
              type="text"
              icon={<InfoCircleOutlined />}
              onClick={() => {
                setPreviewImage(record.url);
                setImageDetails(record);
                setPreviewVisible(true);
              }}
            />
          </Tooltip>
          
          <Tooltip title="Eliminar">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
              loading={deletingId === record._id}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ], [deletingId]);

  // Obtener imágenes desde la API
  const fetchImages = async () => {
    setLoading(true);
    try {
      console.log('📡 Obteniendo imágenes...');
      
      const response = await axios.get(`${API_URL}/api/cabanas/images/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        timeout: 15000
      });
      
      console.log('✅ Respuesta del servidor:', response.data);
      
      let imagesData = [];
      
      if (response.data.success && Array.isArray(response.data.data)) {
        imagesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        imagesData = response.data;
      }
      
      // Preparar datos para la tabla
      const formattedImages = imagesData
        .filter(img => img && (img.url || img._id))
        .map((img, index) => ({
          key: img._id || `img-${index}`,
          _id: img._id,
          fileId: img.fileId || img._id,
          filename: img.filename || 'sin-nombre.jpg',
          originalName: img.originalName || img.filename,
          url: img.url,
          size: img.size || 0,
          mimeType: img.mimeType || 'image/jpeg',
          isPublic: img.isPublic !== false,
          isNew: img.isNew || false,
          createdAt: img.createdAt || new Date().toISOString(),
          cabanaId: img.cabanaId,
          cabanaNombre: img.cabanaNombre,
          relatedCabana: img.relatedCabana
        }));
      
      console.log(`📊 Imágenes formateadas: ${formattedImages.length}`);
      
      // Aplicar filtros
      let filteredImages = formattedImages;
      
      if (filterType === 'assigned') {
        filteredImages = filteredImages.filter(img => img.cabanaId || img.cabanaNombre || img.relatedCabana);
      } else if (filterType === 'unassigned') {
        filteredImages = filteredImages.filter(img => !img.cabanaId && !img.cabanaNombre && !img.relatedCabana);
      }
      
      if (filterVisibility === 'public') {
        filteredImages = filteredImages.filter(img => img.isPublic);
      } else if (filterVisibility === 'private') {
        filteredImages = filteredImages.filter(img => !img.isPublic);
      }
      
      // Aplicar búsqueda
      if (searchText) {
        const lowerSearch = searchText.toLowerCase();
        filteredImages = filteredImages.filter(img => 
          (img.filename || '').toLowerCase().includes(lowerSearch) ||
          (img.originalName || '').toLowerCase().includes(lowerSearch) ||
          (img.cabanaNombre || '').toLowerCase().includes(lowerSearch)
        );
      }

      setImagenes(filteredImages);
      setPagination(prev => ({
        ...prev,
        total: filteredImages.length,
        current: 1
      }));
      
    } catch (error) {
      console.error('❌ Error obteniendo imágenes:', error);
      message.error({
        content: 'Error al cargar las imágenes. Verifica la conexión.',
        duration: 5
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar imágenes con estrategia inteligente
  const handleDelete = async (record) => {
    if (!record || !record._id) {
      message.error('Datos de imagen no válidos');
      return;
    }

    confirm({
      title: '¿Eliminar esta imagen permanentemente?',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: (
        <div>
          <p><strong>Nombre:</strong> {record.filename}</p>
          <p><strong>Tamaño:</strong> {formatFileSize(record.size)}</p>
          <p><strong>ID:</strong> <Text type="secondary" copyable>{record._id}</Text></p>
          {record.cabanaNombre && (
            <p><strong>Cabaña:</strong> {record.cabanaNombre} (ID: {record.cabanaId})</p>
          )}
          <p style={{ color: '#ff4d4f', marginTop: '10px' }}>
            ⚠️ Esta acción no se puede deshacer.
          </p>
        </div>
      ),
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      width: 500,
      async onOk() {
        setDeletingId(record._id);
        
        try {
          console.log('🗑️ Iniciando eliminación inteligente...');
          
          // ESTRATEGIA 1: Si tiene cabaña, usar ese endpoint
          if (record.cabanaId) {
            try {
              const response = await axios.delete(
                `${API_URL}/api/cabanas/${record.cabanaId}/images/${record._id}`,
                {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  }
                }
              );
              
              if (response.data.success) {
                message.success('✅ Imagen eliminada desde la cabaña');
                setImagenes(prev => prev.filter(img => img._id !== record._id));
                return;
              }
            } catch (cabanaError) {
              console.log('❌ Eliminación por cabaña falló:', cabanaError.message);
            }
          }
          
          // ESTRATEGIA 2: Endpoint directo DELETE /api/images/:id
          try {
            const response = await axios.delete(
              `${API_URL}/api/images/${record._id}`,
              {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              }
            );
            
            if (response.data.success) {
              message.success('✅ Imagen eliminada directamente');
              setImagenes(prev => prev.filter(img => img._id !== record._id));
              return;
            }
          } catch (directError) {
            console.log('❌ Eliminación directa falló:', directError.message);
          }
          
          // ESTRATEGIA 3: DELETE con body
          try {
            const response = await axios({
              method: 'delete',
              url: `${API_URL}/api/images`,
              data: {
                docId: record._id,
                fileId: record.fileId || record._id
              },
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.data.success) {
              message.success('✅ Imagen eliminada con método alternativo');
              setImagenes(prev => prev.filter(img => img._id !== record._id));
              return;
            }
          } catch (bodyError) {
            console.log('❌ Eliminación con body falló:', bodyError.message);
          }
          
          // ESTRATEGIA 4: POST /api/images/delete
          try {
            const response = await axios.post(
              `${API_URL}/api/images/delete`,
              {
                docId: record._id,
                fileId: record.fileId || record._id
              },
              {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            
            if (response.data.success) {
              message.success('✅ Imagen eliminada con POST');
              setImagenes(prev => prev.filter(img => img._id !== record._id));
              return;
            }
          } catch (postError) {
            console.log('❌ Eliminación con POST falló:', postError.message);
          }
          
          // Si llegamos aquí, todos los métodos fallaron
          throw new Error('Todos los métodos de eliminación fallaron');
          
        } catch (error) {
          console.error('❌ Todos los métodos fallaron:', error);
          
          // Mostrar diagnóstico detallado
          Modal.error({
            title: 'No se pudo eliminar la imagen',
            width: 700,
            content: (
              <div>
                <Alert 
                  type="error" 
                  message="Todos los endpoints de eliminación fallaron" 
                  description="Esto indica que no hay ningún endpoint DELETE configurado correctamente en el backend."
                  style={{ marginBottom: 16 }}
                />
                
                <div style={{ marginTop: 16 }}>
                  <h4>📋 Información de la imagen:</h4>
                  <ul>
                    <li><strong>ID:</strong> {record._id}</li>
                    <li><strong>Nombre:</strong> {record.filename}</li>
                    <li><strong>Cabaña ID:</strong> {record.cabanaId || 'No asignada'}</li>
                  </ul>
                  
                  <h4>🔧 Solución:</h4>
                  <p>Necesitas agregar uno de estos endpoints al backend:</p>
                  <pre style={{ 
                    backgroundColor: '#f5f5f5', 
                    padding: '12px', 
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
{`// En imageRoutes.js, agrega:
router.delete('/:id', auth, isAdmin, deleteImage);

// Y asegúrate que deleteImage en imageController.js use req.params.id`}
                  </pre>
                  
                  <Button 
                    type="primary" 
                    onClick={() => runDiagnostic()}
                    icon={<BugOutlined />}
                    style={{ marginTop: 12 }}
                  >
                    Ejecutar diagnóstico de endpoints
                  </Button>
                </div>
              </div>
            )
          });
          
        } finally {
          setDeletingId(null);
        }
      },
      onCancel() {
        setDeletingId(null);
      }
    });
  };

  // Modal de vista previa
  const renderPreviewModal = () => (
    <Modal
      title="Detalles de la Imagen"
      open={previewVisible}
      footer={null}
      onCancel={() => {
        setPreviewVisible(false);
        setPreviewImage('');
        setImageDetails(null);
      }}
      width={800}
      destroyOnClose={true}
    >
      {imageDetails && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <AntImage
              src={previewImage}
              style={{ 
                maxWidth: '100%', 
                maxHeight: '400px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
              preview={false}
            />
          </div>
          
          <Card size="small" title="Información">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><strong>Nombre:</strong><div>{imageDetails.filename}</div></div>
              <div><strong>Tamaño:</strong><div>{formatFileSize(imageDetails.size)}</div></div>
              <div><strong>Tipo:</strong><div>{imageDetails.mimeType}</div></div>
              <div><strong>Visibilidad:</strong><div>
                <Tag color={imageDetails.isPublic ? 'green' : 'orange'}>
                  {imageDetails.isPublic ? 'Pública' : 'Privada'}
                </Tag>
              </div></div>
              <div><strong>Creada:</strong><div>{formatDate(imageDetails.createdAt)}</div></div>
              <div><strong>Asignada:</strong><div>
                {imageDetails.cabanaNombre || imageDetails.relatedCabana ? (
                  <Tag color="purple">{imageDetails.cabanaNombre || imageDetails.relatedCabana?.nombre || 'Cabaña'}</Tag>
                ) : (
                  <Tag color="default">Sin asignar</Tag>
                )}
              </div></div>
            </div>
            
            <div style={{ marginTop: '16px' }}>
              <strong>ID del documento:</strong>
              <div style={{ 
                fontSize: '12px', 
                fontFamily: 'monospace',
                backgroundColor: '#f5f5f5',
                padding: '8px',
                borderRadius: '4px',
                wordBreak: 'break-all',
                cursor: 'pointer'
              }}
              onClick={() => {
                navigator.clipboard.writeText(imageDetails._id);
                message.success('ID copiado al portapapeles');
              }}
              title="Click para copiar ID"
              >
                {imageDetails._id}
              </div>
            </div>
            
            <div style={{ marginTop: '8px' }}>
              <strong>URL:</strong>
              <div style={{ 
                fontSize: '12px', 
                fontFamily: 'monospace',
                backgroundColor: '#f5f5f5',
                padding: '8px',
                borderRadius: '4px',
                wordBreak: 'break-all',
                cursor: 'pointer'
              }}
              onClick={() => {
                navigator.clipboard.writeText(imageDetails.url);
                message.success('URL copiada al portapapeles');
              }}
              title="Click para copiar URL"
              >
                {imageDetails.url}
              </div>
            </div>
          </Card>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button 
              type="primary"
              onClick={() => window.open(imageDetails.url, '_blank')}
            >
              Abrir en nueva pestaña
            </Button>
            
            <Button 
              onClick={() => navigator.clipboard.writeText(imageDetails.url)}
            >
              Copiar URL
            </Button>
            
            <Button 
              danger
              loading={deletingId === imageDetails._id}
              onClick={() => {
                setPreviewVisible(false);
                setTimeout(() => handleDelete(imageDetails), 300);
              }}
            >
              Eliminar imagen
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );

// Panel de diagnóstico COMPLETO CORREGIDO
const renderDiagnosticPanel = () => {
  if (!diagnosticResults) return null;

  return (
    <Card 
      title={
        <Space>
          <BugOutlined />
          <span>Resultados del Diagnóstico</span>
          <Tag color="blue">{diagnosticResults.timestamp}</Tag>
        </Space>
      }
      style={{ margin: '16px 24px' }}
      extra={
        <Button 
          size="small" 
          onClick={() => setDiagnosticResults(null)}
        >
          Cerrar
        </Button>
      }
    >
      <Alert
        type={diagnosticResults.workingEndpoints > 0 ? "success" : "error"}
        message={`${diagnosticResults.workingEndpoints}/${diagnosticResults.totalEndpoints} endpoints funcionan`}
        description={diagnosticResults.workingEndpoints === 0 ? 
          "Ningún endpoint DELETE funciona. Necesitas configurar el backend." : 
          "Algunos endpoints están funcionando correctamente."
        }
        style={{ marginBottom: 16 }}
      />
      
      <Collapse defaultActiveKey={['results']}>
        <Panel header="📋 Resultados Detallados" key="results">
          <Table
            size="small"
            dataSource={diagnosticResults.results}
            rowKey={(record, index) => `result-${index}-${Date.now()}`}
            columns={[
              { 
                title: 'Método', 
                dataIndex: 'method', 
                key: 'method-col',
                width: 80,
                render: (method, record, index) => (
                  <Tag key={`method-tag-${index}`} color={method === 'GET' ? 'blue' : 'red'}>
                    {method}
                  </Tag>
                )
              },
              { 
                title: 'URL', 
                dataIndex: 'url', 
                key: 'url-col',
                render: (url, record, index) => (
                  <code key={`url-code-${index}`}>{url}</code>
                )
              },
              { 
                title: 'Descripción', 
                dataIndex: 'description', 
                key: 'description-col',
                width: 200 
              },
              { 
                title: 'Estado', 
                dataIndex: 'status', 
                key: 'status-col',
                width: 100,
                render: (status, record, index) => status.includes('✅') ? 
                  <Tag key={`status-tag-${index}`} color="success">OK</Tag> : 
                  <Tag key={`status-tag-${index}`} color="error">FALLA</Tag>
              },
              { 
                title: 'Código', 
                dataIndex: 'statusCode', 
                key: 'statusCode-col',
                width: 80,
                render: (code, record, index) => (
                  <Tag key={`code-tag-${index}`} color={code === 200 ? 'green' : 'red'}>
                    {code}
                  </Tag>
                )
              },
              { 
                title: 'Tiempo', 
                dataIndex: 'responseTime', 
                key: 'responseTime-col',
                width: 80 
              }
            ]}
            pagination={false}
          />
        </Panel>
        
        <Panel header="💡 Recomendaciones" key="recommendations">
          {diagnosticResults.recommendations?.map((rec, index) => (
            <Alert
              key={`rec-${index}`} // ✅ KEY ÚNICA
              type={rec.type}
              message={rec.message}
              description={rec.action}
              showIcon
              style={{ marginBottom: 8 }}
            />
          ))}
        </Panel>
      </Collapse>
    </Card>
  );
};

  // Efectos para cargar datos iniciales
  useEffect(() => {
    fetchImages();
  }, [searchText, filterType, filterVisibility]);

  // Calcular datos paginados
  const paginatedData = useMemo(() => {
    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return imagenes.slice(start, end);
  }, [imagenes, pagination.current, pagination.pageSize]);

  // Calcular estadísticas
  const stats = useMemo(() => ({
    total: imagenes.length,
    public: imagenes.filter(img => img.isPublic).length,
    private: imagenes.filter(img => !img.isPublic).length,
    assigned: imagenes.filter(img => img.cabanaId || img.cabanaNombre || img.relatedCabana).length,
    unassigned: imagenes.filter(img => !img.cabanaId && !img.cabanaNombre && !img.relatedCabana).length,
    totalSize: imagenes.reduce((sum, img) => sum + (img.size || 0), 0)
  }), [imagenes]);

  return (
    <div className="admin-images">
      <AdminNav />
      
      {/* 🔥 BOTÓN DE DIAGNÓSTICO EN EL HEADER */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              Gestión de Imágenes 
              <span style={{ fontSize: '14px', color: '#666', marginLeft: '8px' }}>
                ({stats.total} imágenes - {formatFileSize(stats.totalSize)})
              </span>
            </span>
            <Space>
              <Tooltip title="Ejecutar diagnóstico de endpoints">
                <Button 
                  icon={<BugOutlined />}
                  onClick={runDiagnostic}
                  loading={testingEndpoints}
                  type={diagnosticResults?.workingEndpoints === 0 ? "dashed" : "default"}
                  danger={diagnosticResults?.workingEndpoints === 0}
                >
                  Diagnosticar
                </Button>
              </Tooltip>
              
              <Button 
                icon={<ReloadOutlined />}
                onClick={fetchImages}
                loading={loading}
              >
                Actualizar
              </Button>
            </Space>
          </div>
        }
        style={{ margin: '24px' }}
        extra={
          <Space>
            <Select
              value={filterType}
              onChange={setFilterType}
              style={{ width: 120 }}
              placeholder="Filtrar por"
            >
              <Option value="all">Todas</Option>
              <Option value="assigned">Asignadas</Option>
              <Option value="unassigned">Sin asignar</Option>
            </Select>
            
            <Select
              value={filterVisibility}
              onChange={setFilterVisibility}
              style={{ width: 120 }}
              placeholder="Visibilidad"
            >
              <Option value="all">Todas</Option>
              <Option value="public">Públicas</Option>
              <Option value="private">Privadas</Option>
            </Select>
            
            <Search
              placeholder="Buscar imágenes..."
              allowClear
              enterButton={<SearchOutlined />}
              size="middle"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={() => {}}
              style={{ width: 250 }}
            />
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={paginatedData}
          rowKey="key"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} de ${total} imágenes`,
            pageSizeOptions: ['12', '24', '48', '96']
          }}
          onChange={(newPagination) => setPagination(newPagination)}
          scroll={{ x: 1200 }}
          size="middle"
          bordered
        />
      </Card>
      
      {/* Panel de diagnóstico */}
      {renderDiagnosticPanel()}
      
      {renderPreviewModal()}
      
      {/* Estadísticas */}
      <Card size="small" style={{ margin: '0 24px 24px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '12px', flexWrap: 'wrap', gap: '10px' }}>
          <div><strong>Total:</strong> {stats.total}</div>
          <div><strong>Públicas:</strong> {stats.public}</div>
          <div><strong>Privadas:</strong> {stats.private}</div>
          <div><strong>Asignadas:</strong> {stats.assigned}</div>
          <div><strong>Sin asignar:</strong> {stats.unassigned}</div>
          <div><strong>Tamaño total:</strong> {formatFileSize(stats.totalSize)}</div>
          <div><strong>Tamaño promedio:</strong> {formatFileSize(
            stats.totalSize / (stats.total || 1)
          )}</div>
        </div>
      </Card>
    </div>
  );
};

export default AdminImages;
import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Modal, message, Space, Card, Tag, Input, Pagination, Image as AntImage } from 'antd';
import { DeleteOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_URL } from '../../config';
import AdminNav from '../../components/admin/AdminNav';

const { Search } = Input;

const AdminImages = () => {
  // Estados del componente
  const [imagenes, setImagenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0
  });
  const [searchText, setSearchText] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  // Definición de las columnas de la tabla
  const columns = useMemo(() => [
  {
    title: 'Miniatura',
    dataIndex: 'url',
    key: 'thumbnail',
    render: (url) => (
      <div style={{ width: 80, height: 60, display: 'flex', alignItems: 'center' }}>
        <AntImage
          src={url}
          width="100%"
          height="100%"
          style={{ objectFit: 'cover', borderRadius: 4 }}
          placeholder={
            <div style={{ background: '#f0f0f0', width: '100%', height: '100%' }} />
          }
          fallback="https://via.placeholder.com/80x60?text=Error"
          preview={{
            visible: previewVisible && previewImage === url,
            src: url,
            onVisibleChange: (visible) => {
              if (!visible) {
                setPreviewVisible(false);
                setPreviewImage('');
              }
            }
          }}
          onClick={() => {
            setPreviewImage(url);
            setPreviewVisible(true);
          }}
        />
      </div>
    )
  },
    {
      title: 'Nombre',
      dataIndex: 'filename',
      key: 'filename',
      sorter: true,
    },
    {
      title: 'Tamaño',
      dataIndex: 'size',
      key: 'size',
      render: (size) => `${(size / 1024).toFixed(2)} KB`,
      sorter: (a, b) => a.size - b.size
    },
    {
      title: 'Visibilidad',
      dataIndex: 'isPublic',
      key: 'isPublic',
      render: (isPublic) => (
        <Tag color={isPublic ? 'green' : 'orange'}>
          {isPublic ? 'Pública' : 'Privada'}
        </Tag>
      )
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              setPreviewImage(record.url);
              setPreviewVisible(true);
            }}
          />
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDelete(record.fileId)}
          />
        </Space>
      )
    }
  ], [previewVisible, previewImage]);

  // Obtener imágenes desde la API
  const fetchImages = async (params = {}) => {
    setLoading(true);
    try {
      const { current, pageSize } = pagination;
      const response = await axios.get(`${API_URL}/api/images`, {
        params: {
          offset: (current - 1) * pageSize,
          limit: pageSize,
          search: searchText,
          ...params
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      setImagenes(response.data.data);
      setPagination({
        ...pagination,
        total: response.data.pagination.total,
      });
    } catch (error) {
      message.error('Error al cargar las imágenes');
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar una imagen
  const handleDelete = async (id) => {
    Modal.confirm({
      title: '¿Eliminar esta imagen?',
      content: 'Esta acción no se puede deshacer.',
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          const response = await axios.delete(`${API_URL}/api/images/${id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });

          if (response.data.success) {
            message.success(response.data.message);
            fetchImages();
          } else {
            message.error(response.data.error);
          }
        } catch (error) {
          console.error('Error deleting image:', error);
          let errorMessage = 'Error al eliminar la imagen';
          if (error.response) {
            if (error.response.status === 404) {
              errorMessage = 'Imagen no encontrada';
            } else if (error.response.status === 403) {
              errorMessage = 'No tienes permiso para eliminar esta imagen';
            } else if (error.response.data?.error) {
              errorMessage = error.response.data.error;
            }
          }
          message.error(errorMessage);
        }
      }
    });
  };

  // Efectos para cargar datos iniciales
  useEffect(() => {
    fetchImages();
  }, [pagination.current, pagination.pageSize, searchText]);

  return (
   
    <div className="admin-images">
      <AdminNav />
      <Card
        title="Gestión de Imágenes"
        extra={
          <Search
            placeholder="Buscar imágenes..."
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={(value) => {
              setSearchText(value);
              setPagination({ ...pagination, current: 1 });
            }}
            style={{ width: 300 }}
          />
        }
      >
        <Table
          columns={columns}
          dataSource={imagenes}
          rowKey="fileId"
          loading={loading}
          pagination={pagination}
          onChange={(newPagination) => setPagination(newPagination)}
          scroll={{ x: true }}
        />
      </Card>
    </div>
    
  );
};

export default AdminImages;
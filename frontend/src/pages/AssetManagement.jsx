import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  User, 
  Calendar, 
  MapPin, 
  Settings,
  Eye,
  UserPlus,
  RotateCcw,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';
import { API_ENDPOINTS } from '../config/api';
import './AssetManagement.css';

const AssetManagement = () => {
  usePageTitle('资产管理');
  
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [stats, setStats] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    brand: '',
    model: '',
    serialNumber: '',
    description: '',
    status: '可用',
    condition: '良好',
    purchaseDate: '',
    purchasePrice: '',
    vendor: '',
    warrantyExpiry: '',
    location: '',
    tags: [],
    isLoanable: true,
    priority: '中'
  });
  const [assignData, setAssignData] = useState({
    userId: '',
    purpose: '',
    expectedReturnDate: ''
  });
  const [returnData, setReturnData] = useState({
    condition: '良好',
    notes: ''
  });
  const [maintenanceData, setMaintenanceData] = useState({
    type: '保养',
    description: '',
    cost: '',
    technician: '',
    notes: ''
  });

  const categories = ['相机', '镜头', '三脚架', '稳定器', '灯光设备', '录音设备', '存储设备', '电脑设备', '其他'];
  const statuses = ['可用', '使用中', '维修中', '报废'];
  const conditions = ['全新', '良好', '一般', '需维修'];
  const priorities = ['低', '中', '高'];
  const maintenanceTypes = ['保养', '维修', '检查'];

  useEffect(() => {
    fetchAssets();
    fetchUsers();
    fetchStats();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.ASSETS, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAssets(data.data.assets);
      }
    } catch (error) {
      console.error('获取资产列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.USERS, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data.users.filter(user => user.role === 'member' || user.role === 'admin'));
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.ASSET_STATS, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  const handleAddAsset = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (key === 'tags') {
          formData[key].forEach(tag => formDataToSend.append('tags', tag));
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await fetch(API_ENDPOINTS.ASSETS, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });
      
      const data = await response.json();
      if (data.success) {
        setAssets([data.data.asset, ...assets]);
        setShowAddModal(false);
        resetForm();
        fetchStats();
        alert('资产添加成功');
      } else {
        alert(data.message || '添加失败');
      }
    } catch (error) {
      console.error('添加资产失败:', error);
      alert('网络错误，请重试');
    }
  };

  const handleEditAsset = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.ASSET_DETAIL(selectedAsset._id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      if (data.success) {
        setAssets(assets.map(asset => 
          asset._id === selectedAsset._id ? data.data.asset : asset
        ));
        setShowEditModal(false);
        setSelectedAsset(null);
        resetForm();
        alert('资产更新成功');
      } else {
        alert(data.message || '更新失败');
      }
    } catch (error) {
      console.error('更新资产失败:', error);
      alert('网络错误，请重试');
    }
  };

  const handleDeleteAsset = async (asset) => {
    if (!confirm(`确定要删除资产"${asset.name}"吗？此操作不可撤销。`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.ASSET_DETAIL(asset._id), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setAssets(assets.filter(a => a._id !== asset._id));
        fetchStats();
        alert('资产删除成功');
      } else {
        alert(data.message || '删除失败');
      }
    } catch (error) {
      console.error('删除资产失败:', error);
      alert('网络错误，请重试');
    }
  };

  const handleAssignAsset = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.ASSET_ASSIGN(selectedAsset._id), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(assignData)
      });
      
      const data = await response.json();
      if (data.success) {
        setAssets(assets.map(asset => 
          asset._id === selectedAsset._id ? data.data.asset : asset
        ));
        setShowAssignModal(false);
        setSelectedAsset(null);
        setAssignData({ userId: '', purpose: '', expectedReturnDate: '' });
        fetchStats();
        alert('设备分配成功');
      } else {
        alert(data.message || '分配失败');
      }
    } catch (error) {
      console.error('分配设备失败:', error);
      alert('网络错误，请重试');
    }
  };

  const handleReturnAsset = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.ASSET_RETURN(selectedAsset._id), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(returnData)
      });
      
      const data = await response.json();
      if (data.success) {
        setAssets(assets.map(asset => 
          asset._id === selectedAsset._id ? data.data.asset : asset
        ));
        setShowReturnModal(false);
        setSelectedAsset(null);
        setReturnData({ condition: '良好', notes: '' });
        fetchStats();
        alert('设备归还成功');
      } else {
        alert(data.message || '归还失败');
      }
    } catch (error) {
      console.error('归还设备失败:', error);
      alert('网络错误，请重试');
    }
  };

  const handleAddMaintenance = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.ASSET_MAINTENANCE(selectedAsset._id), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(maintenanceData)
      });
      
      const data = await response.json();
      if (data.success) {
        setAssets(assets.map(asset => 
          asset._id === selectedAsset._id ? data.data.asset : asset
        ));
        setShowMaintenanceModal(false);
        setSelectedAsset(null);
        setMaintenanceData({ type: '保养', description: '', cost: '', technician: '', notes: '' });
        fetchStats();
        alert('维修记录添加成功');
      } else {
        alert(data.message || '添加失败');
      }
    } catch (error) {
      console.error('添加维修记录失败:', error);
      alert('网络错误，请重试');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      brand: '',
      model: '',
      serialNumber: '',
      description: '',
      status: '可用',
      condition: '良好',
      purchaseDate: '',
      purchasePrice: '',
      vendor: '',
      warrantyExpiry: '',
      location: '',
      tags: [],
      isLoanable: true,
      priority: '中'
    });
  };

  const openEditModal = (asset) => {
    setSelectedAsset(asset);
    setFormData({
      name: asset.name,
      category: asset.category,
      brand: asset.brand || '',
      model: asset.model || '',
      serialNumber: asset.serialNumber,
      description: asset.description || '',
      status: asset.status,
      condition: asset.condition,
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '',
      purchasePrice: asset.purchasePrice || '',
      vendor: asset.vendor || '',
      warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.split('T')[0] : '',
      location: asset.location || '',
      tags: asset.tags || [],
      isLoanable: asset.isLoanable,
      priority: asset.priority
    });
    setShowEditModal(true);
  };

  const openAssignModal = (asset) => {
    setSelectedAsset(asset);
    setShowAssignModal(true);
  };

  const openReturnModal = (asset) => {
    setSelectedAsset(asset);
    setShowReturnModal(true);
  };

  const openMaintenanceModal = (asset) => {
    setSelectedAsset(asset);
    setShowMaintenanceModal(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case '可用':
        return <CheckCircle className="status-icon available" />;
      case '使用中':
        return <Clock className="status-icon in-use" />;
      case '维修中':
        return <Wrench className="status-icon maintenance" />;
      case '报废':
        return <XCircle className="status-icon retired" />;
      default:
        return <AlertTriangle className="status-icon" />;
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || asset.category === filterCategory;
    const matchesStatus = !filterStatus || asset.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return (
      <div className="asset-management-loading">
        <div className="loading-spinner"></div>
        <p>加载资产信息中...</p>
      </div>
    );
  }

  return (
    <div className="asset-management">
      <div className="container">
        {/* 页面头部 */}
        <div className="asset-header">
          <div className="header-left">
            <h1>
              <Package className="page-icon" />
              资产管理
            </h1>
            <p>管理社团设备资产，跟踪使用情况</p>
          </div>
          <button 
            className="add-asset-btn"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="btn-icon" />
            添加资产
          </button>
        </div>

        {/* 统计卡片 */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card total">
              <div className="stat-icon">
                <Package />
              </div>
              <div className="stat-info">
                <h3>{stats.overview.total}</h3>
                <p>总资产</p>
              </div>
            </div>
            <div className="stat-card available">
              <div className="stat-icon">
                <CheckCircle />
              </div>
              <div className="stat-info">
                <h3>{stats.overview.available}</h3>
                <p>可用</p>
              </div>
            </div>
            <div className="stat-card in-use">
              <div className="stat-icon">
                <Clock />
              </div>
              <div className="stat-info">
                <h3>{stats.overview.inUse}</h3>
                <p>使用中</p>
              </div>
            </div>
            <div className="stat-card maintenance">
              <div className="stat-icon">
                <Wrench />
              </div>
              <div className="stat-info">
                <h3>{stats.overview.maintenance}</h3>
                <p>维修中</p>
              </div>
            </div>
          </div>
        )}

        {/* 搜索和筛选 */}
        <div className="asset-controls">
          <div className="search-box">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="搜索资产名称、识别码、品牌或型号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-controls">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">所有分类</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">所有状态</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 资产列表 */}
        <div className="assets-grid">
          {filteredAssets.map(asset => (
            <div key={asset._id} className="asset-card">
              <div className="asset-header">
                <div className="asset-title">
                  <h3>{asset.name}</h3>
                  <span className="asset-category">{asset.category}</span>
                </div>
                <div className="asset-status">
                  {getStatusIcon(asset.status)}
                  <span className={`status-text ${asset.status}`}>{asset.status}</span>
                </div>
              </div>
              
              <div className="asset-info">
                <div className="info-row">
                  <span className="label">识别码:</span>
                  <span className="value">{asset.serialNumber}</span>
                </div>
                {asset.brand && (
                  <div className="info-row">
                    <span className="label">品牌:</span>
                    <span className="value">{asset.brand}</span>
                  </div>
                )}
                {asset.model && (
                  <div className="info-row">
                    <span className="label">型号:</span>
                    <span className="value">{asset.model}</span>
                  </div>
                )}
                <div className="info-row">
                  <span className="label">状态:</span>
                  <span className="value">{asset.condition}</span>
                </div>
                {asset.currentHolder && (
                  <div className="info-row">
                    <span className="label">持有人:</span>
                    <span className="value">{asset.holderName}</span>
                  </div>
                )}
                {asset.location && (
                  <div className="info-row">
                    <span className="label">位置:</span>
                    <span className="value">{asset.location}</span>
                  </div>
                )}
              </div>
              
              <div className="asset-actions">
                <button 
                  className="action-btn edit"
                  onClick={() => openEditModal(asset)}
                  title="编辑"
                >
                  <Edit className="btn-icon" />
                </button>
                
                {asset.status === '可用' && (
                  <button 
                    className="action-btn assign"
                    onClick={() => openAssignModal(asset)}
                    title="分配"
                  >
                    <UserPlus className="btn-icon" />
                  </button>
                )}
                
                {asset.status === '使用中' && (
                  <button 
                    className="action-btn return"
                    onClick={() => openReturnModal(asset)}
                    title="归还"
                  >
                    <RotateCcw className="btn-icon" />
                  </button>
                )}
                
                <button 
                  className="action-btn maintenance"
                  onClick={() => openMaintenanceModal(asset)}
                  title="维修记录"
                >
                  <Wrench className="btn-icon" />
                </button>
                
                <button 
                  className="action-btn delete"
                  onClick={() => handleDeleteAsset(asset)}
                  title="删除"
                  disabled={asset.status === '使用中'}
                >
                  <Trash2 className="btn-icon" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredAssets.length === 0 && (
          <div className="no-assets">
            <Package className="no-assets-icon" />
            <h3>暂无资产</h3>
            <p>还没有添加任何设备资产</p>
          </div>
        )}
      </div>

      {/* 添加资产模态框 */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>添加新资产</h2>
              <button 
                className="modal-close"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleAddAsset} className="asset-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>设备名称 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>设备类型 *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                  >
                    <option value="">选择类型</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>品牌</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>型号</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>设备识别码 *</label>
                  <input
                    type="text"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>设备状态</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({...formData, condition: e.target.value})}
                  >
                    {conditions.map(condition => (
                      <option key={condition} value={condition}>{condition}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>采购日期</label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>采购价格</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({...formData, purchasePrice: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>供应商</label>
                  <input
                    type="text"
                    value={formData.vendor}
                    onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>保修到期</label>
                  <input
                    type="date"
                    value={formData.warrantyExpiry}
                    onChange={(e) => setFormData({...formData, warrantyExpiry: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>存放位置</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>重要程度</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  >
                    {priorities.map(priority => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-group full-width">
                <label>描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div className="form-group full-width">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isLoanable}
                    onChange={(e) => setFormData({...formData, isLoanable: e.target.checked})}
                  />
                  可借用
                </label>
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={() => setShowAddModal(false)}>
                  取消
                </button>
                <button type="submit">
                  添加资产
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 其他模态框代码省略，类似结构 */}
    </div>
  );
};

export default AssetManagement;
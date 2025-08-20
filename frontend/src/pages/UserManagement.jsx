import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Edit, Search, Filter, Eye, EyeOff, Package, Plus, X } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';
import { API_ENDPOINTS } from '../config/api';
import './UserManagement.css';

const UserManagement = () => {
  usePageTitle('用户管理');
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // 添加用户表单数据
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    realName: '',
    role: 'user',
    ownedAssets: []
  });
  
  // 设备相关状态
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [currentAsset, setCurrentAsset] = useState({
    assetName: '',
    serialNumber: '',
    category: '',
    brand: '',
    model: '',
    condition: '良好',
    purchaseDate: '',
    notes: ''
  });
  
  const assetCategories = ['相机', '镜头', '三脚架', '稳定器', '灯光设备', '录音设备', '存储设备', '电脑设备', '其他'];
  const assetConditions = ['全新', '良好', '一般', '需维修'];
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // 获取当前用户信息
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let url = API_ENDPOINTS.USERS;
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('isActive', statusFilter === 'active');
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setUsers(data.data.users);
      } else {
        console.error('获取用户列表失败:', data.message);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 清除对应字段的错误
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.username.trim()) {
      errors.username = '请输入用户名';
    } else if (formData.username.length < 2 || formData.username.length > 20) {
      errors.username = '用户名长度必须在2-20个字符之间';
    }
    
    if (!formData.email.trim()) {
      errors.email = '请输入邮箱地址';
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      errors.email = '请输入有效的邮箱地址';
    }
    
    if (!formData.password.trim()) {
      errors.password = '请输入密码';
    } else if (formData.password.length < 6) {
      errors.password = '密码至少需要6个字符';
    } else if (!/^(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = '密码必须包含至少一个字母和一个数字';
    }
    
    if (!formData.realName.trim()) {
      errors.realName = '请输入真实姓名';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.USERS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // 添加成功，刷新用户列表
        await fetchUsers();
        setShowAddModal(false);
        setFormData({
          username: '',
          email: '',
          password: '',
          realName: '',
          role: 'user',
          ownedAssets: []
        });
        setCurrentAsset({
          assetName: '',
          serialNumber: '',
          category: '',
          brand: '',
          model: '',
          condition: '良好',
          purchaseDate: '',
          notes: ''
        });
        setShowAssetForm(false);
        alert('用户创建成功');
      } else {
        setFormErrors({ submit: data.message || '创建失败' });
      }
    } catch (error) {
      console.error('创建用户失败:', error);
      setFormErrors({ submit: '网络错误，请重试' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (user._id === currentUser?._id) {
      alert('不能删除自己的账户');
      return;
    }
    
    if (!confirm(`确定要删除用户"${user.username}"吗？此操作不可撤销，将同时删除该用户的所有作品。`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.USERS}/${user._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        // 从列表中移除已删除的用户
        setUsers(prev => prev.filter(u => u._id !== user._id));
        alert(data.message || '用户删除成功');
      } else {
        alert(data.message || '删除失败');
      }
    } catch (error) {
      console.error('删除用户失败:', error);
      alert('网络错误，请重试');
    }
  };

  const handleToggleStatus = async (user) => {
    if (user._id === currentUser?._id && user.isActive) {
      alert('不能禁用自己的账户');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.USERS}/${user._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !user.isActive })
      });
      
      const data = await response.json();
      if (data.success) {
        // 更新用户状态
        setUsers(prev => prev.map(u => 
          u._id === user._id ? { ...u, isActive: !u.isActive } : u
        ));
        alert(data.message);
      } else {
        alert(data.message || '操作失败');
      }
    } catch (error) {
      console.error('更新用户状态失败:', error);
      alert('网络错误，请重试');
    }
  };

  const handleRoleChange = async (user, newRole) => {
    if (user._id === currentUser?._id) {
      alert('不能修改自己的角色');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.USERS}/${user._id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      
      const data = await response.json();
      if (data.success) {
        // 更新用户角色
        setUsers(prev => prev.map(u => 
          u._id === user._id ? { ...u, role: newRole } : u
        ));
        alert(data.message);
      } else {
        alert(data.message || '操作失败');
      }
    } catch (error) {
      console.error('更新用户角色失败:', error);
      alert('网络错误，请重试');
    }
  };

  // 设备管理函数
  const handleAddAsset = () => {
    if (!currentAsset.assetName.trim() || !currentAsset.serialNumber.trim() || !currentAsset.category) {
      alert('请填写设备名称、识别码和类型');
      return;
    }
    
    // 检查识别码是否重复
    const isDuplicate = formData.ownedAssets.some(asset => asset.serialNumber === currentAsset.serialNumber);
    if (isDuplicate) {
      alert('设备识别码已存在');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      ownedAssets: [...prev.ownedAssets, { ...currentAsset, addedDate: new Date().toISOString() }]
    }));
    
    setCurrentAsset({
      assetName: '',
      serialNumber: '',
      category: '',
      brand: '',
      model: '',
      condition: '良好',
      purchaseDate: '',
      notes: ''
    });
    
    setShowAssetForm(false);
  };
  
  const handleRemoveAsset = (index) => {
    setFormData(prev => ({
      ...prev,
      ownedAssets: prev.ownedAssets.filter((_, i) => i !== index)
    }));
  };
  
  const handleAssetInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentAsset(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="user-management-loading">
        <div className="loading-spinner"></div>
        <p>加载用户列表中...</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="container">
        <div className="user-management-header">
          <div className="header-left">
            <Users className="header-icon" />
            <div>
              <h1>用户管理</h1>
              <p>管理社团成员账户</p>
            </div>
          </div>
          <button 
            className="btn-add-user"
            onClick={() => setShowAddModal(true)}
          >
            <UserPlus className="btn-icon" />
            添加用户
          </button>
        </div>

        {/* 搜索和筛选 */}
        <div className="user-filters">
          <div className="search-box">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="搜索用户名、姓名或邮箱..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-group">
            <Filter className="filter-icon" />
            <select 
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">全部角色</option>
              <option value="user">普通用户</option>
              <option value="member">社团社员</option>
              <option value="admin">管理员</option>
            </select>
            
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">全部状态</option>
              <option value="active">已启用</option>
              <option value="inactive">已禁用</option>
            </select>
          </div>
        </div>

        {/* 用户列表 */}
        <div className="users-table">
          <div className="table-header">
            <div className="col-user">用户信息</div>
            <div className="col-role">角色</div>
            <div className="col-status">状态</div>
            <div className="col-date">注册时间</div>
            <div className="col-actions">操作</div>
          </div>
          
          <div className="table-body">
            {users.map(user => (
              <div key={user._id} className="table-row">
                <div className="col-user">
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.realName.charAt(0)}
                    </div>
                    <div className="user-details">
                      <div className="user-name">{user.realName}</div>
                      <div className="user-username">@{user.username}</div>
                      <div className="user-email">{user.email}</div>
                      {user.ownedAssets && user.ownedAssets.length > 0 && (
                        <div className="user-assets">
                          <Package className="assets-icon" />
                          <span>{user.ownedAssets.length} 台设备</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="col-role">
                  <select 
                    value={user.role}
                    onChange={(e) => handleRoleChange(user, e.target.value)}
                    className={`role-select ${user.role}`}
                    disabled={user._id === currentUser?._id}
                  >
                    <option value="user">普通用户</option>
                    <option value="member">社团社员</option>
                    <option value="admin">管理员</option>
                  </select>
                </div>
                
                <div className="col-status">
                  <button 
                    className={`status-btn ${user.isActive ? 'active' : 'inactive'}`}
                    onClick={() => handleToggleStatus(user)}
                    disabled={user._id === currentUser?._id && user.isActive}
                  >
                    {user.isActive ? (
                      <>
                        <Eye className="status-icon" />
                        已启用
                      </>
                    ) : (
                      <>
                        <EyeOff className="status-icon" />
                        已禁用
                      </>
                    )}
                  </button>
                </div>
                
                <div className="col-date">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
                
                <div className="col-actions">
                  <button 
                    className="action-btn delete-btn"
                    onClick={() => handleDeleteUser(user)}
                    disabled={user._id === currentUser?._id}
                    title="删除用户"
                  >
                    <Trash2 className="action-icon" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {users.length === 0 && (
          <div className="no-users">
            <Users className="no-users-icon" />
            <h3>暂无用户</h3>
            <p>还没有找到符合条件的用户</p>
          </div>
        )}
      </div>

      {/* 添加用户模态框 */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>添加新用户</h3>
              <button 
                className="modal-close"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="add-user-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">用户名 *</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="请输入用户名"
                    className={`form-input ${formErrors.username ? 'error' : ''}`}
                  />
                  {formErrors.username && <span className="error-message">{formErrors.username}</span>}
                </div>
                
                <div className="form-group">
                  <label className="form-label">真实姓名 *</label>
                  <input
                    type="text"
                    name="realName"
                    value={formData.realName}
                    onChange={handleInputChange}
                    placeholder="请输入真实姓名"
                    className={`form-input ${formErrors.realName ? 'error' : ''}`}
                  />
                  {formErrors.realName && <span className="error-message">{formErrors.realName}</span>}
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">邮箱地址 *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="请输入邮箱地址"
                  className={`form-input ${formErrors.email ? 'error' : ''}`}
                />
                {formErrors.email && <span className="error-message">{formErrors.email}</span>}
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">密码 *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="请输入密码（至少6位，包含字母和数字）"
                    className={`form-input ${formErrors.password ? 'error' : ''}`}
                  />
                  {formErrors.password && <span className="error-message">{formErrors.password}</span>}
                </div>
                
                <div className="form-group">
                  <label className="form-label">角色</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="user">普通用户</option>
                    <option value="member">社团社员</option>
                    <option value="admin">管理员</option>
                  </select>
                </div>
              </div>
              
              {/* 设备信息部分 */}
              <div className="assets-section">
                <div className="section-header">
                  <h4>
                    <Package className="section-icon" />
                    持有设备
                  </h4>
                  <button 
                    type="button"
                    className="btn-add-asset"
                    onClick={() => setShowAssetForm(true)}
                  >
                    <Plus className="btn-icon" />
                    添加设备
                  </button>
                </div>
                
                {formData.ownedAssets.length > 0 && (
                  <div className="assets-list">
                    {formData.ownedAssets.map((asset, index) => (
                      <div key={index} className="asset-item">
                        <div className="asset-info">
                          <div className="asset-name">{asset.assetName}</div>
                          <div className="asset-details">
                            <span className="asset-category">{asset.category}</span>
                            <span className="asset-serial">#{asset.serialNumber}</span>
                            {asset.brand && <span className="asset-brand">{asset.brand}</span>}
                            {asset.model && <span className="asset-model">{asset.model}</span>}
                          </div>
                          <div className="asset-condition">{asset.condition}</div>
                        </div>
                        <button 
                          type="button"
                          className="btn-remove-asset"
                          onClick={() => handleRemoveAsset(index)}
                        >
                          <X className="btn-icon" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {showAssetForm && (
                  <div className="asset-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">设备名称 *</label>
                        <input
                          type="text"
                          name="assetName"
                          value={currentAsset.assetName}
                          onChange={handleAssetInputChange}
                          placeholder="请输入设备名称"
                          className="form-input"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">设备类型 *</label>
                        <select
                          name="category"
                          value={currentAsset.category}
                          onChange={handleAssetInputChange}
                          className="form-select"
                        >
                          <option value="">选择类型</option>
                          {assetCategories.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">设备识别码 *</label>
                        <input
                          type="text"
                          name="serialNumber"
                          value={currentAsset.serialNumber}
                          onChange={handleAssetInputChange}
                          placeholder="请输入设备识别码"
                          className="form-input"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">设备状态</label>
                        <select
                          name="condition"
                          value={currentAsset.condition}
                          onChange={handleAssetInputChange}
                          className="form-select"
                        >
                          {assetConditions.map(condition => (
                            <option key={condition} value={condition}>{condition}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">品牌</label>
                        <input
                          type="text"
                          name="brand"
                          value={currentAsset.brand}
                          onChange={handleAssetInputChange}
                          placeholder="请输入品牌"
                          className="form-input"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">型号</label>
                        <input
                          type="text"
                          name="model"
                          value={currentAsset.model}
                          onChange={handleAssetInputChange}
                          placeholder="请输入型号"
                          className="form-input"
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">购买日期</label>
                        <input
                          type="date"
                          name="purchaseDate"
                          value={currentAsset.purchaseDate}
                          onChange={handleAssetInputChange}
                          className="form-input"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">备注</label>
                        <input
                          type="text"
                          name="notes"
                          value={currentAsset.notes}
                          onChange={handleAssetInputChange}
                          placeholder="备注信息"
                          className="form-input"
                        />
                      </div>
                    </div>
                    
                    <div className="asset-form-actions">
                      <button 
                        type="button"
                        className="btn-cancel"
                        onClick={() => setShowAssetForm(false)}
                      >
                        取消
                      </button>
                      <button 
                        type="button"
                        className="btn-confirm"
                        onClick={handleAddAsset}
                      >
                        添加设备
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {formErrors.submit && (
                <div className="error-message submit-error">{formErrors.submit}</div>
              )}
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowAddModal(false)}
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="loading-spinner"></div>
                      创建中...
                    </>
                  ) : (
                    <>
                      <UserPlus className="btn-icon" />
                      创建用户
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
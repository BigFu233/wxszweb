import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Users, CheckCircle, Clock, AlertTriangle, Eye, Edit, Trash2, UserPlus } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';
import { API_ENDPOINTS } from '../config/api';
import './TaskManagement.css';

const TaskManagement = () => {
  usePageTitle('任务管理');
  const navigate = useNavigate();
  
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // 创建任务表单数据
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'both',
    deadline: '',
    priority: 'medium',
    category: '其他',
    requirements: {
      minFiles: '1',
      maxFiles: '5',
      specifications: ''
    },
    tags: [],
    isPublic: false
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  // 分配任务数据
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);

  // 获取当前用户信息
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchMembers();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('请先登录');
        navigate('/login');
        return;
      }
      
      const response = await fetch(`${API_ENDPOINTS.TASKS}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
         alert('登录已过期，请重新登录');
         localStorage.removeItem('token');
         localStorage.removeItem('user');
         navigate('/login');
         return;
       }
      
      const data = await response.json();
      if (data.success) {
        setTasks(data.data.tasks);
      } else {
        console.error('获取任务列表失败:', data.message);
      }
    } catch (error) {
      console.error('获取任务列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return;
      }
      
      const response = await fetch(`${API_ENDPOINTS.USERS}?role=member&limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
         alert('登录已过期，请重新登录');
         localStorage.removeItem('token');
         localStorage.removeItem('user');
         navigate('/login');
         return;
       }
      
      const data = await response.json();
      if (data.success) {
        setMembers(data.data.users);
      }
    } catch (error) {
      console.error('获取社员列表失败:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
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
    
    if (!formData.title.trim()) {
      errors.title = '请输入任务标题';
    }
    
    if (!formData.description.trim()) {
      errors.description = '请输入任务描述';
    }
    
    if (!formData.deadline) {
      errors.deadline = '请选择截止日期';
    } else if (new Date(formData.deadline) <= new Date()) {
      errors.deadline = '截止日期不能是过去时间';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    console.log('表单提交开始', formData);
    
    if (!validateForm()) {
      console.log('表单验证失败', formErrors);
      console.log('当前表单数据:', formData);
      // 显示具体的验证错误
      const errorMessages = Object.values(formErrors).join(', ');
      alert(`表单验证失败: ${errorMessages}`);
      return;
    }

    setSubmitting(true);
    console.log('开始提交任务数据');
    
    try {
      const token = localStorage.getItem('token');
      
      // 准备提交数据，确保数字字段是数字类型
      const submitData = {
        ...formData,
        requirements: {
          ...formData.requirements,
          minFiles: parseInt(formData.requirements.minFiles, 10) || 1,
          maxFiles: parseInt(formData.requirements.maxFiles, 10) || 5
        }
      };
      
      console.log('发送API请求到:', API_ENDPOINTS.TASKS);
      console.log('请求数据:', submitData);
      
      const response = await fetch(`${API_ENDPOINTS.TASKS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });
      
      console.log('API响应状态:', response.status);
      const data = await response.json();
      console.log('API响应数据:', data);
      
      if (data.success) {
        await fetchTasks();
        setShowCreateModal(false);
        resetForm();
        alert('任务创建成功');
      } else {
        console.log('创建失败:', data.message);
        setFormErrors({ submit: data.message || '创建失败' });
      }
    } catch (error) {
      console.error('创建任务失败:', error);
      setFormErrors({ submit: '网络错误，请重试' });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'both',
      deadline: '',
      priority: 'medium',
      category: '其他',
      requirements: {
        minFiles: '1',
        maxFiles: '5',
        specifications: ''
      },
      tags: [],
      isPublic: false
    });
    setFormErrors({});
    setSubmitting(false);
  };

  const handleAssignTask = async () => {
    if (selectedMembers.length === 0) {
      alert('请选择要分配的社员');
      return;
    }

    setAssignLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.TASKS}/${selectedTask._id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userIds: selectedMembers })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchTasks();
        setShowAssignModal(false);
        setSelectedMembers([]);
        setSelectedTask(null);
        alert('任务分配成功');
      } else {
        alert(data.message || '分配失败');
      }
    } catch (error) {
      console.error('分配任务失败:', error);
      alert('网络错误，请重试');
    } finally {
      setAssignLoading(false);
    }
  };

  const handlePublishTask = async (task) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.TASKS}/${task._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'published' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchTasks();
        alert('任务发布成功');
      } else {
        alert(data.message || '发布失败');
      }
    } catch (error) {
      console.error('发布任务失败:', error);
      alert('网络错误，请重试');
    }
  };

  const handleDeleteTask = async (task) => {
    if (!confirm(`确定要删除任务"${task.title}"吗？此操作不可撤销。`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.TASKS}/${task._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setTasks(prev => prev.filter(t => t._id !== task._id));
        alert('任务删除成功');
      } else {
        alert(data.message || '删除失败');
      }
    } catch (error) {
      console.error('删除任务失败:', error);
      alert('网络错误，请重试');
    }
  };

  const openAssignModal = (task) => {
    setSelectedTask(task);
    setSelectedMembers(task.assignedTo.map(a => a.user._id));
    setShowAssignModal(true);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#e74c3c';
      case 'high': return '#f39c12';
      case 'medium': return '#3498db';
      case 'low': return '#95a5a6';
      default: return '#3498db';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return '#95a5a6';
      case 'published': return '#3498db';
      case 'completed': return '#27ae60';
      case 'cancelled': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="task-management-loading">
        <div className="loading-spinner"></div>
        <p>加载任务列表中...</p>
      </div>
    );
  }

  return (
    <div className="task-management">
      <div className="container">
        <div className="task-management-header">
          <div className="header-left">
            <Calendar className="header-icon" />
            <div>
              <h1>任务管理</h1>
              <p>发布和管理社团任务</p>
            </div>
          </div>
          {currentUser && currentUser.role === 'admin' && (
              <button 
                className="btn-create-task"
                onClick={() => {
                  console.log('创建任务按钮被点击');
                  setShowCreateModal(true);
                  resetForm();
                }}
              >
                <Plus className="btn-icon" />
                创建任务
              </button>
            )}
        </div>

        {/* 任务列表 */}
        <div className="tasks-grid">
          {tasks.map(task => (
            <div key={task._id} className="task-card">
              <div className="task-header">
                <div className="task-title-row">
                  <h3 className="task-title">{task.title}</h3>
                  <div className="task-badges">
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(task.priority) }}
                    >
                      {task.priority === 'urgent' ? '紧急' : 
                       task.priority === 'high' ? '高' :
                       task.priority === 'medium' ? '中' : '低'}
                    </span>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(task.status) }}
                    >
                      {task.status === 'draft' ? '草稿' :
                       task.status === 'published' ? '已发布' :
                       task.status === 'completed' ? '已完成' : '已取消'}
                    </span>
                  </div>
                </div>
                <p className="task-description">{task.description}</p>
              </div>
              
              <div className="task-info">
                <div className="task-meta">
                  <div className="meta-item">
                    <Calendar className="meta-icon" />
                    <span>截止: {formatDate(task.deadline)}</span>
                  </div>
                  <div className="meta-item">
                    <Users className="meta-icon" />
                    <span>分配: {task.assignedTo.length}人</span>
                  </div>
                  <div className="meta-item">
                    <CheckCircle className="meta-icon" />
                    <span>完成率: {task.completionRate}%</span>
                  </div>
                </div>
                
                {task.assignedTo.length > 0 && (
                  <div className="assigned-members">
                    <h4>分配给:</h4>
                    <div className="members-list">
                      {task.assignedTo.slice(0, 3).map(assignment => (
                        <div key={assignment.user._id} className="member-item">
                          <div className="member-avatar">
                            {assignment.user.realName.charAt(0)}
                          </div>
                          <span className="member-name">{assignment.user.realName}</span>
                          <span className={`member-status ${assignment.status}`}>
                            {assignment.status === 'pending' ? '待开始' :
                             assignment.status === 'in_progress' ? '进行中' :
                             assignment.status === 'completed' ? '已完成' : '已提交'}
                          </span>
                        </div>
                      ))}
                      {task.assignedTo.length > 3 && (
                        <span className="more-members">+{task.assignedTo.length - 3}人</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="task-actions">
                {task.status === 'draft' && (
                  <button 
                    className="action-btn publish-btn"
                    onClick={() => handlePublishTask(task)}
                    title="发布任务"
                  >
                    <CheckCircle className="action-icon" />
                    发布
                  </button>
                )}
                <button 
                  className="action-btn assign-btn"
                  onClick={() => openAssignModal(task)}
                  title="分配任务"
                >
                  <UserPlus className="action-icon" />
                  分配
                </button>
                <button 
                  className="action-btn view-btn"
                  onClick={() => window.open(`/tasks/${task._id}`, '_blank')}
                  title="查看详情"
                >
                  <Eye className="action-icon" />
                  查看
                </button>
                <button 
                  className="action-btn delete-btn"
                  onClick={() => handleDeleteTask(task)}
                  title="删除任务"
                >
                  <Trash2 className="action-icon" />
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>

        {tasks.length === 0 && (
          <div className="no-tasks">
            <Calendar className="no-tasks-icon" />
            <h3>暂无任务</h3>
            <p>点击"创建任务"开始发布第一个任务</p>
          </div>
        )}
      </div>

      {/* 创建任务模态框 */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3>创建新任务</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateTask} className="create-task-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">任务标题 *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="请输入任务标题"
                    className={`form-input ${formErrors.title ? 'error' : ''}`}
                  />
                  {formErrors.title && <span className="error-message">{formErrors.title}</span>}
                </div>
                
                <div className="form-group">
                  <label className="form-label">任务类型</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="photo">摄影作品</option>
                    <option value="video">视频作品</option>
                    <option value="both">摄影或视频</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">任务描述 *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="请详细描述任务要求和目标..."
                  className={`form-textarea ${formErrors.description ? 'error' : ''}`}
                  rows={4}
                />
                {formErrors.description && <span className="error-message">{formErrors.description}</span>}
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">截止日期 *</label>
                  <input
                    type="datetime-local"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleInputChange}
                    className={`form-input ${formErrors.deadline ? 'error' : ''}`}
                  />
                  {formErrors.deadline && <span className="error-message">{formErrors.deadline}</span>}
                </div>
                
                <div className="form-group">
                  <label className="form-label">优先级</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                    <option value="urgent">紧急</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">作品分类</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="人像">人像</option>
                    <option value="风景">风景</option>
                    <option value="街拍">街拍</option>
                    <option value="建筑">建筑</option>
                    <option value="纪录片">纪录片</option>
                    <option value="微电影">微电影</option>
                    <option value="MV">MV</option>
                    <option value="广告">广告</option>
                    <option value="活动记录">活动记录</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">文件要求</label>
                  <div className="file-requirements">
                    <input
                      type="number"
                      name="requirements.minFiles"
                      value={formData.requirements.minFiles}
                      onChange={handleInputChange}
                      placeholder="最少"
                      min="1"
                      max="10"
                      className="form-input small"
                    />
                    <span>-</span>
                    <input
                      type="number"
                      name="requirements.maxFiles"
                      value={formData.requirements.maxFiles}
                      onChange={handleInputChange}
                      placeholder="最多"
                      min="1"
                      max="10"
                      className="form-input small"
                    />
                    <span>个文件</span>
                  </div>
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">具体要求</label>
                <textarea
                  name="requirements.specifications"
                  value={formData.requirements.specifications}
                  onChange={handleInputChange}
                  placeholder="请描述具体的技术要求、风格要求等..."
                  className="form-textarea"
                  rows={3}
                />
              </div>
              
              <div className="form-group">
                <label className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={handleInputChange}
                  />
                  <span className="checkbox-text">公开任务（所有社员可见）</span>
                </label>
              </div>
              
              {formErrors.submit && (
                <div className="error-message submit-error">{formErrors.submit}</div>
              )}
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowCreateModal(false)}
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
                      <Plus className="btn-icon" />
                      创建任务
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 分配任务模态框 */}
      {showAssignModal && selectedTask && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>分配任务: {selectedTask.title}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowAssignModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="assign-task-content">
              <p>选择要分配此任务的社员：</p>
              
              <div className="members-selection">
                {members.map(member => (
                  <label key={member._id} className="member-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMembers(prev => [...prev, member._id]);
                        } else {
                          setSelectedMembers(prev => prev.filter(id => id !== member._id));
                        }
                      }}
                    />
                    <div className="member-info">
                      <div className="member-avatar">
                        {member.realName.charAt(0)}
                      </div>
                      <div className="member-details">
                        <span className="member-name">{member.realName}</span>
                        <span className="member-username">@{member.username}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowAssignModal(false)}
                >
                  取消
                </button>
                <button 
                  type="button" 
                  className="btn-submit"
                  onClick={handleAssignTask}
                  disabled={assignLoading || selectedMembers.length === 0}
                >
                  {assignLoading ? (
                    <>
                      <div className="loading-spinner"></div>
                      分配中...
                    </>
                  ) : (
                    <>
                      <UserPlus className="btn-icon" />
                      分配任务
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;
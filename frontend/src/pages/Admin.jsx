import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Clock, User, Calendar, Image, Video, BarChart3, Users, FileText, TrendingUp } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';
import { API_ENDPOINTS } from '../config/api';
import './Admin.css';

const Admin = () => {
  usePageTitle('数据概览与审核');
  
  const [pendingWorks, setPendingWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWork, setSelectedWork] = useState(null);
  const [reviewReason, setReviewReason] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalWorks: 0,
    pendingWorks: 0,
    totalTasks: 0,
    activeMembers: 0
  });
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchPendingWorks();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // 获取用户统计
      const usersResponse = await fetch(`${API_ENDPOINTS.USERS}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const usersData = await usersResponse.json();
      
      // 获取作品统计
      const worksResponse = await fetch(`${API_ENDPOINTS.WORKS}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const worksData = await worksResponse.json();
      
      // 获取任务统计
      const tasksResponse = await fetch(`${API_ENDPOINTS.TASKS}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const tasksData = await tasksResponse.json();
      
      if (usersData.success && worksData.success && tasksData.success) {
        const users = usersData.data.users || [];
        const works = worksData.data.works || [];
        const tasks = tasksData.data.tasks || [];
        
        setStats({
          totalUsers: users.length,
          totalWorks: works.length,
          pendingWorks: works.filter(w => w.status === 'pending').length,
          totalTasks: tasks.length,
          activeMembers: users.filter(u => u.role === 'member').length
        });
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  const fetchPendingWorks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.WORKS}?status=pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setPendingWorks(data.data.works);
      }
    } catch (error) {
      console.error('获取待审核作品失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (workId, action, reason = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.WORK_REVIEW(workId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, reason })
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchPendingWorks();
        await fetchStats();
        alert(`作品${action === 'approve' ? '通过' : '拒绝'}成功`);
      } else {
        alert(data.message || '操作失败');
      }
    } catch (error) {
      console.error('审核失败:', error);
      alert('操作失败，请重试');
    }
  };

  const openReviewModal = (work, action) => {
    setSelectedWork(work);
    setActionType(action);
    setShowModal(true);
  };

  const confirmReview = () => {
    if (actionType === 'reject' && !reviewReason.trim()) {
      alert('请填写拒绝原因');
      return;
    }
    handleReview(selectedWork._id, actionType, reviewReason);
    setShowModal(false);
    setSelectedWork(null);
    setReviewReason('');
  };

  const handleDeleteWork = async (work) => {
    if (!confirm(`确定要删除作品"${work.title}"吗？此操作不可恢复。`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.WORK_DELETE(work._id), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchPendingWorks();
        await fetchStats();
        alert('作品删除成功');
      } else {
        alert(data.message || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>加载待审核作品中...</p>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="container">
        <div className="admin-header">
          <h1>数据概览与审核</h1>
          <p>查看统计数据并管理社团作品</p>
        </div>
        
        {/* 标签页导航 */}
        <div className="admin-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <BarChart3 className="tab-icon" />
            数据概览
          </button>
          <button 
            className={`tab-btn ${activeTab === 'review' ? 'active' : ''}`}
            onClick={() => setActiveTab('review')}
          >
            <FileText className="tab-icon" />
            作品审核
          </button>
        </div>
        
        {/* 数据概览标签页 */}
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon users">
                  <Users />
                </div>
                <div className="stat-content">
                  <h3>{stats.totalUsers}</h3>
                  <p>总用户数</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon members">
                  <User />
                </div>
                <div className="stat-content">
                  <h3>{stats.activeMembers}</h3>
                  <p>活跃社员</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon works">
                  <Image />
                </div>
                <div className="stat-content">
                  <h3>{stats.totalWorks}</h3>
                  <p>总作品数</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon pending">
                  <Clock />
                </div>
                <div className="stat-content">
                  <h3>{stats.pendingWorks}</h3>
                  <p>待审核作品</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon tasks">
                  <Calendar />
                </div>
                <div className="stat-content">
                  <h3>{stats.totalTasks}</h3>
                  <p>总任务数</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon trend">
                  <TrendingUp />
                </div>
                <div className="stat-content">
                  <h3>{Math.round((stats.totalWorks - stats.pendingWorks) / Math.max(stats.totalWorks, 1) * 100)}%</h3>
                  <p>审核通过率</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 作品审核标签页 */}
        {activeTab === 'review' && (
          <div className="review-section">
            {/* 审核统计和操作栏 */}
            <div className="review-header">
              <div className="review-stats">
                <div className="stat-badge pending">
                  <Clock className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-number">{pendingWorks.length}</span>
                    <span className="stat-label">待审核</span>
                  </div>
                </div>
                <div className="stat-badge total">
                  <FileText className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-number">{stats.totalWorks}</span>
                    <span className="stat-label">总作品</span>
                  </div>
                </div>
                <div className="stat-badge rate">
                  <TrendingUp className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-number">{Math.round((stats.totalWorks - stats.pendingWorks) / Math.max(stats.totalWorks, 1) * 100)}%</span>
                    <span className="stat-label">审核率</span>
                  </div>
                </div>
              </div>
              
              <div className="review-actions">
                <button 
                  className="refresh-btn"
                  onClick={() => {
                    fetchPendingWorks();
                    fetchStats();
                  }}
                >
                  <Clock className="btn-icon" />
                  刷新列表
                </button>
              </div>
            </div>

            {/* 作品列表 */}
            {pendingWorks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <CheckCircle size={64} />
                </div>
                <h3>🎉 太棒了！</h3>
                <p>所有作品都已审核完成</p>
                <p className="empty-subtitle">当有新的作品提交时，它们会出现在这里</p>
                <button 
                  className="refresh-btn secondary"
                  onClick={() => {
                    fetchPendingWorks();
                    fetchStats();
                  }}
                >
                  <Clock className="btn-icon" />
                  检查新作品
                </button>
              </div>
            ) : (
              <div className="review-grid">
                {pendingWorks.map(work => (
                  <div key={work._id} className="review-card">
                    {/* 作品预览 */}
                    <div className="review-preview">
                      <div className="preview-image">
                        {work.thumbnail ? (
                          <img 
                            src={work.thumbnail} 
                            alt={work.title}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : (
                          <div className="no-image">
                            {work.type === 'photo' ? 
                              <Image size={32} /> : 
                              <Video size={32} />
                            }
                          </div>
                        )}
                        <div className="preview-overlay">
                          <button 
                            className="preview-btn"
                            onClick={() => window.open(`/admin/works/${work._id}`, '_blank')}
                            title="查看详情"
                          >
                            <Eye size={20} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="work-type-indicator">
                        <span className={`type-badge ${work.type}`}>
                          {work.type === 'photo' ? (
                            <><Image size={14} /> 摄影</>
                          ) : (
                            <><Video size={14} /> 视频</>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* 作品信息 */}
                    <div className="review-content">
                      <div className="work-header">
                        <h3 className="work-title" title={work.title}>
                          {work.title}
                        </h3>
                        <div className="work-status">
                          <span className="status-badge pending">
                            <Clock size={12} />
                            待审核
                          </span>
                        </div>
                      </div>
                      
                      <p className="work-description" title={work.description}>
                        {work.description || '暂无描述'}
                      </p>
                      
                      <div className="work-metadata">
                        <div className="meta-item">
                          <User size={14} className="meta-icon" />
                          <span className="meta-text">{work.authorName}</span>
                        </div>
                        <div className="meta-item">
                          <Calendar size={14} className="meta-icon" />
                          <span className="meta-text">
                            {new Date(work.createdAt).toLocaleDateString('zh-CN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {work.category && (
                          <div className="meta-item">
                            <span className="category-tag">{work.category}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 审核操作 */}
                    <div className="review-actions">
                      <button 
                        className="action-btn approve"
                        onClick={() => openReviewModal(work, 'approve')}
                        title="通过审核"
                      >
                        <CheckCircle size={16} />
                        <span>通过</span>
                      </button>
                      <button 
                        className="action-btn reject"
                        onClick={() => openReviewModal(work, 'reject')}
                        title="拒绝审核"
                      >
                        <XCircle size={16} />
                        <span>拒绝</span>
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={() => handleDeleteWork(work)}
                        title="删除作品"
                      >
                        <XCircle size={16} />
                        <span>删除</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 审核确认模态框 */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>
                {actionType === 'approve' ? '确认通过作品' : '确认拒绝作品'}
              </h3>
              <p>作品标题: <strong>{selectedWork?.title}</strong></p>
              <p>作者: <strong>{selectedWork?.authorName}</strong></p>
              
              {actionType === 'reject' && (
                <div className="reason-input">
                  <label>拒绝原因 *</label>
                  <textarea
                    value={reviewReason}
                    onChange={(e) => setReviewReason(e.target.value)}
                    placeholder="请说明拒绝的具体原因..."
                    rows={4}
                  />
                </div>
              )}
              
              <div className="modal-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedWork(null);
                    setReviewReason('');
                  }}
                >
                  取消
                </button>
                <button 
                  className={`btn-primary ${actionType === 'reject' ? 'btn-danger' : 'btn-success'}`}
                  onClick={confirmReview}
                >
                  {actionType === 'approve' ? '确认通过' : '确认拒绝'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
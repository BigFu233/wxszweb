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
            <div className="admin-stats">
              <div className="stat-item">
                <Clock className="stat-icon" />
                <span>待审核: {pendingWorks.length}</span>
              </div>
            </div>

            {pendingWorks.length === 0 ? (
              <div className="no-pending">
                <CheckCircle className="no-pending-icon" />
                <h3>暂无待审核作品</h3>
                <p>所有作品都已审核完成</p>
              </div>
            ) : (
              <div className="works-grid">
                {pendingWorks.map(work => (
                  <div key={work._id} className="work-card">
                    <div className="work-thumbnail">
                      {work.files && work.files.length > 0 ? (
                        <img 
                          src={work.files[0].url} 
                          alt={work.title}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="work-overlay">
                        <button 
                          className="preview-btn"
                          onClick={() => window.open(`/admin/works/${work._id}`, '_blank')}
                        >
                          <Eye className="btn-icon" />
                        </button>
                      </div>
                      <div className="work-type-badge">
                        {work.type === 'photo' ? '📷' : '🎬'}
                      </div>
                    </div>
                    
                    <div className="work-info">
                      <h3 className="work-title">{work.title}</h3>
                      <p className="work-description">{work.description}</p>
                      
                      <div className="work-meta">
                        <div className="work-author">
                          <User className="meta-icon" />
                          <span>{work.authorName}</span>
                        </div>
                        <div className="work-date">
                          <Calendar className="meta-icon" />
                          <span>{new Date(work.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="work-actions">
                        <button 
                          className="action-btn approve-btn"
                          onClick={() => openReviewModal(work, 'approve')}
                        >
                          <CheckCircle className="btn-icon" />
                          通过
                        </button>
                        <button 
                          className="action-btn reject-btn"
                          onClick={() => openReviewModal(work, 'reject')}
                        >
                          <XCircle className="btn-icon" />
                          拒绝
                        </button>
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteWork(work)}
                        >
                          <XCircle className="btn-icon" />
                          删除
                        </button>
                      </div>
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
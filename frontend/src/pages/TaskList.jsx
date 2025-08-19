import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, Upload, Eye, AlertTriangle, User } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';
import { API_ENDPOINTS } from '../config/api';
import './TaskList.css';

const TaskList = () => {
  usePageTitle('我的任务');
  
  const [tasks, setTasks] = useState([]);
  const [myWorks, setMyWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, in_progress, completed
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedWork, setSelectedWork] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // 获取当前用户信息
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.role === 'member') {
      fetchMyTasks();
      fetchMyWorks();
    }
  }, [currentUser]);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.TASKS}?assignedToMe=true`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
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

  const fetchMyWorks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.WORKS}?author=${currentUser._id}&status=approved`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setMyWorks(data.data.works);
      }
    } catch (error) {
      console.error('获取我的作品失败:', error);
    }
  };

  const handleSubmitWork = async () => {
    if (!selectedWork) {
      alert('请选择要提交的作品');
      return;
    }

    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.TASK_SUBMIT(selectedTask._id)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ workId: selectedWork })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchMyTasks();
        setShowSubmitModal(false);
        setSelectedTask(null);
        setSelectedWork('');
        alert('作品提交成功');
      } else {
        alert(data.message || '提交失败');
      }
    } catch (error) {
      console.error('提交作品失败:', error);
      alert('网络错误，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const openSubmitModal = (task) => {
    setSelectedTask(task);
    setShowSubmitModal(true);
  };

  const getMyTaskStatus = (task) => {
    const assignment = task.assignedTo.find(a => a.user._id === currentUser._id);
    return assignment ? assignment.status : 'pending';
  };

  const getMySubmittedWork = (task) => {
    const assignment = task.assignedTo.find(a => a.user._id === currentUser._id);
    return assignment ? assignment.submittedWork : null;
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    const myStatus = getMyTaskStatus(task);
    return myStatus === filter;
  });

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
      case 'pending': return '#f39c12';
      case 'in_progress': return '#3498db';
      case 'completed': return '#27ae60';
      case 'submitted': return '#9b59b6';
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

  const isOverdue = (deadline) => {
    return new Date(deadline) < new Date();
  };

  // 如果不是社员，显示权限提示
  if (!currentUser || currentUser.role !== 'member') {
    return (
      <div className="task-list-unauthorized">
        <div className="container">
          <div className="unauthorized-content">
            <User className="unauthorized-icon" />
            <h2>权限不足</h2>
            <p>只有社团社员才能查看任务列表</p>
            <p>请联系管理员将您的账户设置为社员角色</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="task-list-loading">
        <div className="loading-spinner"></div>
        <p>加载任务列表中...</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      <div className="container">
        <div className="task-list-header">
          <div className="header-left">
            <Calendar className="header-icon" />
            <div>
              <h1>我的任务</h1>
              <p>查看分配给您的任务并提交作品</p>
            </div>
          </div>
          
          <div className="task-stats">
            <div className="stat-item">
              <span className="stat-number">{tasks.length}</span>
              <span className="stat-label">总任务</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {tasks.filter(task => getMyTaskStatus(task) === 'completed' || getMyTaskStatus(task) === 'submitted').length}
              </span>
              <span className="stat-label">已完成</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {tasks.filter(task => isOverdue(task.deadline) && getMyTaskStatus(task) === 'pending').length}
              </span>
              <span className="stat-label">已逾期</span>
            </div>
          </div>
        </div>

        {/* 筛选器 */}
        <div className="task-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            全部任务
          </button>
          <button 
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            待开始
          </button>
          <button 
            className={`filter-btn ${filter === 'in_progress' ? 'active' : ''}`}
            onClick={() => setFilter('in_progress')}
          >
            进行中
          </button>
          <button 
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            已完成
          </button>
          <button 
            className={`filter-btn ${filter === 'submitted' ? 'active' : ''}`}
            onClick={() => setFilter('submitted')}
          >
            已提交
          </button>
        </div>

        {/* 任务列表 */}
        <div className="tasks-list">
          {filteredTasks.map(task => {
            const myStatus = getMyTaskStatus(task);
            const submittedWork = getMySubmittedWork(task);
            const overdue = isOverdue(task.deadline);
            
            return (
              <div key={task._id} className={`task-item ${overdue && myStatus === 'pending' ? 'overdue' : ''}`}>
                <div className="task-main">
                  <div className="task-header">
                    <div className="task-title-section">
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
                          style={{ backgroundColor: getStatusColor(myStatus) }}
                        >
                          {myStatus === 'pending' ? '待开始' :
                           myStatus === 'in_progress' ? '进行中' :
                           myStatus === 'completed' ? '已完成' : '已提交'}
                        </span>
                        {overdue && myStatus === 'pending' && (
                          <span className="overdue-badge">
                            <AlertTriangle className="overdue-icon" />
                            已逾期
                          </span>
                        )}
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
                        <Clock className="meta-icon" />
                        <span>类型: {task.type === 'photo' ? '摄影' : task.type === 'video' ? '视频' : '摄影或视频'}</span>
                      </div>
                      <div className="meta-item">
                        <User className="meta-icon" />
                        <span>创建者: {task.creator.realName}</span>
                      </div>
                    </div>
                    
                    {task.requirements.specifications && (
                      <div className="task-requirements">
                        <h4>具体要求:</h4>
                        <p>{task.requirements.specifications}</p>
                      </div>
                    )}
                    
                    {submittedWork && (
                      <div className="submitted-work">
                        <h4>已提交作品:</h4>
                        <div className="work-info">
                          <CheckCircle className="work-icon" />
                          <span>{submittedWork.title}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="task-actions">
                  {myStatus === 'pending' || myStatus === 'in_progress' ? (
                    <button 
                      className="action-btn submit-btn"
                      onClick={() => openSubmitModal(task)}
                    >
                      <Upload className="action-icon" />
                      提交作品
                    </button>
                  ) : null}
                  
                  <button 
                    className="action-btn view-btn"
                    onClick={() => window.open(`/tasks/${task._id}`, '_blank')}
                  >
                    <Eye className="action-icon" />
                    查看详情
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredTasks.length === 0 && (
          <div className="no-tasks">
            <Calendar className="no-tasks-icon" />
            <h3>暂无任务</h3>
            <p>
              {filter === 'all' ? '您还没有被分配任何任务' :
               filter === 'pending' ? '没有待开始的任务' :
               filter === 'in_progress' ? '没有进行中的任务' :
               filter === 'completed' ? '没有已完成的任务' : '没有已提交的任务'}
            </p>
          </div>
        )}
      </div>

      {/* 提交作品模态框 */}
      {showSubmitModal && selectedTask && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>提交作品: {selectedTask.title}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowSubmitModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="submit-work-content">
              <p>请选择要提交的作品：</p>
              
              <div className="works-selection">
                {myWorks.length > 0 ? (
                  myWorks.map(work => (
                    <label key={work._id} className="work-option">
                      <input
                        type="radio"
                        name="selectedWork"
                        value={work._id}
                        checked={selectedWork === work._id}
                        onChange={(e) => setSelectedWork(e.target.value)}
                      />
                      <div className="work-info">
                        <div className="work-thumbnail">
                          {work.files && work.files[0] ? (
                            <img src={work.files[0].url} alt={work.title} />
                          ) : (
                            <div className="no-thumbnail">
                              {work.type === 'photo' ? '📷' : '🎬'}
                            </div>
                          )}
                        </div>
                        <div className="work-details">
                          <h4>{work.title}</h4>
                          <p>{work.description}</p>
                          <span className="work-type">{work.type === 'photo' ? '摄影作品' : '视频作品'}</span>
                        </div>
                      </div>
                    </label>
                  ))
                ) : (
                  <div className="no-works">
                    <p>您还没有已审核通过的作品可以提交</p>
                    <p>请先上传作品并等待审核通过</p>
                  </div>
                )}
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowSubmitModal(false)}
                >
                  取消
                </button>
                <button 
                  type="button" 
                  className="btn-submit"
                  onClick={handleSubmitWork}
                  disabled={submitting || !selectedWork}
                >
                  {submitting ? (
                    <>
                      <div className="loading-spinner"></div>
                      提交中...
                    </>
                  ) : (
                    <>
                      <Upload className="btn-icon" />
                      提交作品
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

export default TaskList;
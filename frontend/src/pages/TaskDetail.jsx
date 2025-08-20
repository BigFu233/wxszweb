import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Target,
  FileText,
  Tag,
  ArrowLeft,
  BarChart3,
  PieChart,
  TrendingUp,
  User,
  Mail,
  Phone
} from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import './TaskDetail.css';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [taskStats, setTaskStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // 获取当前用户信息
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  // 获取任务详情
  useEffect(() => {
    const fetchTaskDetail = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(API_ENDPOINTS.TASK_DETAIL(id), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        
        if (data.success) {
          setTask(data.data.task);
        } else {
          setError(data.message || '获取任务详情失败');
        }
      } catch (error) {
        console.error('获取任务详情失败:', error);
        setError('网络错误，请重试');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTaskDetail();
    }
  }, [id, navigate]);

  // 获取任务统计数据（仅管理员）
  useEffect(() => {
    const fetchTaskStats = async () => {
      if (!currentUser || currentUser.role !== 'admin' || !task) return;
      
      setStatsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_ENDPOINTS.TASKS}/stats/overview`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (data.success) {
          setTaskStats(data.data.stats);
        }
      } catch (error) {
        console.error('获取统计数据失败:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchTaskStats();
  }, [currentUser, task]);

  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 获取优先级颜色
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#e74c3c';
      case 'high': return '#f39c12';
      case 'medium': return '#3498db';
      case 'low': return '#95a5a6';
      default: return '#3498db';
    }
  };

  // 获取状态颜色
  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return '#95a5a6';
      case 'published': return '#3498db';
      case 'completed': return '#27ae60';
      case 'cancelled': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  // 获取成员状态颜色
  const getMemberStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f39c12';
      case 'in_progress': return '#3498db';
      case 'completed': return '#27ae60';
      case 'submitted': return '#9b59b6';
      default: return '#95a5a6';
    }
  };

  // 计算完成率统计
  const getCompletionStats = () => {
    if (!task || !task.assignedTo || task.assignedTo.length === 0) {
      return { completed: 0, inProgress: 0, pending: 0, submitted: 0 };
    }

    const stats = task.assignedTo.reduce((acc, assignment) => {
      acc[assignment.status] = (acc[assignment.status] || 0) + 1;
      return acc;
    }, {});

    return {
      completed: stats.completed || 0,
      inProgress: stats.in_progress || 0,
      pending: stats.pending || 0,
      submitted: stats.submitted || 0
    };
  };

  if (loading) {
    return (
      <div className="task-detail-loading">
        <div className="loading-spinner"></div>
        <p>加载任务详情中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="task-detail-error">
        <AlertCircle className="error-icon" />
        <h3>加载失败</h3>
        <p>{error}</p>
        <button onClick={() => {
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            // 根据用户角色决定跳转目标
            if (currentUser && currentUser.role === 'admin') {
              navigate('/admin/tasks');
            } else {
              navigate('/tasks');
            }
          }
        }} className="btn-back">
          <ArrowLeft className="btn-icon" />
          返回
        </button>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="task-detail-error">
        <AlertCircle className="error-icon" />
        <h3>任务不存在</h3>
        <p>请检查任务ID是否正确</p>
        <button onClick={() => {
           if (window.history.length > 1) {
             navigate(-1);
           } else {
             // 根据用户角色决定跳转目标
             if (currentUser && currentUser.role === 'admin') {
               navigate('/admin/tasks');
             } else {
               navigate('/tasks');
             }
           }
         }} className="btn-back">
          <ArrowLeft className="btn-icon" />
          返回
        </button>
      </div>
    );
  }

  const completionStats = getCompletionStats();
  const isAdmin = currentUser && currentUser.role === 'admin';

  return (
    <div className="task-detail">
      <div className="container">
        {/* 页面头部 */}
        <div className="task-detail-header">
          <button onClick={() => {
             if (window.history.length > 1) {
               navigate(-1);
             } else {
               // 根据用户角色决定跳转目标
               if (currentUser && currentUser.role === 'admin') {
                 navigate('/admin/tasks');
               } else {
                 navigate('/tasks');
               }
             }
           }} className="btn-back">
            <ArrowLeft className="btn-icon" />
            返回
          </button>
          <div className="header-info">
            <h1>任务详情</h1>
            <p>查看任务的详细信息和完成情况</p>
          </div>
        </div>

        <div className="task-detail-content">
          {/* 任务基本信息区域 */}
          <div className="task-info-section">
            <div className="task-header">
              <div className="task-title-area">
                <h2 className="task-title">{task.title}</h2>
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
              
              <div className="task-meta">
                <div className="meta-item">
                  <Calendar className="meta-icon" />
                  <span>截止时间: {formatDate(task.deadline)}</span>
                </div>
                <div className="meta-item">
                  <Target className="meta-icon" />
                  <span>任务类型: {
                    task.type === 'photo' ? '摄影作品' :
                    task.type === 'video' ? '视频作品' : '摄影或视频'
                  }</span>
                </div>
                <div className="meta-item">
                  <Tag className="meta-icon" />
                  <span>分类: {task.category}</span>
                </div>
                <div className="meta-item">
                  <Users className="meta-icon" />
                  <span>分配人数: {task.assignedTo.length}人</span>
                </div>
                <div className="meta-item">
                  <CheckCircle className="meta-icon" />
                  <span>完成率: {task.completionRate}%</span>
                </div>
              </div>
            </div>

            <div className="task-description">
              <h3><FileText className="section-icon" />任务描述</h3>
              <p>{task.description}</p>
            </div>

            {task.requirements && (
              <div className="task-requirements">
                <h3><Target className="section-icon" />任务要求</h3>
                <div className="requirements-grid">
                  <div className="requirement-item">
                    <span className="requirement-label">文件数量:</span>
                    <span className="requirement-value">
                      {task.requirements.minFiles}-{task.requirements.maxFiles}个文件
                    </span>
                  </div>
                  {task.requirements.specifications && (
                    <div className="requirement-item full-width">
                      <span className="requirement-label">具体要求:</span>
                      <span className="requirement-value">{task.requirements.specifications}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {task.tags && task.tags.length > 0 && (
              <div className="task-tags">
                <h3><Tag className="section-icon" />标签</h3>
                <div className="tags-list">
                  {task.tags.map((tag, index) => (
                    <span key={index} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 人员完成情况 */}
          <div className="task-members-section">
            <h3><Users className="section-icon" />人员完成情况</h3>
            
            {/* 完成情况概览 */}
            <div className="completion-overview">
              <div className="completion-stats">
                <div className="stat-item completed">
                  <div className="stat-number">{completionStats.completed}</div>
                  <div className="stat-label">已完成</div>
                </div>
                <div className="stat-item submitted">
                  <div className="stat-number">{completionStats.submitted}</div>
                  <div className="stat-label">已提交</div>
                </div>
                <div className="stat-item in-progress">
                  <div className="stat-number">{completionStats.inProgress}</div>
                  <div className="stat-label">进行中</div>
                </div>
                <div className="stat-item pending">
                  <div className="stat-number">{completionStats.pending}</div>
                  <div className="stat-label">待开始</div>
                </div>
              </div>
              
              <div className="completion-chart">
                <div className="chart-container">
                  <div className="progress-ring">
                    <svg width="120" height="120">
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="#f0f0f0"
                        strokeWidth="8"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="#27ae60"
                        strokeWidth="8"
                        strokeDasharray={`${task.completionRate * 3.14} 314`}
                        strokeDashoffset="78.5"
                        transform="rotate(-90 60 60)"
                      />
                    </svg>
                    <div className="progress-text">
                      <span className="progress-number">{task.completionRate}%</span>
                      <span className="progress-label">完成率</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 成员列表 */}
            {task.assignedTo && task.assignedTo.length > 0 && (
              <div className="members-list">
                {task.assignedTo.map(assignment => (
                  <div key={assignment.user._id} className="member-card">
                    <div className="member-info">
                      <div className="member-avatar">
                        {assignment.user.realName.charAt(0)}
                      </div>
                      <div className="member-details">
                        <h4 className="member-name">{assignment.user.realName}</h4>
                        <p className="member-username">@{assignment.user.username}</p>
                        {isAdmin && assignment.user.email && (
                          <p className="member-contact">
                            <Mail className="contact-icon" />
                            {assignment.user.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="member-status">
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getMemberStatusColor(assignment.status) }}
                      >
                        {assignment.status === 'pending' ? '待开始' :
                         assignment.status === 'in_progress' ? '进行中' :
                         assignment.status === 'completed' ? '已完成' : '已提交'}
                      </span>
                      {assignment.submittedWork && (
                        <div className="submitted-work">
                          <CheckCircle className="work-icon" />
                          <span>已提交作品</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 管理员统计模块 */}
          {isAdmin && (
            <div className="admin-stats-section">
              <h3><BarChart3 className="section-icon" />管理员统计</h3>
              
              {statsLoading ? (
                <div className="stats-loading">
                  <div className="loading-spinner"></div>
                  <p>加载统计数据中...</p>
                </div>
              ) : taskStats ? (
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-header">
                      <Target className="stat-icon" />
                      <h4>任务总览</h4>
                    </div>
                    <div className="stat-content">
                      <div className="stat-row">
                        <span>总任务数:</span>
                        <span className="stat-value">{taskStats.totalTasks}</span>
                      </div>
                      <div className="stat-row">
                        <span>已发布:</span>
                        <span className="stat-value">{taskStats.publishedTasks}</span>
                      </div>
                      <div className="stat-row">
                        <span>已完成:</span>
                        <span className="stat-value">{taskStats.completedTasks}</span>
                      </div>
                      <div className="stat-row">
                        <span>逾期任务:</span>
                        <span className="stat-value danger">{taskStats.overdueTasks}</span>
                      </div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-header">
                      <TrendingUp className="stat-icon" />
                      <h4>完成情况</h4>
                    </div>
                    <div className="stat-content">
                      <div className="stat-row">
                        <span>平均完成率:</span>
                        <span className="stat-value">{taskStats.avgCompletionRate.toFixed(1)}%</span>
                      </div>
                      <div className="stat-row">
                        <span>总分配数:</span>
                        <span className="stat-value">{taskStats.totalAssignments}</span>
                      </div>
                      <div className="stat-row">
                        <span>总提交数:</span>
                        <span className="stat-value">{taskStats.totalSubmissions}</span>
                      </div>
                      <div className="stat-row">
                        <span>提交率:</span>
                        <span className="stat-value">
                          {taskStats.totalAssignments > 0 
                            ? ((taskStats.totalSubmissions / taskStats.totalAssignments) * 100).toFixed(1)
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-header">
                      <PieChart className="stat-icon" />
                      <h4>当前任务分析</h4>
                    </div>
                    <div className="stat-content">
                      <div className="current-task-stats">
                        <div className="task-progress-bar">
                          <div className="progress-label">任务进度</div>
                          <div className="progress-bar">
                            <div 
                              className="progress-fill"
                              style={{ width: `${task.completionRate}%` }}
                            ></div>
                          </div>
                          <div className="progress-text">{task.completionRate}%</div>
                        </div>
                        
                        <div className="task-timeline">
                          <div className="timeline-item">
                            <span>创建时间:</span>
                            <span>{formatDate(task.createdAt)}</span>
                          </div>
                          <div className="timeline-item">
                            <span>截止时间:</span>
                            <span>{formatDate(task.deadline)}</span>
                          </div>
                          <div className="timeline-item">
                            <span>剩余时间:</span>
                            <span className={new Date(task.deadline) < new Date() ? 'danger' : 'normal'}>
                              {new Date(task.deadline) < new Date() 
                                ? '已逾期' 
                                : `${Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24))}天`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="stats-error">
                  <AlertCircle className="error-icon" />
                  <p>无法加载统计数据</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
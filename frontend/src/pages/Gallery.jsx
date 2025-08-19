import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Image, Video, User, Calendar, Eye, Trash2, Target } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';
import { API_ENDPOINTS } from '../config/api';
import './Gallery.css';

const Gallery = () => {
  usePageTitle('作品展示');
  
  const [works, setWorks] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // 获取当前用户信息
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  useEffect(() => {
    fetchWorks();
  }, [activeTab]);

  const fetchWorks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      let url = `${API_ENDPOINTS.WORKS}?status=approved`;
      if (activeTab === 'task') {
        url += `&isTaskSubmission=true`;
      } else if (activeTab !== 'all') {
        url += `&type=${activeTab}`;
      }
      
      const response = await fetch(url, { headers });
      const data = await response.json();
      
      if (data.success) {
        setWorks(data.data.works);
      } else {
        console.error('获取作品失败:', data.message);
        setWorks([]);
      }
    } catch (error) {
      console.error('获取作品失败:', error);
      setWorks([]);
    } finally {
      setLoading(false);
    }
  };

  // 删除作品函数
  const handleDeleteWork = async (work, e) => {
    e.preventDefault(); // 阻止Link的默认行为
    e.stopPropagation();
    
    if (!confirm(`确定要删除作品"${work.title}"吗？此操作不可撤销。`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.WORKS}/${work._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        // 从列表中移除已删除的作品
        setWorks(prev => prev.filter(w => w._id !== work._id));
        alert('作品删除成功');
      } else {
        alert(data.message || '删除失败');
      }
    } catch (error) {
      console.error('删除作品失败:', error);
      alert('网络错误，请重试');
    }
  };

  // 检查是否为管理员
  const isAdmin = currentUser && currentUser.role === 'admin';

  const filteredWorks = works.filter(work => {
    if (activeTab === 'all') return true;
    return work.type === activeTab;
  });

  const tabs = [
    { id: 'all', label: '全部作品', icon: null },
    { id: 'photo', label: '摄影作品', icon: Image },
    { id: 'video', label: '视频作品', icon: Video },
    { id: 'task', label: '任务作品', icon: Target }
  ];

  if (loading) {
    return (
      <div className="gallery-loading">
        <div className="loading-spinner"></div>
        <p>加载作品中...</p>
      </div>
    );
  }

  return (
    <div className="gallery">
      <div className="container">
        <div className="gallery-header">
          <h1>作品展示</h1>
          <p>欣赏我们社团成员的精彩创作</p>
        </div>

        {/* 分类标签 */}
        <div className="gallery-tabs">
          {tabs.map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {IconComponent && <IconComponent className="tab-icon" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 作品网格 */}
        <div className="works-grid">
          {filteredWorks.map(work => (
            <div key={work._id} className="work-card-wrapper">
              <Link to={`/works/${work._id}`} className="work-card-link">
                <div className="work-card">
                <div className="work-thumbnail">
                  {work.files && work.files.length > 0 ? (
                     <>
                       <img 
                         src={work.files[0].url} 
                         alt={work.title}
                         onError={(e) => {
                           e.target.style.display = 'none';
                           e.target.nextSibling.style.display = 'flex';
                         }}
                       />
                       <div className="no-image-placeholder" style={{display: 'none'}}>
                         {work.type === 'photo' ? 
                           <Image className="placeholder-icon" /> : 
                           <Video className="placeholder-icon" />
                         }
                       </div>
                     </>
                   ) : (
                     <div className="no-image-placeholder">
                       {work.type === 'photo' ? 
                         <Image className="placeholder-icon" /> : 
                         <Video className="placeholder-icon" />
                       }
                     </div>
                   )}
                  <div className="work-overlay">
                    <div className="work-type">
                      {work.type === 'photo' ? 
                        <Image className="type-icon" /> : 
                        <Video className="type-icon" />
                      }
                    </div>
                    <div className="work-views">
                      <Eye className="view-icon" />
                      <span>{work.views || 0}</span>
                    </div>
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
                    {work.isTaskSubmission && (
                      <div className="work-task">
                        <Target className="meta-icon task-icon" />
                        <span>任务作品</span>
                      </div>
                    )}
                  </div>
                </div>
                </div>
              </Link>
              
              {/* 管理员删除按钮 */}
              {isAdmin && (
                <button 
                  className="admin-delete-btn"
                  onClick={(e) => handleDeleteWork(work, e)}
                  title="删除作品"
                >
                  <Trash2 className="delete-icon" />
                </button>
              )}
            </div>
          ))}
        </div>

        {filteredWorks.length === 0 && (
          <div className="no-works">
            <p>暂无{activeTab === 'all' ? '' : activeTab === 'photo' ? '摄影' : '视频'}作品</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;
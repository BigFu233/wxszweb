import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Eye, 
  Calendar, 
  User, 
  Tag,
  ZoomIn,
  CheckCircle,
  XCircle
} from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';
import { API_ENDPOINTS } from '../config/api';
import './AdminWorkDetail.css';

const AdminWorkDetail = () => {
  const { id } = useParams();
  const [work, setWork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reviewReason, setReviewReason] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [actionType, setActionType] = useState('');

  usePageTitle(work ? `${work.title} - 审核详情` : '审核详情');

  useEffect(() => {
    fetchWorkDetail();
  }, [id]);

  const fetchWorkDetail = async () => {
    try {
      setError(null);
      console.log('正在获取作品详情，ID:', id);
      
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(API_ENDPOINTS.WORK_DETAIL(id), {
        headers
      });
      
      console.log('API响应状态:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API响应数据:', data);
      
      if (data.success) {
        setWork(data.data.work);
      } else {
        setError(data.message || '获取作品详情失败');
        console.error('获取作品详情失败:', data.message);
      }
    } catch (error) {
      console.error('获取作品详情失败:', error);
      setError(error.message || '网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (action, reason = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.WORK_REVIEW(id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, reason })
      });
      
      const data = await response.json();
      if (data.success) {
        // 审核成功后返回管理面板
        window.location.href = '/admin';
      } else {
        alert(data.message || '审核失败');
      }
    } catch (error) {
      console.error('审核作品失败:', error);
      alert('网络错误，请重试');
    }
  };

  const openReviewModal = (action) => {
    setActionType(action);
    setShowReviewModal(true);
  };

  const confirmReview = () => {
    if (actionType === 'reject' && !reviewReason.trim()) {
      alert('拒绝作品时必须提供原因');
      return;
    }
    handleReview(actionType, reviewReason);
    setShowReviewModal(false);
  };

  const handleDownload = async (file, index) => {
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName || `${work.title}_${index + 1}.${file.mimetype.split('/')[1]}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请重试');
    }
  };

  const openImageModal = (index) => {
    setCurrentImageIndex(index);
    setShowImageModal(true);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev < work.files.length - 1 ? prev + 1 : 0
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev > 0 ? prev - 1 : work.files.length - 1
    );
  };

  if (loading) {
    return (
      <div className="admin-work-detail-loading">
        <div className="loading-spinner"></div>
        <p>加载作品详情中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-work-error">
        <h2>加载失败</h2>
        <p>{error}</p>
        <div className="error-actions">
          <button onClick={fetchWorkDetail} className="retry-btn">
            重试
          </button>
          <Link to="/admin" className="back-link">
            <ArrowLeft className="icon" />
            返回管理面板
          </Link>
        </div>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="admin-work-not-found">
        <h2>作品不存在</h2>
        <Link to="/admin" className="back-link">
          <ArrowLeft className="icon" />
          返回管理面板
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-work-detail">
      {/* Header */}
      <div className="admin-work-header">
        <Link to="/admin" className="back-button">
          <ArrowLeft className="icon" />
          返回管理面板
        </Link>
        
        <div className="review-actions">
          <button 
            className="review-btn approve-btn"
            onClick={() => openReviewModal('approve')}
          >
            <CheckCircle className="icon" />
            通过审核
          </button>
          <button 
            className="review-btn reject-btn"
            onClick={() => openReviewModal('reject')}
          >
            <XCircle className="icon" />
            拒绝审核
          </button>
        </div>
      </div>

      <div className="admin-work-content">
        {/* Media Gallery */}
        <div className="admin-media-gallery">
          <div className="admin-media-grid">
            {work.files && work.files.length > 0 && work.files.map((file, index) => (
              <div key={index} className="admin-media-item">
                {file.mimetype && file.mimetype.startsWith('image/') ? (
                  <div className="admin-image-container">
                    <img 
                      src={file.url} 
                      alt={`${work.title} - ${index + 1}`}
                      onClick={() => openImageModal(index)}
                    />
                    <div className="admin-image-overlay">
                      <button 
                        className="admin-overlay-btn zoom-btn"
                        onClick={() => openImageModal(index)}
                      >
                        <ZoomIn className="icon" />
                      </button>
                      <button 
                        className="admin-overlay-btn download-btn"
                        onClick={() => handleDownload(file, index)}
                      >
                        <Download className="icon" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="admin-video-container">
                    <video controls>
                      <source src={file.url} type={file.mimetype || 'video/mp4'} />
                      您的浏览器不支持视频播放
                    </video>
                    <button 
                      className="admin-download-video-btn"
                      onClick={() => handleDownload(file, index)}
                    >
                      <Download className="icon" />
                      下载视频
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Work Info */}
        <div className="admin-work-info">
          <div className="admin-work-main-info">
            <h1 className="admin-work-title">{work.title || '未命名作品'}</h1>
            <p className="admin-work-description">{work.description || '暂无描述'}</p>
            
            <div className="admin-work-meta">
              <div className="admin-meta-row">
                <div className="admin-meta-item">
                  <User className="meta-icon" />
                  <span>创作者: {work.authorName || '未知'}</span>
                </div>
                <div className="admin-meta-item">
                  <Calendar className="meta-icon" />
                  <span>提交时间: {work.createdAt ? new Date(work.createdAt).toLocaleDateString() : '未知'}</span>
                </div>
              </div>
              
              <div className="admin-meta-row">
                <div className="admin-meta-item">
                  <Tag className="meta-icon" />
                  <span>分类: {work.category || '其他'}</span>
                </div>
                <div className="admin-meta-item">
                  <Eye className="meta-icon" />
                  <span>状态: {work.status === 'pending' ? '待审核' : work.status}</span>
                </div>
              </div>
              
              {work.tags && work.tags.length > 0 && (
                <div className="admin-work-tags">
                  {work.tags.map((tag, index) => (
                    <span key={index} className="admin-tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <h3>
              {actionType === 'approve' ? '确认通过作品' : '确认拒绝作品'}
            </h3>
            <p>作品标题: <strong>{work.title}</strong></p>
            <p>作者: <strong>{work.authorName}</strong></p>
            
            {actionType === 'reject' && (
              <div className="admin-reason-input">
                <label>拒绝原因 *</label>
                <textarea
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  placeholder="请说明拒绝的具体原因..."
                  rows={4}
                />
              </div>
            )}
            
            <div className="admin-modal-actions">
              <button 
                className="admin-btn-secondary"
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewReason('');
                }}
              >
                取消
              </button>
              <button 
                className={`admin-btn-primary ${actionType === 'reject' ? 'admin-btn-danger' : 'admin-btn-success'}`}
                onClick={confirmReview}
              >
                {actionType === 'approve' ? '确认通过' : '确认拒绝'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && work.files && (
        <div className="admin-image-modal" onClick={() => setShowImageModal(false)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="admin-modal-close"
              onClick={() => setShowImageModal(false)}
            >
              ×
            </button>
            
            <img 
              src={work.files[currentImageIndex]?.url} 
              alt={`${work.title} - ${currentImageIndex + 1}`}
            />
            
            {work.files.length > 1 && (
              <>
                <button className="admin-modal-nav prev" onClick={prevImage}>
                  ‹
                </button>
                <button className="admin-modal-nav next" onClick={nextImage}>
                  ›
                </button>
              </>
            )}
            
            <div className="admin-modal-info">
              <span>{currentImageIndex + 1} / {work.files.length}</span>
              <button 
                className="admin-modal-download"
                onClick={() => handleDownload(work.files[currentImageIndex], currentImageIndex)}
              >
                <Download className="icon" />
                下载
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWorkDetail;
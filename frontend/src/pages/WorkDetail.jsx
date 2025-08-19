import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Heart, 
  MessageCircle, 
  Eye, 
  Calendar, 
  User, 
  Tag,
  Share2,
  ZoomIn,
  Play
} from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';
import { API_ENDPOINTS } from '../config/api';
import './WorkDetail.css';

const WorkDetail = () => {
  const { id } = useParams();
  const [work, setWork] = useState(null);
  
  usePageTitle(work ? `${work.title} - 作品详情` : '作品详情');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

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
        console.log('作品详情数据:', data.data.work);
        console.log('文件信息:', data.data.work.files);
        setWork(data.data.work);
        // 检查是否已点赞
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user._id && data.data.work.likedBy) {
          setIsLiked(data.data.work.likedBy.includes(user._id));
        }
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

  const handleLike = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('请先登录');
        return;
      }
      
      const response = await fetch(API_ENDPOINTS.WORK_LIKE(id), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setIsLiked(data.data.isLiked);
        setWork(prev => ({
          ...prev,
          likes: data.data.likes
        }));
      }
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  const handleDownload = async (file, index) => {
    try {
      console.log('开始下载文件:', file);
      
      // 添加认证头和CORS处理
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(file.url, {
        method: 'GET',
        headers,
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('文件blob创建成功:', blob.type, blob.size);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // 改进文件名生成逻辑
       let fileName = file.originalName;
       if (!fileName) {
         // 尝试从URL中提取文件名
         const urlParts = file.url.split('/');
         const urlFileName = urlParts[urlParts.length - 1];
         
         if (urlFileName && urlFileName.includes('.')) {
           // 从URL文件名中提取扩展名
           const urlExt = urlFileName.substring(urlFileName.lastIndexOf('.'));
           fileName = `${work.title || '作品'}_${index + 1}${urlExt}`;
         } else {
           // 根据MIME类型确定扩展名
           const mimeToExt = {
             'image/jpeg': '.jpg',
             'image/jpg': '.jpg',
             'image/png': '.png',
             'image/gif': '.gif',
             'image/webp': '.webp',
             'image/bmp': '.bmp',
             'video/mp4': '.mp4',
             'video/mpeg': '.mpeg',
             'video/quicktime': '.mov',
             'video/x-msvideo': '.avi',
             'video/x-ms-wmv': '.wmv',
             'video/webm': '.webm'
           };
           const extension = mimeToExt[file.mimetype] || '.bin';
           fileName = `${work.title || '作品'}_${index + 1}${extension}`;
         }
       }
      
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      console.log('文件下载成功:', fileName);
    } catch (error) {
      console.error('下载失败:', error);
      alert(`下载失败: ${error.message}`);
    }
  };

  const handleDownloadAll = async () => {
    if (!work.files || work.files.length === 0) return;
    
    // 逐个下载所有文件
    for (let i = 0; i < work.files.length; i++) {
      await handleDownload(work.files[i], i);
      // 添加延迟避免浏览器阻止多个下载
      if (i < work.files.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('请先登录');
        return;
      }
      
      setSubmittingComment(true);
      const response = await fetch(API_ENDPOINTS.WORK_COMMENTS(id), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: comment })
      });
      
      const data = await response.json();
      if (data.success) {
        setWork(prev => ({
          ...prev,
          comments: [...prev.comments, data.data.comment]
        }));
        setComment('');
      }
    } catch (error) {
      console.error('添加评论失败:', error);
    } finally {
      setSubmittingComment(false);
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
      <div className="work-detail-loading">
        <div className="loading-spinner"></div>
        <p>加载作品详情中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="work-error">
        <h2>加载失败</h2>
        <p>{error}</p>
        <div className="error-actions">
          <button onClick={fetchWorkDetail} className="retry-btn">
            重试
          </button>
          <Link to="/gallery" className="back-link">
            <ArrowLeft className="icon" />
            返回作品展示
          </Link>
        </div>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="work-not-found">
        <h2>作品不存在</h2>
        <Link to="/gallery" className="back-link">
          <ArrowLeft className="icon" />
          返回作品展示
        </Link>
      </div>
    );
  }

  return (
    <div className="work-detail">
      {/* Header */}
      <div className="work-header">
        <Link to="/gallery" className="back-button">
          <ArrowLeft className="icon" />
          返回作品展示
        </Link>
        
        <div className="work-actions">
          <button className="action-btn" onClick={handleDownloadAll}>
            <Download className="icon" />
            下载全部
          </button>
          <button className="action-btn">
            <Share2 className="icon" />
            分享
          </button>
        </div>
      </div>

      <div className="work-content">
        {/* Media Gallery */}
        <div className="media-gallery">
          <div className="media-grid">
            {work.files && work.files.length > 0 && work.files.map((file, index) => {
              console.log(`文件 ${index}:`, file);
              console.log(`MIME类型: ${file.mimetype || file._doc?.mimetype}`);
              
              const mimeType = file.mimetype || file._doc?.mimetype;
              const isImage = mimeType && mimeType.startsWith('image/');
              console.log(`是否为图片: ${isImage}`);
              
              return (
              <div key={index} className="media-item">
                {isImage ? (
                  <div className="image-container">
                    <img 
                      src={file.url} 
                      alt={`${work.title} - ${index + 1}`}
                      onClick={() => openImageModal(index)}
                    />
                    <div className="image-overlay">
                      <button 
                        className="overlay-btn zoom-btn"
                        onClick={() => openImageModal(index)}
                      >
                        <ZoomIn className="icon" />
                      </button>
                      <button 
                        className="overlay-btn download-btn"
                        onClick={() => handleDownload(file, index)}
                      >
                        <Download className="icon" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="video-container">
                    <video controls>
                      <source src={file.url} type={mimeType || 'video/mp4'} />
                      您的浏览器不支持视频播放
                    </video>
                    <button 
                      className="download-video-btn"
                      onClick={() => handleDownload(file, index)}
                    >
                      <Download className="icon" />
                      下载视频
                    </button>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        </div>

        {/* Work Info */}
        <div className="work-info">
          <div className="work-main-info">
            <h1 className="work-title">{work.title || '未命名作品'}</h1>
            <p className="work-description">{work.description || '暂无描述'}</p>
            
            <div className="work-meta">
              <div className="meta-row">
                <div className="meta-item">
                  <User className="meta-icon" />
                  <span>创作者: {work.authorName || '未知'}</span>
                </div>
                <div className="meta-item">
                  <Calendar className="meta-icon" />
                  <span>发布时间: {work.createdAt ? new Date(work.createdAt).toLocaleDateString() : '未知'}</span>
                </div>
              </div>
              
              <div className="meta-row">
                <div className="meta-item">
                  <Tag className="meta-icon" />
                  <span>分类: {work.category || '其他'}</span>
                </div>
                <div className="meta-item">
                  <Eye className="meta-icon" />
                  <span>浏览: {work.views || 0}</span>
                </div>
              </div>
              
              {work.tags && work.tags.length > 0 && (
                <div className="work-tags">
                  {work.tags.map((tag, index) => (
                    <span key={index} className="tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="work-stats">
              <button 
                className={`stat-btn like-btn ${isLiked ? 'liked' : ''}`}
                onClick={handleLike}
              >
                <Heart className="icon" />
                <span>{work.likes || 0} 点赞</span>
              </button>
              <div className="stat-item">
                <MessageCircle className="icon" />
                <span>{work.comments?.length || 0} 评论</span>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="comments-section">
            <h3>评论 ({work.comments?.length || 0})</h3>
            
            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="comment-form">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="写下您的评论..."
                rows={3}
              />
              <button 
                type="submit" 
                className="submit-comment"
                disabled={submittingComment || !comment.trim()}
              >
                {submittingComment ? '发布中...' : '发布评论'}
              </button>
            </form>
            
            {/* Comments List */}
            <div className="comments-list">
              {work.comments && work.comments.length > 0 ? (
                work.comments.map((comment, index) => (
                  <div key={index} className="comment-item">
                    <div className="comment-header">
                      <span className="comment-author">{comment.username}</span>
                      <span className="comment-date">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="comment-content">{comment.content}</p>
                  </div>
                ))
              ) : (
                <p className="no-comments">暂无评论，快来抢沙发吧！</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && work.files && (
        <div className="image-modal" onClick={() => setShowImageModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close"
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
                <button className="modal-nav prev" onClick={prevImage}>
                  ‹
                </button>
                <button className="modal-nav next" onClick={nextImage}>
                  ›
                </button>
              </>
            )}
            
            <div className="modal-info">
              <span>{currentImageIndex + 1} / {work.files.length}</span>
              <button 
                className="modal-download"
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

export default WorkDetail;
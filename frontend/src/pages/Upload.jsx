import React, { useState } from 'react';
import { Upload as UploadIcon, Image, Video, User, FileText, Calendar, Check, X } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';
import { API_ENDPOINTS } from '../config/api';
import './Upload.css';

const Upload = () => {
  usePageTitle('上传作品');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    author: '',
    type: 'photo',
    files: []
  });
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 清除对应字段的错误
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileSelect = (files) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      if (formData.type === 'photo') {
        return file.type.startsWith('image/');
      } else {
        return file.type.startsWith('video/');
      }
    });

    setFormData(prev => ({
      ...prev,
      files: [...prev.files, ...validFiles]
    }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = '请输入作品标题';
    }
    
    if (!formData.author.trim()) {
      newErrors.author = '请输入创作者姓名';
    }
    
    if (formData.files.length === 0) {
      newErrors.files = '请选择要上传的文件';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setUploading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setErrors({ submit: '请先登录' });
        setUploading(false);
        return;
      }
      
      // 创建FormData对象
      const uploadData = new FormData();
      uploadData.append('title', formData.title);
      uploadData.append('description', formData.description);
      uploadData.append('authorName', formData.author);
      uploadData.append('type', formData.type);
      uploadData.append('category', formData.category || '其他');
      
      // 添加标签
      if (formData.tags && formData.tags.length > 0) {
        formData.tags.forEach(tag => {
          uploadData.append('tags', tag);
        });
      }
      
      // 添加文件
      formData.files.forEach(file => {
        uploadData.append('files', file);
      });
      
      // 调用后端API
      const response = await fetch(API_ENDPOINTS.WORKS, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadData
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUploadSuccess(true);
        
        // 重置表单
        setFormData({
          title: '',
          description: '',
          author: '',
          type: 'photo',
          files: []
        });
        
        // 3秒后隐藏成功消息
        setTimeout(() => {
          setUploadSuccess(false);
        }, 3000);
      } else {
        setErrors({ submit: data.message || '上传失败' });
      }
      
    } catch (error) {
      console.error('上传失败:', error);
      setErrors({ submit: '网络错误，请重试' });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (uploadSuccess) {
    return (
      <div className="upload-success">
        <div className="success-content">
          <div className="success-icon">
            <Check className="check-icon" />
          </div>
          <h2>上传成功！</h2>
          <p>您的作品已成功提交，等待审核中...</p>
          <button 
            className="btn-primary"
            onClick={() => setUploadSuccess(false)}
          >
            继续上传
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="upload">
      <div className="container">
        <div className="upload-header">
          <h1>上传作品</h1>
          <p>分享您的创作，让更多人欣赏您的才华</p>
        </div>

        <form onSubmit={handleSubmit} className="upload-form">
          {/* 作品类型选择 */}
          <div className="form-group">
            <label className="form-label">作品类型</label>
            <div className="type-selector">
              <button
                type="button"
                className={`type-button ${formData.type === 'photo' ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, type: 'photo', files: [] }))}
              >
                <Image className="type-icon" />
                <span>摄影作品</span>
              </button>
              <button
                type="button"
                className={`type-button ${formData.type === 'video' ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, type: 'video', files: [] }))}
              >
                <Video className="type-icon" />
                <span>视频作品</span>
              </button>
            </div>
          </div>

          {/* 文件上传区域 */}
          <div className="form-group">
            <label className="form-label">上传文件</label>
            <div 
              className={`upload-area ${dragActive ? 'drag-active' : ''} ${errors.files ? 'error' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                accept={formData.type === 'photo' ? 'image/*' : 'video/*'}
                onChange={(e) => handleFileSelect(e.target.files)}
                className="file-input"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="upload-label">
                <UploadIcon className="upload-icon" />
                <div className="upload-text">
                  <p>点击选择文件或拖拽文件到此处</p>
                  <p className="upload-hint">
                    支持{formData.type === 'photo' ? '图片格式：JPG, PNG, GIF' : '视频格式：MP4, MOV, AVI'}
                  </p>
                </div>
              </label>
            </div>
            {errors.files && <span className="error-message">{errors.files}</span>}
          </div>

          {/* 已选择的文件列表 */}
          {formData.files.length > 0 && (
            <div className="selected-files">
              <h3>已选择的文件 ({formData.files.length})</h3>
              <div className="file-list">
                {formData.files.map((file, index) => (
                  <div key={index} className="file-item">
                    <div className="file-info">
                      {formData.type === 'photo' ? 
                        <Image className="file-icon" /> : 
                        <Video className="file-icon" />
                      }
                      <div className="file-details">
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">{formatFileSize(file.size)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="remove-file"
                      onClick={() => removeFile(index)}
                    >
                      <X className="remove-icon" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 作品信息 */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">作品标题 *</label>
              <div className="input-wrapper">
                <FileText className="input-icon" />
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="请输入作品标题"
                  className={`form-input ${errors.title ? 'error' : ''}`}
                />
              </div>
              {errors.title && <span className="error-message">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">创作者 *</label>
              <div className="input-wrapper">
                <User className="input-icon" />
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  placeholder="请输入创作者姓名"
                  className={`form-input ${errors.author ? 'error' : ''}`}
                />
              </div>
              {errors.author && <span className="error-message">{errors.author}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">作品描述</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="请描述您的作品创作理念、拍摄技巧或想要表达的内容..."
              className="form-textarea"
              rows={4}
            />
          </div>

          {/* 提交按钮 */}
          <div className="form-actions">
            {errors.submit && <span className="error-message">{errors.submit}</span>}
            <button
              type="submit"
              className="btn-submit"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>上传中...</span>
                </>
              ) : (
                <>
                  <UploadIcon className="submit-icon" />
                  <span>提交作品</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Upload;
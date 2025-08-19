import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';
import { API_ENDPOINTS } from '../config/api';
import './ChangePassword.css';

const ChangePassword = () => {
  usePageTitle('修改密码');
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = '请输入当前密码';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = '请输入新密码';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = '新密码长度至少为6位';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认新密码';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = '新密码不能与当前密码相同';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.CHANGE_PASSWORD, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        // 3秒后隐藏成功消息
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        setErrors({ submit: data.message || '密码修改失败' });
      }
    } catch (error) {
      console.error('修改密码失败:', error);
      setErrors({ submit: '网络错误，请重试' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="change-password">
        <div className="container">
          <div className="success-message">
            <CheckCircle className="success-icon" />
            <h2>密码修改成功！</h2>
            <p>您的密码已成功更新，请使用新密码登录。</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="change-password">
      <div className="container">
        <div className="change-password-card">
          <div className="card-header">
            <h1>修改密码</h1>
            <p>为了您的账户安全，请定期更换密码</p>
          </div>

          <form onSubmit={handleSubmit} className="change-password-form">
            {/* 当前密码 */}
            <div className="form-group">
              <label className="form-label">
                <Lock className="label-icon" />
                当前密码
              </label>
              <div className="password-input">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className={`form-input ${errors.currentPassword ? 'error' : ''}`}
                  placeholder="请输入当前密码"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {errors.currentPassword && (
                <span className="error-message">{errors.currentPassword}</span>
              )}
            </div>

            {/* 新密码 */}
            <div className="form-group">
              <label className="form-label">
                <Lock className="label-icon" />
                新密码
              </label>
              <div className="password-input">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className={`form-input ${errors.newPassword ? 'error' : ''}`}
                  placeholder="请输入新密码（至少6位）"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {errors.newPassword && (
                <span className="error-message">{errors.newPassword}</span>
              )}
            </div>

            {/* 确认新密码 */}
            <div className="form-group">
              <label className="form-label">
                <Lock className="label-icon" />
                确认新密码
              </label>
              <div className="password-input">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder="请再次输入新密码"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="error-message">{errors.confirmPassword}</span>
              )}
            </div>

            {/* 提交错误 */}
            {errors.submit && (
              <div className="submit-error">
                {errors.submit}
              </div>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              className={`submit-btn ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? '修改中...' : '修改密码'}
            </button>
          </form>

          <div className="security-tips">
            <h3>密码安全建议</h3>
            <ul>
              <li>密码长度至少6位，建议8位以上</li>
              <li>包含字母、数字和特殊字符</li>
              <li>不要使用生日、姓名等个人信息</li>
              <li>定期更换密码，建议3-6个月更换一次</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
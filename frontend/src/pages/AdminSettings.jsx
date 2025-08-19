import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Database, Mail, Shield, Globe, Bell, Palette } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';
import './AdminSettings.css';

const AdminSettings = () => {
  usePageTitle('系统设置');
  
  const [settings, setSettings] = useState({
    siteName: '无限摄制社团',
    siteDescription: '专业的摄影摄像社团平台',
    maxFileSize: 50, // MB
    allowedFileTypes: ['jpg', 'jpeg', 'png', 'mp4', 'mov'],
    autoApproveWorks: false,
    emailNotifications: true,
    maintenanceMode: false,
    registrationEnabled: true,
    maxWorksPerUser: 10,
    sessionTimeout: 24, // hours
    backupFrequency: 'daily',
    themeColor: '#667eea'
  });
  
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState('general');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // 这里应该从后端加载设置
      // const response = await fetch('/api/admin/settings');
      // const data = await response.json();
      // setSettings(data.settings);
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // 这里应该保存设置到后端
      // await fetch('/api/admin/settings', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(settings)
      // });
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('保存设置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleArrayChange = (key, value) => {
    const array = value.split(',').map(item => item.trim()).filter(item => item);
    setSettings(prev => ({ ...prev, [key]: array }));
  };

  return (
    <div className="admin-settings">
      <div className="container">
        <div className="settings-header">
          <h1>系统设置</h1>
          <p>配置系统参数和功能选项</p>
        </div>

        <div className="settings-layout">
          {/* 侧边栏导航 */}
          <div className="settings-sidebar">
            <div className="settings-nav">
              <button 
                className={`nav-item ${activeSection === 'general' ? 'active' : ''}`}
                onClick={() => setActiveSection('general')}
              >
                <Globe className="nav-icon" />
                基本设置
              </button>
              <button 
                className={`nav-item ${activeSection === 'upload' ? 'active' : ''}`}
                onClick={() => setActiveSection('upload')}
              >
                <Database className="nav-icon" />
                上传设置
              </button>
              <button 
                className={`nav-item ${activeSection === 'security' ? 'active' : ''}`}
                onClick={() => setActiveSection('security')}
              >
                <Shield className="nav-icon" />
                安全设置
              </button>
              <button 
                className={`nav-item ${activeSection === 'notifications' ? 'active' : ''}`}
                onClick={() => setActiveSection('notifications')}
              >
                <Bell className="nav-icon" />
                通知设置
              </button>
              <button 
                className={`nav-item ${activeSection === 'appearance' ? 'active' : ''}`}
                onClick={() => setActiveSection('appearance')}
              >
                <Palette className="nav-icon" />
                外观设置
              </button>
            </div>
          </div>

          {/* 设置内容 */}
          <div className="settings-content">
            {/* 基本设置 */}
            {activeSection === 'general' && (
              <div className="settings-section">
                <h2>基本设置</h2>
                
                <div className="form-group">
                  <label>网站名称</label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => handleInputChange('siteName', e.target.value)}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>网站描述</label>
                  <textarea
                    value={settings.siteDescription}
                    onChange={(e) => handleInputChange('siteDescription', e.target.value)}
                    className="form-textarea"
                    rows={3}
                  />
                </div>
                
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={settings.registrationEnabled}
                      onChange={(e) => handleInputChange('registrationEnabled', e.target.checked)}
                    />
                    允许用户注册
                  </label>
                </div>
                
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) => handleInputChange('maintenanceMode', e.target.checked)}
                    />
                    维护模式
                  </label>
                  <small>启用后，只有管理员可以访问网站</small>
                </div>
              </div>
            )}

            {/* 上传设置 */}
            {activeSection === 'upload' && (
              <div className="settings-section">
                <h2>上传设置</h2>
                
                <div className="form-group">
                  <label>最大文件大小 (MB)</label>
                  <input
                    type="number"
                    value={settings.maxFileSize}
                    onChange={(e) => handleInputChange('maxFileSize', parseInt(e.target.value))}
                    className="form-input"
                    min="1"
                    max="500"
                  />
                </div>
                
                <div className="form-group">
                  <label>允许的文件类型</label>
                  <input
                    type="text"
                    value={settings.allowedFileTypes.join(', ')}
                    onChange={(e) => handleArrayChange('allowedFileTypes', e.target.value)}
                    className="form-input"
                    placeholder="jpg, png, mp4, mov"
                  />
                  <small>用逗号分隔多个文件类型</small>
                </div>
                
                <div className="form-group">
                  <label>每用户最大作品数</label>
                  <input
                    type="number"
                    value={settings.maxWorksPerUser}
                    onChange={(e) => handleInputChange('maxWorksPerUser', parseInt(e.target.value))}
                    className="form-input"
                    min="1"
                    max="100"
                  />
                </div>
                
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={settings.autoApproveWorks}
                      onChange={(e) => handleInputChange('autoApproveWorks', e.target.checked)}
                    />
                    自动审核通过作品
                  </label>
                  <small>启用后，新上传的作品将自动通过审核</small>
                </div>
              </div>
            )}

            {/* 安全设置 */}
            {activeSection === 'security' && (
              <div className="settings-section">
                <h2>安全设置</h2>
                
                <div className="form-group">
                  <label>会话超时时间 (小时)</label>
                  <input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
                    className="form-input"
                    min="1"
                    max="168"
                  />
                </div>
                
                <div className="form-group">
                  <label>数据备份频率</label>
                  <select
                    value={settings.backupFrequency}
                    onChange={(e) => handleInputChange('backupFrequency', e.target.value)}
                    className="form-select"
                  >
                    <option value="hourly">每小时</option>
                    <option value="daily">每天</option>
                    <option value="weekly">每周</option>
                    <option value="monthly">每月</option>
                  </select>
                </div>
              </div>
            )}

            {/* 通知设置 */}
            {activeSection === 'notifications' && (
              <div className="settings-section">
                <h2>通知设置</h2>
                
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                    />
                    启用邮件通知
                  </label>
                  <small>向管理员发送重要事件的邮件通知</small>
                </div>
              </div>
            )}

            {/* 外观设置 */}
            {activeSection === 'appearance' && (
              <div className="settings-section">
                <h2>外观设置</h2>
                
                <div className="form-group">
                  <label>主题色</label>
                  <input
                    type="color"
                    value={settings.themeColor}
                    onChange={(e) => handleInputChange('themeColor', e.target.value)}
                    className="form-color"
                  />
                </div>
              </div>
            )}

            {/* 保存按钮 */}
            <div className="settings-actions">
              <button 
                className="btn-save"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="btn-icon spinning" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="btn-icon" />
                    保存设置
                  </>
                )}
              </button>
              
              {saved && (
                <div className="save-success">
                  设置已保存成功！
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
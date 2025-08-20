import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Home, Upload, Image, LogIn, UserPlus, Settings, User, Users, Calendar, ChevronDown, BarChart3, FileText, Shield, Package } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <Camera className="logo-icon" />
          <span>无限摄制社团</span>
        </Link>
        
        <div className="nav-menu">
          <Link to="/" className="nav-link">
            <Home className="nav-icon" />
            <span>首页</span>
          </Link>
          <Link to="/gallery" className="nav-link">
            <Image className="nav-icon" />
            <span>作品展示</span>
          </Link>
          <Link to="/upload" className="nav-link">
            <Upload className="nav-icon" />
            <span>上传作品</span>
          </Link>
          {user && user.role === 'member' && (
            <Link to="/tasks" className="nav-link">
              <Calendar className="nav-icon" />
              <span>我的任务</span>
            </Link>
          )}
          {user && user.role === 'admin' && (
            <div className="admin-dropdown-container">
              <button 
                className="nav-link admin-dropdown-trigger"
                onClick={() => setShowAdminDropdown(!showAdminDropdown)}
                onBlur={() => setTimeout(() => setShowAdminDropdown(false), 150)}
              >
                <Shield className="nav-icon" />
                <span>管理中心</span>
                <ChevronDown className={`dropdown-arrow ${showAdminDropdown ? 'rotated' : ''}`} />
              </button>
              {showAdminDropdown && (
                 <div className="admin-dropdown-menu">
                   <Link to="/admin" className="dropdown-item">
                     <BarChart3 className="dropdown-icon" />
                     <span>数据概览与审核</span>
                   </Link>
                   <Link to="/admin/users" className="dropdown-item">
                     <Users className="dropdown-icon" />
                     <span>用户管理</span>
                   </Link>
                   <Link to="/admin/tasks" className="dropdown-item">
                     <Calendar className="dropdown-icon" />
                     <span>任务管理</span>
                   </Link>
                   <Link to="/admin/assets" className="dropdown-item">
                     <Package className="dropdown-icon" />
                     <span>资产管理</span>
                   </Link>
                   <Link to="/admin/settings" className="dropdown-item">
                     <Settings className="dropdown-icon" />
                     <span>系统设置</span>
                   </Link>
                 </div>
               )}
            </div>
          )}
        </div>
        
        <div className="nav-auth">
          {user ? (
            <div className="user-menu">
              <span className="user-welcome">欢迎, {user.realName}</span>
              <Link to="/change-password" className="nav-link change-password-link">
                <Settings className="nav-icon" />
                <span>修改密码</span>
              </Link>
              <button className="logout-btn" onClick={handleLogout}>
                <User className="nav-icon" />
                <span>退出</span>
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="nav-link auth-link">
                <LogIn className="nav-icon" />
                <span>登录</span>
              </Link>
              <Link to="/register" className="nav-link auth-link register">
                <UserPlus className="nav-icon" />
                <span>注册</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
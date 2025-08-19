// API配置
const getApiBaseUrl = () => {
  // 检查是否在局域网环境
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  } else {
    // 局域网环境，使用本机IP
    return 'http://192.168.3.10:5000';
  }
};

export const API_BASE_URL = getApiBaseUrl();

// API端点
export const API_ENDPOINTS = {
  // 认证相关
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  CHANGE_PASSWORD: `${API_BASE_URL}/api/auth/change-password`,
  
  // 作品相关
  WORKS: `${API_BASE_URL}/api/works`,
  WORK_DETAIL: (id) => `${API_BASE_URL}/api/works/${id}`,
  WORK_LIKE: (id) => `${API_BASE_URL}/api/works/${id}/like`,
  WORK_COMMENTS: (id) => `${API_BASE_URL}/api/works/${id}/comments`,
  WORK_REVIEW: (id) => `${API_BASE_URL}/api/works/${id}/review`,
  
  // 用户相关
  USERS: `${API_BASE_URL}/api/users`,
  
  // 任务相关
  TASKS: `${API_BASE_URL}/api/tasks`,
  TASK_DETAIL: (id) => `${API_BASE_URL}/api/tasks/${id}`,
  TASK_ASSIGN: (id) => `${API_BASE_URL}/api/tasks/${id}/assign`,
  TASK_SUBMIT: (id) => `${API_BASE_URL}/api/tasks/${id}/submit`
};

export default API_BASE_URL;
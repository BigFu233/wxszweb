const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/database');
const { checkFFmpegAvailability } = require('./utils/videoProcessor');
const authRoutes = require('./routes/auth');
const workRoutes = require('./routes/works');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const assetRoutes = require('./routes/assets');

const app = express();
const PORT = process.env.PORT || 5000;

// 连接数据库
connectDB();

// 中间件
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "http://localhost:5000", "http://localhost:5173"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "http://localhost:5000", "http://localhost:5173"]
    }
  }
}));
app.use(morgan('combined'));
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://192.168.3.10:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'Content-Type']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务 - 配置CORS和MIME类型
const staticOptions = {
  setHeaders: (res, path, stat) => {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // 根据文件扩展名设置正确的Content-Type
    const ext = require('path').extname(path).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.wmv': 'video/x-ms-wmv',
      '.webm': 'video/webm'
    };
    
    if (mimeTypes[ext]) {
      res.setHeader('Content-Type', mimeTypes[ext]);
    }
  }
};

// 处理OPTIONS预检请求
app.options('/uploads/*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.sendStatus(200);
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), staticOptions));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/works', workRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/assets', assetRoutes);

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: '无限摄制社团后端服务运行正常',
    timestamp: new Date().toISOString()
  });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: '请求的资源不存在' 
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err.stack);
  res.status(500).json({ 
    success: false, 
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : '服务器错误'
  });
});

app.listen(PORT, async () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
  console.log(`📱 前端地址: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🌐 后端地址: http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
  
  // 检查FFmpeg是否可用
  try {
    await checkFFmpegAvailability();
    console.log('✅ FFmpeg 检查通过，视频缩略图功能可用');
  } catch (error) {
    console.warn('⚠️  FFmpeg 不可用，视频缩略图功能将无法正常工作');
    console.warn('📖 请参考安装指南: backend/FFMPEG_INSTALL_GUIDE.md');
  }
});
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const ensureUploadDirs = () => {
  const dirs = [
    path.join(__dirname, '../uploads'),
    path.join(__dirname, '../uploads/photos'),
    path.join(__dirname, '../uploads/videos'),
    path.join(__dirname, '../uploads/thumbnails')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 创建上传目录: ${dir}`);
    }
  });
};

// 初始化上传目录
ensureUploadDirs();

// 存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    if (file.mimetype.startsWith('image/')) {
      uploadPath += 'photos/';
    } else if (file.mimetype.startsWith('video/')) {
      uploadPath += 'videos/';
    } else {
      uploadPath += 'others/';
    }
    
    const fullPath = path.join(__dirname, '../', uploadPath);
    
    // 确保目录存在
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_') // 替换特殊字符
      .substring(0, 50); // 限制长度
    
    cb(null, `${name}_${uniqueSuffix}${ext}`);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 允许的图片格式
  const allowedImageTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp'
  ];
  
  // 允许的视频格式
  const allowedVideoTypes = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo', // .avi
    'video/x-ms-wmv',  // .wmv
    'video/webm'
  ];
  
  const allAllowedTypes = [...allowedImageTypes, ...allowedVideoTypes];
  
  if (allAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${file.mimetype}。支持的格式: 图片(JPG, PNG, GIF, WebP, BMP) 和 视频(MP4, MOV, AVI, WMV, WebM)`), false);
  }
};

// 文件大小限制
const limits = {
  fileSize: 100 * 1024 * 1024, // 100MB
  files: 10 // 最多10个文件
};

// 创建multer实例
const upload = multer({
  storage,
  fileFilter,
  limits
});

// 单文件上传中间件
const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        return handleUploadError(err, res);
      }
      next();
    });
  };
};

// 多文件上传中间件
const uploadMultiple = (fieldName, maxCount = 10) => {
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) => {
      if (err) {
        return handleUploadError(err, res);
      }
      next();
    });
  };
};

// 处理上传错误
const handleUploadError = (err, res) => {
  console.error('文件上传错误:', err);
  
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: '文件大小超过限制（最大100MB）'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: '文件数量超过限制（最多10个文件）'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: '意外的文件字段'
        });
      default:
        return res.status(400).json({
          success: false,
          message: `上传错误: ${err.message}`
        });
    }
  }
  
  return res.status(400).json({
    success: false,
    message: err.message || '文件上传失败'
  });
};

// 删除文件工具函数
const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error('删除文件失败:', err);
        reject(err);
      } else {
        console.log('文件删除成功:', filePath);
        resolve();
      }
    });
  });
};

// 删除多个文件
const deleteFiles = async (filePaths) => {
  const deletePromises = filePaths.map(filePath => deleteFile(filePath));
  try {
    await Promise.all(deletePromises);
    console.log('批量删除文件成功');
  } catch (error) {
    console.error('批量删除文件失败:', error);
  }
};

// 获取文件URL
const getFileUrl = (req, filePath) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  // 确保路径以uploads开头
  const normalizedPath = filePath.replace(/\\/g, '/');
  const relativePath = normalizedPath.includes('uploads/') 
    ? normalizedPath.substring(normalizedPath.indexOf('uploads/')) 
    : `uploads/${normalizedPath}`;
  return `${baseUrl}/${relativePath}`;
};

// 验证文件类型
const validateFileType = (file, allowedTypes) => {
  return allowedTypes.includes(file.mimetype);
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  deleteFile,
  deleteFiles,
  getFileUrl,
  validateFileType,
  formatFileSize,
  ensureUploadDirs
};
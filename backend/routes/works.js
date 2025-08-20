const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Work = require('../models/Work');
const User = require('../models/User');
const { authenticateToken, optionalAuth, requireAdmin, requireOwnerOrAdmin } = require('../middleware/auth');

// 验证社员或管理员权限
const requireMemberOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '需要登录'
    });
  }

  if (!['member', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: '只有社团社员才能上传作品'
    });
  }

  next();
};
const { uploadMultiple, getFileUrl, deleteFiles } = require('../middleware/upload');
const { processVideoFile } = require('../utils/videoProcessor');
const path = require('path');

const router = express.Router();

// 作品创建验证规则
const createWorkValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('标题长度必须在1-100个字符之间'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('描述不能超过1000个字符'),
  body('type')
    .isIn(['photo', 'video'])
    .withMessage('作品类型必须是photo或video'),
  body('authorName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('作者姓名不能为空且不超过50个字符'),
  body('category')
    .optional()
    .isIn(['人像', '风景', '街拍', '建筑', '纪录片', '微电影', 'MV', '广告', '其他'])
    .withMessage('作品分类不正确'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组格式')
];

// 获取作品列表
router.get('/', optionalAuth, [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间'),
  query('type').optional().isIn(['photo', 'video']).withMessage('类型必须是photo或video'),
  query('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('状态不正确'),
  query('category').optional().isString().withMessage('分类必须是字符串'),
  query('author').optional().isMongoId().withMessage('作者ID格式不正确'),
  query('search').optional().isString().withMessage('搜索关键词必须是字符串'),
  query('sort').optional().isIn(['newest', 'oldest', 'popular', 'views']).withMessage('排序方式不正确'),
  query('isTaskSubmission').optional().isBoolean().withMessage('isTaskSubmission必须是布尔值')
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 12,
      type,
      status,
      category,
      author,
      search,
      sort = 'newest',
      isTaskSubmission
    } = req.query;

    // 构建查询条件
    const query = {};
    
    // 非管理员只能看到已审核通过的作品
    if (!req.user || req.user.role !== 'admin') {
      query.status = 'approved';
      query.isPublic = true;
    } else if (status) {
      query.status = status;
    }

    if (type) query.type = type;
    if (category) query.category = category;
    if (author) query.author = author;
    if (isTaskSubmission !== undefined) query.isTaskSubmission = isTaskSubmission === 'true';
    
    // 文本搜索
    if (search) {
      query.$text = { $search: search };
    }

    // 排序选项
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'popular':
        sortOption = { likes: -1, views: -1 };
        break;
      case 'views':
        sortOption = { views: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // 分页计算
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 查询作品
    const works = await Work.find(query)
      .populate('author', 'username realName avatar')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // 获取总数
    const total = await Work.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    // 处理文件URL
    const worksWithUrls = works.map(work => ({
      ...work,
      files: work.files.map(file => ({
        ...file,
        url: getFileUrl(req, file.path)
      })),
      thumbnail: work.thumbnail ? getFileUrl(req, work.thumbnail) : 
                 (work.type === 'video' && work.files.length > 0 ? null : 
                  (work.files.length > 0 ? getFileUrl(req, work.files[0].path) : null))
    }));

    res.json({
      success: true,
      data: {
        works: worksWithUrls,
        pagination: {
          current: parseInt(page),
          total: totalPages,
          count: works.length,
          totalCount: total
        }
      }
    });

  } catch (error) {
    console.error('获取作品列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取单个作品详情
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const work = await Work.findById(id)
      .populate('author', 'username realName avatar bio socialLinks')
      .populate('comments.user', 'username realName avatar');

    if (!work) {
      return res.status(404).json({
        success: false,
        message: '作品不存在'
      });
    }

    // 检查访问权限
    if (work.status !== 'approved' && (!req.user || (req.user._id.toString() !== work.author._id.toString() && req.user.role !== 'admin'))) {
      return res.status(403).json({
        success: false,
        message: '没有权限访问此作品'
      });
    }

    // 增加浏览量（非作者访问时）
    if (!req.user || req.user._id.toString() !== work.author._id.toString()) {
      await work.incrementViews();
    }

    // 处理文件URL
    const workWithUrls = {
      ...work.toObject(),
      files: work.files.map(file => ({
        ...file,
        url: getFileUrl(req, file.path)
      })),
      thumbnail: work.thumbnail ? getFileUrl(req, work.thumbnail) : 
                 (work.type === 'video' && work.files.length > 0 ? null : 
                  (work.files.length > 0 ? getFileUrl(req, work.files[0].path) : null))
    };

    res.json({
      success: true,
      data: { work: workWithUrls }
    });

  } catch (error) {
    console.error('获取作品详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 创建新作品
router.post('/', authenticateToken, requireMemberOrAdmin, uploadMultiple('files', 10), createWorkValidation, async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // 删除已上传的文件
      if (req.files && req.files.length > 0) {
        const filePaths = req.files.map(file => file.path);
        await deleteFiles(filePaths);
      }
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    // 检查是否有文件上传
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的文件'
      });
    }

    const { title, description, type, authorName, category, tags } = req.body;

    // 验证文件类型与作品类型匹配
    const isValidFileType = req.files.every(file => {
      if (type === 'photo') {
        return file.mimetype.startsWith('image/');
      } else if (type === 'video') {
        return file.mimetype.startsWith('video/');
      }
      return false;
    });

    if (!isValidFileType) {
      // 删除已上传的文件
      const filePaths = req.files.map(file => file.path);
      await deleteFiles(filePaths);
      return res.status(400).json({
        success: false,
        message: `文件类型与作品类型不匹配。${type === 'photo' ? '摄影作品只能上传图片文件' : '视频作品只能上传视频文件'}`
      });
    }

    // 处理文件信息
    const files = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path.replace(/\\/g, '/'),
      url: getFileUrl(req, file.path)
    }));

    // 生成视频缩略图
    let thumbnailPath = '';
    if (type === 'video' && req.files.length > 0) {
      try {
        const thumbnailDir = path.join(__dirname, '../uploads/thumbnails');
        thumbnailPath = await processVideoFile(req.files[0], thumbnailDir);
        console.log('视频缩略图生成成功:', thumbnailPath);
      } catch (error) {
        console.error('生成视频缩略图失败:', error);
        // 不阻止作品创建，只是没有缩略图
      }
    }

    // 创建作品
    const work = new Work({
      title,
      description: description || '',
      type,
      author: req.user._id,
      authorName,
      files,
      thumbnail: thumbnailPath,
      category: category || '其他',
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : []
    });

    await work.save();

    // 更新用户统计
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.totalWorks': 1 }
    });

    // 填充作者信息
    await work.populate('author', 'username realName avatar');

    res.status(201).json({
      success: true,
      message: '作品上传成功，等待审核',
      data: { work }
    });

  } catch (error) {
    console.error('创建作品错误:', error);
    
    // 删除已上传的文件
    if (req.files && req.files.length > 0) {
      const filePaths = req.files.map(file => file.path);
      await deleteFiles(filePaths);
    }
    
    res.status(500).json({
      success: false,
      message: '服务器错误，上传失败'
    });
  }
});

// 更新作品信息
router.put('/:id', authenticateToken, requireOwnerOrAdmin, [
  body('title').optional().trim().isLength({ min: 1, max: 100 }).withMessage('标题长度必须在1-100个字符之间'),
  body('description').optional().isLength({ max: 1000 }).withMessage('描述不能超过1000个字符'),
  body('category').optional().isIn(['人像', '风景', '街拍', '建筑', '纪录片', '微电影', 'MV', '广告', '其他']).withMessage('作品分类不正确'),
  body('tags').optional().isArray().withMessage('标签必须是数组格式')
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { title, description, category, tags } = req.body;
    const work = req.work;

    // 更新字段
    if (title !== undefined) work.title = title;
    if (description !== undefined) work.description = description;
    if (category !== undefined) work.category = category;
    if (tags !== undefined) work.tags = tags;

    await work.save();
    await work.populate('author', 'username realName avatar');

    res.json({
      success: true,
      message: '作品更新成功',
      data: { work }
    });

  } catch (error) {
    console.error('更新作品错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，更新失败'
    });
  }
});

// 删除作品
router.delete('/:id', authenticateToken, requireOwnerOrAdmin, async (req, res) => {
  try {
    const work = req.work;

    // 删除文件
    if (work.files && work.files.length > 0) {
      const filePaths = work.files.map(file => file.path);
      await deleteFiles(filePaths);
    }

    // 删除作品
    await Work.findByIdAndDelete(work._id);

    // 更新用户统计
    await User.findByIdAndUpdate(work.author, {
      $inc: { 'stats.totalWorks': -1 }
    });

    res.json({
      success: true,
      message: '作品删除成功'
    });

  } catch (error) {
    console.error('删除作品错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，删除失败'
    });
  }
});

// 点赞/取消点赞作品
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const work = await Work.findById(req.params.id);
    
    if (!work) {
      return res.status(404).json({
        success: false,
        message: '作品不存在'
      });
    }

    if (work.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: '只能点赞已审核通过的作品'
      });
    }

    await work.toggleLike(req.user._id);
    
    const isLiked = work.likedBy.includes(req.user._id);

    res.json({
      success: true,
      message: isLiked ? '点赞成功' : '取消点赞成功',
      data: {
        isLiked,
        likes: work.likes
      }
    });

  } catch (error) {
    console.error('点赞作品错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 添加评论
router.post('/:id/comments', authenticateToken, [
  body('content').trim().isLength({ min: 1, max: 500 }).withMessage('评论内容长度必须在1-500个字符之间')
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const work = await Work.findById(req.params.id);
    
    if (!work) {
      return res.status(404).json({
        success: false,
        message: '作品不存在'
      });
    }

    if (work.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: '只能评论已审核通过的作品'
      });
    }

    const { content } = req.body;
    
    await work.addComment(req.user._id, req.user.username, content);
    await work.populate('comments.user', 'username realName avatar');

    res.status(201).json({
      success: true,
      message: '评论添加成功',
      data: {
        comment: work.comments[work.comments.length - 1]
      }
    });

  } catch (error) {
    console.error('添加评论错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 删除评论
router.delete('/:id/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const work = await Work.findById(req.params.id);
    
    if (!work) {
      return res.status(404).json({
        success: false,
        message: '作品不存在'
      });
    }

    const comment = work.comments.id(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }

    // 检查权限（评论作者或管理员）
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '没有权限删除此评论'
      });
    }

    await work.removeComment(req.params.commentId);

    res.json({
      success: true,
      message: '评论删除成功'
    });

  } catch (error) {
    console.error('删除评论错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 审核作品（管理员）
router.put('/:id/review', authenticateToken, requireAdmin, [
  body('action').isIn(['approve', 'reject']).withMessage('操作必须是approve或reject'),
  body('reason').optional().isLength({ max: 200 }).withMessage('拒绝原因不能超过200个字符')
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const work = await Work.findById(req.params.id);
    
    if (!work) {
      return res.status(404).json({
        success: false,
        message: '作品不存在'
      });
    }

    const { action, reason } = req.body;

    if (action === 'approve') {
      await work.approve(req.user._id);
    } else {
      if (!reason) {
        return res.status(400).json({
          success: false,
          message: '拒绝作品时必须提供原因'
        });
      }
      await work.reject(reason);
    }

    await work.populate('author', 'username realName');

    res.json({
      success: true,
      message: action === 'approve' ? '作品审核通过' : '作品审核拒绝',
      data: { work }
    });

  } catch (error) {
    console.error('审核作品错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 删除作品 (仅管理员)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // 检查用户权限
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '权限不足，只有管理员可以删除作品'
      });
    }

    const work = await Work.findById(req.params.id);
    if (!work) {
      return res.status(404).json({
        success: false,
        message: '作品不存在'
      });
    }

    // 删除相关文件
    const { deleteFiles } = require('../middleware/upload');
    if (work.files && work.files.length > 0) {
      const filePaths = work.files.map(file => file.path);
      await deleteFiles(filePaths);
    }

    // 删除作品记录
    await Work.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: '作品删除成功'
    });

  } catch (error) {
    console.error('删除作品错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router;
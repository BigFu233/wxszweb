const express = require('express');
const { query, body, validationResult } = require('express-validator');
const User = require('../models/User');
const Work = require('../models/Work');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 创建用户（管理员）
router.post('/', authenticateToken, requireAdmin, [
  body('username')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('用户名长度必须在2-20个字符之间')
    .matches(/^[a-zA-Z0-9\u4e00-\u9fa5_]+$/)
    .withMessage('用户名只能包含字母、数字、中文和下划线'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码至少需要6个字符')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('密码必须包含至少一个字母和一个数字'),
  body('realName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('真实姓名长度必须在2-50个字符之间'),
  body('role')
    .optional()
    .isIn(['user', 'member', 'admin'])
    .withMessage('角色必须是user、member或admin')
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

    const { username, email, password, realName, role = 'user' } = req.body;

    // 检查用户是否已存在
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email ? '邮箱已被注册' : '用户名已被使用'
      });
    }

    // 创建新用户
    const user = new User({
      username,
      email,
      password,
      realName,
      role,
      isActive: true
    });

    await user.save();

    // 返回用户信息（不包含密码）
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: { user: userResponse }
    });

  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，创建失败'
    });
  }
});

// 获取用户列表（管理员）
router.get('/', authenticateToken, requireAdmin, [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间'),
  query('search').optional().isString().withMessage('搜索关键词必须是字符串'),
  query('role').optional().isIn(['user', 'member', 'admin']).withMessage('角色必须是user、member或admin'),
  query('isActive').optional().isBoolean().withMessage('状态必须是布尔值')
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
      limit = 20,
      search,
      role,
      isActive
    } = req.query;

    // 构建查询条件
    const query = {};
    
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    // 文本搜索
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { realName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // 分页计算
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 查询用户
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // 获取总数
    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          total: totalPages,
          count: users.length,
          totalCount: total
        }
      }
    });

  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取用户详情
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查权限：只能查看自己的详细信息或管理员可以查看所有用户
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '没有权限访问此用户信息'
      });
    }

    const user = await User.findById(id)
      .select('-password')
      .populate({
        path: 'works',
        select: 'title type status createdAt views likes thumbnail',
        options: { sort: { createdAt: -1 } }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('获取用户详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取用户公开资料
router.get('/:id/profile', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('username realName avatar bio socialLinks stats joinDate')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 获取用户的公开作品
    const works = await Work.find({
      author: id,
      status: 'approved',
      isPublic: true
    })
    .select('title type thumbnail createdAt views likes')
    .sort({ createdAt: -1 })
    .limit(12)
    .lean();

    res.json({
      success: true,
      data: {
        user,
        works
      }
    });

  } catch (error) {
    console.error('获取用户公开资料错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取用户作品列表
router.get('/:id/works', [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间'),
  query('type').optional().isIn(['photo', 'video']).withMessage('类型必须是photo或video'),
  query('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('状态不正确')
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

    const { id } = req.params;
    const {
      page = 1,
      limit = 12,
      type,
      status
    } = req.query;

    // 检查用户是否存在
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 构建查询条件
    const query = { author: id };
    
    // 权限检查：非作者本人和非管理员只能看到已审核通过的公开作品
    if (!req.user || (req.user._id.toString() !== id && req.user.role !== 'admin')) {
      query.status = 'approved';
      query.isPublic = true;
    } else if (status) {
      query.status = status;
    }
    
    if (type) query.type = type;

    // 分页计算
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 查询作品
    const works = await Work.find(query)
      .select('title type thumbnail status createdAt views likes commentCount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // 获取总数
    const total = await Work.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        works,
        pagination: {
          current: parseInt(page),
          total: totalPages,
          count: works.length,
          totalCount: total
        }
      }
    });

  } catch (error) {
    console.error('获取用户作品列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 更新用户状态（管理员）
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: '状态值必须是布尔类型'
      });
    }

    // 不能禁用自己的账户
    if (req.user._id.toString() === id && !isActive) {
      return res.status(400).json({
        success: false,
        message: '不能禁用自己的账户'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      message: `用户账户已${isActive ? '启用' : '禁用'}`,
      data: { user }
    });

  } catch (error) {
    console.error('更新用户状态错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 更新用户角色（管理员）
router.put('/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'member', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: '角色必须是user、member或admin'
      });
    }

    // 不能修改自己的角色
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: '不能修改自己的角色'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      message: `用户角色已更新为${role === 'admin' ? '管理员' : role === 'member' ? '社团社员' : '普通用户'}`,
      data: { user }
    });

  } catch (error) {
    console.error('更新用户角色错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 删除用户（管理员）
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // 不能删除自己的账户
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: '不能删除自己的账户'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 删除用户的所有作品
    const userWorks = await Work.find({ author: id });
    
    // 这里应该删除作品相关的文件，但为了简化，我们只删除数据库记录
    await Work.deleteMany({ author: id });
    
    // 删除用户
    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: `用户 ${user.username} 及其所有作品已删除`,
      data: {
        deletedWorksCount: userWorks.length
      }
    });

  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取用户统计信息
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('stats username realName');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 获取详细统计
    const [totalWorks, approvedWorks, pendingWorks, rejectedWorks] = await Promise.all([
      Work.countDocuments({ author: id }),
      Work.countDocuments({ author: id, status: 'approved' }),
      Work.countDocuments({ author: id, status: 'pending' }),
      Work.countDocuments({ author: id, status: 'rejected' })
    ]);

    // 获取总浏览量和点赞数
    const workStats = await Work.aggregate([
      { $match: { author: user._id } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: '$likes' }
        }
      }
    ]);

    const stats = {
      totalWorks,
      approvedWorks,
      pendingWorks,
      rejectedWorks,
      totalViews: workStats[0]?.totalViews || 0,
      totalLikes: workStats[0]?.totalLikes || 0
    };

    res.json({
      success: true,
      data: {
        user: {
          username: user.username,
          realName: user.realName
        },
        stats
      }
    });

  } catch (error) {
    console.error('获取用户统计错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router;
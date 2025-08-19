const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Task = require('../models/Task');
const User = require('../models/User');
const Work = require('../models/Work');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

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
      message: '需要社员或管理员权限'
    });
  }

  next();
};

// 创建任务验证规则
const createTaskValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('任务标题长度必须在1-100个字符之间'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('任务描述长度必须在1-1000个字符之间'),
  body('type')
    .isIn(['photo', 'video', 'both'])
    .withMessage('任务类型必须是photo、video或both'),
  body('deadline')
    .isISO8601()
    .withMessage('截止日期格式不正确'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('优先级必须是low、medium、high或urgent'),
  body('assignedTo')
    .optional()
    .isArray()
    .withMessage('分配用户必须是数组格式'),
  body('requirements.minFiles')
    .optional()
    .isInt({ min: 1 })
    .withMessage('最少文件数必须是正整数'),
  body('requirements.maxFiles')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('最多文件数必须在1-10之间')
];

// 创建任务（管理员）
router.post('/', authenticateToken, requireAdmin, createTaskValidation, async (req, res) => {
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

    const {
      title,
      description,
      type,
      deadline,
      priority = 'medium',
      assignedTo = [],
      requirements = {},
      tags = [],
      category = '其他',
      isPublic = false
    } = req.body;

    // 验证截止日期不能是过去时间
    if (new Date(deadline) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: '截止日期不能是过去时间'
      });
    }

    // 验证分配的用户是否存在且为社员
    if (assignedTo.length > 0) {
      const users = await User.find({
        _id: { $in: assignedTo },
        role: 'member',
        isActive: true
      });
      
      if (users.length !== assignedTo.length) {
        return res.status(400).json({
          success: false,
          message: '部分用户不存在或不是活跃的社员'
        });
      }
    }

    // 创建任务
    const task = new Task({
      title,
      description,
      type,
      creator: req.user._id,
      deadline: new Date(deadline),
      priority,
      requirements,
      tags,
      category,
      isPublic,
      assignedTo: assignedTo.map(userId => ({
        user: userId,
        assignedAt: new Date(),
        status: 'pending'
      }))
    });

    await task.save();
    await task.populate([
      { path: 'creator', select: 'username realName' },
      { path: 'assignedTo.user', select: 'username realName email' }
    ]);

    res.status(201).json({
      success: true,
      message: '任务创建成功',
      data: { task }
    });

  } catch (error) {
    console.error('创建任务错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，创建失败'
    });
  }
});

// 获取任务列表
router.get('/', authenticateToken, requireMemberOrAdmin, [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间'),
  query('status').optional().isIn(['draft', 'published', 'completed', 'cancelled']).withMessage('状态不正确'),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('优先级不正确'),
  query('type').optional().isIn(['photo', 'video', 'both']).withMessage('类型不正确'),
  query('assignedToMe').optional().isBoolean().withMessage('assignedToMe必须是布尔值')
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
      status,
      priority,
      type,
      assignedToMe
    } = req.query;

    // 构建查询条件
    const query = {};
    
    // 管理员可以看到所有任务，社员只能看到分配给自己的任务或公开任务
    if (req.user.role === 'admin') {
      if (status) query.status = status;
    } else {
      // 社员只能看到已发布的任务
      query.status = 'published';
      
      if (assignedToMe === 'true') {
        query['assignedTo.user'] = req.user._id;
      } else {
        // 显示分配给自己的任务或公开任务
        query.$or = [
          { 'assignedTo.user': req.user._id },
          { isPublic: true }
        ];
      }
    }
    
    if (priority) query.priority = priority;
    if (type) query.type = type;

    // 分页计算
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 查询任务
    const tasks = await Task.find(query)
      .populate('creator', 'username realName')
      .populate('assignedTo.user', 'username realName email')
      .sort({ priority: -1, deadline: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // 获取总数
    const total = await Task.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          current: parseInt(page),
          total: totalPages,
          count: tasks.length,
          totalCount: total
        }
      }
    });

  } catch (error) {
    console.error('获取任务列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取任务详情
router.get('/:id', authenticateToken, requireMemberOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id)
      .populate('creator', 'username realName')
      .populate('assignedTo.user', 'username realName email')
      .populate('assignedTo.submittedWork', 'title type files createdAt');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    // 权限检查：管理员可以查看所有任务，社员只能查看分配给自己的任务或公开任务
    if (req.user.role !== 'admin') {
      const isAssigned = task.assignedTo.some(assignment => 
        assignment.user._id.toString() === req.user._id.toString()
      );
      
      if (!isAssigned && !task.isPublic) {
        return res.status(403).json({
          success: false,
          message: '没有权限查看此任务'
        });
      }
    }

    res.json({
      success: true,
      data: { task }
    });

  } catch (error) {
    console.error('获取任务详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 更新任务（管理员）
router.put('/:id', authenticateToken, requireAdmin, [
  body('title').optional().trim().isLength({ min: 1, max: 100 }).withMessage('任务标题长度必须在1-100个字符之间'),
  body('description').optional().trim().isLength({ min: 1, max: 1000 }).withMessage('任务描述长度必须在1-1000个字符之间'),
  body('type').optional().isIn(['photo', 'video', 'both']).withMessage('任务类型必须是photo、video或both'),
  body('deadline').optional().isISO8601().withMessage('截止日期格式不正确'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('优先级必须是low、medium、high或urgent'),
  body('status').optional().isIn(['draft', 'published', 'completed', 'cancelled']).withMessage('状态不正确')
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

    const { id } = req.params;
    const updateData = req.body;

    // 验证截止日期
    if (updateData.deadline && new Date(updateData.deadline) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: '截止日期不能是过去时间'
      });
    }

    const task = await Task.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'creator', select: 'username realName' },
      { path: 'assignedTo.user', select: 'username realName email' }
    ]);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    res.json({
      success: true,
      message: '任务更新成功',
      data: { task }
    });

  } catch (error) {
    console.error('更新任务错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，更新失败'
    });
  }
});

// 分配任务给用户（管理员）
router.post('/:id/assign', authenticateToken, requireAdmin, [
  body('userIds').isArray().withMessage('用户ID必须是数组格式'),
  body('userIds.*').isMongoId().withMessage('用户ID格式不正确')
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

    const { id } = req.params;
    const { userIds } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    // 验证用户是否存在且为社员
    const users = await User.find({
      _id: { $in: userIds },
      role: 'member',
      isActive: true
    });
    
    if (users.length !== userIds.length) {
      return res.status(400).json({
        success: false,
        message: '部分用户不存在或不是活跃的社员'
      });
    }

    // 分配任务
    for (const userId of userIds) {
      await task.assignToUser(userId);
    }

    await task.populate([
      { path: 'creator', select: 'username realName' },
      { path: 'assignedTo.user', select: 'username realName email' }
    ]);

    res.json({
      success: true,
      message: '任务分配成功',
      data: { task }
    });

  } catch (error) {
    console.error('分配任务错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 提交任务作品（社员）
router.post('/:id/submit', authenticateToken, requireMemberOrAdmin, [
  body('workId').isMongoId().withMessage('作品ID格式不正确')
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

    const { id } = req.params;
    const { workId } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    // 检查用户是否被分配了此任务
    const assignment = task.assignedTo.find(assignment => 
      assignment.user.toString() === req.user._id.toString()
    );
    
    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: '您未被分配此任务'
      });
    }

    // 检查作品是否存在且属于当前用户
    const work = await Work.findOne({
      _id: workId,
      author: req.user._id
    });
    
    if (!work) {
      return res.status(404).json({
        success: false,
        message: '作品不存在或不属于您'
      });
    }

    // 更新任务状态
    await task.updateUserStatus(req.user._id, 'submitted', workId);
    
    // 关联作品到任务
    work.relatedTask = task._id;
    await work.save();

    await task.populate([
      { path: 'creator', select: 'username realName' },
      { path: 'assignedTo.user', select: 'username realName email' },
      { path: 'assignedTo.submittedWork', select: 'title type files createdAt' }
    ]);

    res.json({
      success: true,
      message: '作品提交成功',
      data: { task }
    });

  } catch (error) {
    console.error('提交任务作品错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 删除任务（管理员）
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    // 删除任务
    await Task.findByIdAndDelete(id);

    res.json({
      success: true,
      message: '任务删除成功'
    });

  } catch (error) {
    console.error('删除任务错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取任务统计信息（管理员）
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [totalTasks, publishedTasks, completedTasks, overdueTasks] = await Promise.all([
      Task.countDocuments(),
      Task.countDocuments({ status: 'published' }),
      Task.countDocuments({ status: 'completed' }),
      Task.countDocuments({ 
        status: 'published',
        deadline: { $lt: new Date() }
      })
    ]);

    // 获取任务完成率统计
    const taskCompletionStats = await Task.aggregate([
      { $match: { status: 'published' } },
      {
        $group: {
          _id: null,
          avgCompletionRate: { $avg: '$completionRate' },
          totalAssignments: { $sum: { $size: '$assignedTo' } },
          totalSubmissions: { $sum: '$submissionCount' }
        }
      }
    ]);

    const stats = {
      totalTasks,
      publishedTasks,
      completedTasks,
      overdueTasks,
      avgCompletionRate: taskCompletionStats[0]?.avgCompletionRate || 0,
      totalAssignments: taskCompletionStats[0]?.totalAssignments || 0,
      totalSubmissions: taskCompletionStats[0]?.totalSubmissions || 0
    };

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('获取任务统计错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router;
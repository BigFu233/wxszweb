const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Asset = require('../models/Asset');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { uploadMultiple, getFileUrl, deleteFiles } = require('../middleware/upload');
const path = require('path');

const router = express.Router();

// 资产创建验证规则
const createAssetValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('设备名称长度必须在1-100个字符之间'),
  body('category')
    .isIn(['相机', '镜头', '三脚架', '稳定器', '灯光设备', '录音设备', '存储设备', '电脑设备', '其他'])
    .withMessage('设备类型不正确'),
  body('serialNumber')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('设备识别码长度必须在1-50个字符之间'),
  body('brand')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('品牌名称不能超过50个字符'),
  body('model')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('型号不能超过100个字符'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('描述不能超过500个字符')
];

// 获取资产列表
router.get('/', authenticateToken, requireAdmin, [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('category').optional().isString().withMessage('分类必须是字符串'),
  query('status').optional().isIn(['可用', '使用中', '维修中', '报废']).withMessage('状态不正确'),
  query('holder').optional().isMongoId().withMessage('持有人ID格式不正确'),
  query('search').optional().isString().withMessage('搜索关键词必须是字符串'),
  query('sort').optional().isIn(['newest', 'oldest', 'name', 'category']).withMessage('排序方式不正确')
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
      category,
      status,
      holder,
      search,
      sort = 'newest'
    } = req.query;

    // 构建查询条件
    const query = {};
    
    if (category) query.category = category;
    if (status) query.status = status;
    if (holder) query.currentHolder = holder;
    
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
      case 'name':
        sortOption = { name: 1 };
        break;
      case 'category':
        sortOption = { category: 1, name: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // 分页计算
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 查询资产
    const assets = await Asset.find(query)
      .populate('currentHolder', 'username realName')
      .populate('createdBy', 'username realName')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // 获取总数
    const total = await Asset.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    // 处理图片URL
    const assetsWithUrls = assets.map(asset => ({
      ...asset,
      images: asset.images?.map(image => ({
        ...image,
        url: getFileUrl(req, image.path)
      })) || []
    }));

    res.json({
      success: true,
      data: {
        assets: assetsWithUrls,
        pagination: {
          current: parseInt(page),
          total: totalPages,
          count: assets.length,
          totalCount: total
        }
      }
    });

  } catch (error) {
    console.error('获取资产列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取单个资产详情
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const asset = await Asset.findById(id)
      .populate('currentHolder', 'username realName avatar')
      .populate('createdBy', 'username realName')
      .populate('lastUpdatedBy', 'username realName')
      .populate('usageHistory.user', 'username realName')
      .lean();

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: '资产不存在'
      });
    }

    // 处理图片URL
    const assetWithUrls = {
      ...asset,
      images: asset.images?.map(image => ({
        ...image,
        url: getFileUrl(req, image.path)
      })) || []
    };

    res.json({
      success: true,
      data: { asset: assetWithUrls }
    });

  } catch (error) {
    console.error('获取资产详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 创建新资产
router.post('/', authenticateToken, requireAdmin, uploadMultiple('images', 5), createAssetValidation, async (req, res) => {
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

    const {
      name,
      category,
      brand,
      model,
      serialNumber,
      description,
      status,
      condition,
      purchaseDate,
      purchasePrice,
      vendor,
      warrantyExpiry,
      location,
      tags,
      isLoanable,
      priority
    } = req.body;

    // 检查识别码是否已存在
    const existingAsset = await Asset.findOne({ serialNumber });
    if (existingAsset) {
      // 删除已上传的文件
      if (req.files && req.files.length > 0) {
        const filePaths = req.files.map(file => file.path);
        await deleteFiles(filePaths);
      }
      return res.status(400).json({
        success: false,
        message: '设备识别码已存在'
      });
    }

    // 处理图片信息
    const images = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path.replace(/\\/g, '/'),
      url: getFileUrl(req, file.path)
    })) : [];

    // 创建资产
    const asset = new Asset({
      name,
      category,
      brand: brand || '',
      model: model || '',
      serialNumber,
      description: description || '',
      status: status || '可用',
      condition: condition || '良好',
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
      vendor: vendor || '',
      warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : undefined,
      location: location || '',
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
      isLoanable: isLoanable !== undefined ? isLoanable === 'true' : true,
      priority: priority || '中',
      images,
      createdBy: req.user._id
    });

    await asset.save();

    // 填充关联信息
    await asset.populate('createdBy', 'username realName');

    res.status(201).json({
      success: true,
      message: '资产创建成功',
      data: { asset }
    });

  } catch (error) {
    console.error('创建资产错误:', error);
    
    // 删除已上传的文件
    if (req.files && req.files.length > 0) {
      const filePaths = req.files.map(file => file.path);
      await deleteFiles(filePaths);
    }
    
    res.status(500).json({
      success: false,
      message: '服务器错误，创建失败'
    });
  }
});

// 更新资产信息
router.put('/:id', authenticateToken, requireAdmin, [
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('设备名称长度必须在1-100个字符之间'),
  body('category').optional().isIn(['相机', '镜头', '三脚架', '稳定器', '灯光设备', '录音设备', '存储设备', '电脑设备', '其他']).withMessage('设备类型不正确'),
  body('serialNumber').optional().trim().isLength({ min: 1, max: 50 }).withMessage('设备识别码长度必须在1-50个字符之间'),
  body('description').optional().isLength({ max: 500 }).withMessage('描述不能超过500个字符')
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
    const updateData = { ...req.body };
    
    // 如果更新识别码，检查是否重复
    if (updateData.serialNumber) {
      const existingAsset = await Asset.findOne({ 
        serialNumber: updateData.serialNumber,
        _id: { $ne: id }
      });
      if (existingAsset) {
        return res.status(400).json({
          success: false,
          message: '设备识别码已存在'
        });
      }
    }

    // 处理日期字段
    if (updateData.purchaseDate) {
      updateData.purchaseDate = new Date(updateData.purchaseDate);
    }
    if (updateData.warrantyExpiry) {
      updateData.warrantyExpiry = new Date(updateData.warrantyExpiry);
    }
    if (updateData.expectedReturnDate) {
      updateData.expectedReturnDate = new Date(updateData.expectedReturnDate);
    }

    // 处理数字字段
    if (updateData.purchasePrice) {
      updateData.purchasePrice = parseFloat(updateData.purchasePrice);
    }

    // 处理标签
    if (updateData.tags) {
      updateData.tags = Array.isArray(updateData.tags) ? updateData.tags : [updateData.tags];
    }

    // 处理布尔值
    if (updateData.isLoanable !== undefined) {
      updateData.isLoanable = updateData.isLoanable === 'true';
    }

    updateData.lastUpdatedBy = req.user._id;

    const asset = await Asset.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('currentHolder', 'username realName')
     .populate('createdBy', 'username realName')
     .populate('lastUpdatedBy', 'username realName');

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: '资产不存在'
      });
    }

    res.json({
      success: true,
      message: '资产更新成功',
      data: { asset }
    });

  } catch (error) {
    console.error('更新资产错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，更新失败'
    });
  }
});

// 删除资产
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const asset = await Asset.findById(id);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: '资产不存在'
      });
    }

    // 检查是否正在使用中
    if (asset.status === '使用中') {
      return res.status(400).json({
        success: false,
        message: '设备正在使用中，无法删除'
      });
    }

    // 删除相关图片文件
    if (asset.images && asset.images.length > 0) {
      const filePaths = asset.images.map(image => image.path);
      await deleteFiles(filePaths);
    }

    // 删除资产记录
    await Asset.findByIdAndDelete(id);

    res.json({
      success: true,
      message: '资产删除成功'
    });

  } catch (error) {
    console.error('删除资产错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 分配设备给用户
router.post('/:id/assign', authenticateToken, requireAdmin, [
  body('userId').isMongoId().withMessage('用户ID格式不正确'),
  body('purpose').optional().isLength({ max: 200 }).withMessage('使用目的不能超过200个字符'),
  body('expectedReturnDate').optional().isISO8601().withMessage('预期归还日期格式不正确')
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
    const { userId, purpose, expectedReturnDate } = req.body;

    const asset = await Asset.findById(id);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: '资产不存在'
      });
    }

    if (asset.status !== '可用') {
      return res.status(400).json({
        success: false,
        message: '设备当前不可用'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 分配设备
    await asset.assignToUser(
      userId,
      user.realName || user.username,
      purpose,
      expectedReturnDate ? new Date(expectedReturnDate) : null
    );

    await asset.populate('currentHolder', 'username realName');

    res.json({
      success: true,
      message: '设备分配成功',
      data: { asset }
    });

  } catch (error) {
    console.error('分配设备错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 归还设备
router.post('/:id/return', authenticateToken, requireAdmin, [
  body('condition').isIn(['良好', '一般', '需维修']).withMessage('设备状态不正确'),
  body('notes').optional().isLength({ max: 300 }).withMessage('备注不能超过300个字符')
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
    const { condition, notes } = req.body;

    const asset = await Asset.findById(id);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: '资产不存在'
      });
    }

    if (asset.status !== '使用中') {
      return res.status(400).json({
        success: false,
        message: '设备当前未被使用'
      });
    }

    // 归还设备
    await asset.returnFromUser(condition, notes);

    res.json({
      success: true,
      message: '设备归还成功',
      data: { asset }
    });

  } catch (error) {
    console.error('归还设备错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 添加维修记录
router.post('/:id/maintenance', authenticateToken, requireAdmin, [
  body('type').isIn(['保养', '维修', '检查']).withMessage('维修类型不正确'),
  body('description').trim().isLength({ min: 1, max: 300 }).withMessage('维修描述长度必须在1-300个字符之间'),
  body('cost').optional().isFloat({ min: 0 }).withMessage('费用必须是非负数'),
  body('technician').optional().isLength({ max: 50 }).withMessage('技术员姓名不能超过50个字符'),
  body('notes').optional().isLength({ max: 300 }).withMessage('备注不能超过300个字符')
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
    const { type, description, cost, technician, notes } = req.body;

    const asset = await Asset.findById(id);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: '资产不存在'
      });
    }

    // 添加维修记录
    await asset.addMaintenanceRecord(
      type,
      description,
      cost ? parseFloat(cost) : undefined,
      technician,
      notes
    );

    res.json({
      success: true,
      message: '维修记录添加成功',
      data: { asset }
    });

  } catch (error) {
    console.error('添加维修记录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取资产统计信息
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await Asset.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          available: {
            $sum: {
              $cond: [{ $eq: ['$status', '可用'] }, 1, 0]
            }
          },
          inUse: {
            $sum: {
              $cond: [{ $eq: ['$status', '使用中'] }, 1, 0]
            }
          },
          maintenance: {
            $sum: {
              $cond: [{ $eq: ['$status', '维修中'] }, 1, 0]
            }
          },
          retired: {
            $sum: {
              $cond: [{ $eq: ['$status', '报废'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const categoryStats = await Asset.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          available: {
            $sum: {
              $cond: [{ $eq: ['$status', '可用'] }, 1, 0]
            }
          },
          inUse: {
            $sum: {
              $cond: [{ $eq: ['$status', '使用中'] }, 1, 0]
            }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          total: 0,
          available: 0,
          inUse: 0,
          maintenance: 0,
          retired: 0
        },
        categoryStats
      }
    });

  } catch (error) {
    console.error('获取资产统计错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router;
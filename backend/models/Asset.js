const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  // 设备基本信息
  name: {
    type: String,
    required: [true, '设备名称是必需的'],
    trim: true,
    maxlength: [100, '设备名称不能超过100个字符']
  },
  category: {
    type: String,
    required: [true, '设备类型是必需的'],
    enum: ['相机', '镜头', '三脚架', '稳定器', '灯光设备', '录音设备', '存储设备', '电脑设备', '其他'],
    index: true
  },
  brand: {
    type: String,
    trim: true,
    maxlength: [50, '品牌名称不能超过50个字符']
  },
  model: {
    type: String,
    trim: true,
    maxlength: [100, '型号不能超过100个字符']
  },
  serialNumber: {
    type: String,
    required: [true, '设备识别码是必需的'],
    unique: true,
    trim: true,
    maxlength: [50, '识别码不能超过50个字符'],
    index: true
  },
  description: {
    type: String,
    maxlength: [500, '描述不能超过500个字符'],
    default: ''
  },
  
  // 设备状态
  status: {
    type: String,
    enum: ['可用', '使用中', '维修中', '报废'],
    default: '可用',
    index: true
  },
  condition: {
    type: String,
    enum: ['全新', '良好', '一般', '需维修'],
    default: '良好'
  },
  
  // 持有人信息
  currentHolder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  holderName: {
    type: String,
    default: ''
  },
  assignedDate: {
    type: Date,
    default: null
  },
  expectedReturnDate: {
    type: Date,
    default: null
  },
  
  // 采购信息
  purchaseDate: {
    type: Date
  },
  purchasePrice: {
    type: Number,
    min: 0
  },
  vendor: {
    type: String,
    trim: true,
    maxlength: [100, '供应商名称不能超过100个字符']
  },
  warrantyExpiry: {
    type: Date
  },
  
  // 使用记录
  usageHistory: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    assignedDate: {
      type: Date,
      required: true
    },
    returnedDate: {
      type: Date
    },
    purpose: {
      type: String,
      maxlength: [200, '使用目的不能超过200个字符']
    },
    condition: {
      type: String,
      enum: ['良好', '一般', '需维修']
    },
    notes: {
      type: String,
      maxlength: [300, '备注不能超过300个字符']
    }
  }],
  
  // 维修记录
  maintenanceHistory: [{
    date: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      enum: ['保养', '维修', '检查'],
      required: true
    },
    description: {
      type: String,
      required: true,
      maxlength: [300, '维修描述不能超过300个字符']
    },
    cost: {
      type: Number,
      min: 0
    },
    technician: {
      type: String,
      maxlength: [50, '技术员姓名不能超过50个字符']
    },
    notes: {
      type: String,
      maxlength: [300, '备注不能超过300个字符']
    }
  }],
  
  // 管理信息
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // 标签和分类
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, '标签不能超过20个字符']
  }],
  location: {
    type: String,
    trim: true,
    maxlength: [100, '存放位置不能超过100个字符'],
    default: ''
  },
  
  // 图片
  images: [{
    filename: String,
    originalName: String,
    path: String,
    url: String
  }],
  
  // 是否可借用
  isLoanable: {
    type: Boolean,
    default: true
  },
  
  // 重要程度
  priority: {
    type: String,
    enum: ['低', '中', '高'],
    default: '中'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段：是否在使用中
assetSchema.virtual('isInUse').get(function() {
  return this.status === '使用中' && this.currentHolder;
});

// 虚拟字段：使用天数
assetSchema.virtual('daysInUse').get(function() {
  if (this.assignedDate && this.status === '使用中') {
    const now = new Date();
    const diffTime = Math.abs(now - this.assignedDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// 虚拟字段：是否过期未归还
assetSchema.virtual('isOverdue').get(function() {
  if (this.expectedReturnDate && this.status === '使用中') {
    return new Date() > this.expectedReturnDate;
  }
  return false;
});

// 分配设备给用户
assetSchema.methods.assignToUser = function(userId, userName, purpose, expectedReturnDate) {
  this.currentHolder = userId;
  this.holderName = userName;
  this.assignedDate = new Date();
  this.expectedReturnDate = expectedReturnDate;
  this.status = '使用中';
  
  // 添加到使用记录
  this.usageHistory.push({
    user: userId,
    userName: userName,
    assignedDate: new Date(),
    purpose: purpose
  });
  
  return this.save();
};

// 归还设备
assetSchema.methods.returnFromUser = function(condition, notes) {
  // 更新最后一条使用记录
  if (this.usageHistory.length > 0) {
    const lastUsage = this.usageHistory[this.usageHistory.length - 1];
    if (!lastUsage.returnedDate) {
      lastUsage.returnedDate = new Date();
      lastUsage.condition = condition;
      lastUsage.notes = notes;
    }
  }
  
  this.currentHolder = null;
  this.holderName = '';
  this.assignedDate = null;
  this.expectedReturnDate = null;
  this.status = '可用';
  this.condition = condition;
  
  return this.save();
};

// 添加维修记录
assetSchema.methods.addMaintenanceRecord = function(type, description, cost, technician, notes) {
  this.maintenanceHistory.push({
    date: new Date(),
    type: type,
    description: description,
    cost: cost,
    technician: technician,
    notes: notes
  });
  
  if (type === '维修') {
    this.status = '维修中';
  }
  
  return this.save();
};

// 索引
assetSchema.index({ category: 1, status: 1 });
assetSchema.index({ currentHolder: 1 });
assetSchema.index({ serialNumber: 1 }, { unique: true });
assetSchema.index({ createdAt: -1 });
assetSchema.index({ name: 'text', description: 'text', brand: 'text', model: 'text' });

module.exports = mongoose.model('Asset', assetSchema);
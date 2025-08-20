const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, '用户名是必需的'],
    unique: true,
    trim: true,
    minlength: [2, '用户名至少需要2个字符'],
    maxlength: [20, '用户名不能超过20个字符']
  },
  email: {
    type: String,
    required: [true, '邮箱是必需的'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址']
  },
  password: {
    type: String,
    required: [true, '密码是必需的'],
    minlength: [6, '密码至少需要6个字符']
  },
  realName: {
    type: String,
    required: [true, '真实姓名是必需的'],
    trim: true,
    maxlength: [50, '真实姓名不能超过50个字符']
  },
  role: {
    type: String,
    enum: ['user', 'member', 'admin'],
    default: 'user'
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: [500, '个人简介不能超过500个字符'],
    default: ''
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  socialLinks: {
    instagram: { type: String, default: '' },
    weibo: { type: String, default: '' },
    bilibili: { type: String, default: '' }
  },
  stats: {
    totalWorks: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 }
  },
  
  // 设备持有信息
  ownedAssets: [{
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset'
    },
    assetName: {
      type: String,
      required: true
    },
    serialNumber: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    brand: {
      type: String,
      default: ''
    },
    model: {
      type: String,
      default: ''
    },
    condition: {
      type: String,
      enum: ['全新', '良好', '一般', '需维修'],
      default: '良好'
    },
    purchaseDate: {
      type: Date
    },
    notes: {
      type: String,
      maxlength: [200, '备注不能超过200个字符'],
      default: ''
    },
    addedDate: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段：用户的作品
userSchema.virtual('works', {
  ref: 'Work',
  localField: '_id',
  foreignField: 'author'
});

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 比较密码方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 获取公开信息方法
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.email;
  return userObject;
};

// 更新最后登录时间
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// 索引
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
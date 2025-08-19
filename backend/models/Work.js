const mongoose = require('mongoose');

const workSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '作品标题是必需的'],
    trim: true,
    maxlength: [100, '标题不能超过100个字符']
  },
  description: {
    type: String,
    maxlength: [1000, '描述不能超过1000个字符'],
    default: ''
  },
  type: {
    type: String,
    required: [true, '作品类型是必需的'],
    enum: ['photo', 'video'],
    index: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '作者是必需的'],
    index: true
  },
  authorName: {
    type: String,
    required: [true, '作者姓名是必需的']
  },
  files: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  }],
  thumbnail: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, '标签不能超过20个字符']
  }],
  category: {
    type: String,
    enum: ['人像', '风景', '街拍', '建筑', '纪录片', '微电影', 'MV', '广告', '其他'],
    default: '其他'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: [true, '评论内容不能为空'],
      maxlength: [500, '评论不能超过500个字符']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    camera: { type: String, default: '' },
    lens: { type: String, default: '' },
    settings: {
      iso: { type: String, default: '' },
      aperture: { type: String, default: '' },
      shutterSpeed: { type: String, default: '' },
      focalLength: { type: String, default: '' }
    },
    location: { type: String, default: '' },
    shootingDate: { type: Date }
  },
  submissionDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  approvalDate: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String,
    maxlength: [200, '拒绝原因不能超过200个字符']
  },
  relatedTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null,
    index: true
  },
  isTaskSubmission: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段：评论数量
workSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// 虚拟字段：文件数量
workSchema.virtual('fileCount').get(function() {
  return this.files.length;
});

// 增加浏览量方法
workSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// 切换点赞状态方法
workSchema.methods.toggleLike = function(userId) {
  const likedIndex = this.likedBy.indexOf(userId);
  
  if (likedIndex > -1) {
    // 取消点赞
    this.likedBy.splice(likedIndex, 1);
    this.likes = Math.max(0, this.likes - 1);
  } else {
    // 添加点赞
    this.likedBy.push(userId);
    this.likes += 1;
  }
  
  return this.save();
};

// 添加评论方法
workSchema.methods.addComment = function(userId, username, content) {
  this.comments.push({
    user: userId,
    username: username,
    content: content
  });
  return this.save();
};

// 删除评论方法
workSchema.methods.removeComment = function(commentId) {
  this.comments.id(commentId).remove();
  return this.save();
};

// 审核通过方法
workSchema.methods.approve = function(approvedBy) {
  this.status = 'approved';
  this.approvalDate = new Date();
  this.approvedBy = approvedBy;
  this.rejectionReason = undefined;
  return this.save();
};

// 审核拒绝方法
workSchema.methods.reject = function(reason) {
  this.status = 'rejected';
  this.rejectionReason = reason;
  this.approvalDate = undefined;
  this.approvedBy = undefined;
  return this.save();
};

// 索引
workSchema.index({ type: 1, status: 1 });
workSchema.index({ author: 1, createdAt: -1 });
workSchema.index({ submissionDate: -1 });
workSchema.index({ views: -1 });
workSchema.index({ likes: -1 });
workSchema.index({ isFeatured: 1, status: 1 });
workSchema.index({ tags: 1 });
workSchema.index({ category: 1 });

// 文本搜索索引
workSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
  authorName: 'text'
});

module.exports = mongoose.model('Work', workSchema);
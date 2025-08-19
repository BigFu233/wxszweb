const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '任务标题是必需的'],
    trim: true,
    maxlength: [100, '任务标题不能超过100个字符']
  },
  description: {
    type: String,
    required: [true, '任务描述是必需的'],
    maxlength: [1000, '任务描述不能超过1000个字符']
  },
  type: {
    type: String,
    enum: ['photo', 'video', 'both'],
    required: [true, '任务类型是必需的'],
    default: 'both'
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '创建者是必需的'],
    index: true
  },
  assignedTo: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'submitted'],
      default: 'pending'
    },
    submittedWork: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Work',
      default: null
    },
    submittedAt: {
      type: Date,
      default: null
    },
    feedback: {
      type: String,
      maxlength: [500, '反馈不能超过500个字符'],
      default: ''
    }
  }],
  deadline: {
    type: Date,
    required: [true, '截止日期是必需的']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'completed', 'cancelled'],
    default: 'draft',
    index: true
  },
  requirements: {
    minFiles: {
      type: Number,
      default: 1,
      min: [1, '最少需要1个文件']
    },
    maxFiles: {
      type: Number,
      default: 5,
      max: [10, '最多允许10个文件']
    },
    specifications: {
      type: String,
      maxlength: [500, '规格要求不能超过500个字符'],
      default: ''
    }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, '标签不能超过20个字符']
  }],
  category: {
    type: String,
    enum: ['人像', '风景', '街拍', '建筑', '纪录片', '微电影', 'MV', '广告', '活动记录', '其他'],
    default: '其他'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  completionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  submissionCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段：获取已分配的用户数量
taskSchema.virtual('assignedCount').get(function() {
  return this.assignedTo.length;
});

// 虚拟字段：获取已完成的用户数量
taskSchema.virtual('completedCount').get(function() {
  return this.assignedTo.filter(assignment => assignment.status === 'completed' || assignment.status === 'submitted').length;
});

// 虚拟字段：获取已提交作品的用户数量
taskSchema.virtual('submittedCount').get(function() {
  return this.assignedTo.filter(assignment => assignment.status === 'submitted').length;
});

// 更新完成率的方法
taskSchema.methods.updateCompletionRate = function() {
  if (this.assignedTo.length === 0) {
    this.completionRate = 0;
  } else {
    const completedCount = this.assignedTo.filter(assignment => 
      assignment.status === 'completed' || assignment.status === 'submitted'
    ).length;
    this.completionRate = Math.round((completedCount / this.assignedTo.length) * 100);
  }
  return this.save();
};

// 分配任务给用户的方法
taskSchema.methods.assignToUser = function(userId) {
  // 检查用户是否已经被分配
  const existingAssignment = this.assignedTo.find(assignment => 
    assignment.user.toString() === userId.toString()
  );
  
  if (!existingAssignment) {
    this.assignedTo.push({
      user: userId,
      assignedAt: new Date(),
      status: 'pending'
    });
  }
  
  return this.save();
};

// 移除用户分配的方法
taskSchema.methods.removeUserAssignment = function(userId) {
  this.assignedTo = this.assignedTo.filter(assignment => 
    assignment.user.toString() !== userId.toString()
  );
  return this.updateCompletionRate();
};

// 更新用户任务状态的方法
taskSchema.methods.updateUserStatus = function(userId, status, workId = null, feedback = '') {
  const assignment = this.assignedTo.find(assignment => 
    assignment.user.toString() === userId.toString()
  );
  
  if (assignment) {
    assignment.status = status;
    if (workId) {
      assignment.submittedWork = workId;
      assignment.submittedAt = new Date();
      this.submissionCount += 1;
    }
    if (feedback) {
      assignment.feedback = feedback;
    }
  }
  
  return this.updateCompletionRate();
};

// 发布任务的方法
taskSchema.methods.publish = function() {
  this.status = 'published';
  return this.save();
};

// 完成任务的方法
taskSchema.methods.complete = function() {
  this.status = 'completed';
  return this.save();
};

// 取消任务的方法
taskSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

// 索引
taskSchema.index({ creator: 1, status: 1 });
taskSchema.index({ 'assignedTo.user': 1, status: 1 });
taskSchema.index({ deadline: 1 });
taskSchema.index({ createdAt: -1 });
taskSchema.index({ priority: 1, deadline: 1 });

module.exports = mongoose.model('Task', taskSchema);
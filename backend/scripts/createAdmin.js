const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

// 连接数据库
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/infinite_photo_club', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB 连接成功');
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error.message);
    process.exit(1);
  }
};

// 创建管理员账号
const createAdmin = async () => {
  try {
    // 检查是否已存在管理员
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('⚠️ 管理员账号已存在:', existingAdmin.email);
      return;
    }

    // 创建默认管理员账号
    const adminData = {
      username: 'admin',
      email: 'admin@infinitephoto.com',
      password: 'admin123456', // 默认密码，建议首次登录后修改
      realName: '系统管理员',
      role: 'admin',
      isActive: true
    };

    const admin = new User(adminData);
    await admin.save();

    console.log('🎉 管理员账号创建成功!');
    console.log('📧 邮箱:', adminData.email);
    console.log('🔑 密码:', adminData.password);
    console.log('⚠️ 请首次登录后立即修改密码!');
    
  } catch (error) {
    console.error('❌ 创建管理员失败:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔒 数据库连接已关闭');
    process.exit(0);
  }
};

// 执行脚本
const run = async () => {
  await connectDB();
  await createAdmin();
};

run();
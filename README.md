# 无限摄制社团官网

一个现代化的摄影摄制社团官网，支持作品展示、上传和管理功能。

## 🌟 功能特性

### 前端功能
- 🏠 **主页展示** - 社团介绍和社交媒体链接
- 🖼️ **作品展示** - 支持照片和视频分类浏览
- 📤 **作品上传** - 拖拽上传，支持多文件
- 👤 **用户系统** - 注册、登录、个人资料管理
- 📱 **响应式设计** - 完美适配各种设备

### 后端功能
- 🔐 **用户认证** - JWT令牌认证
- 📁 **文件管理** - 安全的文件上传和存储
- 🗄️ **数据库** - MongoDB数据持久化
- 🛡️ **安全防护** - 输入验证、文件类型检查
- 📊 **作品管理** - 审核、分类、统计功能

## 🚀 快速开始

### 环境要求
- Node.js 16+
- MongoDB 4.4+
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd wxsz
```

2. **安装后端依赖**
```bash
cd backend
npm install
```

3. **配置环境变量**
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，配置数据库连接等信息
```

4. **启动MongoDB**
```bash
# 确保MongoDB服务正在运行
mongod
```

5. **启动后端服务**
```bash
npm run dev
```

6. **安装前端依赖**
```bash
# 新开终端窗口
cd frontend
npm install
```

7. **启动前端服务**
```bash
npm run dev
```

8. **访问应用**
- 前端地址: http://localhost:5173
- 后端API: http://localhost:5000
- 健康检查: http://localhost:5000/api/health

## 📁 项目结构

```
wxsz/
├── frontend/                 # React前端应用
│   ├── src/
│   │   ├── components/       # 可复用组件
│   │   ├── pages/           # 页面组件
│   │   ├── assets/          # 静态资源
│   │   └── App.jsx          # 主应用组件
│   ├── public/              # 公共资源
│   └── package.json
├── backend/                  # Node.js后端API
│   ├── src/                 # 源代码目录
│   ├── models/              # 数据模型
│   ├── routes/              # API路由
│   ├── middleware/          # 中间件
│   ├── controllers/         # 控制器
│   ├── config/              # 配置文件
│   ├── uploads/             # 文件上传目录
│   ├── server.js            # 服务器入口
│   └── package.json
└── README.md                # 项目说明
```

## 🔧 API接口

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `PUT /api/auth/profile` - 更新用户资料

### 作品接口
- `GET /api/works` - 获取作品列表
- `GET /api/works/:id` - 获取作品详情
- `POST /api/works` - 上传新作品
- `PUT /api/works/:id` - 更新作品信息
- `DELETE /api/works/:id` - 删除作品
- `POST /api/works/:id/like` - 点赞/取消点赞
- `POST /api/works/:id/comments` - 添加评论

### 用户接口
- `GET /api/users` - 获取用户列表（管理员）
- `GET /api/users/:id` - 获取用户详情
- `GET /api/users/:id/works` - 获取用户作品

## 🎨 技术栈

### 前端
- **React 18** - 用户界面库
- **React Router** - 路由管理
- **Lucide React** - 图标库
- **Vite** - 构建工具
- **CSS3** - 样式设计

### 后端
- **Node.js** - 运行环境
- **Express.js** - Web框架
- **MongoDB** - 数据库
- **Mongoose** - ODM工具
- **JWT** - 身份认证
- **Multer** - 文件上传
- **bcryptjs** - 密码加密

## 🛠️ 开发指南

### 添加新功能
1. 在对应的目录下创建新文件
2. 更新路由配置
3. 添加必要的测试
4. 更新文档

### 数据库模型
- **User** - 用户信息
- **Work** - 作品信息

### 文件上传
- 支持图片格式：JPG, PNG, GIF, WebP, BMP
- 支持视频格式：MP4, MOV, AVI, WMV, WebM
- 最大文件大小：100MB
- 最多文件数量：10个

## 🔒 安全特性

- JWT令牌认证
- 密码加密存储
- 文件类型验证
- 输入数据验证
- CORS跨域保护
- 安全头部设置

## 📝 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## 📞 联系我们

- 邮箱：infinitephoto@example.com
- 地址：北京市海淀区某某大学

---

**无限摄制社团** - 用镜头记录无限可能 📸
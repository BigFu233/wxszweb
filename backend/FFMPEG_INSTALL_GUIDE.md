# FFmpeg 安装指南

## 问题说明

视频缩略图功能需要 FFmpeg 支持，但系统中未检测到 FFmpeg 安装。

## Windows 安装方法

### 方法一：手动安装（推荐，最稳定）

1. **下载 FFmpeg**
   - 访问 FFmpeg 官网：https://ffmpeg.org/download.html
   - 点击 "Windows" 选项
   - 选择 "Windows builds by BtbN" 或 "gyan.dev" 链接
   - 下载最新的 "release" 版本（通常是 .zip 文件）

2. **解压和安装**
   - 将下载的 .zip 文件解压到 `C:\ffmpeg` 目录
   - 确保解压后的目录结构为：`C:\ffmpeg\bin\ffmpeg.exe`

3. **配置环境变量**
   - 右键点击 "此电脑" → "属性"
   - 点击 "高级系统设置"
   - 点击 "环境变量" 按钮
   - 在 "系统变量" 区域找到 "Path" 变量，点击 "编辑"
   - 点击 "新建"，添加路径：`C:\ffmpeg\bin`
   - 点击 "确定" 保存所有设置

### 方法二：使用 Chocolatey

**注意：如果您遇到 Chocolatey 命令不可用的问题，请使用方法一。**

1. 以管理员身份打开 PowerShell
2. 如果 Chocolatey 未正确安装，重新安装：
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   ```
3. 重新打开 PowerShell 窗口，然后安装 FFmpeg：
   ```powershell
   choco install ffmpeg
   ```

### 方法二：手动安装

1. 访问 FFmpeg 官网：https://ffmpeg.org/download.html
2. 下载 Windows 版本的 FFmpeg
3. 解压到一个目录，例如：`C:\ffmpeg`
4. 将 `C:\ffmpeg\bin` 添加到系统环境变量 PATH 中：
   - 右键"此电脑" → "属性" → "高级系统设置"
   - 点击"环境变量"
   - 在"系统变量"中找到"Path"，点击"编辑"
   - 点击"新建"，添加 `C:\ffmpeg\bin`
   - 确定保存

### 方法三：使用 Scoop

1. 安装 Scoop（如果未安装）：
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   irm get.scoop.sh | iex
   ```
2. 安装 FFmpeg：
   ```powershell
   scoop install ffmpeg
   ```

## 验证安装

安装完成后，重新打开命令行窗口，运行以下命令验证：

```bash
ffmpeg -version
```

如果显示版本信息，说明安装成功。

## 重启服务

安装 FFmpeg 后，需要重启后端服务：

1. 在后端终端中按 `Ctrl+C` 停止服务
2. 重新运行 `npm run dev` 启动服务

## 测试视频缩略图功能

1. 上传一个视频文件
2. 检查 `backend/uploads/thumbnails/` 目录是否生成了缩略图
3. 在作品展示页面查看视频是否显示缩略图

## 故障排除

### 如果仍然无法生成缩略图：

1. 检查后端控制台是否有错误信息
2. 确认视频文件格式是否支持（MP4, AVI, MOV 等）
3. 检查文件权限，确保应用有读写权限
4. 查看 `backend/uploads/thumbnails/` 目录是否存在且可写

### 常见错误解决：

- **"ffmpeg not found"**: FFmpeg 未正确安装或未添加到 PATH
- **"Permission denied"**: 文件权限问题，检查目录权限
- **"Invalid video format"**: 视频格式不支持，尝试转换格式

## 技术说明

- 缩略图尺寸：640x360 像素
- 截取时间：视频第1秒
- 输出格式：JPEG
- 存储位置：`backend/uploads/thumbnails/`

安装完成后，视频缩略图功能将自动工作，无需额外配置。
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

// 检查FFmpeg是否可用
const checkFFmpegAvailability = () => {
  return new Promise((resolve, reject) => {
    ffmpeg.getAvailableFormats((err, formats) => {
      if (err) {
        console.error('FFmpeg 不可用:', err.message);
        console.error('请安装 FFmpeg 后重试。参考: backend/FFMPEG_INSTALL_GUIDE.md');
        reject(new Error('FFmpeg 未安装或配置不正确'));
      } else {
        console.log('FFmpeg 可用，支持的格式数量:', Object.keys(formats).length);
        resolve(true);
      }
    });
  });
};

/**
 * 生成视频缩略图
 * @param {string} videoPath - 视频文件路径
 * @param {string} outputPath - 输出缩略图路径
 * @param {number} timeOffset - 截取时间点（秒），默认为1秒
 * @returns {Promise<string>} - 返回生成的缩略图路径
 */
const generateVideoThumbnail = (videoPath, outputPath, timeOffset = 1) => {
  return new Promise(async (resolve, reject) => {
    try {
      // 首先检查FFmpeg是否可用
      await checkFFmpegAvailability();
      
      // 确保输出目录存在
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // 检查输入视频文件是否存在
      if (!fs.existsSync(videoPath)) {
        throw new Error(`视频文件不存在: ${videoPath}`);
      }

      console.log(`开始生成视频缩略图: ${videoPath} -> ${outputPath}`);
      
      ffmpeg(videoPath)
        .screenshots({
          timestamps: [timeOffset], // 在指定时间点截取
          filename: path.basename(outputPath),
          folder: outputDir,
          size: '640x360' // 设置缩略图尺寸
        })
        .on('end', () => {
          console.log(`视频缩略图生成成功: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('生成视频缩略图失败:', err.message);
          console.error('错误详情:', err);
          reject(new Error(`视频缩略图生成失败: ${err.message}`));
        });
    } catch (error) {
      console.error('视频缩略图生成前置检查失败:', error.message);
      reject(error);
    }
  });
};

/**
 * 获取视频信息
 * @param {string} videoPath - 视频文件路径
 * @returns {Promise<object>} - 返回视频信息
 */
const getVideoInfo = (videoPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        console.error('获取视频信息失败:', err);
        reject(err);
      } else {
        resolve(metadata);
      }
    });
  });
};

/**
 * 生成视频缩略图文件名
 * @param {string} originalFilename - 原始文件名
 * @returns {string} - 缩略图文件名
 */
const generateThumbnailFilename = (originalFilename) => {
  const ext = path.extname(originalFilename);
  const name = path.basename(originalFilename, ext);
  return `${name}_thumbnail.jpg`;
};

/**
 * 处理视频文件并生成缩略图
 * @param {object} videoFile - 视频文件对象
 * @param {string} thumbnailDir - 缩略图存储目录
 * @returns {Promise<string>} - 返回缩略图相对路径
 */
const processVideoFile = async (videoFile, thumbnailDir) => {
  try {
    const thumbnailFilename = generateThumbnailFilename(videoFile.filename);
    const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);
    
    // 生成缩略图
    await generateVideoThumbnail(videoFile.path, thumbnailPath);
    
    // 返回相对路径
    const relativePath = path.relative(path.join(__dirname, '../'), thumbnailPath);
    return relativePath.replace(/\\/g, '/');
  } catch (error) {
    console.error('处理视频文件失败:', error);
    throw error;
  }
};

module.exports = {
  generateVideoThumbnail,
  getVideoInfo,
  generateThumbnailFilename,
  processVideoFile,
  checkFFmpegAvailability
};
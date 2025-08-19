import React from 'react';
import { Instagram, Youtube, Twitter, Facebook, Mail, MapPin } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';
import './Home.css';

// B站图标组件
const BilibiliIcon = ({ className }) => (
  <img src="/bilibili.svg" alt="B站" className={className} style={{ width: '24px', height: '24px' }} />
);

// 微信视频号图标组件
const WechatIcon = ({ className }) => (
  <img src="/wechat.svg" alt="微信视频号" className={className} style={{ width: '24px', height: '24px' }} />
);

// 小红书图标组件
const XiaohongshuIcon = ({ className }) => (
  <img src="/xiaohongshu.svg" alt="小红书" className={className} style={{ width: '24px', height: '24px' }} />
);

// 抖音图标组件
const DouyinIcon = ({ className }) => (
  <img src="/douyin.svg" alt="抖音" className={className} style={{ width: '24px', height: '24px' }} />
);

const Home = () => {
  usePageTitle('首页');
  
  const socialLinks = [
    {
      name: 'B站',
      icon: BilibiliIcon,
      url: 'https://space.bilibili.com/3494373505370597?spm_id_from=333.1007.0.0',
      color: '#00A1D6',
      clickable: true
    },
    {
      name: '微信视频号',
      icon: WechatIcon,
      color: '#07C160',
      clickable: false,
      qrCode: '/wechat.jpg'
    },
    {
      name: '小红书',
      icon: XiaohongshuIcon,
      color: '#FF2442',
      clickable: false,
      qrCode: '/xiaohongshu.jpg'
    },
    {
      name: '抖音',
      icon: DouyinIcon,
      color: '#000000',
      clickable: false,
      qrCode: '/douyin.jpg'
    }
  ];

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-image">
            <div className="camera-placeholder">
              📷
            </div>
          </div>
          <h1 className="hero-title">无限摄制社团</h1>
          <p className="hero-subtitle">用镜头记录无限可能，用创意诠释美好瞬间</p>
          <div className="hero-description">
            <p>我们是一群热爱摄影与摄制的创作者，致力于通过镜头语言表达内心的声音，</p>
            <p>记录生活中的美好瞬间，创造属于我们的视觉艺术作品。</p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about">
        <div className="container">
          <h2>关于我们</h2>
          <div className="about-grid">
            <div className="about-card">
              <h3>📸 摄影创作</h3>
              <p>从人像到风景，从街拍到艺术摄影，我们用镜头捕捉世界的每一个精彩瞬间。</p>
            </div>
            <div className="about-card">
              <h3>🎬 视频制作</h3>
              <p>微电影、纪录片、MV制作，我们用动态影像讲述动人的故事。</p>
            </div>
            <div className="about-card">
              <h3>🎨 后期制作</h3>
              <p>专业的后期处理技术，让每一张照片、每一段视频都呈现最佳效果。</p>
            </div>
            <div className="about-card">
              <h3>🤝 团队协作</h3>
              <p>我们相信团队的力量，每个成员都能在这里找到属于自己的创作空间。</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Media Section */}
      <section className="social-media">
        <div className="container">
          <h2>关注我们</h2>
          <p className="social-description">在各大社交平台关注我们，获取最新作品和活动信息</p>
          <div className="social-links">
            {socialLinks.map((social, index) => {
              const IconComponent = social.icon;
              
              if (social.clickable) {
                return (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                    style={{ '--social-color': social.color }}
                  >
                    <IconComponent className="social-icon" />
                    <span>{social.name}</span>
                  </a>
                );
              } else {
                return (
                  <div
                    key={index}
                    className="social-link social-qr"
                    style={{ '--social-color': social.color }}
                  >
                    <IconComponent className="social-icon" />
                    <span>{social.name}</span>
                    <div className="qr-tooltip">
                      <img src={social.qrCode} alt={`${social.name}二维码`} className="qr-image" />
                      <p>扫码关注{social.name}</p>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact">
        <div className="container">
          <h2>联系我们</h2>
          <div className="contact-info">
            <div className="contact-item">
              <Mail className="contact-icon" />
              <span>tywxsz@qq.com</span>
            </div>
            <div className="contact-item">
              <MapPin className="contact-icon" />
              <span>杭州市余杭区天元公学（西站校区）</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
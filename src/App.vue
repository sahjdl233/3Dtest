<template>
  <div class="dashboard">
    <header class="header">
      <h1>脑部数据分析平台</h1>
      <nav>
        <a href="#home">首页</a>
        <a href="#analysis">数据分析</a>
        <a href="#settings">设置</a>
      </nav>
    </header>

    <main class="main-content">
      <aside class="sidebar">
        <h2>数据概览</h2>
        <div class="stats-card">
          <h3>📊 统计信息</h3>
          <ul>
            <li>总样本数: 1,234</li>
            <li>活跃区域: 45</li>
            <li>数据完整性: 98.7%</li>
          </ul>
        </div>
        
        <div class="stats-card">
          <h3>📈 最近活动</h3>
          <ul>
            <li>新增EEG数据集</li>
            <li>fNIRS数据更新</li>
            <li>模型优化完成</li>
          </ul>
        </div>
      </aside>

      <section class="visualizer-section">
        <!-- 3D可视化组件 - 包含所有UV控制 -->
        <div class="visualizer-container">
          <BrainVisualizer />
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import BrainVisualizer from './components/BrainVisualizer.vue'
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

/* 顶部导航 */
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 1.8rem;
}

.header nav {
  display: flex;
  gap: 1.5rem;
}

.header nav a {
  color: white;
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.3s;
}

.header nav a:hover {
  opacity: 0.8;
}

/* 主内容区域 */
.main-content {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1rem;
  padding: 1rem;
  flex: 1;
  overflow: hidden;
}

/* 侧边栏 */
.sidebar {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  overflow-y: auto;
}

.sidebar h2 {
  margin: 0 0 1rem 0;
  font-size: 1.3rem;
  color: #333;
  border-bottom: 2px solid #667eea;
  padding-bottom: 0.5rem;
}

.stats-card {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  border-left: 3px solid #667eea;
}

.stats-card h3 {
  margin: 0 0 0.8rem 0;
  font-size: 1rem;
  color: #555;
}

.stats-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.stats-card li {
  padding: 0.4rem 0;
  color: #666;
  font-size: 0.9rem;
  border-bottom: 1px solid #e5e7eb;
}

.stats-card li:last-child {
  border-bottom: none;
}

/* 可视化区域 */
.visualizer-section {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  overflow: hidden;
}

.visualizer-container {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
  }
  
  .sidebar {
    display: none; /* 小屏幕隐藏侧边栏 */
  }
}

@media (max-width: 768px) {
  .header h1 {
    font-size: 1.3rem;
  }
  
  .header nav {
    flex-direction: column;
    gap: 0.3rem;
  }
  
  .main-content {
    padding: 0.5rem;
  }
}
</style>
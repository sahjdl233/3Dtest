<template>
  <div class="control-panel">
    <div class="panel-header">
      <h3><i class="fas fa-brain"></i> 脑部数据可视化</h3>
    </div>
    
    <!-- UV层列表 -->
    <div class="uv-layers">
      <div 
        v-for="(layer, index) in uvLayers" 
        :key="index" 
        class="uv-layer"
      >
        <div class="layer-header">
          <div class="layer-title">
            <i class="fas fa-layer-group"></i>
            <span>{{ layer.name }}</span>
          </div>
          <button 
            class="remove-btn"
            @click="removeLayer(index)"
            title="移除层"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <!-- 颜色梯度显示 -->
        <div 
          class="color-ramp" 
          :style="getGradientStyle(layer.gradient)"
        ></div>
        
        <!-- 颜色梯度选择 -->
        <div class="gradient-buttons">
          <button 
            v-for="gradient in gradients" 
            :key="gradient"
            :class="{ active: layer.gradient === gradient }"
            @click="changeGradient(index, gradient)"
          >
            {{ gradient }}
          </button>
        </div>
        
        <!-- 不透明度控制 -->
        <div class="opacity-control">
          <label>
            不透明度: <span>{{ layer.opacity.toFixed(1) }}</span>
          </label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.1"
            :value="layer.opacity"
            @input="updateOpacity(index, parseFloat($event.target.value))"
          />
        </div>
      </div>
    </div>
    
    <!-- 添加新层按钮 -->
    <div class="add-layer-section">
      <button 
        class="add-layer-btn"
        @click="addNewLayer"
      >
        <i class="fas fa-plus"></i> 添加数据层
      </button>
    </div>
    
    <!-- 全局控制 -->
    <div class="global-controls">
      <div class="section-title">全局设置</div>
      
      <div class="control-group">
        <label>混合模式:</label>
        <select v-model="blendMode" @change="updateBlendMode">
          <option value="additive">叠加</option>
          <option value="multiply">相乘</option>
          <option value="overlay">覆盖</option>
          <option value="difference">差异</option>
        </select>
      </div>
      
      <div class="control-group">
        <label>透明度: {{ globalOpacity.toFixed(1) }}</label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.1"
          v-model="globalOpacity"
          @input="updateGlobalOpacity"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 定义props - 使用emit代替props中的函数
const props = defineProps({
  uvLayers: {
    type: Array,
    default: () => []
  }
})

// 定义emits
const emit = defineEmits([
  'add-layer',
  'remove-layer', 
  'update-opacity',
  'change-gradient',
  'update-blend-mode',
  'update-global-opacity'
])

// 本地状态
const gradients = ref(['jet', 'hot', 'cool', 'rainbow'])
const blendMode = ref('additive')
const globalOpacity = ref(0.5)

// 颜色梯度样式
const getGradientStyle = (gradientName) => {
  const gradientsMap = {
    'jet': 'linear-gradient(to right, rgb(0,0,128), blue, cyan, lime, yellow, orange, red, maroon)',
    'hot': 'linear-gradient(to right, black, red, yellow, white)',
    'cool': 'linear-gradient(to right, cyan, magenta)',
    'rainbow': 'linear-gradient(to right, red, orange, yellow, green, cyan, blue, purple)'
  }
  return { background: gradientsMap[gradientName] || gradientsMap.jet }
}

// 添加新层
const addNewLayer = () => {
  const name = prompt('输入新数据层的名称:', `数据层 ${props.uvLayers.length + 1}`)
  if (name) {
    emit('add-layer', name)
  }
}

// 移除层
const removeLayer = (index) => {
  emit('remove-layer', index)
}

// 更新不透明度
const updateOpacity = (index, value) => {
  emit('update-opacity', index, value)
}

// 更改颜色梯度
const changeGradient = (index, gradient) => {
  emit('change-gradient', index, gradient)
}

// 更新混合模式
const updateBlendMode = () => {
  emit('update-blend-mode', blendMode.value)
}

// 更新全局透明度
const updateGlobalOpacity = () => {
  emit('update-global-opacity', parseFloat(globalOpacity.value))
}
</script>

<style scoped>
/* 关键改动：从 fixed 改为 absolute，让它相对于父容器定位 */
.control-panel {
  position: absolute;  /* 改为 absolute */
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 15px;
  border-radius: 10px;
  z-index: 1000;
  max-width: 300px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  max-height: calc(100% - 40px);  /* 相对于父容器 */
  overflow-y: auto;
}

.panel-header h3 {
  margin: 0 0 15px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #fff;
}

.uv-layer {
  margin: 10px 0;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.layer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.layer-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  color: #fff;
}

.remove-btn {
  background: none;
  border: none;
  color: #ff6b6b;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 3px;
  transition: background 0.3s;
}

.remove-btn:hover {
  background: rgba(255, 107, 107, 0.1);
}

.color-ramp {
  height: 20px;
  width: 100%;
  margin: 8px 0;
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.gradient-buttons {
  display: flex;
  gap: 5px;
  margin: 8px 0;
}

.gradient-buttons button {
  flex: 1;
  padding: 5px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.3s;
}

.gradient-buttons button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.gradient-buttons button.active {
  background: rgba(59, 130, 246, 0.5);
  font-weight: bold;
}

.opacity-control {
  margin-top: 10px;
}

.opacity-control label {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.opacity-control input[type="range"] {
  width: 100%;
  margin: 5px 0;
}

.add-layer-section {
  margin: 15px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: 15px;
}

.add-layer-btn {
  width: 100%;
  padding: 10px;
  background: rgba(59, 130, 246, 0.5);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.add-layer-btn:hover {
  background: rgba(59, 130, 246, 0.7);
}

.global-controls {
  margin-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: 15px;
}

.section-title {
  font-weight: bold;
  margin-bottom: 12px;
  color: #fff;
}

.control-group {
  margin-bottom: 12px;
}

.control-group label {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.control-group select,
.control-group input[type="range"] {
  width: 100%;
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  font-size: 14px;
}

.control-group select option {
  background: #333;
  color: white;
}

/* 滚动条样式 */
.control-panel::-webkit-scrollbar {
  width: 6px;
}

.control-panel::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.control-panel::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.control-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .control-panel {
    max-width: 250px;
    padding: 10px;
    font-size: 0.9em;
  }
  
  .uv-layer {
    padding: 8px;
  }
  
  .gradient-buttons button {
    font-size: 10px;
    padding: 4px;
  }
}

@media (max-width: 480px) {
  .control-panel {
    max-width: 220px;
    padding: 8px;
  }
  
  .panel-header h3 {
    font-size: 14px;
  }
}
</style>
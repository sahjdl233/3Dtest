<template>
  <div class="brain-visualizer">
    <!-- 加载状态 -->
    <div v-if="!isModelLoaded" class="loading-overlay">
      <div class="loader"></div>
      <p>加载模型中... {{ loadingProgress.toFixed(0) }}%</p>
    </div>
    
    <!-- Three.js画布 -->
    <canvas ref="canvasRef" class="three-canvas"></canvas>
    
    <!-- 控制面板 - 现在内嵌在这里 -->
    <ControlPanel
      :uv-layers="uvLayers"
      @add-layer="handleAddLayer"
      @remove-layer="handleRemoveLayer"
      @update-opacity="handleUpdateOpacity"
      @change-gradient="handleChangeGradient"
      @update-blend-mode="handleUpdateBlendMode"
      @update-global-opacity="handleUpdateGlobalOpacity"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useThreeBrain } from '../composables/useThreeBrain'
import ControlPanel from './ControlPanel.vue'
import * as THREE from 'three'

// 画布引用
const canvasRef = ref(null)

// 使用Three.js组合式函数
const {
  uvLayers,
  isModelLoaded,
  loadingProgress,
  addUVLayer,
  updateLayerOpacity,
  changeGradient,
  removeUVLayer,
  scene,
  camera,
  renderer,
  brainModel,
} = useThreeBrain(canvasRef)

// 全局状态
const globalOpacity = ref(0.5)
const blendMode = ref('additive')

// 生成模拟数据纹理
const generateSimulatedDataTexture = (width = 512, height = 512) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  
  const imageData = ctx.createImageData(width, height)
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4
      
      const dx = (x - width / 2) / (width / 2)
      const dy = (y - height / 2) / (height / 2)
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < 0.8) {
        const noise = (Math.sin(x * 0.05) * Math.cos(y * 0.05) + 1) * 0.5
        const value = Math.floor(noise * 255)
        
        imageData.data[index] = value
        imageData.data[index + 1] = value
        imageData.data[index + 2] = value
        imageData.data[index + 3] = 255
      } else {
        imageData.data[index] = 0
        imageData.data[index + 1] = 0
        imageData.data[index + 2] = 0
        imageData.data[index + 3] = 0
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0)
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

// 事件处理函数
const handleAddLayer = (name) => {
  addUVLayer(name, generateSimulatedDataTexture())
}

const handleRemoveLayer = (index) => {
  removeUVLayer(index)
}

const handleUpdateOpacity = (index, value) => {
  updateLayerOpacity(index, value)
}

const handleChangeGradient = (index, gradient) => {
  changeGradient(index, gradient)
}

const handleUpdateBlendMode = (mode) => {
  const blendModes = {
    'additive': 0,
    'multiply': 1,
    'overlay': 2,
    'difference': 3
  }
  
  if (scene.value && scene.value.children) {
    scene.value.traverse((child) => {
      if (child.isMesh && child.material.uniforms) {
        child.material.uniforms.blendMode.value = blendModes[mode] || 0
        child.material.uniformsNeedUpdate = true
      }
    })
  }
  
  blendMode.value = mode
}

const handleUpdateGlobalOpacity = (opacity) => {
  globalOpacity.value = opacity
  
  if (scene.value && scene.value.children) {
    scene.value.traverse((child) => {
      if (child.isMesh && child.material.uniforms) {
        child.material.uniforms.globalOpacity.value = opacity
        child.material.uniformsNeedUpdate = true
      }
    })
  }
}
</script>

<style scoped>
/* 主容器 - 相对定位支持嵌入 */
.brain-visualizer {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  min-height: 400px;
}

.three-canvas {
  display: block;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.loader {
  width: 50px;
  height: 50px;
  border: 5px solid #333;
  border-top-color: #FF6347;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

.loading-overlay p {
  color: white;
  font-size: 16px;
  margin-top: 10px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .brain-visualizer {
    min-height: 300px;
  }
}

@media (max-width: 480px) {
  .brain-visualizer {
    min-height: 250px;
  }
}
</style>
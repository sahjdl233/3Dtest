import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { ref, onMounted, onUnmounted, markRaw } from 'vue'

export function useThreeBrain(canvasRef) {
  // 响应式数据
  const scene = ref(null)
  const camera = ref(null)
  const renderer = ref(null)
  const controls = ref(null)
  const brainModel = ref(null)
  const customMaterial = ref(null)
  const uvLayers = ref([])
  const isModelLoaded = ref(false)
  const loadingProgress = ref(0)
  // 限制UV层最大数量（对应Uniform中的4个层）
  const MAX_UV_LAYERS = 4

  // 预定义颜色梯度
  const colorGradients = {
    'jet': [
      [0, 0, 0.5],     // 深蓝
      [0, 0, 1],       // 蓝
      [0, 0.5, 1],     // 青蓝
      [0, 1, 1],       // 青
      [0.5, 1, 0.5],   // 绿
      [1, 1, 0],       // 黄
      [1, 0.5, 0],     // 橙
      [1, 0, 0],       // 红
      [0.5, 0, 0]      // 深红
    ],
    'hot': [
      [0, 0, 0],       // 黑
      [1, 0, 0],       // 红
      [1, 1, 0],       // 黄
      [1, 1, 1]        // 白
    ],
    'cool': [
      [0, 1, 1],       // 青
      [1, 0, 1]        // 紫
    ],
    'rainbow': [
      [1, 0, 0],       // 红
      [1, 0.5, 0],     // 橙
      [1, 1, 0],       // 黄
      [0, 1, 0],       // 绿
      [0, 1, 1],       // 青
      [0, 0, 1],       // 蓝
      [0.5, 0, 0.5]    // 紫
    ]
  }

  // ======================================
  // 提取工具函数到全局作用域（修复作用域问题）
  // ======================================
  // 生成颜色纹理
  const generateColorTexture = (gradientName, width = 256, height = 1) => {
    const gradient = colorGradients[gradientName] || colorGradients['jet']
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    const gradientObj = ctx.createLinearGradient(0, 0, width, 0)

    for (let i = 0; i < gradient.length; i++) {
      const [r, g, b] = gradient[i]
      const color = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`
      gradientObj.addColorStop(i / (gradient.length - 1), color)
    }

    ctx.fillStyle = gradientObj
    ctx.fillRect(0, 0, width, height)

    // 包装markRaw，避免Vue响应式追踪
    const texture = markRaw(new THREE.CanvasTexture(canvas))
    texture.needsUpdate = true
    return texture
  }

  // 生成模拟fNIRS数据纹理
  const generateFNIRSTexture = (width = 512, height = 512) => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, width, height)

    const createHotspot = (x, y, radius, intensity) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      gradient.addColorStop(0, `rgba(255, 0, 0, ${intensity})`)
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }

    createHotspot(width * 0.35, height * 0.4, width * 0.15, 0.8)
    createHotspot(width * 0.45, height * 0.6, width * 0.1, 0.6)
    createHotspot(width * 0.55, height * 0.4, width * 0.12, 0.7)

    const texture = markRaw(new THREE.CanvasTexture(canvas))
    texture.needsUpdate = true
    return texture
  }

  // 生成模拟EEG数据纹理
  const generateSimulatedEEGTexture = (width = 512, height = 512) => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, width, height)

    const centerX = width / 2
    const centerY = height / 2

    for (let i = 0; i < 5; i++) {
      const radius = (i + 1) * width / 10
      const intensity = 0.5 + 0.5 * Math.sin(i)

      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(0, 255, 255, ${intensity * 0.3})`
      ctx.lineWidth = 2
      ctx.stroke()
    }

    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2
      const distance = width * 0.4
      const x = centerX + Math.cos(angle) * distance
      const y = centerY + Math.sin(angle) * distance

      const intensity = 0.5 + 0.5 * Math.sin(i * 0.5)

      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(0, 255, 255, ${intensity})`
      ctx.fill()
    }

    const texture = markRaw(new THREE.CanvasTexture(canvas))
    texture.needsUpdate = true
    return texture
  }

  // 创建自定义多UV着色器材质
  const createMultiUVMaterial = (baseColor = 0x444444) => {
    return markRaw(new THREE.ShaderMaterial({
      uniforms: {
        baseColor: { value: new THREE.Color(baseColor) },
        uvLayer1: { value: null },
        uvLayer2: { value: null },
        uvLayer3: { value: null },
        uvLayer4: { value: null },
        colorRamp1: { value: generateColorTexture('jet') },
        colorRamp2: { value: generateColorTexture('hot') },
        colorRamp3: { value: generateColorTexture('cool') },
        colorRamp4: { value: generateColorTexture('rainbow') },
        opacity1: { value: 0.0 },
        opacity2: { value: 0.0 },
        opacity3: { value: 0.0 },
        opacity4: { value: 0.0 },
        blendMode: { value: 0 },
        globalOpacity: { value: 0.5 },
        time: { value: 0.0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vUv = uv;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 baseColor;
        uniform sampler2D uvLayer1;
        uniform sampler2D uvLayer2;
        uniform sampler2D uvLayer3;
        uniform sampler2D uvLayer4;
        uniform sampler2D colorRamp1;
        uniform sampler2D colorRamp2;
        uniform sampler2D colorRamp3;
        uniform sampler2D colorRamp4;
        uniform float opacity1;
        uniform float opacity2;
        uniform float opacity3;
        uniform float opacity4;
        uniform int blendMode;
        uniform float globalOpacity;
        uniform float time;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        
        vec3 blendAdditive(vec3 base, vec3 blend, float opacity) {
          return base + blend * opacity;
        }
        
        vec3 blendMultiply(vec3 base, vec3 blend, float opacity) {
          return mix(base, base * blend, opacity);
        }
        
        vec3 blendOverlay(vec3 base, vec3 blend, float opacity) {
          vec3 result = vec3(0.0);
          for (int i = 0; i < 3; i++) {
            if (base[i] < 0.5) {
              result[i] = 2.0 * base[i] * blend[i];
            } else {
              result[i] = 1.0 - 2.0 * (1.0 - base[i]) * (1.0 - blend[i]);
            }
          }
          return mix(base, result, opacity);
        }
        
        vec3 blendDifference(vec3 base, vec3 blend, float opacity) {
          return mix(base, abs(base - blend), opacity);
        }
        
        vec3 getRampColor(float value, sampler2D ramp) {
          return texture2D(ramp, vec2(clamp(value, 0.0, 1.0), 0.5)).rgb;
        }
        
        void main() {
          vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
          float diff = max(dot(vNormal, lightDir), 0.1);
          vec3 base = baseColor * diff;
          
          vec3 result = base;
          
          if (opacity1 > 0.0) {
            float value1 = texture2D(uvLayer1, vUv).r;
            vec3 color1 = getRampColor(value1, colorRamp1);
            
            if (blendMode == 0) result = blendAdditive(result, color1, opacity1);
            else if (blendMode == 1) result = blendMultiply(result, color1, opacity1);
            else if (blendMode == 2) result = blendOverlay(result, color1, opacity1);
            else if (blendMode == 3) result = blendDifference(result, color1, opacity1);
          }
          
          if (opacity2 > 0.0) {
            float value2 = texture2D(uvLayer2, vUv).r;
            vec3 color2 = getRampColor(value2, colorRamp2);
            
            if (blendMode == 0) result = blendAdditive(result, color2, opacity2);
            else if (blendMode == 1) result = blendMultiply(result, color2, opacity2);
            else if (blendMode == 2) result = blendOverlay(result, color2, opacity2);
            else if (blendMode == 3) result = blendDifference(result, color2, opacity2);
          }
          
          if (opacity3 > 0.0) {
            float value3 = texture2D(uvLayer3, vUv).r;
            vec3 color3 = getRampColor(value3, colorRamp3);
            
            if (blendMode == 0) result = blendAdditive(result, color3, opacity3);
            else if (blendMode == 1) result = blendMultiply(result, color3, opacity3);
            else if (blendMode == 2) result = blendOverlay(result, color3, opacity3);
            else if (blendMode == 3) result = blendDifference(result, color3, opacity3);
          }
          
          if (opacity4 > 0.0) {
            float value4 = texture2D(uvLayer4, vUv).r;
            vec3 color4 = getRampColor(value4, colorRamp4);
            
            if (blendMode == 0) result = blendAdditive(result, color4, opacity4);
            else if (blendMode == 1) result = blendMultiply(result, color4, opacity4);
            else if (blendMode == 2) result = blendOverlay(result, color4, opacity4);
            else if (blendMode == 3) result = blendDifference(result, color4, opacity4);
          }
          
          gl_FragColor = vec4(result, globalOpacity);
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false
    }))
  }

  // ======================================
  // 修正后的核心函数（无重复定义、无嵌套错误）
  // ======================================
  // 初始化Three.js场景
  const initThreeScene = () => {
    console.log('初始化Three.js场景...')

    // 创建场景 - 使用 markRaw
    scene.value = markRaw(new THREE.Scene())
    scene.value.background = new THREE.Color(0xfffdef)

    // 创建相机 - 使用 markRaw，修复宽高比（绑定canvas实际尺寸）
    const canvas = canvasRef.value
    const aspect = canvas.clientWidth / canvas.clientHeight || window.innerWidth / window.innerHeight
    camera.value = markRaw(new THREE.PerspectiveCamera(75, aspect, 0.1, 1000))
    camera.value.position.set(0, 0, 5)

    // 创建渲染器 - 使用 markRaw
    renderer.value = markRaw(new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true
    }))
    // 修复渲染器尺寸（绑定canvas实际尺寸）
    renderer.value.setSize(canvas.clientWidth, canvas.clientHeight)
    renderer.value.shadowMap.enabled = true
    renderer.value.shadowMap.type = THREE.PCFSoftShadowMap

    // 添加光源 - 使用 markRaw
    const ambientLight = markRaw(new THREE.AmbientLight(0xffffff, 0.5))
    scene.value.add(ambientLight)

    const directionalLight = markRaw(new THREE.DirectionalLight(0xffffff, 0.8))
    directionalLight.position.set(10, 10, 5)
    directionalLight.castShadow = true
    scene.value.add(directionalLight)

    // 添加鼠标控制器 - 使用 markRaw
    controls.value = markRaw(new OrbitControls(camera.value, renderer.value.domElement))
    controls.value.enableDamping = true
    controls.value.dampingFactor = 0.05

    console.log('Three.js场景初始化完成')
  }

  // 加载脑模型（仅定义一次，无嵌套）
  const loadBrainModel = () => {
    const gltfLoader = new GLTFLoader()

    gltfLoader.load(
      // 建议改为相对路径（根据项目实际结构调整）
      './brain.glb',
      (gltf) => {
        console.log('GLTF加载成功:', gltf)
        brainModel.value = markRaw(gltf.scene)

        customMaterial.value = createMultiUVMaterial(0x333333)

        brainModel.value.traverse((child) => {
          if (child.isMesh) {
            const originalGeometry = markRaw(child.geometry)

            if (!originalGeometry.attributes.uv) {
              console.log('创建默认UV')

              const positions = originalGeometry.attributes.position
              const count = positions.count
              const uvs = []

              for (let i = 0; i < count; i++) {
                const x = positions.getX(i)
                const y = positions.getY(i)
                const z = positions.getZ(i)

                const u = (Math.atan2(z, x) + Math.PI) / (2 * Math.PI)
                const v = (Math.asin(y) + Math.PI / 2) / Math.PI
                uvs.push(u, 1 - v)
              }

              originalGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
            }

            child.material = customMaterial.value
            child.castShadow = true
            child.receiveShadow = true
          }
        })

        const box = new THREE.Box3().setFromObject(brainModel.value)
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)

        if (maxDim > 0) {
          brainModel.value.scale.set(3 / maxDim, 3 / maxDim, 3 / maxDim)
        } else {
          brainModel.value.scale.set(1, 1, 1)
        }

        brainModel.value.position.set(0, 0, 0)
        scene.value.add(brainModel.value)

        console.log('脑模型加载成功')
        isModelLoaded.value = true

        // 添加默认UV层
        addUVLayer('fNIRS数据', generateFNIRSTexture())
        addUVLayer('EEG数据', generateSimulatedEEGTexture())
      },
      (xhr) => {
        loadingProgress.value = (xhr.loaded / xhr.total) * 100
        console.log(`${loadingProgress.value.toFixed(2)}% loaded`)
      },
      (error) => {
        console.error('模型加载失败:', error)
        createFallbackBrainModel()
      }
    )
  }

  // 创建替代脑模型（修复工具函数访问问题、补充markRaw）
  const createFallbackBrainModel = () => {
    console.log('创建替代脑模型...')

    const brainGeometry = markRaw(new THREE.SphereGeometry(1, 64, 64))
    const positionAttribute = brainGeometry.attributes.position
    const vertex = new THREE.Vector3()

    for (let i = 0; i < positionAttribute.count; i++) {
      vertex.fromBufferAttribute(positionAttribute, i)

      const scaleX = vertex.x > 0 ? 0.9 : 0.85
      const scaleY = 1.2
      const scaleZ = 0.8

      vertex.x *= scaleX
      vertex.y *= scaleY
      vertex.z *= scaleZ

      const noise = 0.05 * Math.sin(vertex.y * 10) * Math.cos(vertex.z * 10)
      vertex.x += noise
      vertex.y += noise * 0.5

      positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z)
    }

    brainGeometry.computeVertexNormals()

    customMaterial.value = createMultiUVMaterial(0x333333)

    if (!brainGeometry.attributes.uv) {
      const count = positionAttribute.count
      const uvs = []

      for (let i = 0; i < count; i++) {
        vertex.fromBufferAttribute(positionAttribute, i)
        vertex.normalize()

        const u = (Math.atan2(vertex.z, vertex.x) + Math.PI) / (2 * Math.PI)
        const v = (Math.asin(vertex.y) + Math.PI / 2) / Math.PI
        uvs.push(u, 1 - v)
      }

      brainGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    }

    const brainMesh = markRaw(new THREE.Mesh(brainGeometry, customMaterial.value))
    brainMesh.castShadow = true
    brainMesh.receiveShadow = true

    brainModel.value = brainMesh
    scene.value.add(brainModel.value)

    console.log('替代脑模型创建完成')
    isModelLoaded.value = true

    addUVLayer('fNIRS数据', generateFNIRSTexture())
    addUVLayer('EEG数据', generateSimulatedEEGTexture())
  }

  // 添加UV层（增加数量限制）
  const addUVLayer = (name, texture) => {
    if (uvLayers.value.length >= MAX_UV_LAYERS) {
      console.warn(`UV层数量已达上限（${MAX_UV_LAYERS}个），无法添加新层`)
      return
    }

    const newLayer = {
      name,
      texture: markRaw(texture),
      opacity: 0.5,
      gradient: 'jet',
      index: uvLayers.value.length
    }

    uvLayers.value.push(newLayer)

    if (customMaterial.value) {
      const uniformName = `uvLayer${uvLayers.value.length}`
      const opacityName = `opacity${uvLayers.value.length}`
      const rampName = `colorRamp${uvLayers.value.length}`

      customMaterial.value.uniforms[uniformName].value = texture
      customMaterial.value.uniforms[opacityName].value = newLayer.opacity
      customMaterial.value.uniforms[rampName].value = generateColorTexture(newLayer.gradient)
      customMaterial.value.needsUpdate = true
    }

    console.log(`添加UV层: ${name}`, uvLayers.value)
  }

  // 更新层不透明度
  const updateLayerOpacity = (index, value) => {
    if (index < 0 || index >= uvLayers.value.length) return

    const opacityValue = parseFloat(value)
    if (isNaN(opacityValue)) return

    uvLayers.value[index].opacity = opacityValue

    if (customMaterial.value) {
      const opacityName = `opacity${index + 1}`
      customMaterial.value.uniforms[opacityName].value = opacityValue
      customMaterial.value.needsUpdate = true
    }
  }

  // 更改颜色梯度
  const changeGradient = (index, gradientName) => {
    if (index < 0 || index >= uvLayers.value.length || !colorGradients[gradientName]) return

    uvLayers.value[index].gradient = gradientName

    if (customMaterial.value) {
      const rampName = `colorRamp${index + 1}`
      customMaterial.value.uniforms[rampName].value = generateColorTexture(gradientName)
      customMaterial.value.needsUpdate = true
    }
  }

  // 移除UV层（优化Uniform更新逻辑）
  const removeUVLayer = (index) => {
    if (index < 0 || index >= uvLayers.value.length) return

    console.log(`移除UV层: ${index} - ${uvLayers.value[index].name}`)

    uvLayers.value.splice(index, 1)

    // 更新剩余层的索引和Uniform
    if (customMaterial.value) {
      uvLayers.value.forEach((layer, i) => {
        layer.index = i

        const uniformName = `uvLayer${i + 1}`
        const opacityName = `opacity${i + 1}`
        const rampName = `colorRamp${i + 1}`

        customMaterial.value.uniforms[uniformName].value = layer.texture
        customMaterial.value.uniforms[opacityName].value = layer.opacity
        customMaterial.value.uniforms[rampName].value = generateColorTexture(layer.gradient)
      })

      // 清空超出当前层数量的Uniform
      for (let i = uvLayers.value.length + 1; i <= MAX_UV_LAYERS; i++) {
        customMaterial.value.uniforms[`uvLayer${i}`].value = null
        customMaterial.value.uniforms[`opacity${i}`].value = 0.0
        customMaterial.value.uniforms[`colorRamp${i}`].value = generateColorTexture('jet')
      }

      customMaterial.value.needsUpdate = true
    }
  }

  // 动画循环
  const animate = () => {
    requestAnimationFrame(animate)

    if (customMaterial.value) {
      customMaterial.value.uniforms.time.value += 0.01
    }

    if (brainModel.value) {
      brainModel.value.rotation.y += 0.001
    }

    if (controls.value) {
      controls.value.update()
    }

    if (renderer.value && scene.value && camera.value) {
      renderer.value.render(scene.value, camera.value)
    }
  }

  // 窗口大小调整处理（修复canvas尺寸绑定）
  const handleResize = () => {
    const canvas = canvasRef.value
    if (!canvas || !camera.value || !renderer.value) return

    const aspect = canvas.clientWidth / canvas.clientHeight
    camera.value.aspect = aspect
    camera.value.updateProjectionMatrix()
    renderer.value.setSize(canvas.clientWidth, canvas.clientHeight)
  }

  // 初始化函数
  const init = () => {
    if (!canvasRef.value) {
      console.error('Canvas元素未找到')
      return
    }

    initThreeScene()
    loadBrainModel()
    animate()

    window.addEventListener('resize', handleResize)
  }

  // 清理函数（优化资源释放，避免内存泄漏）
  const cleanup = () => {
    window.removeEventListener('resize', handleResize)

    // 销毁OrbitControls
    if (controls.value) {
      controls.value.dispose()
    }

    // 释放纹理、材质、几何体资源
    if (uvLayers.value.length > 0) {
      uvLayers.value.forEach(layer => {
        if (layer.texture) {
          layer.texture.dispose()
        }
      })
    }

    if (customMaterial.value) {
      customMaterial.value.dispose()
    }

    if (brainModel.value) {
      brainModel.value.traverse((child) => {
        if (child.isMesh) {
          child.geometry.dispose()
          if (child.material !== customMaterial.value) {
            child.material.dispose()
          }
        }
      })
    }

    // 释放渲染器
    if (renderer.value) {
      renderer.value.dispose()
    }

    // 清空场景和UV层
    if (scene.value) {
      scene.value.clear()
    }

    uvLayers.value = []
    console.log('Three.js资源清理完成')
  }

  // 生命周期钩子
  onMounted(() => {
    init()
  })

  onUnmounted(() => {
    cleanup()
  })

  // 返回所有需要暴露的属性和方法
  return {
    // 响应式数据
    uvLayers,
    isModelLoaded,
    loadingProgress,

    // 方法
    addUVLayer,
    updateLayerOpacity,
    changeGradient,
    removeUVLayer,

    // Three.js对象（如果需要直接访问）
    scene,
    camera,
    renderer,
    brainModel,

    // 工具函数
    generateColorTexture,
    generateFNIRSTexture,
    generateSimulatedEEGTexture
  }
}
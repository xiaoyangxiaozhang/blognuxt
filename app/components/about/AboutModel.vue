<template>
  <div
    ref="hostRef"
    class="about-model"
    :class="{ 'is-error': status === 'error' }"
    :aria-busy="status === 'loading'"
  >
    <canvas
      ref="canvasRef"
      :class="{ 'is-hidden': status === 'error' }"
      role="img"
      :aria-label="modelAlt"
      :aria-hidden="status === 'error' ? 'true' : undefined"
    />

    <div v-if="status === 'loading'" class="model-state" role="status">
      正在加载 3D 模型…
    </div>

    <div v-else-if="status === 'error'" class="model-error" role="status">
      <img v-if="fallbackImageUrl" :src="fallbackImageUrl" :alt="fallbackAlt" />
      <span>3D 模型暂时无法加载</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

type Props = {
  modelUrl: string
  fallbackImageUrl?: string
  fallbackAlt?: string
  autoRotate?: boolean
  enableControls?: boolean
  enableZoom?: boolean
  modelAlt?: string
}

const props = withDefaults(defineProps<Props>(), {
  fallbackImageUrl: '',
  fallbackAlt: '博客作者',
  autoRotate: true,
  enableControls: true,
  enableZoom: false,
  modelAlt: '关于本站的 3D 模型'
})

const hostRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const status = ref<'loading' | 'ready' | 'error'>('loading')

let renderer: THREE.WebGLRenderer | null = null
let controls: OrbitControls | null = null
let model: THREE.Object3D | null = null
let modelPivot: THREE.Group | null = null
let resizeObserver: ResizeObserver | null = null
let reducedMotionQuery: MediaQueryList | null = null
let animationFrame = 0
let disposed = false

const disposeMaterial = (material: THREE.Material) => {
  for (const value of Object.values(material as unknown as Record<string, unknown>)) {
    if (value instanceof THREE.Texture) value.dispose()
  }
  material.dispose()
}

const disposeModel = (object: THREE.Object3D) => {
  object.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return

    node.geometry.dispose()
    const materials = Array.isArray(node.material) ? node.material : [node.material]
    materials.forEach((material) => material && disposeMaterial(material))
  })
}

const setError = (error: unknown) => {
  if (disposed) return
  console.error('[AboutModel] failed to load model', error)
  status.value = 'error'
}

const cleanup = () => {
  disposed = true
  if (animationFrame) window.cancelAnimationFrame(animationFrame)
  resizeObserver?.disconnect()
  resizeObserver = null
  controls?.dispose()
  controls = null
  if (model) disposeModel(model)
  model = null
  modelPivot = null
  renderer?.dispose()
  renderer?.forceContextLoss()
  renderer = null
}

onBeforeUnmount(cleanup)

onMounted(() => {
  const canvas = canvasRef.value
  const host = hostRef.value
  if (!canvas || !host) return

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 1000)
  const clock = new THREE.Timer()

  const resize = () => {
    if (!renderer) return

    const { width, height } = host.getBoundingClientRect()
    if (!width || !height) return

    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  const fitCameraToModel = (object: THREE.Object3D) => {
    const box = new THREE.Box3().setFromObject(object)
    if (box.isEmpty()) return

    const centeredBox = new THREE.Box3().setFromObject(object)
    const sphere = new THREE.Sphere()
    centeredBox.getBoundingSphere(sphere)
    const radius = Math.max(sphere.radius, 0.01)
    const distance = (radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.12
    const target = new THREE.Vector3(0, radius * 0.05, 0)

    camera.near = Math.max(radius / 200, 0.001)
    camera.far = Math.max(radius * 200, 100)
    camera.position.set(0, radius * 0.18, distance)
    camera.lookAt(target)
    camera.updateProjectionMatrix()

    controls?.target.copy(target)
    if (controls) {
      controls.minDistance = distance * 0.35
      controls.maxDistance = distance * 8
      controls.update()
    }
  }

  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
  } catch (error) {
    setError(error)
    return
  }

  scene.add(new THREE.AmbientLight(0xffffff, 1.4))

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2)
  keyLight.position.set(4, 6, 8)
  scene.add(keyLight)

  const fillLight = new THREE.DirectionalLight(0x9db7ff, 0.7)
  fillLight.position.set(-4, 2, -3)
  scene.add(fillLight)

  controls = new OrbitControls(camera, renderer.domElement)
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches
  controls.enabled = props.enableControls && !coarsePointer
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.enablePan = false
  controls.enableZoom = props.enableZoom
  controls.screenSpacePanning = false

  reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(host)
  resize()

  const loader = new GLTFLoader()
  loader.load(
    props.modelUrl,
    (gltf) => {
      if (disposed) {
        disposeModel(gltf.scene)
        return
      }

      model = gltf.scene
      model.rotation.y = -0.35
      modelPivot = new THREE.Group()
      modelPivot.add(model)
      scene.add(modelPivot)

      // 模型文件自身的原点可能在脚底或偏离几何中心，先把包围盒中心放到旋转容器原点。
      model.updateMatrixWorld(true)
      const box = new THREE.Box3().setFromObject(model)
      const center = new THREE.Vector3()
      box.getCenter(center)
      modelPivot.worldToLocal(center)
      modelPivot.position.sub(center)
      modelPivot.updateMatrixWorld(true)
      fitCameraToModel(modelPivot)

      status.value = 'ready'
    },
    undefined,
    setError
  )

  const animate = () => {
    if (disposed || !renderer) return

    animationFrame = window.requestAnimationFrame(animate)
    clock.update()
    const delta = clock.getDelta()
    if (modelPivot && props.autoRotate && !reducedMotionQuery?.matches) modelPivot.rotation.y += delta * 0.18
    controls?.update()
    renderer.render(scene, camera)
  }

  animate()
})
</script>

<style scoped lang="scss">
.about-model {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 280px;
  overflow: hidden;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  min-height: inherit;
  outline: none;
  touch-action: pan-y;
  transition: opacity var(--transition-fast);
}

canvas.is-hidden {
  opacity: 0;
}

.model-state,
.model-error {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--home-text);
  font-size: 14px;
  text-align: center;
}

.model-state {
  pointer-events: none;
}

.model-error {
  overflow: hidden;
  padding: 20px;
  background: var(--home-card-bg);
}

.model-error img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.35;
}

.model-error span {
  position: relative;
  z-index: 1;
  padding: 8px 12px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--home-surface) 82%, transparent);
}
</style>

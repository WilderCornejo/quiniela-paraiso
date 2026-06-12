import * as THREE from 'three'

// Balón 3D futurista con Three.js — esfera con paneles geodésicos,
// material metálico holográfico, anillo orbital de energía y rotación física.

export function montarBalon3D(containerId) {
  const container = document.getElementById(containerId)
  if (!container) return

  const W = container.clientWidth || 220
  const H = container.clientHeight || 220

  // Escena
  const scene = new THREE.Scene()

  // Cámara
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100)
  camera.position.z = 6.8
  camera.position.y = 0.9

  // Renderer con transparencia
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(W, H)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)

  // Grupo principal del balón
  const ballGroup = new THREE.Group()
  scene.add(ballGroup)

  // ── Esfera base — material metálico oscuro ──
  const sphereGeo = new THREE.IcosahedronGeometry(1.35, 1)
  const sphereMat = new THREE.MeshStandardMaterial({
    color: 0x122a5e,
    metalness: 0.9,
    roughness: 0.25,
    flatShading: true,
  })
  const sphere = new THREE.Mesh(sphereGeo, sphereMat)
  ballGroup.add(sphere)

  // ── Wireframe geodésico brillante encima (las "costuras") ──
  const wireGeo = new THREE.IcosahedronGeometry(1.37, 1)
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0xffd24a,
    wireframe: true,
    transparent: true,
    opacity: 0.55,
  })
  const wire = new THREE.Mesh(wireGeo, wireMat)
  ballGroup.add(wire)

  // ── Paneles luminosos en algunos vértices (nodos de energía) ──
  const nodeGeo = new THREE.SphereGeometry(0.07, 12, 12)
  const nodeMat = new THREE.MeshBasicMaterial({ color: 0xffe28a })
  const posAttr = sphereGeo.attributes.position
  const seen = new Set()
  for (let i = 0; i < posAttr.count; i += 3) {
    const x = posAttr.getX(i), y = posAttr.getY(i), z = posAttr.getZ(i)
    const key = `${x.toFixed(1)},${y.toFixed(1)},${z.toFixed(1)}`
    if (seen.has(key)) continue
    seen.add(key)
    const node = new THREE.Mesh(nodeGeo, nodeMat)
    const v = new THREE.Vector3(x, y, z).normalize().multiplyScalar(1.37)
    node.position.copy(v)
    ballGroup.add(node)
  }

  // ── Anillo orbital de energía ──
  const ringGeo = new THREE.TorusGeometry(1.95, 0.025, 16, 100)
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffc933,
    transparent: true,
    opacity: 0.7,
  })
  const ring = new THREE.Mesh(ringGeo, ringMat)
  ring.rotation.x = Math.PI / 2.3
  scene.add(ring)

  const ring2 = new THREE.Mesh(ringGeo, ringMat.clone())
  ring2.material.opacity = 0.4
  ring2.material.color = new THREE.Color(0x3b82f6)
  ring2.rotation.x = Math.PI / 1.8
  ring2.rotation.z = Math.PI / 4
  ring2.scale.setScalar(1.12)
  scene.add(ring2)

  // ── Halo / glow esférico exterior ──
  const glowGeo = new THREE.SphereGeometry(1.6, 32, 32)
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x2a5cff,
    transparent: true,
    opacity: 0.08,
    side: THREE.BackSide,
  })
  const glow = new THREE.Mesh(glowGeo, glowMat)
  ballGroup.add(glow)

  // ── Iluminación ──
  const ambient = new THREE.AmbientLight(0x2a3560, 1.2)
  scene.add(ambient)

  const keyLight = new THREE.DirectionalLight(0xffe2a8, 2.5)
  keyLight.position.set(3, 4, 5)
  scene.add(keyLight)

  const rimLight = new THREE.DirectionalLight(0x2244cc, 2)
  rimLight.position.set(-4, -2, -3)
  scene.add(rimLight)

  const point = new THREE.PointLight(0xffcc44, 1.5, 10)
  point.position.set(0, 0, 3)
  scene.add(point)

  // ── Partículas flotantes alrededor ──
  const pCount = 40
  const pGeo = new THREE.BufferGeometry()
  const pPos = new Float32Array(pCount * 3)
  for (let i = 0; i < pCount; i++) {
    const r = 2.2 + Math.random() * 1.3
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    pPos[i*3]   = r * Math.sin(phi) * Math.cos(theta)
    pPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta)
    pPos[i*3+2] = r * Math.cos(phi)
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
  const pMat = new THREE.PointsMaterial({
    color: 0xffd97a,
    size: 0.05,
    transparent: true,
    opacity: 0.8,
  })
  const particles = new THREE.Points(pGeo, pMat)
  scene.add(particles)

  // ── Logo "PARAÍSO" dorado fijo arriba del balón (generado en canvas, sin imagen externa) ──
  let logoMesh = null
  ;(function crearLogoParaiso() {
    const cw = 1024, ch = 300
    const cv = document.createElement('canvas')
    cv.width = cw; cv.height = ch
    const ctx = cv.getContext('2d')

    function dibujar() {
      ctx.clearRect(0, 0, cw, ch)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      // Palabra principal con degradado dorado y brillo
      const grad = ctx.createLinearGradient(0, 30, 0, 200)
      grad.addColorStop(0, '#fff3c4')
      grad.addColorStop(0.45, '#ffd24a')
      grad.addColorStop(1, '#c8881a')
      ctx.font = '900 148px Orbitron, sans-serif'
      ctx.shadowColor = 'rgba(255,200,60,0.9)'
      ctx.shadowBlur = 26
      ctx.fillStyle = grad
      ctx.fillText('PARA\u00cdSO', cw / 2, 118)
      // Subtítulo
      ctx.font = '700 34px Orbitron, sans-serif'
      ctx.shadowBlur = 10
      ctx.fillStyle = '#dce8ff'
      ctx.fillText('C A R T A G O  \u00b7  C O S T A  R I C A', cw / 2, 236)
    }
    dibujar()

    const texture = new THREE.CanvasTexture(cv)
    texture.colorSpace = THREE.SRGBColorSpace
    const logoW = 5.0
    const logoH = logoW * ch / cw
    const logoGeo = new THREE.PlaneGeometry(logoW, logoH)
    const logoMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthTest: false,
    })
    logoMesh = new THREE.Mesh(logoGeo, logoMat)
    logoMesh.position.set(0, 2.45, 0.5)
    logoMesh.renderOrder = 999
    scene.add(logoMesh)

    // Cuando la fuente Orbitron termine de cargar, redibujamos para que se vea perfecta
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { dibujar(); texture.needsUpdate = true })
    }
  })()

  // ── Animación ──
  let frame = 0
  function animate() {
    frame = requestAnimationFrame(animate)

    ballGroup.rotation.y += 0.012
    ballGroup.rotation.x += 0.004
    wire.rotation.y -= 0.002

    ring.rotation.z += 0.01
    ring2.rotation.z -= 0.007

    particles.rotation.y += 0.002

    const pulse = 1 + Math.sin(Date.now() * 0.002) * 0.04
    glow.scale.setScalar(pulse)

    renderer.render(scene, camera)
  }
  animate()

  // ── Responsive ──
  function onResize() {
    const w = container.clientWidth || 220
    const h = container.clientHeight || 220
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }
  window.addEventListener('resize', onResize)

  // Devuelve función de limpieza
  return () => {
    cancelAnimationFrame(frame)
    window.removeEventListener('resize', onResize)
    renderer.dispose()
    if (renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
  }
}

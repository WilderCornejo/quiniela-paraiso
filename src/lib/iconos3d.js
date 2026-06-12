import * as THREE from 'three'

// Mini-objetos 3D futuristas para la sección Especiales:
// trofeo, medalla y balón, todos giratorios con estilo holográfico neón.

function crearRenderer(container, size) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(size, size)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)
  return renderer
}

function luces(scene) {
  scene.add(new THREE.AmbientLight(0x335577, 1.3))
  const key = new THREE.DirectionalLight(0x88ccff, 2.6)
  key.position.set(3, 4, 5)
  scene.add(key)
  const rim = new THREE.DirectionalLight(0x0055cc, 1.8)
  rim.position.set(-4, -1, -3)
  scene.add(rim)
  const pt = new THREE.PointLight(0x00ffff, 1.4, 12)
  pt.position.set(0, 1, 4)
  scene.add(pt)
}

function anilloEnergia(scene, radio, opacidad) {
  const geo = new THREE.TorusGeometry(radio, 0.018, 12, 80)
  const mat = new THREE.MeshBasicMaterial({ color: 0x00b4ff, transparent: true, opacity: opacidad })
  const ring = new THREE.Mesh(geo, mat)
  ring.rotation.x = Math.PI / 2.2
  scene.add(ring)
  return ring
}

// ── TROFEO 3D ──
export function montarTrofeo(containerId) {
  const c = document.getElementById(containerId)
  if (!c) return
  const S = c.clientWidth || 90
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
  camera.position.set(0, 0.3, 5.2)
  const renderer = crearRenderer(c, S)
  luces(scene)

  const grupo = new THREE.Group()
  scene.add(grupo)

  const oro = new THREE.MeshStandardMaterial({ color: 0xffd24a, metalness: 1, roughness: 0.2, emissive: 0x4a3000, emissiveIntensity: 0.3 })

  // Copa
  const copa = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.45, 1.25, 24, 1, true), oro)
  copa.position.y = 0.55
  grupo.add(copa)
  // Borde superior
  const borde = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.1, 12, 32), oro)
  borde.position.y = 1.15
  borde.rotation.x = Math.PI / 2
  grupo.add(borde)
  // Base de la copa
  const cuello = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.35, 16), oro)
  cuello.position.y = -0.2
  grupo.add(cuello)
  const pie = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 0.25, 20), oro)
  pie.position.y = -0.5
  grupo.add(pie)
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.9), new THREE.MeshStandardMaterial({ color: 0x10243f, metalness: 0.8, roughness: 0.3 }))
  base.position.y = -0.78
  grupo.add(base)
  // Asas
  ;[-1, 1].forEach(s => {
    const asa = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 10, 20, Math.PI), oro)
    asa.position.set(s * 0.95, 0.6, 0)
    asa.rotation.z = s * Math.PI / 2
    grupo.add(asa)
  })

  const ring = anilloEnergia(scene, 1.85, 0.5)

  let frame
  function animate() {
    frame = requestAnimationFrame(animate)
    grupo.rotation.y += 0.018
    ring.rotation.z += 0.012
    renderer.render(scene, camera)
  }
  animate()
  return () => { cancelAnimationFrame(frame); renderer.dispose() }
}

// ── MEDALLA 3D ──
export function montarMedalla(containerId) {
  const c = document.getElementById(containerId)
  if (!c) return
  const S = c.clientWidth || 90
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
  camera.position.set(0, 0, 5)
  const renderer = crearRenderer(c, S)
  luces(scene)

  const grupo = new THREE.Group()
  scene.add(grupo)

  const plata = new THREE.MeshStandardMaterial({ color: 0xc8d4e0, metalness: 1, roughness: 0.22, emissive: 0x1a2230, emissiveIntensity: 0.3 })

  // Disco de la medalla
  const disco = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.18, 40), plata)
  disco.rotation.x = Math.PI / 2
  grupo.add(disco)
  // Anillo interior grabado
  const aro = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.06, 12, 40), new THREE.MeshStandardMaterial({ color: 0x00b4ff, metalness: 0.6, roughness: 0.3, emissive: 0x004488, emissiveIntensity: 0.5 }))
  aro.position.z = 0.1
  grupo.add(aro)
  // Estrella central (número 2 abstracto -> estrella)
  const estrella = new THREE.Mesh(new THREE.OctahedronGeometry(0.4, 0), new THREE.MeshStandardMaterial({ color: 0x66e0ff, metalness: 0.9, roughness: 0.15, emissive: 0x0088cc, emissiveIntensity: 0.6 }))
  estrella.position.z = 0.12
  grupo.add(estrella)
  // Cinta
  ;[-1, 1].forEach(s => {
    const cinta = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.9, 0.06), new THREE.MeshStandardMaterial({ color: 0x0066cc, metalness: 0.4, roughness: 0.5 }))
    cinta.position.set(s * 0.32, 1.35, 0)
    cinta.rotation.z = s * 0.32
    grupo.add(cinta)
  })

  const ring = anilloEnergia(scene, 1.7, 0.45)

  let frame
  function animate() {
    frame = requestAnimationFrame(animate)
    grupo.rotation.y += 0.022
    estrella.rotation.y -= 0.04
    estrella.rotation.x += 0.02
    ring.rotation.z += 0.013
    renderer.render(scene, camera)
  }
  animate()
  return () => { cancelAnimationFrame(frame); renderer.dispose() }
}

// ── BALÓN 3D (versión mini) ──
export function montarMiniBalon(containerId) {
  const c = document.getElementById(containerId)
  if (!c) return
  const S = c.clientWidth || 90
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
  camera.position.z = 5
  const renderer = crearRenderer(c, S)
  luces(scene)

  const grupo = new THREE.Group()
  scene.add(grupo)

  const esferaGeo = new THREE.IcosahedronGeometry(1.25, 1)
  const esfera = new THREE.Mesh(esferaGeo, new THREE.MeshStandardMaterial({
    color: 0x0a1830, metalness: 0.9, roughness: 0.25, flatShading: true,
  }))
  grupo.add(esfera)

  const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.27, 1), new THREE.MeshBasicMaterial({
    color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.6,
  }))
  grupo.add(wire)

  // nodos
  const nodeGeo = new THREE.SphereGeometry(0.06, 10, 10)
  const nodeMat = new THREE.MeshBasicMaterial({ color: 0x66e0ff })
  const pos = esferaGeo.attributes.position
  const seen = new Set()
  for (let i = 0; i < pos.count; i += 3) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
    const k = `${x.toFixed(1)},${y.toFixed(1)},${z.toFixed(1)}`
    if (seen.has(k)) continue
    seen.add(k)
    const n = new THREE.Mesh(nodeGeo, nodeMat)
    n.position.copy(new THREE.Vector3(x, y, z).normalize().multiplyScalar(1.27))
    grupo.add(n)
  }

  const ring = anilloEnergia(scene, 1.8, 0.5)

  let frame
  function animate() {
    frame = requestAnimationFrame(animate)
    grupo.rotation.y += 0.018
    grupo.rotation.x += 0.005
    ring.rotation.z += 0.012
    renderer.render(scene, camera)
  }
  animate()
  return () => { cancelAnimationFrame(frame); renderer.dispose() }
}

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// ═══════════════════════════════════════════════════════════════════════════
// WAREHOUSE CONFIG — everything below is generated from this block.
// Layout per Jonathan: rectangle; R1 against left wall (single face),
// R2 + R3 double-sided in the middle, C against right wall (single face).
// 3 aisles between them. Dock back-right, entrance front-right.
// LEVELS = 3 (confirmed). BAYS = 8 is a PLACEHOLDER — count them and change it.
// ═══════════════════════════════════════════════════════════════════════════
const LEVELS = 3
const BAYS = 8            // per face — placeholder until real count
const BAY_W = 1.4         // meters along the rack
const LEVEL_H = 1.35      // shelf-to-shelf height
const RACK_D = 1.2        // single-sided rack depth
const DOUBLE_D = 2.2      // double-sided rack depth
const AISLE_W = 2.6
const BACK_M = 3.0        // dock apron behind racks
const FRONT_M = 3.6       // front crosswalk (entrance side)
const WALL_M = 0.35

const RACK_LEN = BAYS * BAY_W
const X = {}              // computed x positions, left wall = 0
X.r1 = [WALL_M, WALL_M + RACK_D]
X.a1 = [X.r1[1], X.r1[1] + AISLE_W]
X.r2 = [X.a1[1], X.a1[1] + DOUBLE_D]
X.a2 = [X.r2[1], X.r2[1] + AISLE_W]
X.r3 = [X.a2[1], X.a2[1] + DOUBLE_D]
X.a3 = [X.r3[1], X.r3[1] + AISLE_W]
X.c  = [X.a3[1], X.a3[1] + RACK_D]
const W = X.c[1] + WALL_M                 // warehouse width  (x)
const D = BACK_M + RACK_LEN + FRONT_M     // warehouse depth  (z); z=0 back wall
const RACK_Z0 = BACK_M                    // racks start (back end)
const RACK_Z1 = BACK_M + RACK_LEN         // racks end (front end)
const ENTRANCE = new THREE.Vector3(W - 1.6, 0, D)        // front-right
const DOCK = { x0: X.r3[0] + 0.4, x1: X.c[1], z: 0 }     // back-right roll-up

// Faces: which rack, which x plane, which way it looks (+1 = +x), which aisle serves it
const FACES = [
  { id: 'R1',  rack: 'r1', x: X.r1[1], dir: +1, aisle: (X.a1[0]+X.a1[1])/2, label: 'Rack 1 · left wall' },
  { id: 'R2a', rack: 'r2', x: X.r2[0], dir: -1, aisle: (X.a1[0]+X.a1[1])/2, label: 'Rack 2 · aisle 1 side' },
  { id: 'R2b', rack: 'r2', x: X.r2[1], dir: +1, aisle: (X.a2[0]+X.a2[1])/2, label: 'Rack 2 · aisle 2 side' },
  { id: 'R3a', rack: 'r3', x: X.r3[0], dir: -1, aisle: (X.a2[0]+X.a2[1])/2, label: 'Rack 3 · aisle 2 side' },
  { id: 'R3b', rack: 'r3', x: X.r3[1], dir: +1, aisle: (X.a3[0]+X.a3[1])/2, label: 'Rack 3 · aisle 3 side' },
  { id: 'C',   rack: 'c',  x: X.c[0],  dir: -1, aisle: (X.a3[0]+X.a3[1])/2, label: 'Rack C · right wall' },
]
const AISLE_OF_FACE = { R1: 1, R2a: 1, R2b: 2, R3a: 2, R3b: 3, C: 3 }

// Categories — placeholder zones; swap for real ones (later: Supabase).
const CATEGORIES = {
  gowns:    { name: 'Gowns',              color: 0xd4649b },
  fabric:   { name: 'Fabric rolls',       color: 0x4a90d9 },
  boxes:    { name: 'Shipping boxes',     color: 0xdb9b3f },
  labels:   { name: 'Labels & packaging', color: 0x53b168 },
  supplies: { name: 'Supplies',           color: 0x8a6fd4 },
  returns:  { name: 'Returns / staging',  color: 0xd96a55 },
}
function categoryOf(faceId, bay) {
  if (faceId === 'R1' || faceId === 'R2a') return 'gowns'
  if (faceId === 'R2b') return 'fabric'
  if (faceId === 'R3a') return 'boxes'
  if (faceId === 'R3b') return bay <= Math.ceil(BAYS / 2) ? 'labels' : 'supplies'
  return 'returns'
}

// Sample items so item-name search works today; replace with live data later.
const ITEMS = [
  ['White lace gown 1042', 'R1-02-2'], ['Ivory satin gown 1187', 'R1-05-1'],
  ['Blush tulle gown 0966', 'R2a-03-3'], ['Champagne gown 1201', 'R2a-07-2'],
  ['Silk chiffon roll 44"', 'R2b-01-1'], ['Crepe roll — ivory', 'R2b-04-2'],
  ['Organza roll — blush', 'R2b-06-3'], ['12x9x4 mailer boxes', 'R3a-02-1'],
  ['Garment boxes XL', 'R3a-05-2'], ['Poly mailers 19x24', 'R3a-08-1'],
  ['Thermal labels 4x6', 'R3b-01-2'], ['Brand tissue + stickers', 'R3b-03-1'],
  ['Tape + dispensers', 'R3b-06-2'], ['Steamer + spare heads', 'R3b-07-3'],
  ['RMA 2211 — awaiting check', 'C-02-1'], ['RMA 2216 — restock', 'C-04-2'],
]

// ── palette: bright daylight warehouse ─────────────────────────────────────
const COL = {
  sky: 0xe9eef4, floor: 0xb6bac0, floorLine: 0x9aa0a8, wall: 0xd4d8dd,
  upright: 0x2e6db4, beam: 0xe8842a, bin: 0xc8a97e, binEdge: 0x1a1c20,
  amber: 0xffb020, path: 0xf59e0b, dock: 0x8b95a1, door: 0x4caf6e,
  lane: 0xe8c62a,
}

// ═══ scene ═════════════════════════════════════════════════════════════════
const canvasHost = document.getElementById('scene')
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
canvasHost.appendChild(renderer.domElement)
const scene = new THREE.Scene()
scene.background = new THREE.Color(COL.sky)
scene.fog = new THREE.Fog(COL.sky, 45, 110)

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200)
camera.position.set(W * 1.15, 14, D * 1.25)
const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(W / 2, 1.2, D / 2)
controls.enableDamping = true
controls.dampingFactor = 0.08
controls.maxPolarAngle = Math.PI / 2.05
controls.minDistance = 3
controls.maxDistance = 60

scene.add(new THREE.HemisphereLight(0xffffff, 0xcfc4b0, 1.05))
const sun = new THREE.DirectionalLight(0xfff6e5, 1.35)
sun.position.set(-10, 22, 14)
scene.add(sun)
const fill = new THREE.DirectionalLight(0xdfe9f5, 0.5)
fill.position.set(20, 10, -10)
scene.add(fill)

// floor + subtle grid
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(W, D),
  new THREE.MeshStandardMaterial({ color: COL.floor, roughness: 0.95 })
)
floor.rotation.x = -Math.PI / 2
floor.position.set(W / 2, 0, D / 2)
scene.add(floor)
const grid = new THREE.GridHelper(Math.max(W, D), Math.max(W, D), COL.floorLine, COL.floorLine)
grid.position.set(W / 2, 0.01, D / 2)
grid.material.opacity = 0.18
grid.material.transparent = true
scene.add(grid)

// perimeter walls (low, so the interior always reads)
const wallMat = new THREE.MeshStandardMaterial({ color: COL.wall, roughness: 0.9 })
function wall(w, h, d, x, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat)
  m.position.set(x, h / 2, z)
  scene.add(m)
}
wall(W, 2.2, 0.25, W / 2, 0.12)            // back
wall(0.25, 2.2, D, 0.12, D / 2)            // left
wall(0.25, 2.2, D, W - 0.12, D / 2)        // right
// front wall split around the entrance opening
const entW = 2.2
wall(W - (W - ENTRANCE.x) - entW / 2, 2.2, 0.25, (W - (W - ENTRANCE.x) - entW / 2) / 2, D - 0.12)
wall((W - ENTRANCE.x) - entW / 2, 2.2, 0.25, W - ((W - ENTRANCE.x) - entW / 2) / 2, D - 0.12)

// dock (back-right): apron + roll-up door
const dockDoor = new THREE.Mesh(
  new THREE.BoxGeometry(DOCK.x1 - DOCK.x0, 2.6, 0.18),
  new THREE.MeshStandardMaterial({ color: COL.dock, roughness: 0.6, metalness: 0.4 })
)
dockDoor.position.set((DOCK.x0 + DOCK.x1) / 2, 1.3, 0.2)
scene.add(dockDoor)
const dockStripe = new THREE.Mesh(
  new THREE.PlaneGeometry(DOCK.x1 - DOCK.x0, 1.6),
  new THREE.MeshBasicMaterial({ color: 0x4a5361, transparent: true, opacity: 0.5 })
)
dockStripe.rotation.x = -Math.PI / 2
dockStripe.position.set((DOCK.x0 + DOCK.x1) / 2, 0.02, 1.2)
scene.add(dockStripe)

// safety-yellow lane markings along each aisle
const laneMat = new THREE.MeshBasicMaterial({ color: COL.lane, transparent: true, opacity: 0.85 })
for (const [x0, x1] of [X.a1, X.a2, X.a3]) {
  for (const lx of [x0 + 0.14, x1 - 0.14]) {
    const lane = new THREE.Mesh(new THREE.PlaneGeometry(0.09, D - RACK_Z0 - 1.2), laneMat)
    lane.rotation.x = -Math.PI / 2
    lane.position.set(lx, 0.015, RACK_Z0 + (D - RACK_Z0 - 1.2) / 2)
    scene.add(lane)
  }
}

// entrance marker (front-right)
const entMark = new THREE.Mesh(
  new THREE.PlaneGeometry(entW, 1.2),
  new THREE.MeshBasicMaterial({ color: COL.door, transparent: true, opacity: 0.55 })
)
entMark.rotation.x = -Math.PI / 2
entMark.position.set(ENTRANCE.x, 0.02, D - 0.8)
scene.add(entMark)

// ── racks + bins ───────────────────────────────────────────────────────────
const uprightMat = new THREE.MeshStandardMaterial({ color: COL.upright, roughness: 0.5, metalness: 0.35 })
const beamMat = new THREE.MeshStandardMaterial({ color: COL.beam, roughness: 0.55, metalness: 0.3 })
const bins = []            // { id, face, bay, level, mesh, baseColor, cat, pos }
const binGeo = new THREE.BoxGeometry(BAY_W * 0.8, LEVEL_H * 0.62, 0.85)
const binIndex = new Map() // id -> bin

const rackSpans = { r1: X.r1, r2: X.r2, r3: X.r3, c: X.c }
for (const [rk, [x0, x1]] of Object.entries(rackSpans)) {
  const cx = (x0 + x1) / 2, depth = x1 - x0
  // uprights every bay + shelf beams per level (front and back edge of rack)
  for (let b = 0; b <= BAYS; b++) {
    const z = RACK_Z1 - b * BAY_W
    for (const ux of [x0 + 0.06, x1 - 0.06]) {
      const up = new THREE.Mesh(new THREE.BoxGeometry(0.09, LEVELS * LEVEL_H + 0.25, 0.09), uprightMat)
      up.position.set(ux, (LEVELS * LEVEL_H + 0.25) / 2, z)
      scene.add(up)
    }
  }
  for (let lv = 1; lv <= LEVELS; lv++) {
    const y = lv * LEVEL_H
    for (const bx of [x0 + 0.06, x1 - 0.06]) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.11, RACK_LEN), beamMat)
      beam.position.set(bx, y, (RACK_Z0 + RACK_Z1) / 2)
      scene.add(beam)
    }
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(depth - 0.1, 0.04, RACK_LEN),
      new THREE.MeshStandardMaterial({ color: 0x9ba1a9, roughness: 0.85 })
    )
    deck.position.set(cx, y - 0.04, (RACK_Z0 + RACK_Z1) / 2)
    scene.add(deck)
  }
}

for (const face of FACES) {
  for (let bay = 1; bay <= BAYS; bay++) {
    // bay 1 is at the FRONT (entrance end) — you count as you walk in
    const z = RACK_Z1 - (bay - 0.5) * BAY_W
    for (let lv = 1; lv <= LEVELS; lv++) {
      const catKey = categoryOf(face.id, bay)
      const baseColor = new THREE.Color(COL.bin).offsetHSL(0, 0, (Math.sin(bay * 7 + lv * 13) * 0.03))
      const mat = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.9 })
      const mesh = new THREE.Mesh(binGeo, mat)
      const inset = face.dir * -0.52
      mesh.position.set(face.x + inset, (lv - 1) * LEVEL_H + LEVEL_H * 0.36, z)
      scene.add(mesh)
      const id = `${face.id}-${String(bay).padStart(2, '0')}-${lv}`
      const bin = { id, face, bay, level: lv, mesh, baseColor: baseColor.clone(), cat: catKey, pos: mesh.position.clone() }
      bins.push(bin)
      binIndex.set(id.toLowerCase(), bin)
      mesh.userData.bin = bin
    }
  }
}

// ── walk path + highlight ──────────────────────────────────────────────────
let pathLine = null, highlighted = null, pulseT = 0
function clearFocus() {
  if (pathLine) { scene.remove(pathLine); pathLine.geometry.dispose(); pathLine = null }
  if (highlighted) {
    highlighted.mesh.material.emissive.setHex(0x000000)
    highlighted.mesh.material.emissiveIntensity = 0
    highlighted = null
  }
}
function focusBin(bin) {
  clearFocus()
  highlighted = bin
  // walk path: entrance → along front crosswalk → down the serving aisle → the bay
  const ax = bin.face.aisle
  const crossZ = D - FRONT_M / 2
  const pts = [
    new THREE.Vector3(ENTRANCE.x, 0.05, D - 0.6),
    new THREE.Vector3(ax, 0.05, crossZ),
    new THREE.Vector3(ax, 0.05, bin.pos.z),
    new THREE.Vector3(bin.pos.x + bin.face.dir * 0.75, 0.05, bin.pos.z),
  ]
  const curvePts = []
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], n = Math.max(2, Math.ceil(a.distanceTo(b) / 0.5))
    for (let j = 0; j < n; j++) curvePts.push(a.clone().lerp(b, j / n))
  }
  curvePts.push(pts[pts.length - 1])
  const geo = new THREE.BufferGeometry().setFromPoints(curvePts)
  pathLine = new THREE.Line(geo, new THREE.LineDashedMaterial({
    color: COL.path, dashSize: 0.45, gapSize: 0.28, linewidth: 2,
  }))
  pathLine.computeLineDistances()
  scene.add(pathLine)
  // fly the camera to stand in the aisle looking at the bin
  const stand = new THREE.Vector3(bin.pos.x + bin.face.dir * (AISLE_W * 0.9), bin.pos.y + 1.6, bin.pos.z + 2.4)
  flyTo(stand, bin.pos.clone())
  showPanel(bin)
}

// camera fly animation
let fly = null
function flyTo(pos, target) {
  fly = {
    t: 0, dur: 1.1,
    p0: camera.position.clone(), p1: pos,
    t0: controls.target.clone(), t1: target,
  }
}

// ── UI wiring ──────────────────────────────────────────────────────────────
const $ = (s) => document.querySelector(s)
const input = $('#q'), results = $('#results'), panel = $('#panel')
const itemsByBin = {}
for (const [name, code] of ITEMS) (itemsByBin[code.toLowerCase()] = itemsByBin[code.toLowerCase()] || []).push(name)

function searchAll(q) {
  q = q.trim().toLowerCase()
  if (!q) return []
  const out = []
  // location code (also accepts partial like "r2b-04")
  for (const [code, bin] of binIndex) {
    if (code.startsWith(q) || code.replace(/-/g, '').startsWith(q.replace(/-/g, ''))) {
      out.push({ kind: 'bin', label: bin.id, sub: CATEGORIES[bin.cat].name, bin })
      if (out.length >= 4) break
    }
  }
  for (const [name, code] of ITEMS) {
    if (name.toLowerCase().includes(q)) {
      const bin = binIndex.get(code.toLowerCase())
      if (bin) out.push({ kind: 'item', label: name, sub: bin.id, bin })
    }
  }
  for (const [key, c] of Object.entries(CATEGORIES)) {
    if (c.name.toLowerCase().includes(q)) {
      const first = bins.find(b => b.cat === key && b.level === 1)
      if (first) out.push({ kind: 'cat', label: c.name, sub: `zone · starts ${first.id}`, bin: first, cat: key })
    }
  }
  return out.slice(0, 8)
}
function renderResults(list) {
  results.innerHTML = ''
  results.style.display = list.length ? 'block' : 'none'
  for (const r of list) {
    const el = document.createElement('button')
    el.className = 'result'
    el.innerHTML = `<span class="r-label">${r.label}</span><span class="r-sub">${r.sub}</span>`
    el.addEventListener('click', () => {
      results.style.display = 'none'
      input.blur()
      if (r.kind === 'cat') tintCategory(r.cat)
      focusBin(r.bin)
    })
    results.appendChild(el)
  }
}
input.addEventListener('input', () => renderResults(searchAll(input.value)))
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const list = searchAll(input.value)
    if (list.length) { results.style.display = 'none'; input.blur(); focusBin(list[0].bin) }
  }
  if (e.key === 'Escape') { results.style.display = 'none'; input.blur() }
})

function showPanel(bin) {
  const items = itemsByBin[bin.id.toLowerCase()] || []
  const c = CATEGORIES[bin.cat]
  $('#p-code').textContent = bin.id
  $('#p-cat').textContent = c.name
  $('#p-cat').style.background = '#' + c.color.toString(16).padStart(6, '0') + '33'
  $('#p-cat').style.color = '#' + new THREE.Color(c.color).offsetHSL(0, 0.05, -0.18).getHexString()
  $('#p-where').textContent = `${bin.face.label} · aisle ${AISLE_OF_FACE[bin.face.id]} · bay ${bin.bay} · level ${bin.level}`
  $('#p-items').innerHTML = items.length
    ? items.map(i => `<div class="p-item">${i}</div>`).join('')
    : '<div class="p-item p-empty">Nothing logged in this bin yet</div>'
  panel.classList.add('open')
}
$('#p-close').addEventListener('click', () => { panel.classList.remove('open'); clearFocus() })

// category overlay — ON by default (the colorful view is the home view)
let tinted = true
const legend = $('#legend')
for (const [key, c] of Object.entries(CATEGORIES)) {
  const chip = document.createElement('button')
  chip.className = 'chip'
  chip.innerHTML = `<i style="background:#${c.color.toString(16).padStart(6, '0')}"></i>${c.name}`
  chip.addEventListener('click', () => { tintCategory(key); const b = bins.find(x => x.cat === key && x.level === 2 && x.bay === Math.ceil(BAYS/2)); if (b) focusBin(b) })
  legend.appendChild(chip)
}
function applyTint(on, only) {
  for (const b of bins) {
    if (on && (!only || b.cat === only)) b.mesh.material.color.setHex(CATEGORIES[b.cat].color)
    else if (on) b.mesh.material.color.copy(b.baseColor).multiplyScalar(0.45)
    else b.mesh.material.color.copy(b.baseColor)
  }
}
function tintCategory(only) { tinted = true; applyTint(true, only); $('#tint').classList.add('on') }
$('#tint').addEventListener('click', () => {
  tinted = !tinted
  applyTint(tinted, null)
  $('#tint').classList.toggle('on', tinted)
  legend.classList.toggle('open', tinted)
})
$('#reset').addEventListener('click', () => {
  clearFocus(); panel.classList.remove('open'); tinted = true
  applyTint(true, null); $('#tint').classList.add('on')
  flyTo(new THREE.Vector3(W * 1.15, 14, D * 1.25), new THREE.Vector3(W / 2, 1.2, D / 2))
})

// initial state: categories tinted, legend visible on wide screens
applyTint(true, null)
$('#tint').classList.add('on')
if (window.innerWidth > 560) legend.classList.add('open')

// tap / click select (with drag threshold so orbiting doesn't select)
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2()
let downAt = null
renderer.domElement.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY] })
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downAt) return
  const moved = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1])
  downAt = null
  if (moved > 6) return
  const r = renderer.domElement.getBoundingClientRect()
  ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
  ray.setFromCamera(ptr, camera)
  const hit = ray.intersectObjects(bins.map(b => b.mesh), false)[0]
  if (hit) focusBin(hit.object.userData.bin)
})

// ── resize + render loop ───────────────────────────────────────────────────
function resize() {
  const w = canvasHost.clientWidth || window.innerWidth
  const h = canvasHost.clientHeight || window.innerHeight
  renderer.setSize(w, h)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
}
window.addEventListener('resize', resize)
resize()
requestAnimationFrame(resize) // some embedded hosts report 0 on first measure

const clock = new THREE.Clock()
const ease = (t) => 1 - Math.pow(1 - t, 3)
renderer.setAnimationLoop(() => {
  const dt = clock.getDelta()
  if (fly) {
    fly.t += dt / fly.dur
    const k = ease(Math.min(fly.t, 1))
    camera.position.lerpVectors(fly.p0, fly.p1, k)
    controls.target.lerpVectors(fly.t0, fly.t1, k)
    if (fly.t >= 1) fly = null
  }
  if (highlighted) {
    pulseT += dt * 3.2
    highlighted.mesh.material.emissive.setHex(COL.amber)
    highlighted.mesh.material.emissiveIntensity = 0.45 + Math.sin(pulseT) * 0.3
  }
  controls.update()
  renderer.render(scene, camera)
})

import './src/styles.css'
import {
  supabase, registrar, login, getUser, logout, verificarAdmin,
  guardarPrediccionGrupo, getPrediccionesGrupos,
  guardarPrediccionKO, getPrediccionesKO,
  guardarEspeciales, getEspeciales,
  getRanking, calcularYGuardarPuntos, recalcularTodosLosPuntos,
  getConfig, setConfig,
  getFechasGrupos, guardarFechasGrupos,
  guardarResultadoGrupo, getResultadosGrupos,
  guardarResultadoKO, getResultadosKO, guardarResultadosEspeciales, getResultadosEspeciales
} from './src/lib/supabase.js'
import { GRUPOS, getPartidosGrupo, KO_ROUNDS, SELECCIONES, GOLEADORES, GOLEADORES_POR_PAIS, flagUrl, FECHAS_GRUPOS_DEFAULT } from './src/lib/data.js'
import { montarBalon3D } from './src/lib/balon3d.js'
import { montarTrofeo, montarMedalla, montarMiniBalon } from './src/lib/iconos3d.js'
import { textoSedes } from './src/lib/sedes.js'
import { partidoBloqueado, eliminacionBloqueada, textoCierre, formatoFechaPartido } from './src/lib/bloqueos.js'

// ═══════════════════════════════════════════════════════
//  CONFIGURACIÓN DEL GRUPO  (cambiar al clonar la app)
// ═══════════════════════════════════════════════════════
const CONDOMINIO = import.meta.env.VITE_NOMBRE_SEDE || 'Cantón de Paraíso'
// Poné en false para ARRANCAR DIRECTO EN ELIMINATORIAS (oculta la fase de grupos).
// Poné en true si clonás una quiniela desde el inicio del torneo.
const MOSTRAR_GRUPOS = false
// Cierre de Especiales: viernes 3 de julio 2026 a las 11:59 p.m. (hora Costa Rica)
const CIERRE_ESPECIALES = new Date('2026-07-03T23:59:00-06:00')
const especialesCerrado = () => Date.now() > CIERRE_ESPECIALES.getTime()
const TEXTO_CIERRE_ESP = 'viernes 3 de julio a las 11:59 p.m.'
// ═══════════════════════════════════════════════════════

// ── STATE ─────────────────────────────────────────────
let user = null
let inscripcionesAbiertas = true
let torneoIniciado = false
let prediccionesGrupos = []
let prediccionesKO = []
let especiales = null
let fechasGrupos = {}
let resultadosKO = []   // enfrentamientos de eliminatoria definidos por el admin
let resultadosGrupos = []   // resultados reales de grupos cargados por el admin

// Mapa nombre de equipo -> codigo de pais (los grupos tienen todos los equipos con su codigo)
const NOMBRE_A_CODIGO = {}
GRUPOS.forEach(g => getPartidosGrupo(g).forEach(({ e1, e2 }) => {
  if (e1) NOMBRE_A_CODIGO[e1.n] = e1.c
  if (e2) NOMBRE_A_CODIGO[e2.n] = e2.c
}))
const banderaDe = (nombre) => flagUrl(NOMBRE_A_CODIGO[nombre] || '')

// ── INIT ──────────────────────────────────────────────
async function init() {
  user = getUser()
  inscripcionesAbiertas = (await getConfig('inscripciones_abiertas')) === 'true'
  torneoIniciado = (await getConfig('torneo_iniciado')) === 'true'
  fechasGrupos = await getFechasGrupos(FECHAS_GRUPOS_DEFAULT)

  if (user) {
    await cargarPredicciones()
    renderApp()
  } else {
    renderAuth()
  }
}

async function cargarPredicciones() {
  if (!user) return
  prediccionesGrupos = await getPrediccionesGrupos(user.id)
  prediccionesKO = await getPrediccionesKO(user.id)
  especiales = await getEspeciales(user.id)
}

// ── TOAST ─────────────────────────────────────────────
function toast(msg, tipo = 'ok') {
  const el = document.getElementById('toast')
  if (!el) return
  el.textContent = msg
  el.className = 'toast' + (tipo === 'err' ? ' err' : '')
  el.classList.add('show')
  clearTimeout(el._t)
  el._t = setTimeout(() => el.classList.remove('show'), 2800)
}

// ── GRÁFICOS ORIGINALES DEL HERO (trofeo + emblema, sin marcas registradas) ──
const TROFEO_SVG = `<svg viewBox="0 0 64 84" width="96" height="126" xmlns="http://www.w3.org/2000/svg" aria-label="Trofeo">
  <defs>
    <linearGradient id="trGold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFE89A"/><stop offset=".5" stop-color="#F5C04E"/><stop offset="1" stop-color="#B8810F"/>
    </linearGradient>
  </defs>
  <g fill="url(#trGold)" stroke="#7a5408" stroke-width=".8">
    <path d="M14 18 C4 18 4 34 16 34 L16 29 C10 29 10 23 16 23 Z"/>
    <path d="M50 18 C60 18 60 34 48 34 L48 29 C54 29 54 23 48 23 Z"/>
    <path d="M16 14 H48 V26 C48 40 40 48 32 48 C24 48 16 40 16 26 Z"/>
    <rect x="29" y="48" width="6" height="10"/>
    <rect x="22" y="58" width="20" height="5" rx="1.5"/>
    <rect x="18" y="63" width="28" height="6" rx="2"/>
  </g>
  <path d="M32 22 l2.1 4.6 5 .5 -3.8 3.4 1.1 4.9 -4.4 -2.6 -4.4 2.6 1.1 -4.9 -3.8 -3.4 5 -.5 Z" fill="#fff8e1" opacity=".92"/>
</svg>`
const EMBLEMA_SVG = `<svg viewBox="0 0 72 86" width="100" height="119" xmlns="http://www.w3.org/2000/svg" aria-label="Mundial 2026">
  <defs>
    <radialGradient id="emBall" cx=".38" cy=".34" r=".75">
      <stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#dfefff"/><stop offset="1" stop-color="#8fb8d6"/>
    </radialGradient>
  </defs>
  <circle cx="36" cy="27" r="22" fill="url(#emBall)" stroke="#ffd24a" stroke-width="1.4"/>
  <path d="M36 16 l8.5 6.2 -3.2 10 H30.7 L27.5 22.2 Z" fill="#0b1f2a"/>
  <path d="M36 5 V16 M15 24 L27.5 22.2 M57 24 L44.5 22.2 M23 46 L30.7 32.2 M49 46 L41.3 32.2" stroke="#0b1f2a" stroke-width="1.1" fill="none" opacity=".5"/>
  <circle cx="24" cy="53" r="3.3" fill="#3c3b6e" stroke="#fff" stroke-width=".6"/>
  <circle cx="36" cy="53" r="3.3" fill="#006847" stroke="#fff" stroke-width=".6"/>
  <circle cx="48" cy="53" r="3.3" fill="#d52b1e" stroke="#fff" stroke-width=".6"/>
  <rect x="14" y="61" width="44" height="18" rx="4" fill="#0b1f2a" stroke="#ffd24a" stroke-width="1.2"/>
  <text x="36" y="73.5" text-anchor="middle" font-family="Orbitron, sans-serif" font-weight="700" font-size="11" fill="#ffd24a" letter-spacing="1.5">2026</text>
</svg>`

// ── AUTH PAGE ─────────────────────────────────────────
function renderAuth() {
  document.getElementById('app').innerHTML = `
    <div class="hero">
      <div id="ball-canvas" class="ball-canvas"></div>
      <div class="hero-badge">FIFA World Cup 2026</div>
      <div class="hero-title-row" style="display:flex;align-items:center;justify-content:center;gap:18px;flex-wrap:wrap;">
        <span class="hero-flank">${TROFEO_SVG}</span>
        <h1 style="margin:0;">QUINIELA<br><em>MUNDIAL</em> 2026</h1>
        <span class="hero-flank">${EMBLEMA_SVG}</span>
      </div>
      <style>.hero-flank svg{display:block;filter:drop-shadow(0 0 6px rgba(255,210,74,.3))}@media(max-width:480px){.hero-flank svg{transform:scale(.85)}}</style>
      <div class="hero-sub">${textoSedes()}</div>
      <div class="ais-band" style="overflow:hidden;white-space:nowrap;width:100%;max-width:480px;margin:16px auto 0;padding:8px 0;border-top:1px solid rgba(255,210,74,0.25);border-bottom:1px solid rgba(255,210,74,0.25);background:linear-gradient(90deg,transparent,rgba(255,210,74,0.10),transparent);border-radius:4px;">
        <div style="display:inline-flex;white-space:nowrap;animation:aisMarquee 18s linear infinite;will-change:transform;">
          <span style="font-family:'Orbitron',sans-serif;font-weight:700;color:var(--neon,#ffd24a);font-size:16px;letter-spacing:3px;text-shadow:0 0 12px rgba(255,210,74,0.6);">Participa del Mundial &nbsp;·&nbsp; Vívelo en Familia &nbsp;·&nbsp; Paraíso &nbsp;·&nbsp; Participa del Mundial &nbsp;·&nbsp; Vívelo en Familia &nbsp;·&nbsp; Paraíso &nbsp;·&nbsp;&nbsp;</span>
          <span style="font-family:'Orbitron',sans-serif;font-weight:700;color:var(--neon,#ffd24a);font-size:16px;letter-spacing:3px;text-shadow:0 0 12px rgba(255,210,74,0.6);">Participa del Mundial &nbsp;·&nbsp; Vívelo en Familia &nbsp;·&nbsp; Paraíso &nbsp;·&nbsp; Participa del Mundial &nbsp;·&nbsp; Vívelo en Familia &nbsp;·&nbsp; Paraíso &nbsp;·&nbsp;&nbsp;</span>
        </div>
      </div>
      <style>@keyframes aisMarquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}</style>
    </div>
    <div style="max-width:420px;margin:40px auto;padding:0 16px;">
      <div class="card fade-up">
        <div class="card-title"><i class="ti ti-user-circle"></i>Acceso al torneo</div>

        <div id="auth-tabs" style="display:flex;gap:0;margin-bottom:20px;border:1px solid var(--border);border-radius:6px;overflow:hidden;">
          <button id="btn-login-tab" onclick="switchAuthTab('login')"
            style="flex:1;padding:10px;font-family:'Orbitron',monospace;font-size:9px;letter-spacing:1px;cursor:pointer;border:none;background:var(--neon-dim);color:var(--neon);text-transform:uppercase;">
            Iniciar Sesión
          </button>
          <button id="btn-reg-tab" onclick="switchAuthTab('registro')"
            style="flex:1;padding:10px;font-family:'Orbitron',monospace;font-size:9px;letter-spacing:1px;cursor:pointer;border:none;background:transparent;color:var(--text-dim);text-transform:uppercase;border-left:1px solid var(--border);">
            Registrarse
          </button>
        </div>

        <div id="form-login">
          <div class="form-group">
            <label class="form-label">Nombre</label>
            <input class="input" id="l-id" type="text" placeholder="Tu nombre" autocomplete="off" />
            <span class="form-hint">Escríbelo tal como te registraste.</span>
          </div>
          <div class="form-group">
            <label class="form-label">Contraseña</label>
            <input class="input" id="l-pass" type="password" placeholder="••••••••" />
          </div>
          <button class="btn full" onclick="doLogin()">
            <i class="ti ti-login"></i> Entrar al torneo
          </button>
        </div>

        <div id="form-registro" style="display:none;">
          ${!inscripcionesAbiertas ? `<div style="text-align:center;padding:20px;color:var(--warn);font-family:'Orbitron',monospace;font-size:11px;letter-spacing:1px;">⚠  INSCRIPCIONES CERRADAS</div>` : `
          <div class="form-group">
            <label class="form-label">Nombre</label>
            <input class="input" id="r-nombre" type="text" placeholder="Tu nombre" maxlength="40" />
            <span class="form-hint">Será tu nombre para ingresar. Si ya está tomado, agrégale algo que te distinga (apodo, inicial).</span>
          </div>
          <div class="form-group">
            <label class="form-label">Contraseña</label>
            <input class="input" id="r-pass" type="password" placeholder="Mínimo 8 caracteres" />
            <span class="form-hint">Mínimo 8 caracteres. Combina letras y números.</span>
          </div>
          <button class="btn full success" onclick="doRegistro()">
            <i class="ti ti-user-plus"></i> Inscribirme a la quiniela
          </button>`}
        </div>
      </div>
      <p style="text-align:center;font-size:12px;color:var(--text-dim);margin-top:12px;">
        ¿Eres admin? <span style="color:var(--neon);cursor:pointer;" onclick="showAdminLogin()">Acceso administrador</span>
      </p>
    </div>
    <div class="toast" id="toast"></div>
  `
  window.switchAuthTab = (tab) => {
    document.getElementById('form-login').style.display = tab === 'login' ? 'block' : 'none'
    document.getElementById('form-registro').style.display = tab === 'registro' ? 'block' : 'none'
    document.getElementById('btn-login-tab').style.background = tab === 'login' ? 'var(--neon-dim)' : 'transparent'
    document.getElementById('btn-login-tab').style.color = tab === 'login' ? 'var(--neon)' : 'var(--text-dim)'
    document.getElementById('btn-reg-tab').style.background = tab === 'registro' ? 'var(--neon-dim)' : 'transparent'
    document.getElementById('btn-reg-tab').style.color = tab === 'registro' ? 'var(--neon)' : 'var(--text-dim)'
  }

  setTimeout(() => montarBalon3D('ball-canvas'), 50)
}

window.doLogin = async () => {
  const nombre = document.getElementById('l-id')?.value.trim()
  const pass = document.getElementById('l-pass')?.value
  if (!nombre || !pass) { toast('Completa todos los campos', 'err'); return }
  try {
    user = await login(nombre, pass)
    await cargarPredicciones()
    renderApp()
  } catch (e) { toast(e.message, 'err') }
}

window.doRegistro = async () => {
  const nombre = document.getElementById('r-nombre')?.value.trim()
  const pass = document.getElementById('r-pass')?.value
  if (!nombre || !pass) { toast('Completa todos los campos', 'err'); return }
  try {
    user = await registrar(nombre, pass)
    sessionStorage.setItem('user', JSON.stringify(user))
    await cargarPredicciones()
    renderApp()
    toast('¡Bienvenido, ' + nombre + '!')
  } catch (e) { toast('Error: ' + e.message, 'err') }
}

window.showAdminLogin = async () => {
  const secret = prompt('Clave de administrador:')
  if (!secret) return
  try {
    const ok = await verificarAdmin(secret)
    if (ok) {
      sessionStorage.setItem('adminMode', '1')
      user = { id: null, nombre: 'Administrador', es_admin: true }
      renderApp()
      window.showPage('admin')
    } else {
      toast('Clave incorrecta', 'err')
    }
  } catch (e) {
    console.error('Admin verify error:', e)
    toast('Error verificando', 'err')
  }
}

// ── MAIN APP ──────────────────────────────────────────
function renderApp() {
  const tabs = []
  if (MOSTRAR_GRUPOS) tabs.push({ id: 'grupos', icon: 'ti-layout-grid', label: 'Grupos' })
  tabs.push(
    { id: 'eliminacion', icon: 'ti-tournament', label: 'Eliminación' },
    { id: 'especiales', icon: 'ti-star', label: 'Especiales' },
    { id: 'ranking', icon: 'ti-podium', label: 'Ranking' },
  )
  if (user?.es_admin || sessionStorage.getItem('adminMode')) {
    tabs.push({ id: 'admin', icon: 'ti-settings', label: 'Admin' })
  }

  document.getElementById('app').innerHTML = `
    <div class="hero">
      <div id="ball-canvas" class="ball-canvas"></div>
      <div class="hero-badge">FIFA World Cup 2026</div>
      <div class="hero-title-row" style="display:flex;align-items:center;justify-content:center;gap:18px;flex-wrap:wrap;">
        <span class="hero-flank">${TROFEO_SVG}</span>
        <h1 style="margin:0;">QUINIELA<br><em>MUNDIAL</em> 2026</h1>
        <span class="hero-flank">${EMBLEMA_SVG}</span>
      </div>
      <style>.hero-flank svg{display:block;filter:drop-shadow(0 0 6px rgba(255,210,74,.3))}@media(max-width:480px){.hero-flank svg{transform:scale(.85)}}</style>
      <div class="hero-sub">${textoSedes()}</div>
      <div class="ais-band" style="overflow:hidden;white-space:nowrap;width:100%;max-width:480px;margin:16px auto 0;padding:8px 0;border-top:1px solid rgba(255,210,74,0.25);border-bottom:1px solid rgba(255,210,74,0.25);background:linear-gradient(90deg,transparent,rgba(255,210,74,0.10),transparent);border-radius:4px;">
        <div style="display:inline-flex;white-space:nowrap;animation:aisMarquee 18s linear infinite;will-change:transform;">
          <span style="font-family:'Orbitron',sans-serif;font-weight:700;color:var(--neon,#ffd24a);font-size:16px;letter-spacing:3px;text-shadow:0 0 12px rgba(255,210,74,0.6);">Participa del Mundial &nbsp;·&nbsp; Vívelo en Familia &nbsp;·&nbsp; Paraíso &nbsp;·&nbsp; Participa del Mundial &nbsp;·&nbsp; Vívelo en Familia &nbsp;·&nbsp; Paraíso &nbsp;·&nbsp;&nbsp;</span>
          <span style="font-family:'Orbitron',sans-serif;font-weight:700;color:var(--neon,#ffd24a);font-size:16px;letter-spacing:3px;text-shadow:0 0 12px rgba(255,210,74,0.6);">Participa del Mundial &nbsp;·&nbsp; Vívelo en Familia &nbsp;·&nbsp; Paraíso &nbsp;·&nbsp; Participa del Mundial &nbsp;·&nbsp; Vívelo en Familia &nbsp;·&nbsp; Paraíso &nbsp;·&nbsp;&nbsp;</span>
        </div>
      </div>
      <style>@keyframes aisMarquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}</style>
      <div class="user-chip" style="margin-top:10px;">
        <i class="ti ti-user" style="font-size:14px;"></i>
        ${user.nombre}
        <span style="opacity:0.5;margin:0 2px;">|</span>
        <span style="cursor:pointer;font-size:10px;" onclick="doLogout()">Salir</span>
      </div>
    </div>

    <nav class="nav">
      ${tabs.map(t => `
        <div class="nav-tab" id="tab-${t.id}" onclick="showPage('${t.id}')">
          <i class="ti ${t.icon}"></i>${t.label}
        </div>
      `).join('')}
    </nav>

    ${!especialesCerrado() ? `
    <div onclick="showPage('especiales')" style="cursor:pointer;overflow:hidden;white-space:nowrap;max-width:760px;margin:0 auto 8px;padding:9px 0;border:1px solid rgba(255,60,60,0.55);border-radius:8px;background:linear-gradient(90deg,rgba(200,20,20,0.20),rgba(255,70,70,0.12),rgba(200,20,20,0.20));">
      <div style="display:inline-flex;white-space:nowrap;animation:espMarquee 16s linear infinite;will-change:transform;">
        <span style="font-family:'Orbitron',sans-serif;font-weight:700;color:#ff5a5a;font-size:14px;letter-spacing:1.5px;text-shadow:0 0 10px rgba(255,60,60,0.6);">⚠ ESPECIALES: hay tiempo hasta el VIERNES 3 DE JULIO 11:59 p.m. — Campeón · Subcampeón · Goleador &nbsp;·&nbsp;&nbsp;</span>
        <span style="font-family:'Orbitron',sans-serif;font-weight:700;color:#ff5a5a;font-size:14px;letter-spacing:1.5px;text-shadow:0 0 10px rgba(255,60,60,0.6);">⚠ ESPECIALES: hay tiempo hasta el VIERNES 3 DE JULIO 11:59 p.m. — Campeón · Subcampeón · Goleador &nbsp;·&nbsp;&nbsp;</span>
      </div>
    </div>
    <style>@keyframes espMarquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}</style>` : ''}

    <div id="page-grupos" class="page${MOSTRAR_GRUPOS ? ' active' : ''}"></div>
    <div id="page-eliminacion" class="page${MOSTRAR_GRUPOS ? '' : ' active'}"></div>
    <div id="page-especiales" class="page"></div>
    <div id="page-ranking" class="page"></div>
    ${user?.es_admin || sessionStorage.getItem('adminMode') ? '<div id="page-admin" class="page"></div>' : ''}

    <div class="toast" id="toast"></div>
  `

  window.showPage = (id) => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'))
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'))
    document.getElementById('page-' + id)?.classList.add('active')
    document.getElementById('tab-' + id)?.classList.add('active')
    if (id === 'grupos') renderGrupos()
    if (id === 'eliminacion') renderEliminacion()
    if (id === 'especiales') renderEspeciales()
    if (id === 'ranking') renderRanking()
    if (id === 'admin') renderAdmin()
  }

  window.doLogout = () => {
    logout()
    sessionStorage.removeItem('adminMode')
    user = null
    renderAuth()
  }

  if (MOSTRAR_GRUPOS) {
    renderGrupos()
    document.getElementById('tab-grupos')?.classList.add('active')
  } else {
    renderEliminacion()
    document.getElementById('tab-eliminacion')?.classList.add('active')
  }
  setTimeout(() => montarBalon3D('ball-canvas'), 50)
}

// ── GRUPOS ────────────────────────────────────────────
function getPredGrupo(grupo, idx) {
  return prediccionesGrupos.find(p => p.grupo === grupo && p.partido_idx === idx)
}

// Helpers de fecha en hora de Costa Rica para la vista por día
function _fechaCRDate(iso) {
  if (!iso) return null
  let s = iso.trim()
  if (s.length === 16) s += ':00'
  const d = new Date(s + '-06:00')
  return isNaN(d.getTime()) ? null : d
}
function _diaLabel(iso) {
  const d = _fechaCRDate(iso)
  if (!d) return 'Sin fecha'
  const s = d.toLocaleDateString('es-CR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Costa_Rica' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}
function _horaLabel(iso) {
  const d = _fechaCRDate(iso)
  if (!d) return ''
  return d.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Costa_Rica' })
}
function _diaKey(iso) {
  const d = _fechaCRDate(iso)
  if (!d) return '9999-99-99'
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Costa_Rica' })
}

function renderGrupos() {
  const editable = !torneoIniciado
  const cont = document.getElementById('page-grupos')
  if (!cont) return

  const totalPartidos = GRUPOS.reduce((s, g) => s + getPartidosGrupo(g).length, 0)
  const completados = prediccionesGrupos.filter(p => p.goles1 !== null && p.goles2 !== null).length
  const pct = Math.round((completados / totalPartidos) * 100)

  // Todos los partidos ordenados por día y hora (Costa Rica)
  const _todos = []
  GRUPOS.forEach(g => {
    getPartidosGrupo(g).forEach(({ e1, e2, idx }) => {
      const fechaISO = fechasGrupos[`${g.letra}_${idx}`]
      const dt = _fechaCRDate(fechaISO)
      _todos.push({ letra: g.letra, idx, e1, e2, fechaISO, t: dt ? dt.getTime() : Infinity })
    })
  })
  _todos.sort((a, b) => a.t - b.t)
  const dias = []
  const _mapDia = {}
  _todos.forEach(m => {
    const k = _diaKey(m.fechaISO)
    if (!_mapDia[k]) { _mapDia[k] = { label: _diaLabel(m.fechaISO), partidos: [] }; dias.push(_mapDia[k]) }
    _mapDia[k].partidos.push(m)
  })

  cont.innerHTML = `
    <div class="card fade-up">
      <div class="card-title"><i class="ti ti-layout-grid"></i>Fase de Grupos</div>
      <p style="font-size:13px;color:var(--text-dim);margin-bottom:10px;">
        Ingresa el marcador que predices para cada partido. ${!editable ? '<span style="color:var(--warn);">Solo lectura — torneo en curso.</span>' : ''}
      </p>
      <div style="background:rgba(0,255,150,0.07);border:1px solid rgba(0,255,150,0.25);border-radius:6px;padding:8px 12px;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
        <i class="ti ti-device-floppy" style="color:var(--success);font-size:16px;"></i>
        <span style="font-size:12px;color:var(--success);">
          Guardado automático: cada marcador se graba solo. Puedes cerrar y continuar otro día.
        </span>
      </div>
      <div id="progreso-txt" style="font-size:12px;color:var(--text-dim);margin-bottom:6px;">
        Completados: ${completados} / ${totalPartidos}
      </div>
      <div class="progress-bar"><div id="progreso-fill" class="progress-fill" style="width:${pct}%"></div></div>
    </div>

    <div class="dias-lista">
      ${dias.map(dia => `
        <div style="margin:18px 0 8px;padding:9px 14px;background:linear-gradient(90deg,rgba(255,210,74,0.13),transparent);border-left:3px solid #ffd24a;border-radius:6px;font-weight:700;font-size:15px;color:var(--text,#eaf6ff);">
          <i class="ti ti-calendar-event" style="color:#ffd24a;"></i> ${dia.label}
        </div>
        ${dia.partidos.map(({ letra, idx, e1, e2, fechaISO }) => {
          const pred = getPredGrupo(letra, idx)
          const bloqueado = partidoBloqueado(fechaISO)
          return `<div class="match-row ${bloqueado ? 'match-locked' : ''}">
            <span class="team">
              <img class="flag" src="${flagUrl(e1.c)}" alt="${e1.n}" loading="lazy" />
              ${e1.n}
            </span>
            <div class="score-box">
              <input class="score-inp" type="number" min="0" max="20" value="${pred?.goles1 ?? ''}" placeholder="-"
                ${bloqueado ? 'disabled' : ''}
                onchange="saveGrupo('${letra}',${idx},'${e1.n}','${e2.n}',this,'s1')" data-g="${letra}" data-i="${idx}" data-f="s1" />
              <span class="score-sep">:</span>
              <input class="score-inp" type="number" min="0" max="20" value="${pred?.goles2 ?? ''}" placeholder="-"
                ${bloqueado ? 'disabled' : ''}
                onchange="saveGrupo('${letra}',${idx},'${e1.n}','${e2.n}',this,'s2')" data-g="${letra}" data-i="${idx}" data-f="s2" />
            </div>
            <span class="team r">
              ${e2.n}
              <img class="flag" src="${flagUrl(e2.c)}" alt="${e2.n}" loading="lazy" />
            </span>
            <div class="match-fecha">
              ${bloqueado ? '<i class="ti ti-lock"></i> Cerrado · ' : '<i class="ti ti-clock"></i> '}${_horaLabel(fechaISO) || 'Por definir'} · Grupo ${letra}
            </div>
          </div>`
        }).join('')}
      `).join('')}
    </div>
  `

  window.saveGrupo = async (grupo, idx, e1, e2, el, field) => {
    // Seguridad: no permitir guardar si el partido ya empezó
    if (partidoBloqueado(fechasGrupos[`${grupo}_${idx}`])) {
      toast('Este partido ya está cerrado', 'err')
      return
    }
    const row = document.querySelectorAll(`[data-g="${grupo}"][data-i="${idx}"]`)
    const s1 = row[0]?.value
    const s2 = row[1]?.value
    if (s1 === '' || s2 === '') return
    try {
      await guardarPrediccionGrupo(user.id, grupo, idx, e1, e2, parseInt(s1), parseInt(s2))
      prediccionesGrupos = await getPrediccionesGrupos(user.id)
      row.forEach(inp => {
        inp.style.borderColor = 'var(--success)'
        setTimeout(() => inp.style.borderColor = '', 1800)
      })
      toast('✓ Marcador guardado')
      actualizarProgresoGrupos()
    } catch (e) { toast('Error guardando: ' + e.message, 'err') }
  }
}

function actualizarProgresoGrupos() {
  const totalPartidos = GRUPOS.reduce((s, g) => s + getPartidosGrupo(g).length, 0)
  const completados = prediccionesGrupos.filter(p => p.goles1 !== null && p.goles2 !== null).length
  const pct = Math.round((completados / totalPartidos) * 100)
  const fill = document.getElementById('progreso-fill')
  const txt = document.getElementById('progreso-txt')
  if (fill) fill.style.width = pct + '%'
  if (txt) txt.textContent = `Completados: ${completados} / ${totalPartidos}`
}

// ── ELIMINACIÓN ───────────────────────────────────────
function getPredKO(ronda, idx) {
  return prediccionesKO.find(p => p.ronda === ronda && p.partido_idx === idx)
}

async function renderEliminacion() {
  const cont = document.getElementById('page-eliminacion')
  if (!cont) return

  resultadosKO = await getResultadosKO()
  const getMatchup = (ronda, idx) => resultadosKO.find(r => r.ronda === ronda && r.partido_idx === idx)

  cont.innerHTML = `
    <div class="card fade-up">
      <div class="card-title"><i class="ti ti-tournament"></i>Eliminación Directa</div>
      <p style="font-size:13px;color:var(--text-dim);">
        Los enfrentamientos los define la organización a medida que avanza el Mundial.
        Cuando aparezcan los equipos de un partido, escribe tu <strong>marcador</strong>.
        Puntaje: marcador exacto <strong>3 pts</strong>, solo el resultado <strong>1 pt</strong>.
      </p>
    </div>

    ${KO_ROUNDS.map(ronda => `
      <div class="ko-section fade-up">
        <div class="ko-label">
          <i class="ti ${ronda.icon}"></i>${ronda.title}
          <span style="font-size:10px;color:var(--neon);margin-left:auto;">marcador 3 &middot; resultado 1</span>
        </div>
        <div class="ko-grid">
          ${ronda.matches.map((m, idx) => {
            const mu = getMatchup(ronda.id, idx)
            const definido = mu && mu.equipo1 && mu.equipo2
            const cerradoHora = definido && mu.fecha ? partidoBloqueado(mu.fecha) : false
            const jugado = mu && mu.jugado
            const editable = definido && !jugado && !cerradoHora
            const pred = getPredKO(ronda.id, idx)
            if (!definido) {
              return `<div class="ko-match">
                <div class="ko-match-head"><span class="ko-num">#${m.num}</span> ${ronda.title}</div>
                <div style="padding:18px 10px;text-align:center;color:var(--text-dim);font-size:13px;">
                  <i class="ti ti-clock"></i><br>Partido por definir<br>
                  <span style="font-size:11px;opacity:.8;">${m.l1} vs ${m.l2}</span>
                </div>
              </div>`
            }
            return `<div class="ko-match">
              <div class="ko-match-head">
                <span class="ko-num">#${m.num}</span> ${ronda.title}
                ${jugado ? `<span style="margin-left:auto;color:var(--success);font-size:10px;font-weight:bold;">FINAL ${mu.goles1}-${mu.goles2}</span>` : ''}
              </div>
              <div class="ko-row">
                <span class="ko-source"><img src="${banderaDe(mu.equipo1)}" onerror="this.style.display='none'" style="width:22px;height:15px;vertical-align:middle;margin-right:5px;border-radius:2px;" />${mu.equipo1}</span>
                <input class="score-inp" type="number" min="0" max="20" value="${pred?.goles1 ?? ''}" placeholder="-"
                  onchange="saveKO('${ronda.id}',${idx},this,'s1')" ${!editable ? 'disabled' : ''} />
              </div>
              <div class="ko-vs-divider"><span>VS</span></div>
              <div class="ko-row">
                <span class="ko-source"><img src="${banderaDe(mu.equipo2)}" onerror="this.style.display='none'" style="width:22px;height:15px;vertical-align:middle;margin-right:5px;border-radius:2px;" />${mu.equipo2}</span>
                <input class="score-inp" type="number" min="0" max="20" value="${pred?.goles2 ?? ''}" placeholder="-"
                  onchange="saveKO('${ronda.id}',${idx},this,'s2')" ${!editable ? 'disabled' : ''} />
              </div>
              ${mu.fecha ? `<div class="match-fecha" style="margin-top:6px;text-align:center;">${(jugado || cerradoHora) ? '<i class="ti ti-lock"></i> Cerrado · ' : '<i class="ti ti-clock"></i> '}${formatoFechaPartido(mu.fecha)}</div>` : ''}
            </div>`
          }).join('')}
        </div>
      </div>
    `).join('')}
  `

  const pendingKO = {}

  window.saveKO = async (ronda, idx, el, field) => {
    const mu = resultadosKO.find(r => r.ronda === ronda && r.partido_idx === idx)
    if (!mu || !mu.equipo1 || !mu.equipo2) { toast('Este partido aún no tiene equipos definidos', 'err'); return }
    if (mu.jugado) { toast('Este partido ya finalizó', 'err'); return }
    if (mu.fecha && partidoBloqueado(mu.fecha)) { toast('Este partido ya cerró (pasó su hora de inicio)', 'err'); return }
    const key = `${ronda}_${idx}`
    if (!pendingKO[key]) pendingKO[key] = {}
    pendingKO[key][field] = el.value

    const pred = getPredKO(ronda, idx)
    const merged = {
      s1: pred?.goles1 ?? '', s2: pred?.goles2 ?? '',
      ...pendingKO[key]
    }
    if (merged.s1 !== '' && merged.s2 !== '') {
      try {
        await guardarPrediccionKO(user.id, ronda, idx, mu.equipo1, mu.equipo2, merged.s1, merged.s2)
        prediccionesKO = await getPrediccionesKO(user.id)
        el.style.borderColor = 'var(--success)'
        setTimeout(() => el.style.borderColor = '', 1500)
      } catch (e) { toast('Error: ' + e.message, 'err') }
    }
  }
}

// ── ESPECIALES ────────────────────────────────────────
function renderEspeciales() {
  const cont = document.getElementById('page-especiales')
  if (!cont) return

  const selOpts = (val) => SELECCIONES.map(s => `<option value="${s}" ${s === val ? 'selected' : ''}>${s}</option>`).join('')

  // Selector de goleador agrupado por país
  const golEnLista = GOLEADORES.includes(especiales?.goleador)
  const golGrupos = GOLEADORES_POR_PAIS.map(g => `
    <optgroup label="${g.pais}">
      ${g.jugadores.map(j => `<option value="${j}" ${j === especiales?.goleador ? 'selected' : ''}>${j}</option>`).join('')}
    </optgroup>
  `).join('')

  const bloqueado = especialesCerrado()
  const dis = bloqueado ? 'disabled' : ''

  cont.innerHTML = `
    <div class="card fade-up">
      <div class="card-title"><i class="ti ti-star"></i>Predicciones Especiales</div>
      ${bloqueado
        ? `<div class="aviso-bloqueo">
             <i class="ti ti-lock"></i>
             Esta fase ya está cerrada. El plazo venció el ${TEXTO_CIERRE_ESP}
           </div>`
        : `<div class="aviso-cierre">
             <i class="ti ti-clock"></i>
             Puedes llenar esta fase hasta: <strong>${TEXTO_CIERRE_ESP}</strong>
           </div>`}
      <div class="pts-grid" style="margin-bottom:0;margin-top:12px;">
        <div class="pts-item"><span class="pts-val">10</span><div class="pts-desc">Campeón correcto</div></div>
        <div class="pts-item"><span class="pts-val">5</span><div class="pts-desc">Subcampeón correcto</div></div>
        <div class="pts-item"><span class="pts-val">5</span><div class="pts-desc">Goleador correcto</div></div>
      </div>
    </div>

    <div class="pick-grid fade-up">
      <div class="pick-card">
        <div id="icon-trofeo" class="pick-icon-3d"></div>
        <div class="pick-label">Campeón del mundo</div>
        <select class="select" ${dis} onchange="saveEsp('campeon',this.value)">
          <option value="">-- Selecciona --</option>
          ${selOpts(especiales?.campeon)}
        </select>
      </div>
      <div class="pick-card">
        <div id="icon-medalla" class="pick-icon-3d"></div>
        <div class="pick-label">Subcampeón</div>
        <select class="select" ${dis} onchange="saveEsp('subcampeon',this.value)">
          <option value="">-- Selecciona --</option>
          ${selOpts(especiales?.subcampeon)}
        </select>
      </div>
      <div class="pick-card">
        <div id="icon-balon" class="pick-icon-3d"></div>
        <div class="pick-label">Goleador del torneo</div>
        <select class="select" id="sel-goleador" ${dis} onchange="onGoleadorSelect(this.value)">
          <option value="">-- Selecciona de la lista --</option>
          ${golGrupos}
          <option value="__OTRO__" ${especiales?.goleador && !golEnLista ? 'selected' : ''}>✏️ Otro jugador (escribir)</option>
        </select>
        <input class="input" id="inp-goleador-otro" type="text" ${dis}
          placeholder="Escribe el nombre del jugador"
          value="${especiales?.goleador && !golEnLista ? especiales.goleador : ''}"
          style="margin-top:8px;display:${especiales?.goleador && !golEnLista ? 'block' : 'none'};"
          onchange="saveEsp('goleador',this.value)" />
      </div>
    </div>
  `

  window.onGoleadorSelect = (val) => {
    const inpOtro = document.getElementById('inp-goleador-otro')
    if (val === '__OTRO__') {
      inpOtro.style.display = 'block'
      inpOtro.focus()
      // no guardamos aún, esperamos a que escriba
    } else {
      inpOtro.style.display = 'none'
      inpOtro.value = ''
      saveEsp('goleador', val)
    }
  }

  const espPending = { ...especiales }

  window.saveEsp = async (field, val) => {
    if (especialesCerrado()) {
      toast('La fase de especiales ya está cerrada', 'err')
      return
    }
    espPending[field] = val
    try {
      await guardarEspeciales(user.id, espPending.campeon || null, espPending.subcampeon || null, espPending.goleador || null)
      especiales = await getEspeciales(user.id)
      toast('✓ Guardado')
    } catch (e) { toast('Error: ' + e.message, 'err') }
  }

  setTimeout(() => {
    montarTrofeo('icon-trofeo')
    montarMedalla('icon-medalla')
    montarMiniBalon('icon-balon')
  }, 50)
}

// ── RANKING ───────────────────────────────────────────
async function renderRanking() {
  const cont = document.getElementById('page-ranking')
  if (!cont) return
  cont.innerHTML = `<div class="card fade-up"><div class="card-title"><i class="ti ti-podium"></i>Tabla de posiciones</div><div class="empty"><i class="ti ti-loader"></i>Cargando ranking...</div></div>`

  try {
    const ranking = await getRanking()
    if (!ranking.length) {
      cont.innerHTML = `<div class="card fade-up"><div class="card-title"><i class="ti ti-podium"></i>Tabla de posiciones</div><div class="empty"><i class="ti ti-users"></i>Aún no hay participantes inscritos</div></div>`
      return
    }

    cont.innerHTML = `
      <div class="card fade-up">
        <div class="card-title"><i class="ti ti-podium"></i>Tabla de posiciones</div>
        <p style="font-size:14px;color:var(--text-dim);margin:-4px 0 14px;"><i class="ti ti-info-circle"></i> Se muestran los 15 mejores rankeados.</p>
        <table class="rank-table">
          <thead><tr>
            <th>#</th>
            <th>Participante</th>
            <th>Total</th>
          </tr></thead>
          <tbody>
            ${ranking.map((r, i) => {
              const pos = i + 1
              const cls = pos === 1 ? 'gold' : pos === 2 ? 'silver' : pos === 3 ? 'bronze' : ''
              const medal = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : pos
              return `<tr class="rank-row">
                <td><span class="rank-pos ${cls}">${medal}</span></td>
                <td style="font-weight:600;font-size:15px;">${r.nombre || '—'}</td>
                <td><span class="rank-pts">${r.total}</span></td>
              </tr>`
            }).join('')}
          </tbody>
        </table>
      </div>

      <div class="card fade-up">
        <div class="card-title"><i class="ti ti-info-circle"></i>Sistema de puntos</div>
        <div class="pts-grid">
          <div class="pts-item"><span class="pts-val">3</span><div class="pts-desc">Marcador exacto (grupos y eliminatoria)</div></div>
          <div class="pts-item"><span class="pts-val">1</span><div class="pts-desc">Solo el resultado (ganador o empate)</div></div>
          <div class="pts-item"><span class="pts-val">10</span><div class="pts-desc">Campeón</div></div>
          <div class="pts-item"><span class="pts-val">5</span><div class="pts-desc">Subcampeón</div></div>
          <div class="pts-item"><span class="pts-val">5</span><div class="pts-desc">Goleador</div></div>
        </div>
      </div>
    `
  } catch (e) {
    cont.innerHTML = `<div class="card"><div class="empty"><i class="ti ti-alert-triangle"></i>Error cargando ranking</div></div>`
  }
}

// ── ADMIN ─────────────────────────────────────────────
async function renderAdmin() {
  const cont = document.getElementById('page-admin')
  if (!cont) return

  resultadosKO = await getResultadosKO()
  resultadosGrupos = await getResultadosGrupos()

  cont.innerHTML = `
    <div class="card fade-up">
      <div class="card-title"><i class="ti ti-settings"></i>Panel de Administración</div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;">
        <button class="btn" onclick="toggleInscripciones()">
          <i class="ti ti-toggle-left"></i> Inscripciones: <span id="lbl-inscripciones" style="color:var(--success);">${inscripcionesAbiertas ? 'ABIERTAS' : 'CERRADAS'}</span>
        </button>
        <button class="btn" onclick="toggleTorneo()">
          <i class="ti ti-player-play"></i> Torneo: <span id="lbl-torneo" style="color:${torneoIniciado ? 'var(--success)' : 'var(--warn)'};">${torneoIniciado ? 'INICIADO' : 'NO INICIADO'}</span>
        </button>
        <button class="btn success" onclick="recalcularTodos()">
          <i class="ti ti-refresh"></i> Recalcular todos los puntos
        </button>
      </div>

      <hr class="sep" />
      <div class="card-title" style="margin-top:8px;"><i class="ti ti-calendar-event"></i>Fechas de partidos (bloqueo automático)</div>
      <p style="font-size:13px;color:var(--text-dim);margin-bottom:6px;">
        Estas fechas controlan cuándo se bloquea cada partido. Verifícalas contra el fixture oficial.
        Si corriges una, pulsa "Guardar fechas".
      </p>
      <div class="aviso-cierre" style="margin-bottom:14px;">
        <i class="ti ti-clock"></i>
        Las predicciones Especiales se cierran: <strong>${TEXTO_CIERRE_ESP}</strong>
      </div>
      <div id="fechas-editor">
        ${GRUPOS.map(g => {
          const partidos = getPartidosGrupo(g)
          return `<div class="fechas-grupo">
            <div class="fechas-grupo-tit">GRUPO ${g.letra}</div>
            ${partidos.map(({ e1, e2, idx }) => `
              <div class="fecha-row">
                <span class="fecha-equipos">${e1.n.slice(0,12)} vs ${e2.n.slice(0,12)}</span>
                <input class="input fecha-input" type="datetime-local"
                  id="fecha_${g.letra}_${idx}"
                  value="${fechasGrupos[`${g.letra}_${idx}`] || ''}" />
              </div>
            `).join('')}
          </div>`
        }).join('')}
      </div>
      <button class="btn full success" style="margin-top:12px;" onclick="guardarFechas()">
        <i class="ti ti-device-floppy"></i> Guardar fechas
      </button>

      <hr class="sep" />
      <div class="card-title" style="margin-top:8px;"><i class="ti ti-ball-football"></i>Resultados reales — Grupos</div>
      <p style="font-size:13px;color:var(--text-dim);margin-bottom:16px;">Ingresa aquí los marcadores reales cuando se jueguen los partidos.</p>

      <div class="admin-grid" id="admin-grupos-cont">
        ${GRUPOS.map(g => {
          const partidos = getPartidosGrupo(g)
          return partidos.map(({ e1, e2, idx }) => `
            <div class="admin-match">
              <div class="admin-match-title">GRUPO ${g.letra} — P${idx + 1}</div>
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <span style="font-size:13px;flex:1;display:flex;align-items:center;gap:5px;"><img src="${flagUrl(e1.c)}" alt="${e1.n}" onerror="this.style.display='none'" style="width:22px;height:15px;border-radius:2px;" />${e1.n}</span>
                <input class="score-inp" type="number" min="0" max="20" placeholder="-"
                  id="rg_${g.letra}_${idx}_s1" value="${(resultadosGrupos.find(r => r.grupo === g.letra && r.partido_idx === idx) || {}).goles1 ?? ''}" style="width:36px;" />
                <span style="color:var(--text-dim);">:</span>
                <input class="score-inp" type="number" min="0" max="20" placeholder="-"
                  id="rg_${g.letra}_${idx}_s2" value="${(resultadosGrupos.find(r => r.grupo === g.letra && r.partido_idx === idx) || {}).goles2 ?? ''}" style="width:36px;" />
                <span style="font-size:13px;flex:1;text-align:right;display:flex;align-items:center;justify-content:flex-end;gap:5px;">${e2.n}<img src="${flagUrl(e2.c)}" alt="${e2.n}" onerror="this.style.display='none'" style="width:22px;height:15px;border-radius:2px;" /></span>
                <button class="btn sm success" onclick="saveResGrupo('${g.letra}',${idx},'${e1.n}','${e2.n}')">
                  <i class="ti ti-check"></i>
                </button>
              </div>
            </div>
          `).join('')
        }).join('')}
      </div>

      <hr class="sep" />
      <div class="card-title" style="margin-top:8px;"><i class="ti ti-tournament"></i>Resultados reales — Eliminatoria</div>
      <p style="font-size:13px;color:var(--text-dim);margin-bottom:16px;">Para cada partido: 1) elegí los dos equipos que juegan (así los usuarios pueden predecir). 2) Cuando se juegue, poné el marcador real y marcá <strong>“Ya se jugó”</strong> para que cuente en los puntos.</p>
      <div class="admin-grid">
        ${KO_ROUNDS.map(ronda => `
          <div style="grid-column:1/-1;font-family:'Orbitron',monospace;font-size:12px;color:var(--neon);margin-top:10px;text-transform:uppercase;letter-spacing:1px;">${ronda.title}</div>
          ${ronda.matches.map((m, idx) => {
            const mu = resultadosKO.find(r => r.ronda === ronda.id && r.partido_idx === idx) || {}
            return `
            <div class="admin-match">
              <div class="admin-match-title">#${m.num} ${ronda.title} <span style="color:var(--text-dim);font-size:10px;font-weight:normal;">(${m.l1} vs ${m.l2})</span></div>
              <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;">
                <select class="select ko-adm-sel" data-koronda="${ronda.id}" onchange="refreshKOOptions('${ronda.id}')" id="rko_${ronda.id}_${idx}_t1" style="flex:1;min-width:78px;">
                  <option value="">-- Equipo 1 --</option>
                  ${SELECCIONES.map(s => `<option ${s === mu.equipo1 ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
                <input class="score-inp" type="number" min="0" max="20" id="rko_${ronda.id}_${idx}_s1" value="${mu.jugado ? (mu.goles1 ?? '') : ''}" placeholder="-" style="width:42px;" />
                <span style="color:var(--text-dim);font-size:12px;">-</span>
                <input class="score-inp" type="number" min="0" max="20" id="rko_${ronda.id}_${idx}_s2" value="${mu.jugado ? (mu.goles2 ?? '') : ''}" placeholder="-" style="width:42px;" />
                <select class="select ko-adm-sel" data-koronda="${ronda.id}" onchange="refreshKOOptions('${ronda.id}')" id="rko_${ronda.id}_${idx}_t2" style="flex:1;min-width:78px;">
                  <option value="">-- Equipo 2 --</option>
                  ${SELECCIONES.map(s => `<option ${s === mu.equipo2 ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
              </div>
              <div style="margin-top:8px;display:flex;align-items:center;gap:6px;">
                <span style="font-size:11px;color:var(--text-dim);min-width:70px;">Inicio:</span>
                <input class="input" type="datetime-local" id="rko_${ronda.id}_${idx}_fecha" value="${mu.fecha || ''}" style="flex:1;font-size:12px;padding:4px 6px;" />
              </div>
              <label style="display:flex;align-items:center;gap:6px;margin-top:8px;font-size:12px;color:var(--text-dim);cursor:pointer;">
                <input type="checkbox" id="rko_${ronda.id}_${idx}_jug" ${mu.jugado ? 'checked' : ''} style="width:16px;height:16px;" />
                Ya se jugó (cuenta para los puntos)
                <button class="btn sm success" style="margin-left:auto;" onclick="saveResKO('${ronda.id}',${idx})"><i class="ti ti-check"></i> Guardar</button>
              </label>
            </div>
          `}).join('')}
        `).join('')}
      </div>

      <hr class="sep" />
      <div class="card-title" style="margin-top:8px;"><i class="ti ti-trophy"></i>Resultados especiales finales</div>
      <div class="pick-grid" style="margin-top:12px;">
        <div class="pick-card">
          <span class="pick-icon">🏆</span>
          <div class="pick-label">Campeón real</div>
          <select class="select" id="res-campeon">
            <option value="">-- Selecciona --</option>
            ${SELECCIONES.map(s => `<option>${s}</option>`).join('')}
          </select>
        </div>
        <div class="pick-card">
          <span class="pick-icon">🥈</span>
          <div class="pick-label">Subcampeón real</div>
          <select class="select" id="res-subcampeon">
            <option value="">-- Selecciona --</option>
            ${SELECCIONES.map(s => `<option>${s}</option>`).join('')}
          </select>
        </div>
        <div class="pick-card">
          <span class="pick-icon">⚽</span>
          <div class="pick-label">Goleador real</div>
          <select class="select" id="res-goleador">
            <option value="">-- Selecciona --</option>
            ${GOLEADORES_POR_PAIS.map(g => `<optgroup label="${g.pais}">${g.jugadores.map(j => `<option>${j}</option>`).join('')}</optgroup>`).join('')}
          </select>
        </div>
      </div>
      <button class="btn full success" style="margin-top:12px;" onclick="saveResEspeciales()">
        <i class="ti ti-check"></i> Guardar resultados finales y calcular ganador
      </button>
    </div>
  `

  window.toggleInscripciones = async () => {
    inscripcionesAbiertas = !inscripcionesAbiertas
    await setConfig('inscripciones_abiertas', String(inscripcionesAbiertas))
    document.getElementById('lbl-inscripciones').textContent = inscripcionesAbiertas ? 'ABIERTAS' : 'CERRADAS'
    document.getElementById('lbl-inscripciones').style.color = inscripcionesAbiertas ? 'var(--success)' : 'var(--danger)'
    toast(inscripcionesAbiertas ? 'Inscripciones abiertas' : 'Inscripciones cerradas')
  }

  window.toggleTorneo = async () => {
    torneoIniciado = !torneoIniciado
    await setConfig('torneo_iniciado', String(torneoIniciado))
    document.getElementById('lbl-torneo').textContent = torneoIniciado ? 'INICIADO' : 'NO INICIADO'
    document.getElementById('lbl-torneo').style.color = torneoIniciado ? 'var(--success)' : 'var(--warn)'
    toast('Estado del torneo actualizado')
  }

  window.saveResGrupo = async (grupo, idx, e1, e2) => {
    const s1 = document.getElementById(`rg_${grupo}_${idx}_s1`)?.value
    const s2 = document.getElementById(`rg_${grupo}_${idx}_s2`)?.value
    if (s1 === '' || s2 === '') { toast('Ingresa ambos marcadores', 'err'); return }
    try {
      await guardarResultadoGrupo(grupo, idx, e1, e2, s1, s2)
      toast('✓ Resultado guardado, recalculando puntos...')
      await recalcularTodosLosPuntos()
      toast(`✓ Grupo ${grupo} P${idx + 1}: puntos actualizados`)
    } catch (e) { toast('Error: ' + e.message, 'err') }
  }

  window.saveResKO = async (ronda, idx) => {
    const t1 = document.getElementById(`rko_${ronda}_${idx}_t1`)?.value
    const t2 = document.getElementById(`rko_${ronda}_${idx}_t2`)?.value
    const s1 = document.getElementById(`rko_${ronda}_${idx}_s1`)?.value
    const s2 = document.getElementById(`rko_${ronda}_${idx}_s2`)?.value
    const jugado = document.getElementById(`rko_${ronda}_${idx}_jug`)?.checked
    const fecha = document.getElementById(`rko_${ronda}_${idx}_fecha`)?.value || null
    if (!t1 || !t2) { toast('Selecciona ambos equipos', 'err'); return }
    if (t1 === t2) { toast('Un equipo no puede jugar contra sí mismo', 'err'); return }
    if (jugado && (s1 === '' || s2 === '')) { toast('Si ya se jugó, ingresa el marcador', 'err'); return }
    try {
      await guardarResultadoKO(ronda, idx, t1, t2, s1 || 0, s2 || 0, jugado, fecha)
      resultadosKO = await getResultadosKO()
      if (jugado) {
        toast('✓ Resultado guardado, recalculando puntos...')
        await recalcularTodosLosPuntos()
        toast('✓ Puntos actualizados')
      } else {
        toast('✓ Enfrentamiento guardado (abierto para predicciones)')
      }
    } catch (e) { toast('Error: ' + e.message, 'err') }
  }

  // Filtra las listas: un equipo elegido en un partido desaparece de los demas de esa ronda
  window.refreshKOOptions = (ronda) => {
    const selects = Array.from(document.querySelectorAll(`select.ko-adm-sel[data-koronda="${ronda}"]`))
    selects.forEach(sel => {
      const current = sel.value
      const usadosOtros = selects.filter(s => s !== sel).map(s => s.value).filter(Boolean)
      const disp = SELECCIONES.filter(s => s === current || !usadosOtros.includes(s))
      const esT1 = sel.id.endsWith('_t1')
      sel.innerHTML = `<option value="">-- Equipo ${esT1 ? '1' : '2'} --</option>` +
        disp.map(s => `<option ${s === current ? 'selected' : ''}>${s}</option>`).join('')
    })
  }

  window.saveResEspeciales = async () => {
    const c = document.getElementById('res-campeon')?.value
    const s = document.getElementById('res-subcampeon')?.value
    const g = document.getElementById('res-goleador')?.value
    if (!c || !s || !g) { toast('Selecciona los 3 resultados', 'err'); return }
    try {
      await guardarResultadosEspeciales(c, s, g)
      toast('✓ Guardado, recalculando puntos...')
      await recalcularTodosLosPuntos()
      toast('✓ Resultados finales y puntos actualizados')
    } catch (e) { toast('Error: ' + e.message, 'err') }
  }

  window.recalcularTodos = async () => {
    toast('Recalculando puntos...')
    try {
      await recalcularTodosLosPuntos()
      toast('✓ Puntos actualizados para todos')
    } catch (e) { toast('Error: ' + e.message, 'err') }
  }

  window.guardarFechas = async () => {
    const nuevasFechas = {}
    GRUPOS.forEach(g => {
      getPartidosGrupo(g).forEach(({ idx }) => {
        const inp = document.getElementById(`fecha_${g.letra}_${idx}`)
        if (inp && inp.value) nuevasFechas[`${g.letra}_${idx}`] = inp.value
      })
    })
    try {
      await guardarFechasGrupos(nuevasFechas)
      fechasGrupos = nuevasFechas
      toast('✓ Fechas guardadas correctamente')
    } catch (e) { toast('Error: ' + e.message, 'err') }
  }

  // Aplica el filtrado inicial segun los partidos ya guardados
  KO_ROUNDS.forEach(r => window.refreshKOOptions(r.id))
}

// ── START ─────────────────────────────────────────────
init()

// ════════════════════════════════════════════════════════
// PWA — instalación de la app + banner guía para el usuario
// Cubre 4 casos:
//  1) Navegador interno de Facebook/Instagram/WhatsApp/etc → guía "Abrir en Chrome/Safari" + botón Copiar link
//  2) iPhone/iPad en Safari → guía "Compartir → Agregar a inicio"
//  3) Android en Chrome → botón "Instalar" de un toque
//  4) Ya instalada o aviso cerrado antes → no molestar
// ════════════════════════════════════════════════════════
;(function initPWA() {
  // Metadatos (manifest, color de barra, ícono de iPhone)
  const add = (html) => document.head.insertAdjacentHTML('beforeend', html)
  if (!document.querySelector('link[rel="manifest"]')) add('<link rel="manifest" href="/manifest.json">')
  if (!document.querySelector('meta[name="theme-color"]')) add('<meta name="theme-color" content="#061030">')
  if (!document.querySelector('link[rel="apple-touch-icon"]')) add('<link rel="apple-touch-icon" href="/icons/icon-180.png">')

  // Registrar el service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
  }

  // Si ya está instalada, o el usuario cerró el aviso antes, no molestar
  const yaInstalada = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  if (yaInstalada) return
  if (localStorage.getItem('pwa_banner_oculto') === '1') return

  const ua = navigator.userAgent || ''
  const esIOS = /iphone|ipad|ipod/i.test(ua)
  // Navegadores internos: Facebook (FBAN/FBAV/FB_IAB), Messenger, Instagram, WhatsApp, TikTok, Twitter/X, LinkedIn, Snapchat, Line
  const esNavegadorInterno = /FBAN|FBAV|FB_IAB|FB4A|FBIOS|Instagram|Messenger|WhatsApp|musical_ly|TikTok|BytedanceWebview|Twitter|LinkedInApp|Snapchat|Line\//i.test(ua)
  let promptGuardado = null

  function mostrarBanner(mensajeHTML, tipoBoton) {
    // tipoBoton: 'instalar' | 'copiar' | null
    if (document.getElementById('pwa-banner')) return
    const div = document.createElement('div')
    div.id = 'pwa-banner'
    div.style.cssText = 'position:fixed;left:10px;right:10px;bottom:12px;z-index:9999;background:#0a1840;border:1px solid rgba(255,210,74,.45);border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:10px;box-shadow:0 6px 24px rgba(0,0,0,.5);font-size:13px;color:#eaf6ff;max-width:560px;margin:0 auto;'
    let botonHTML = ''
    if (tipoBoton === 'instalar') botonHTML = '<button id="pwa-instalar" style="background:#ffd24a;color:#0a1840;border:none;border-radius:8px;padding:9px 16px;font-weight:700;cursor:pointer;flex-shrink:0;">Instalar</button>'
    if (tipoBoton === 'copiar') botonHTML = '<button id="pwa-copiar" style="background:#ffd24a;color:#0a1840;border:none;border-radius:8px;padding:9px 14px;font-weight:700;cursor:pointer;flex-shrink:0;white-space:nowrap;">Copiar link</button>'
    div.innerHTML = `
      <span style="font-size:22px;flex-shrink:0;">📲</span>
      <span style="flex:1;line-height:1.45;">${mensajeHTML}</span>
      ${botonHTML}
      <button id="pwa-cerrar" aria-label="Cerrar" style="background:none;border:none;color:#7e93a8;font-size:18px;cursor:pointer;padding:4px;flex-shrink:0;">✕</button>`
    document.body.appendChild(div)
    document.getElementById('pwa-cerrar').onclick = () => {
      div.remove()
      localStorage.setItem('pwa_banner_oculto', '1')
    }
    const btnInstalar = document.getElementById('pwa-instalar')
    if (btnInstalar) btnInstalar.onclick = async () => {
      if (!promptGuardado) return
      promptGuardado.prompt()
      await promptGuardado.userChoice
      promptGuardado = null
      div.remove()
    }
    const btnCopiar = document.getElementById('pwa-copiar')
    if (btnCopiar) btnCopiar.onclick = async () => {
      const url = location.origin + '/'
      let copiado = false
      try {
        await navigator.clipboard.writeText(url)
        copiado = true
      } catch (e) {
        // Plan B para navegadores internos viejos que bloquean el portapapeles moderno
        try {
          const ta = document.createElement('textarea')
          ta.value = url
          ta.style.cssText = 'position:fixed;opacity:0;'
          document.body.appendChild(ta)
          ta.select()
          copiado = document.execCommand('copy')
          ta.remove()
        } catch (e2) { copiado = false }
      }
      btnCopiar.textContent = copiado ? '✓ Copiado' : url
      btnCopiar.style.background = copiado ? '#19d27c' : '#ffd24a'
    }
  }

  if (esNavegadorInterno) {
    // Caso 1: el link se abrió dentro de Facebook, Instagram, WhatsApp, etc.
    // Ese navegador interno NO permite instalar la app; guiamos a abrirla en el navegador real.
    const guia = esIOS
      ? 'Para instalar la <strong>Quiniela</strong>, toca los <strong>tres puntos (···)</strong> o el botón <strong>Compartir</strong> y elige <strong>"Abrir en Safari"</strong>. También puedes copiar el link y pegarlo en Safari.'
      : 'Para instalar la <strong>Quiniela</strong>, toca los <strong>tres puntos (⋮)</strong> arriba a la derecha y elige <strong>"Abrir en Chrome"</strong>. También puedes copiar el link y pegarlo en Chrome.'
    setTimeout(() => mostrarBanner(guia, 'copiar'), 2000)
  } else if (esIOS) {
    // Caso 2: iPhone/iPad en Safari — no existe botón de instalar; mostramos la guía
    setTimeout(() => mostrarBanner(
      'Instala la <strong>Quiniela Paraíso</strong> como app: toca el botón <strong>Compartir</strong> (el cuadrito con la flecha ↑) y elige <strong>"Agregar a inicio"</strong>.',
      null
    ), 2500)
  } else {
    // Caso 3: Android/Chrome — botón de instalación directo
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      promptGuardado = e
      mostrarBanner('Instala la <strong>Quiniela Paraíso</strong> en tu pantalla de inicio y entra con un solo toque.', 'instalar')
    })
  }
})()

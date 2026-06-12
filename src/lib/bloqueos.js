// Lógica de bloqueos de la quiniela.
// Las fechas están en hora de Costa Rica (GMT-6).
// El navegador del usuario puede estar en otra zona, así que
// convertimos todo a un instante absoluto usando el offset -06:00.

const OFFSET_CR = '-06:00'

// Convierte una fecha ISO local de Costa Rica (ej "2026-06-11T16:00")
// a un objeto Date absoluto correcto.
function fechaCR(isoLocal) {
  if (!isoLocal) return null
  // Añade segundos si faltan y el offset de Costa Rica
  let s = isoLocal.trim()
  if (s.length === 16) s += ':00'
  return new Date(s + OFFSET_CR)
}

// ¿Ya pasó la fecha/hora de este partido de grupos?
export function partidoBloqueado(fechaISO, ahora = new Date()) {
  const f = fechaCR(fechaISO)
  if (!f || isNaN(f.getTime())) return false // sin fecha válida = no se bloquea
  return ahora >= f
}

// ── FECHA LÍMITE PARA LAS PREDICCIONES ESPECIALES ──
// (Campeón, Subcampeón y Goleador.) Hora de Costa Rica. Editable aquí en un solo lugar.
export const CIERRE_ESPECIALES = '2026-06-22T12:00'

// Devuelve la fecha de cierre de Especiales (fija).
export function fechaCierreEliminacion(fechasGrupos) {
  return fechaCR(CIERRE_ESPECIALES)
}

// ¿Ya está cerrada la fase de Eliminación y Especiales?
// Se cierra cuando todos los grupos jugaron su primer partido.
export function eliminacionBloqueada(fechasGrupos, ahora = new Date()) {
  const cierre = fechaCierreEliminacion(fechasGrupos)
  if (!cierre) return false
  return ahora >= cierre
}

// Texto amigable de cuándo se cierra (para mostrar al usuario)
export function textoCierre(fechasGrupos) {
  const cierre = fechaCierreEliminacion(fechasGrupos)
  if (!cierre) return ''
  return cierre.toLocaleString('es-CR', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Costa_Rica'
  })
}

// Formatea una fecha de partido para mostrarla
export function formatoFechaPartido(fechaISO) {
  const f = fechaCR(fechaISO)
  if (!f || isNaN(f.getTime())) return 'Sin fecha'
  return f.toLocaleString('es-CR', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Costa_Rica'
  })
}

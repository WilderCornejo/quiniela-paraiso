// Genera el texto "USA · MÉXICO · CANADÁ" con letras gruesas
// rellenas con la bandera de cada país sede del Mundial 2026.

import { flagUrl } from './data.js'

export function textoSedes() {
  return `
    <svg class="sedes-svg" viewBox="0 0 760 80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="flag-us" patternUnits="objectBoundingBox" width="1" height="1">
          <image href="${flagUrl('us')}" width="200" height="120"
            preserveAspectRatio="xMidYMid slice" x="0" y="0" />
        </pattern>
        <pattern id="flag-mx" patternUnits="objectBoundingBox" width="1" height="1">
          <image href="${flagUrl('mx')}" width="320" height="120"
            preserveAspectRatio="xMidYMid slice" x="0" y="0" />
        </pattern>
        <pattern id="flag-ca" patternUnits="objectBoundingBox" width="1" height="1">
          <image href="${flagUrl('ca')}" width="320" height="120"
            preserveAspectRatio="xMidYMid slice" x="0" y="0" />
        </pattern>
      </defs>

      <!-- USA -->
      <text x="85" y="56" class="sede-word" text-anchor="middle" fill="url(#flag-us)">USA</text>

      <!-- separador -->
      <circle cx="190" cy="44" r="5" fill="#00b4ff" />

      <!-- MÉXICO -->
      <text x="370" y="56" class="sede-word" text-anchor="middle" fill="url(#flag-mx)">MÉXICO</text>

      <!-- separador -->
      <circle cx="555" cy="44" r="5" fill="#00b4ff" />

      <!-- CANADÁ -->
      <text x="660" y="56" class="sede-word" text-anchor="middle" fill="url(#flag-ca)">CANADÁ</text>
    </svg>
  `
}

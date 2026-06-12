# 🔒 Seguridad y Clonación — Quiniela Mundial 2026

## PARTE 1 — Aplicar la migración de acceso

Antes de usar la versión nueva, ejecuta el SQL en Supabase:

1. Ve a `https://supabase.com/dashboard/project/zvyxtlphoiedbaiaegfm/sql/new`
2. Abre el archivo `MIGRACION-ACCESO.sql`
3. Copia todo, pégalo y dale **Run**

Esto cambia el acceso de correo a **identificación + filial**, y guarda la clave de admin de forma segura.

> ⚠️ Importante: los usuarios registrados con el sistema viejo (correo) deberán registrarse de nuevo con su identificación y filial.

---

## PARTE 2 — Mejoras de seguridad aplicadas

| Mejora | Qué hace |
|--------|----------|
| Acceso por ID + filial + contraseña | Cada quien entra solo a su cuenta |
| Hash PBKDF2 con salt (100.000 iteraciones) | Contraseñas mucho más difíciles de descifrar |
| Hash no se expone en el navegador | El navegador ya no guarda la contraseña cifrada |
| Clave de admin en base de datos | Ya no está visible en el código del sitio |
| Límite de 5 intentos de login | Frena ataques de adivinación de contraseña |
| Validación de datos | Identificación solo números, filial solo letras/números, marcadores 0-99 |

---

## PARTE 3 — Cómo clonar la app para OTRO condominio/colegio

Cada grupo necesita su **propia copia independiente**. Pasos:

### 1. Nueva base de datos
- Crea un **proyecto nuevo en Supabase** (uno por cada grupo)
- Ejecuta en orden: `supabase-schema.sql`, luego `MIGRACION-ACCESO.sql`

### 2. Personalizar el código
Solo hay que cambiar **una línea**. Abre el archivo `main.js` y busca al inicio:

```javascript
// ═══════════════════════════════════════════════════════
//  CONFIGURACIÓN DEL GRUPO  (cambiar al clonar la app)
// ═══════════════════════════════════════════════════════
const CONDOMINIO = 'Condominio Calzadas Coloniales'
```

Cambia el texto por el nombre del nuevo grupo, por ejemplo:
```javascript
const CONDOMINIO = 'Colegio San José'
```

### 3. Cambiar las credenciales
En el archivo `.env`, pon la URL y clave del **nuevo** proyecto de Supabase:
```
VITE_SUPABASE_URL=https://NUEVO_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=nueva_clave
```

### 4. Cambiar la clave de admin (opcional)
En `MIGRACION-ACCESO.sql`, la clave admin es `vecinos2026`. Para usar otra:
- Genera el hash SHA-256 de tu nueva clave (hay webs gratuitas para esto)
- Reemplaza el valor en el `INSERT` de `admin_secret`

### 5. Desplegar
- Sube el código a un repositorio nuevo de GitHub
- Crea un proyecto nuevo en Vercel apuntando a ese repo
- Configura las 3 variables de entorno

Resultado: cada grupo tiene su app, su URL y sus datos **totalmente separados**.

---

## Notas honestas sobre seguridad

Esta app tiene seguridad **adecuada para quinielas entre grupos cerrados** (condominios, colegios, barrios) sin dinero de por medio. Las mejoras aplicadas evitan:
- Que alguien entre a la cuenta de otro
- Que alguien se cuele como administrador
- Manipulación básica de datos
- Ataques de adivinación de contraseña

**Lo que esta app NO debe usarse para:** manejar dinero real, apuestas con premios económicos, o datos personales sensibles. Para eso se necesitaría una auditoría de seguridad profesional y, posiblemente, permisos legales.

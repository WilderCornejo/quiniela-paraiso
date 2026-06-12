# 🏆 Guía de Despliegue — Quiniela Mundial 2026

Sigue estos pasos en orden. Tiempo estimado: **30–45 minutos**.

---

## PASO 1 — Crear base de datos en Supabase (gratis)

1. Ve a https://supabase.com y crea una cuenta gratuita
2. Haz clic en **"New Project"**
   - Nombre: `quiniela-mundial-2026`
   - Contraseña: una contraseña segura (guárdala)
   - Región: elige la más cercana (ej. US East)
3. Espera ~2 minutos a que el proyecto se cree
4. Ve a **SQL Editor** (menú izquierdo)
5. Haz clic en **"New Query"**
6. Copia TODO el contenido del archivo `supabase-schema.sql` y pégalo ahí
7. Haz clic en **"Run"** — debería decir "Success"

### Obtener tus credenciales de Supabase:
- Ve a **Settings → API**
- Copia el **Project URL** (algo como `https://abcdef.supabase.co`)
- Copia el **anon/public key** (una cadena larga)

---

## PASO 2 — Subir el código a GitHub

1. Ve a https://github.com y crea una cuenta si no tienes
2. Haz clic en **"New repository"**
   - Nombre: `quiniela-mundial`
   - Visibilidad: **Private** (recomendado)
   - Haz clic en **"Create repository"**
3. Instala Git en tu computadora si no lo tienes: https://git-scm.com
4. Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
git init
git add .
git commit -m "Quiniela Mundial 2026 - primer commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/quiniela-mundial.git
git push -u origin main
```

---

## PASO 3 — Crear archivo .env con tus credenciales

Copia el archivo `.env.example` y renómbralo `.env`:

```
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
VITE_ADMIN_SECRET=una_clave_secreta_que_solo_tu_sepas
```

> ⚠️ NUNCA subas el archivo `.env` a GitHub. Ya está en el .gitignore.

---

## PASO 4 — Publicar en Vercel (gratis)

1. Ve a https://vercel.com y crea una cuenta (puedes usar tu cuenta de GitHub)
2. Haz clic en **"New Project"**
3. Elige tu repositorio `quiniela-mundial`
4. En la sección **Environment Variables**, agrega estas 3 variables:
   - `VITE_SUPABASE_URL` → tu URL de Supabase
   - `VITE_SUPABASE_ANON_KEY` → tu anon key
   - `VITE_ADMIN_SECRET` → tu clave de admin
5. Haz clic en **"Deploy"**
6. Espera 1–2 minutos
7. Vercel te dará una URL como: `https://quiniela-mundial.vercel.app`

---

## PASO 5 — Probar la app

1. Abre la URL de Vercel en tu navegador
2. Regístrate como primer usuario
3. Prueba llenar una quiniela
4. Para entrar como **administrador**: haz clic en "Acceso administrador" en la pantalla de login e ingresa la clave que pusiste en `VITE_ADMIN_SECRET`

---

## PASO 6 — Compartir con tus vecinos

Simplemente comparte el link de Vercel por WhatsApp:

```
🏆 QUINIELA MUNDIAL 2026 🏆
Regístrate y llena tu quiniela:
https://quiniela-mundial.vercel.app

⏰ Inscripciones abiertas hasta el 10 de junio de 2026
```

---

## Como administrador puedes:

| Acción | Cómo |
|--------|------|
| Cerrar inscripciones | Panel Admin → botón "Inscripciones" |
| Iniciar torneo (bloquea edición) | Panel Admin → botón "Torneo" |
| Ingresar resultados reales | Panel Admin → sección Resultados |
| Recalcular ranking | Panel Admin → botón "Recalcular" |
| Ver ganadores | Pestaña Ranking (visible para todos) |

---

## Preguntas frecuentes

**¿Cuánto cuesta?**
Todo es gratuito: Supabase (hasta 500MB de datos), Vercel (ilimitado para proyectos pequeños), GitHub.

**¿Cuántos participantes soporta?**
Sin problemas hasta 500 personas con el plan gratuito de Supabase.

**¿Se puede ver en el celular?**
Sí, la app es completamente responsive.

**¿Los datos se pierden si cierro el navegador?**
No, todo queda guardado en Supabase permanentemente.

**¿Cómo actualizo los resultados del torneo?**
Como administrador, entra al panel admin y escribe el marcador real de cada partido. Luego haz clic en "Recalcular puntos".

---

## Estructura del proyecto

```
quiniela-mundial/
├── index.html              # Página principal
├── main.js                 # Lógica de la app
├── package.json            # Dependencias
├── vite.config.js          # Configuración de build
├── vercel.json             # Configuración de despliegue
├── supabase-schema.sql     # Base de datos (ejecutar en Supabase)
├── .env.example            # Plantilla de variables de entorno
├── .gitignore
└── src/
    ├── styles.css          # Estilos 3D futuristas
    └── lib/
        ├── supabase.js     # Conexión y funciones de BD
        └── data.js         # Equipos, grupos, datos del torneo
```

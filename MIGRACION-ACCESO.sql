-- ============================================
-- MIGRACIÓN — Acceso por Identificación + Filial
-- Quiniela Mundial 2026 — Condominio Calzadas Coloniales
-- Ejecuta este archivo en el SQL Editor de Supabase
-- ============================================

-- Agregar las columnas nuevas a participantes
ALTER TABLE participantes ADD COLUMN IF NOT EXISTS identificacion TEXT;
ALTER TABLE participantes ADD COLUMN IF NOT EXISTS filial TEXT;

-- Quitar la restricción de email único (ya no se usa email)
ALTER TABLE participantes DROP CONSTRAINT IF EXISTS participantes_email_key;

-- Hacer el email opcional (ya no es obligatorio)
ALTER TABLE participantes ALTER COLUMN email DROP NOT NULL;

-- La identificación debe ser única (un participante por cédula)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'participantes_identificacion_key'
  ) THEN
    ALTER TABLE participantes ADD CONSTRAINT participantes_identificacion_key UNIQUE (identificacion);
  END IF;
END $$;

-- Listo. La app ahora usa identificación + filial para el acceso.

-- ── Clave de administrador (guardada como hash seguro) ──
-- La clave es: vecinos2026  (cámbiala desde aquí si quieres otra)
INSERT INTO configuracion (clave, valor)
VALUES ('admin_secret', 'a8f694a1a56d79d722f0a92f7ae0fec1eedde59189bac0d5dd5659f52cd4f7da')
ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor;

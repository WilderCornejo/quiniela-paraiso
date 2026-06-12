-- ============================================
-- QUINIELA MUNDIAL 2026 - Supabase Schema
-- Ejecuta este archivo en el SQL Editor de Supabase
-- ============================================

-- Tabla de participantes
CREATE TABLE participantes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  es_admin BOOLEAN DEFAULT false,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de predicciones de grupos
CREATE TABLE predicciones_grupos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participante_id UUID REFERENCES participantes(id) ON DELETE CASCADE,
  grupo TEXT NOT NULL,
  partido_idx INTEGER NOT NULL,
  equipo1 TEXT NOT NULL,
  equipo2 TEXT NOT NULL,
  goles1 INTEGER,
  goles2 INTEGER,
  actualizado_en TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participante_id, grupo, partido_idx)
);

-- Tabla de predicciones eliminación directa
CREATE TABLE predicciones_ko (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participante_id UUID REFERENCES participantes(id) ON DELETE CASCADE,
  ronda TEXT NOT NULL, -- octavos, cuartos, semis, final
  partido_idx INTEGER NOT NULL,
  equipo1 TEXT,
  equipo2 TEXT,
  goles1 INTEGER,
  goles2 INTEGER,
  actualizado_en TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participante_id, ronda, partido_idx)
);

-- Tabla de predicciones especiales
CREATE TABLE predicciones_especiales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participante_id UUID REFERENCES participantes(id) ON DELETE CASCADE UNIQUE,
  campeon TEXT,
  subcampeon TEXT,
  goleador TEXT,
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de resultados reales (la llena el admin o la API)
CREATE TABLE resultados_grupos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  grupo TEXT NOT NULL,
  partido_idx INTEGER NOT NULL,
  equipo1 TEXT NOT NULL,
  equipo2 TEXT NOT NULL,
  goles1 INTEGER,
  goles2 INTEGER,
  jugado BOOLEAN DEFAULT false,
  UNIQUE(grupo, partido_idx)
);

CREATE TABLE resultados_ko (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ronda TEXT NOT NULL,
  partido_idx INTEGER NOT NULL,
  equipo1 TEXT,
  equipo2 TEXT,
  goles1 INTEGER,
  goles2 INTEGER,
  jugado BOOLEAN DEFAULT false,
  UNIQUE(ronda, partido_idx)
);

CREATE TABLE resultados_especiales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campeon TEXT,
  subcampeon TEXT,
  goleador TEXT,
  torneo_terminado BOOLEAN DEFAULT false
);

-- Tabla de configuración
CREATE TABLE configuracion (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);

-- Insertar config inicial
INSERT INTO configuracion (clave, valor) VALUES
  ('inscripciones_abiertas', 'true'),
  ('torneo_iniciado', 'false'),
  ('torneo_terminado', 'false');

-- Tabla de puntos (calculada)
CREATE TABLE puntos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participante_id UUID REFERENCES participantes(id) ON DELETE CASCADE UNIQUE,
  pts_grupos INTEGER DEFAULT 0,
  pts_ko INTEGER DEFAULT 0,
  pts_especiales INTEGER DEFAULT 0,
  total INTEGER DEFAULT 0,
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE predicciones_grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE predicciones_ko ENABLE ROW LEVEL SECURITY;
ALTER TABLE predicciones_especiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_ko ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_especiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE puntos ENABLE ROW LEVEL SECURITY;

-- Políticas: todos pueden leer resultados, ranking y config
CREATE POLICY "resultados_grupos_public_read" ON resultados_grupos FOR SELECT USING (true);
CREATE POLICY "resultados_ko_public_read" ON resultados_ko FOR SELECT USING (true);
CREATE POLICY "resultados_especiales_public_read" ON resultados_especiales FOR SELECT USING (true);
CREATE POLICY "configuracion_public_read" ON configuracion FOR SELECT USING (true);
CREATE POLICY "puntos_public_read" ON puntos FOR SELECT USING (true);
CREATE POLICY "participantes_public_read" ON participantes FOR SELECT USING (true);

-- Políticas: solo el dueño puede leer/editar sus predicciones
CREATE POLICY "predicciones_grupos_owner" ON predicciones_grupos
  USING (participante_id::text = current_setting('app.current_user_id', true));
CREATE POLICY "predicciones_ko_owner" ON predicciones_ko
  USING (participante_id::text = current_setting('app.current_user_id', true));
CREATE POLICY "predicciones_especiales_owner" ON predicciones_especiales
  USING (participante_id::text = current_setting('app.current_user_id', true));

-- Políticas INSERT para predicciones
CREATE POLICY "predicciones_grupos_insert" ON predicciones_grupos FOR INSERT
  WITH CHECK (participante_id::text = current_setting('app.current_user_id', true));
CREATE POLICY "predicciones_ko_insert" ON predicciones_ko FOR INSERT
  WITH CHECK (participante_id::text = current_setting('app.current_user_id', true));
CREATE POLICY "predicciones_especiales_insert" ON predicciones_especiales FOR INSERT
  WITH CHECK (participante_id::text = current_setting('app.current_user_id', true));

-- INSERT participantes es público (registro)
CREATE POLICY "participantes_insert" ON participantes FOR INSERT WITH CHECK (true);

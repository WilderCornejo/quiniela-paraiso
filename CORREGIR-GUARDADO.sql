-- ============================================
-- CORRECCIÓN DE POLÍTICAS — Quiniela Mundial 2026
-- Versión segura: se puede ejecutar varias veces sin error
-- ============================================

-- Predicciones de grupos
DROP POLICY IF EXISTS "predicciones_grupos_owner" ON predicciones_grupos;
DROP POLICY IF EXISTS "predicciones_grupos_insert" ON predicciones_grupos;
DROP POLICY IF EXISTS "predicciones_grupos_all" ON predicciones_grupos;
CREATE POLICY "predicciones_grupos_all" ON predicciones_grupos
  FOR ALL USING (true) WITH CHECK (true);

-- Predicciones de eliminación
DROP POLICY IF EXISTS "predicciones_ko_owner" ON predicciones_ko;
DROP POLICY IF EXISTS "predicciones_ko_insert" ON predicciones_ko;
DROP POLICY IF EXISTS "predicciones_ko_all" ON predicciones_ko;
CREATE POLICY "predicciones_ko_all" ON predicciones_ko
  FOR ALL USING (true) WITH CHECK (true);

-- Predicciones especiales
DROP POLICY IF EXISTS "predicciones_especiales_owner" ON predicciones_especiales;
DROP POLICY IF EXISTS "predicciones_especiales_insert" ON predicciones_especiales;
DROP POLICY IF EXISTS "predicciones_especiales_all" ON predicciones_especiales;
CREATE POLICY "predicciones_especiales_all" ON predicciones_especiales
  FOR ALL USING (true) WITH CHECK (true);

-- Puntos
DROP POLICY IF EXISTS "puntos_public_read" ON puntos;
DROP POLICY IF EXISTS "puntos_all" ON puntos;
CREATE POLICY "puntos_all" ON puntos
  FOR ALL USING (true) WITH CHECK (true);

-- Resultados (admin)
DROP POLICY IF EXISTS "resultados_grupos_write" ON resultados_grupos;
CREATE POLICY "resultados_grupos_write" ON resultados_grupos
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "resultados_ko_write" ON resultados_ko;
CREATE POLICY "resultados_ko_write" ON resultados_ko
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "resultados_especiales_write" ON resultados_especiales;
CREATE POLICY "resultados_especiales_write" ON resultados_especiales
  FOR ALL USING (true) WITH CHECK (true);

-- Configuración (admin)
DROP POLICY IF EXISTS "configuracion_write" ON configuracion;
CREATE POLICY "configuracion_write" ON configuracion
  FOR ALL USING (true) WITH CHECK (true);

-- Listo. Los marcadores se guardan correctamente.

-- ============================================
-- Supabase RLS Policies for DollarAlert
-- ============================================

-- Enable RLS on all tables
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- exchange_rates: Lectura pública, escritura solo para authenticated
-- ============================================

-- Política: Cualquiera puede leer tasas actuales
CREATE POLICY "Public read access for exchange rates"
ON exchange_rates
FOR SELECT
USING (true);

-- Política: Solo usuarios autenticados pueden insertar/actualizar
CREATE POLICY "Authenticated insert for exchange rates"
ON exchange_rates
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update for exchange rates"
ON exchange_rates
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- exchange_rates_history: Lectura pública
-- ============================================

-- Política: Cualquiera puede leer historial
CREATE POLICY "Public read access for exchange rates history"
ON exchange_rates_history
FOR SELECT
USING (true);

-- Política: Solo usuarios autenticados pueden insertar historial
CREATE POLICY "Authenticated insert for history"
ON exchange_rates_history
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- notification_subscribers: Solo el usuario puede ver sus propias suscripciones
-- ============================================

-- Política: Usuarios pueden ver sus propias suscripciones
CREATE POLICY "Users can view own subscriptions"
ON notification_subscribers
FOR SELECT
USING (
  auth.uid()::text = user_identifier OR 
  auth.jwt() ->> 'sub' = user_identifier
);

-- Política: Usuarios pueden crear sus propias suscripciones
CREATE POLICY "Users can create subscriptions"
ON notification_subscribers
FOR INSERT
WITH CHECK (
  auth.uid()::text = user_identifier OR 
  auth.jwt() ->> 'sub' = user_identifier
);

-- Política: Usuarios pueden actualizar sus propias suscripciones
CREATE POLICY "Users can update own subscriptions"
ON notification_subscribers
FOR UPDATE
USING (
  auth.uid()::text = user_identifier OR 
  auth.jwt() ->> 'sub' = user_identifier
)
WITH CHECK (
  auth.uid()::text = user_identifier OR 
  auth.jwt() ->> 'sub' = user_identifier
);

-- Política: Usuarios pueden eliminar sus propias suscripciones
CREATE POLICY "Users can delete own subscriptions"
ON notification_subscribers
FOR DELETE
USING (
  auth.uid()::text = user_identifier OR 
  auth.jwt() ->> 'sub' = user_identifier
);

-- ============================================
-- admin_configs: Solo administradores pueden acceder
-- ============================================

-- Política: Solo usuarios autenticados pueden leer configuración (para checks de mantenimiento)
CREATE POLICY "Authenticated read for admin config"
ON admin_configs
FOR SELECT
USING (auth.role() = 'authenticated');

-- Política: Solo usuarios autenticados pueden actualizar configuración
CREATE POLICY "Authenticated update for admin config"
ON admin_configs
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- alert_notifications: Usuarios ven solo sus notificaciones
-- ============================================

-- Política: Usuarios ven sus propias notificaciones
CREATE POLICY "Users view own notifications"
ON alert_notifications
FOR SELECT
USING (
  subscriber_id IN (
    SELECT id FROM notification_subscribers 
    WHERE user_identifier = auth.uid()::text 
    OR user_identifier = auth.jwt() ->> 'sub'
  )
);

-- Política: Sistema crea notificaciones
CREATE POLICY "System creates notifications"
ON alert_notifications
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Política: Usuarios marcan como leídas sus notificaciones
CREATE POLICY "Users mark own notifications as read"
ON alert_notifications
FOR UPDATE
USING (
  subscriber_id IN (
    SELECT id FROM notification_subscribers 
    WHERE user_identifier = auth.uid()::text 
    OR user_identifier = auth.jwt() ->> 'sub'
  )
);

-- ============================================
-- Functions para manejo de scraping_sources (JSONB)
-- ============================================

-- Función para agregar una fuente de scraping
CREATE OR REPLACE FUNCTION add_scraping_source(
  source_name text,
  source_url text,
  source_selector text,
  source_rate_type text,
  source_currency text,
  source_frequency text
) RETURNS void AS $$
BEGIN
  UPDATE admin_configs
  SET scraping_sources = scraping_sources || jsonb_build_object(
    'id', gen_random_uuid()::text,
    'name', source_name,
    'url', source_url,
    'selector', source_selector,
    'rate_type', source_rate_type,
    'currency', source_currency,
    'frequency', source_frequency,
    'is_active', true,
    'created_at', now()::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Verificación de políticas
-- ============================================

-- Listar todas las políticas
SELECT 
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

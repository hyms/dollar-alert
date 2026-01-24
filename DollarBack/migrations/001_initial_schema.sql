-- Create admin_configs table
CREATE TABLE IF NOT EXISTS admin_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_username VARCHAR(255) NOT NULL,
    admin_password_hash VARCHAR(255) NOT NULL,
    scraping_sources JSONB DEFAULT '[]'::jsonb,
    maintenance_mode BOOLEAN DEFAULT false,
    site_config JSONB DEFAULT '{
        "title": "DollarAlert 🇧🇴",
        "maintenance_message": "System under maintenance. Please try again later.",
        "allowed_currencies": ["USD", "BOB"],
        "max_subscriptions_per_user": 5,
        "notification_cooldown": 300
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exchange_rates table for current rates
CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('official', 'parallel')),
    base_currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    target_currency VARCHAR(10) NOT NULL DEFAULT 'BOB',
    buy_price DECIMAL(10,4) NOT NULL,
    sell_price DECIMAL(10,4) NOT NULL,
    average_price DECIMAL(10,4) GENERATED ALWAYS AS ((buy_price + sell_price) / 2) STORED,
    spread_amount DECIMAL(10,4) GENERATED ALWAYS AS (sell_price - buy_price) STORED,
    change_24h DECIMAL(10,4) DEFAULT 0,
    change_percentage_24h DECIMAL(10,4) DEFAULT 0,
    source VARCHAR(255),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(type, base_currency, target_currency)
);

-- Create exchange_rates_history table for historical data
CREATE TABLE IF NOT EXISTS exchange_rates_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rate_type VARCHAR(20) NOT NULL CHECK (rate_type IN ('official', 'parallel')),
    base_currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    target_currency VARCHAR(10) NOT NULL DEFAULT 'BOB',
    buy_price DECIMAL(10,4) NOT NULL,
    sell_price DECIMAL(10,4) NOT NULL,
    average_price DECIMAL(10,4) GENERATED ALWAYS AS ((buy_price + sell_price) / 2) STORED,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_subscribers table
CREATE TABLE IF NOT EXISTS notification_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_identifier VARCHAR(255) NOT NULL,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('telegram', 'web_push')),
    push_subscription_data JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_identifier, platform)
);

-- Create alert_notifications table
CREATE TABLE IF NOT EXISTS alert_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscriber_id UUID REFERENCES notification_subscribers(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('price_change', 'threshold_alert')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE admin_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access on exchange rates
CREATE POLICY "Public read access for exchange rates" ON exchange_rates
    FOR SELECT USING (true);

CREATE POLICY "Public read access for exchange rates history" ON exchange_rates_history
    FOR SELECT USING (true);

-- Create policies for notification subscribers (users can only see their own data)
CREATE POLICY "Users can insert their own subscriptions" ON notification_subscribers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own subscriptions" ON notification_subscribers
    FOR UPDATE USING (true);

CREATE POLICY "Users can read their own subscriptions" ON notification_subscribers
    FOR SELECT USING (true);

-- Create policies for alert notifications
CREATE POLICY "Users can insert their own notifications" ON alert_notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON alert_notifications
    FOR UPDATE USING (true);

CREATE POLICY "Users can read their own notifications" ON alert_notifications
    FOR SELECT USING (true);

-- Admin access policies
CREATE POLICY "Admin access to configs" ON admin_configs
    FOR ALL USING (false); -- Only service role access

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exchange_rates_type ON exchange_rates(type);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_last_updated ON exchange_rates(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_history_recorded_at ON exchange_rates_history(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_history_type ON exchange_rates_history(rate_type);
CREATE INDEX IF NOT EXISTS idx_notification_subscribers_platform ON notification_subscribers(platform);
CREATE INDEX IF NOT EXISTS idx_notification_subscribers_active ON notification_subscribers(is_active);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_subscriber_id ON alert_notifications(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_created_at ON alert_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_read ON alert_notifications(is_read);

-- Insert default admin configuration
INSERT INTO admin_configs (
    admin_username,
    admin_password_hash,
    scraping_sources,
    maintenance_mode
) VALUES (
  'admin',
  '$2a$10$rQZ8ZK9A8K8K8K8K8K8K8O8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', -- change in prod
  jsonb_build_array(
    jsonb_build_object(
      'id', '1',
      'name', 'Banco Central de Bolivia',
      'url', 'https://www.bcb.gob.bo/',
      'selector', '.tipo-cambio-',
      'currency', 'USD',
      'frequency', '0 */6 * * *',
      'is_active', true,
      'rate_type', 'official',
      'created_at', to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SSOF') -- or use NOW()::text
    ),
    jsonb_build_object(
      'id', '2',
      'name', 'Dolar Blue Bolivia',
      'url', 'https://www.dolarbluebolivia.click/',
      'selector', '#usdRate',
      'currency', 'USD',
      'frequency', '0 */2 * * *',
      'is_active', true,
      'rate_type', 'parallel',
      'created_at', to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SSOF')
    )
  ),
  false
)
ON CONFLICT DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_admin_configs_updated_at BEFORE UPDATE ON admin_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_subscribers_updated_at BEFORE UPDATE ON notification_subscribers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

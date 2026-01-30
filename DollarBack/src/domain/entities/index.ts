export interface Currency {
  code: string
  name: string
  symbol: string
  is_crypto: boolean
}

export interface ExchangeRate {
  id: string
  type: 'official' | 'parallel'
  base_currency: string
  target_currency: string
  buy_price: number
  sell_price: number
  average_price: number
  spread_amount: number
  change_24h: number
  change_percentage_24h: number
  last_updated: string
  source?: string
}

export interface HistoricalRate {
  id: string
  rate_type: 'official' | 'parallel'
  base_currency: string
  target_currency: string
  buy_price: number
  sell_price: number
  average_price: number
  recorded_at: string
}

export interface NotificationSubscriber {
  id: string
  user_identifier: string
  platform: 'telegram' | 'web_push'
  push_subscription_data?: any
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ScrapingSource {
  id: string
  name: string
  url: string
  selector: string
  currency: string
  frequency: string
  is_active: boolean
  rate_type: 'official' | 'parallel'
  created_at: string
}

export interface AdminConfig {
  id: string
  admin_username: string
  admin_password_hash: string
  admin_password?: string // Temporary field for password updates
  scraping_sources: ScrapingSource[]
  maintenance_mode: boolean
  site_config: {
    title: string
    maintenance_message: string
    allowed_currencies: string[]
    max_subscriptions_per_user: number
    notification_cooldown: number
  }
  updated_at: string
}

export interface AlertNotification {
  id: string
  subscriber_id: string
  type: 'price_change' | 'threshold_alert'
  message: string
  is_read: boolean
  created_at: string
}
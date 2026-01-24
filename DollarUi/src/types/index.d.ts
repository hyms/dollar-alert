// TypeScript type definitions for the application
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

export interface UserSubscription {
  id: string
  user_id: string
  telegram_id: string
  username?: string
  email?: string
  is_active: boolean
  alert_threshold: number
  preferred_currencies: string[]
  notification_types: ('price_change' | 'threshold_alert')[]
  created_at: string
  updated_at: string
}

export interface Currency {
  code: string
  name: string
  symbol: string
  flag: string
  is_crypto: boolean
}

export interface AlertNotification {
  id: string
  user_id: string
  type: 'price_change' | 'threshold_alert'
  message: string
  is_read: boolean
  created_at: string
}

export interface SiteConfig {
  title: string
  maintenance_mode: boolean
  maintenance_message: string
  allowed_currencies: string[]
  max_subscriptions_per_user: number
  notification_cooldown: number
}
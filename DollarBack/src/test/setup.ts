import 'jest'

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.PORT = '3000'
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_KEY = 'test-key'
process.env.TELEGRAM_TOKEN = 'test-token'
process.env.VAPID_PUBLIC_KEY = 'test-vapid-public'
process.env.VAPID_PRIVATE_KEY = 'test-vapid-private'
process.env.VAPID_EMAIL = 'test@example.com'
process.env.JWT_SECRET = 'test-jwt-secret'

// Global test utilities
;(global as any).createMockRate = (type: 'official' | 'parallel' = 'official') => ({
  id: 'test-id',
  type,
  base_currency: 'USD',
  target_currency: 'BOB',
  buy_price: type === 'official' ? 6.95 : 7.20,
  sell_price: type === 'official' ? 7.05 : 7.35,
  average_price: type === 'official' ? 7.00 : 7.28,
  spread_amount: type === 'official' ? 0.10 : 0.15,
  change_24h: 0.05,
  change_percentage_24h: 0.72,
  last_updated: new Date().toISOString(),
  source: 'Test Source'
})

;(global as any).createMockSource = (type: 'official' | 'parallel' = 'official') => ({
  id: 'test-source-id',
  name: `Test ${type} Source`,
  url: 'https://test.com',
  selector: '.rate',
  currency: 'USD',
  frequency: '0 */2 * * *',
  is_active: true,
  rate_type: type,
  created_at: new Date().toISOString()
})
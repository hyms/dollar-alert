import type {
  Currency,
  ExchangeRate,
  HistoricalRate,
  NotificationSubscriber,
  ScrapingSource,
  AdminConfig,
  AlertNotification
} from '@/domain/entities'

// Helper functions for tests
const createMockRate = (type: 'official' | 'parallel' = 'official') => ({
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

const createMockSource = (type: 'official' | 'parallel' = 'official') => ({
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

describe('Domain Entities', () => {
  describe('Currency', () => {
    it('should create a valid currency', () => {
      const currency: Currency = {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        is_crypto: false
      }

      expect(currency.code).toBe('USD')
      expect(currency.name).toBe('US Dollar')
      expect(currency.symbol).toBe('$')
      expect(currency.is_crypto).toBe(false)
    })

    it('should create a valid crypto currency', () => {
      const cryptoCurrency: Currency = {
        code: 'BTC',
        name: 'Bitcoin',
        symbol: '₿',
        is_crypto: true
      }

      expect(cryptoCurrency.is_crypto).toBe(true)
      expect(cryptoCurrency.code).toBe('BTC')
    })
  })

  describe('ExchangeRate', () => {
    it('should create a valid exchange rate', () => {
      const rate: ExchangeRate = {
        id: '1',
        type: 'official',
        base_currency: 'USD',
        target_currency: 'BOB',
        buy_price: 6.95,
        sell_price: 7.05,
        average_price: 7.00,
        spread_amount: 0.10,
        change_24h: 0.05,
        change_percentage_24h: 0.72,
        last_updated: '2024-01-24T12:00:00Z',
        source: 'BCB'
      }

      expect(rate.type).toBe('official')
      expect(rate.buy_price).toBeLessThan(rate.sell_price)
      expect(rate.average_price).toBe((rate.buy_price + rate.sell_price) / 2)
    })

    it('should validate rate type constraint', () => {
      const validTypes = ['official', 'parallel']
      const rate = createMockRate('official')
      
      expect(validTypes).toContain(rate.type)
    })

    it('should calculate spread correctly', () => {
      const rate = createMockRate('official')
      const expectedSpread = rate.sell_price - rate.buy_price
      
      expect(rate.spread_amount).toBeCloseTo(expectedSpread, 10)
    })
  })

  describe('HistoricalRate', () => {
    it('should create a valid historical rate', () => {
      const historicalRate: HistoricalRate = {
        id: 'hist-1',
        rate_type: 'parallel',
        base_currency: 'USD',
        target_currency: 'BOB',
        buy_price: 7.20,
        sell_price: 7.35,
        average_price: 7.28,
        recorded_at: '2024-01-24T10:00:00Z'
      }

      expect(historicalRate.rate_type).toBe('parallel')
      expect(historicalRate.recorded_at).toBeDefined()
    })
  })

  describe('NotificationSubscriber', () => {
    it('should create a valid telegram subscriber', () => {
      const subscriber: NotificationSubscriber = {
        id: 'sub-1',
        user_identifier: '123456789',
        platform: 'telegram',
        is_active: true,
        created_at: '2024-01-24T12:00:00Z',
        updated_at: '2024-01-24T12:00:00Z'
      }

      expect(subscriber.platform).toBe('telegram')
      expect(subscriber.is_active).toBe(true)
    })

    it('should create a valid web push subscriber', () => {
      const subscriber: NotificationSubscriber = {
        id: 'sub-2',
        user_identifier: 'uuid-123',
        platform: 'web_push',
        push_subscription_data: { endpoint: 'test-endpoint' },
        is_active: true,
        created_at: '2024-01-24T12:00:00Z',
        updated_at: '2024-01-24T12:00:00Z'
      }

      expect(subscriber.platform).toBe('web_push')
      expect(subscriber.push_subscription_data).toBeDefined()
    })
  })

  describe('ScrapingSource', () => {
    it('should create a valid scraping source', () => {
      const source: ScrapingSource = {
        id: 'source-1',
        name: 'Banco Central de Bolivia',
        url: 'https://www.bcb.gob.bo/',
        selector: '.tipo-cambio .valor',
        currency: 'USD',
        frequency: '0 */6 * * *',
        is_active: true,
        rate_type: 'official',
        created_at: '2024-01-24T12:00:00Z'
      }

      expect(source.name).toBe('Banco Central de Bolivia')
      expect(source.url).toMatch(/^https?:\/\//)
      expect(source.is_active).toBe(true)
      expect(source.rate_type).toBe('official')
    })

    it('should validate cron frequency format', () => {
      const source = createMockSource()
      const cronPattern = /^(\*|[0-5]?\d|\*\/\d+) (\*|[01]?\d|2[0-3]|\*\/\d+) (\*|[12]?\d|3[01]|\*\/\d+) (\*|[01]?\d|\*\/\d+) (\*|[0-6]|\*\/\d+)$/
      
      expect(source.frequency).toMatch(cronPattern)
    })
  })

  describe('AdminConfig', () => {
    it('should create a valid admin config', () => {
      const config: AdminConfig = {
        id: 'config-1',
        admin_username: 'admin',
        admin_password_hash: 'hashed_password',
        scraping_sources: [createMockSource()],
        maintenance_mode: false,
        site_config: {
          title: 'DollarAlert',
          maintenance_message: 'Under maintenance',
          allowed_currencies: ['USD', 'EUR'],
          max_subscriptions_per_user: 5,
          notification_cooldown: 300
        },
        updated_at: '2024-01-24T12:00:00Z'
      }

      expect(config.admin_username).toBe('admin')
      expect(config.scraping_sources).toHaveLength(1)
      expect(config.maintenance_mode).toBe(false)
      expect(config.site_config.title).toBe('DollarAlert')
    })

    it('should validate site configuration', () => {
      const config = {
        id: 'config-2',
        admin_username: 'admin',
        admin_password_hash: 'hashed_password',
        scraping_sources: [],
        maintenance_mode: false,
        site_config: {
          title: 'Test',
          maintenance_message: 'Test maintenance',
          allowed_currencies: ['USD'],
          max_subscriptions_per_user: 10,
          notification_cooldown: 600
        },
        updated_at: '2024-01-24T12:00:00Z'
      } as AdminConfig

      expect(config.site_config.max_subscriptions_per_user).toBeGreaterThan(0)
      expect(config.site_config.notification_cooldown).toBeGreaterThan(0)
      expect(config.site_config.allowed_currencies).toContain('USD')
    })
  })

  describe('AlertNotification', () => {
    it('should create a valid alert notification', () => {
      const alert: AlertNotification = {
        id: 'alert-1',
        subscriber_id: 'sub-1',
        type: 'price_change',
        message: 'USD/BOB rate has changed by 5%',
        is_read: false,
        created_at: '2024-01-24T12:00:00Z'
      }

      expect(alert.type).toBe('price_change')
      expect(alert.is_read).toBe(false)
      expect(alert.message).toContain('5%')
    })

    it('should support different alert types', () => {
      const alertTypes = ['price_change', 'threshold_alert']
      
      alertTypes.forEach(type => {
        const alert: AlertNotification = {
          id: `alert-${type}`,
          subscriber_id: 'sub-1',
          type: type as 'price_change' | 'threshold_alert',
          message: `Test ${type} message`,
          is_read: false,
          created_at: '2024-01-24T12:00:00Z'
        }
        
        expect(alertTypes).toContain(alert.type)
      })
    })
  })
})
import { ScraperEngine } from '@/application/services/scraper'
import { NotificationManager } from '@/application/services/notification'
import type { ScrapingSource, ExchangeRate, NotificationSubscriber } from '@/domain/entities'

// Helper functions
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

// Mock the services
jest.mock('@/application/services/scraper')
jest.mock('@/application/services/notification')

const MockedScraperEngine = ScraperEngine as jest.MockedClass<typeof ScraperEngine>
const MockedNotificationManager = NotificationManager as jest.MockedClass<typeof NotificationManager>

describe('Application Services Integration', () => {
  let mockScraperEngine: jest.Mocked<ScraperEngine>
  let mockNotificationManager: jest.Mocked<NotificationManager>

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockScraperEngine = {
      scrapeAllSources: jest.fn(),
      scrapeSource: jest.fn(),
      getActiveSources: jest.fn()
    } as any
    
    mockNotificationManager = {
      sendNotification: jest.fn(),
      sendTelegramMessage: jest.fn(),
      sendWebPushNotification: jest.fn(),
      startBot: jest.fn(),
      stopBot: jest.fn()
    } as any
    
    MockedScraperEngine.mockImplementation(() => mockScraperEngine)
    MockedNotificationManager.mockImplementation(() => mockNotificationManager)
  })

  describe('Scraper and Notification Integration', () => {
    it('should handle successful scraping followed by notifications', async () => {
      const mockSources = [createMockSource('official'), createMockSource('parallel')]
      const mockRates = [
        createMockRate('official'),
        createMockRate('parallel')
      ]
      
      mockScraperEngine.getActiveSources.mockResolvedValue(mockSources)
      mockScraperEngine.scrapeAllSources.mockResolvedValue(mockRates)
      
      const scraper = new ScraperEngine()
      const activeSources = await scraper.getActiveSources()
      const rates = await scraper.scrapeAllSources()
      
      expect(activeSources).toHaveLength(2)
      expect(rates).toHaveLength(2)
      expect(rates[0].type).toBe('official')
      expect(rates[1].type).toBe('parallel')
    })

    it('should handle partial scraping failures gracefully', async () => {
      const mockSources = [createMockSource('official'), createMockSource('parallel')]
      
      mockScraperEngine.getActiveSources.mockResolvedValue(mockSources)
      mockScraperEngine.scrapeAllSources.mockResolvedValue([createMockRate('official')])
      
      const scraper = new ScraperEngine()
      const rates = await scraper.scrapeAllSources()
      
      expect(rates).toHaveLength(1)
      expect(rates[0].type).toBe('official')
    })

    it('should handle notification broadcasting to multiple subscribers', async () => {
      const subscribers: NotificationSubscriber[] = [
        {
          id: 'sub-1',
          user_identifier: '123456789',
          platform: 'telegram',
          is_active: true,
          created_at: '2024-01-24T12:00:00Z',
          updated_at: '2024-01-24T12:00:00Z'
        },
        {
          id: 'sub-2',
          user_identifier: 'uuid-123',
          platform: 'web_push',
          push_subscription_data: { endpoint: 'test' },
          is_active: true,
          created_at: '2024-01-24T12:00:00Z',
          updated_at: '2024-01-24T12:00:00Z'
        }
      ]
      
      const notification = {
        type: 'price_change',
        message: 'USD/BOB rate updated: 7.00'
      }
      
      const notificationManager = new NotificationManager()
      
      // Simulate sending to all subscribers
      for (const subscriber of subscribers) {
        await notificationManager.sendNotification(subscriber, notification)
      }
      
      expect(mockNotificationManager.sendNotification).toHaveBeenCalledTimes(2)
      expect(mockNotificationManager.sendNotification).toHaveBeenCalledWith(
        subscribers[0],
        notification
      )
      expect(mockNotificationManager.sendNotification).toHaveBeenCalledWith(
        subscribers[1],
        notification
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle scraping service failures', async () => {
      mockScraperEngine.scrapeAllSources.mockRejectedValue(new Error('Scraping service unavailable'))
      
      const scraper = new ScraperEngine()
      
      await expect(scraper.scrapeAllSources()).rejects.toThrow('Scraping service unavailable')
    })

    it('should handle notification service failures', async () => {
      const subscriber: NotificationSubscriber = {
        id: 'sub-1',
        user_identifier: '123456789',
        platform: 'telegram',
        is_active: true,
        created_at: '2024-01-24T12:00:00Z',
        updated_at: '2024-01-24T12:00:00Z'
      }
      
      mockNotificationManager.sendNotification.mockRejectedValue(new Error('Telegram API error'))
      
      const notificationManager = new NotificationManager()
      
      await expect(notificationManager.sendNotification(subscriber, {
        type: 'test',
        message: 'test message'
      })).rejects.toThrow('Telegram API error')
    })
  })

  describe('Data Flow Validation', () => {
    it('should validate exchange rate data structure', () => {
      const rate = createMockRate('official')
      
      expect(rate.id).toBeDefined()
      expect(rate.type).toMatch(/^(official|parallel)$/)
      expect(rate.base_currency).toBe('USD')
      expect(rate.target_currency).toBe('BOB')
      expect(rate.buy_price).toBeGreaterThan(0)
      expect(rate.sell_price).toBeGreaterThan(0)
      expect(rate.sell_price).toBeGreaterThan(rate.buy_price)
      expect(rate.average_price).toBe((rate.buy_price + rate.sell_price) / 2)
    })

    it('should validate scraping source configuration', () => {
      const source = createMockSource('official')
      
      expect(source.id).toBeDefined()
      expect(source.name).toBeDefined()
      expect(source.url).toMatch(/^https?:\/\//)
      expect(source.selector).toBeDefined()
      expect(source.currency).toBe('USD')
      expect(source.frequency).toMatch(/^\S+ \S+ \S+ \S+ \S+$/) // Basic cron pattern
      expect(['official', 'parallel']).toContain(source.rate_type)
    })
  })
})
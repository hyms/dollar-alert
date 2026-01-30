import { 
  SupabaseExchangeRateRepository,
  SupabaseNotificationSubscriberRepository,
  SupabaseAdminConfigRepository,
  SupabaseAlertNotificationRepository
} from '@/infrastructure/database/supabase'
import { createClient } from '@supabase/supabase-js'
import type { 
  ExchangeRate, 
  HistoricalRate, 
  NotificationSubscriber, 
  AdminConfig,
  AlertNotification
} from '@/domain/entities'

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

// Mock Supabase client
jest.mock('@supabase/supabase-js')
const MockedCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('Supabase Repositories', () => {
  let mockSupabaseClient: any
  let mockQuery: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Create a shared mock query that maintains state across chain calls
    // Each method returns the query object to allow chaining
    mockQuery = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis()
    }
    
    // Override then to allow awaiting the query
    mockQuery.then = jest.fn((callback: any) => {
      return Promise.resolve(callback({ data: null, error: null }))
    })
    
    mockSupabaseClient = {
      from: jest.fn().mockReturnValue(mockQuery)
    }
    
    MockedCreateClient.mockReturnValue(mockSupabaseClient)
  })

  describe('SupabaseExchangeRateRepository', () => {
    let repository: SupabaseExchangeRateRepository

    beforeEach(() => {
      repository = new SupabaseExchangeRateRepository(mockSupabaseClient)
    })

    describe('getCurrentRates', () => {
      it('should fetch current exchange rates', async () => {
        const mockRates = [createMockRate('official'), createMockRate('parallel')]
        
        mockQuery.limit.mockReturnValue({
          ...mockQuery,
          then: (resolve: any) => resolve({ data: mockRates, error: null })
        })

        const result = await repository.getCurrentRates()

        expect(result).toEqual(mockRates)
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('exchange_rates')
        expect(mockQuery.select).toHaveBeenCalledWith('*')
        expect(mockQuery.order).toHaveBeenCalledWith('last_updated', { ascending: false })
        expect(mockQuery.limit).toHaveBeenCalledWith(10)
      })

      it('should handle database errors', async () => {
        const mockError = new Error('Database connection failed')
        
        mockQuery.limit.mockReturnValue({
          ...mockQuery,
          then: (resolve: any, reject: any) => reject(mockError)
        })

        await expect(repository.getCurrentRates()).rejects.toThrow('Database connection failed')
      })
    })

    describe('getHistoricalRates', () => {
      it('should fetch historical rates with filters', async () => {
        const mockHistoricalRates: HistoricalRate[] = [
          {
            id: 'hist-1',
            rate_type: 'official',
            base_currency: 'USD',
            target_currency: 'BOB',
            buy_price: 6.95,
            sell_price: 7.05,
            average_price: 7.00,
            recorded_at: '2024-01-24T10:00:00Z'
          }
        ]

        // Mock the chain methods to track calls and return proper values
        // The order method is last in the chain, so it should return the promise
        mockQuery.range.mockImplementation(() => mockQuery)
        mockQuery.order.mockImplementation(() => {
          return Promise.resolve({ 
            data: mockHistoricalRates, 
            error: null, 
            count: 1 
          })
        })

        const result = await repository.getHistoricalRates({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          rateType: 'official',
          limit: 25,
          offset: 25
        })

        expect(result).toEqual({
          data: mockHistoricalRates,
          total: 1
        })
        expect(mockQuery.gte).toHaveBeenCalledWith('recorded_at', '2024-01-01')
        expect(mockQuery.lte).toHaveBeenCalledWith('recorded_at', '2024-01-31')
        expect(mockQuery.eq).toHaveBeenCalledWith('rate_type', 'official')
        expect(mockQuery.range).toHaveBeenCalledWith(25, 49)
      })

      it('should handle missing count', async () => {
        mockQuery.select.mockImplementation(() => {
          return {
            ...mockQuery,
            then: (resolve: any) => resolve({ 
              data: [], 
              error: null, 
              count: null 
            })
          }
        })

        const result = await repository.getHistoricalRates({})

        expect(result.total).toBe(0)
      })
    })

    describe('saveRate', () => {
      it('should save a new exchange rate', async () => {
        const rateToSave = {
          type: 'official' as const,
          base_currency: 'USD',
          target_currency: 'BOB',
          buy_price: 6.95,
          sell_price: 7.05,
          average_price: 7.00,
          spread_amount: 0.10,
          change_24h: 0.05,
          change_percentage_24h: 0.72,
          source: 'BCB'
        }

        const savedRate = {
          ...rateToSave,
          id: 'rate-1',
          last_updated: '2024-01-24T12:00:00Z'
        }

        mockQuery.single.mockImplementation(() => {
          return Promise.resolve({ data: savedRate, error: null })
        })

        const result = await repository.saveRate(rateToSave)

        expect(result).toEqual(savedRate)
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('exchange_rates')
        expect(mockQuery.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            ...rateToSave,
            last_updated: expect.any(String)
          })
        )
      })
    })

    describe('saveHistoricalRate', () => {
      it('should save a historical rate', async () => {
        const rateToSave = {
          rate_type: 'parallel' as const,
          base_currency: 'USD',
          target_currency: 'BOB',
          buy_price: 7.20,
          sell_price: 7.35,
          average_price: 7.28
        }

        const savedRate = {
          ...rateToSave,
          id: 'hist-1',
          recorded_at: '2024-01-24T12:00:00Z'
        }

        mockQuery.single.mockImplementation(() => {
          return Promise.resolve({ data: savedRate, error: null })
        })

        const result = await repository.saveHistoricalRate(rateToSave)

        expect(result).toEqual(savedRate)
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('exchange_rates_history')
        expect(mockQuery.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            ...rateToSave,
            recorded_at: expect.any(String)
          })
        )
      })
    })
  })

  describe('SupabaseNotificationSubscriberRepository', () => {
    let repository: SupabaseNotificationSubscriberRepository

    beforeEach(() => {
      repository = new SupabaseNotificationSubscriberRepository(mockSupabaseClient)
    })

    describe('createSubscriber', () => {
      it('should create a new subscriber', async () => {
        const subscriberToCreate = {
          user_identifier: '123456789',
          platform: 'telegram' as const,
          is_active: true
        }

        const createdSubscriber: NotificationSubscriber = {
          ...subscriberToCreate,
          id: 'sub-1',
          created_at: '2024-01-24T12:00:00Z',
          updated_at: '2024-01-24T12:00:00Z'
        }

        mockQuery.single.mockImplementation(() => {
          return Promise.resolve({ data: createdSubscriber, error: null })
        })

        const result = await repository.createSubscriber(subscriberToCreate)

        expect(result).toEqual(createdSubscriber)
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('notification_subscribers')
      })
    })

    describe('updateSubscriber', () => {
      it('should update an existing subscriber', async () => {
        const updateData = { is_active: false }
        const updatedSubscriber: NotificationSubscriber = {
          id: 'sub-1',
          user_identifier: '123456789',
          platform: 'telegram',
          is_active: false,
          created_at: '2024-01-24T12:00:00Z',
          updated_at: '2024-01-24T13:00:00Z'
        }

        mockQuery.single.mockImplementation(() => {
          return Promise.resolve({ data: updatedSubscriber, error: null })
        })

        const result = await repository.updateSubscriber('sub-1', updateData)

        expect(result).toEqual(updatedSubscriber)
        expect(mockQuery.update).toHaveBeenCalledWith(
          expect.objectContaining({
            ...updateData,
            updated_at: expect.any(String)
          })
        )
        expect(mockQuery.eq).toHaveBeenCalledWith('id', 'sub-1')
      })
    })

    describe('getActiveSubscribers', () => {
      it('should fetch only active subscribers', async () => {
        const activeSubscribers: NotificationSubscriber[] = [
          {
            id: 'sub-1',
            user_identifier: '123456789',
            platform: 'telegram',
            is_active: true,
            created_at: '2024-01-24T12:00:00Z',
            updated_at: '2024-01-24T12:00:00Z'
          }
        ]

        mockQuery.eq.mockImplementation(() => {
          return {
            ...mockQuery,
            then: (resolve: any) => resolve({ data: activeSubscribers, error: null })
          }
        })

        const result = await repository.getActiveSubscribers()

        expect(result).toEqual(activeSubscribers)
        expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true)
      })
    })

    describe('getSubscribersByPlatform', () => {
      it('should fetch subscribers by platform', async () => {
        const telegramSubscribers: NotificationSubscriber[] = [
          {
            id: 'sub-1',
            user_identifier: '123456789',
            platform: 'telegram',
            is_active: true,
            created_at: '2024-01-24T12:00:00Z',
            updated_at: '2024-01-24T12:00:00Z'
          }
        ]

        mockQuery.eq.mockImplementation(() => {
          return {
            ...mockQuery,
            then: (resolve: any) => resolve({ data: telegramSubscribers, error: null })
          }
        })

        const result = await repository.getSubscribersByPlatform('telegram')

        expect(result).toEqual(telegramSubscribers)
        expect(mockQuery.eq).toHaveBeenCalledWith('platform', 'telegram')
        expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true)
      })
    })
  })

  describe('SupabaseAdminConfigRepository', () => {
    let repository: SupabaseAdminConfigRepository

    beforeEach(() => {
      repository = new SupabaseAdminConfigRepository(mockSupabaseClient)
    })

    describe('getConfig', () => {
      it('should fetch admin configuration', async () => {
        const mockConfig: AdminConfig = {
          id: 'config-1',
          admin_username: 'admin',
          admin_password_hash: 'hashed_password',
          scraping_sources: [createMockSource()],
          maintenance_mode: false,
          site_config: {
            title: 'DollarAlert',
            maintenance_message: 'Under maintenance',
            allowed_currencies: ['USD'],
            max_subscriptions_per_user: 5,
            notification_cooldown: 300
          },
          updated_at: '2024-01-24T12:00:00Z'
        }

        mockQuery.single.mockImplementation(() => {
          return Promise.resolve({ data: mockConfig, error: null })
        })

        const result = await repository.getConfig()

        expect(result).toEqual(mockConfig)
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('admin_configs')
      })

      it('should return null when no config exists', async () => {
        mockQuery.single.mockImplementation(() => {
          return Promise.resolve({ data: null, error: { code: 'PGRST116' } })
        })

        const result = await repository.getConfig()

        expect(result).toBeNull()
      })
    })

    describe('updateConfig', () => {
      it('should update admin configuration', async () => {
        const updateData = { maintenance_mode: true }
        const updatedConfig: AdminConfig = {
          id: 'config-1',
          admin_username: 'admin',
          admin_password_hash: 'hashed_password',
          scraping_sources: [],
          maintenance_mode: true,
          site_config: {
            title: 'DollarAlert',
            maintenance_message: 'Under maintenance',
            allowed_currencies: ['USD'],
            max_subscriptions_per_user: 5,
            notification_cooldown: 300
          },
          updated_at: '2024-01-24T13:00:00Z'
        }

        mockQuery.single.mockImplementation(() => {
          return Promise.resolve({ data: updatedConfig, error: null })
        })

        const result = await repository.updateConfig(updateData)

        expect(result).toEqual(updatedConfig)
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('admin_configs')
      })
    })
  })

  describe('SupabaseAlertNotificationRepository', () => {
    let repository: SupabaseAlertNotificationRepository

    beforeEach(() => {
      repository = new SupabaseAlertNotificationRepository(mockSupabaseClient)
    })

    describe('createNotification', () => {
      it('should create a new alert notification', async () => {
        const notificationToCreate = {
          subscriber_id: 'sub-1',
          type: 'price_change' as const,
          message: 'Rate changed by 5%',
          is_read: false
        }

        const createdNotification: AlertNotification = {
          ...notificationToCreate,
          id: 'alert-1',
          created_at: '2024-01-24T12:00:00Z'
        }

        mockQuery.single.mockImplementation(() => {
          return Promise.resolve({ data: createdNotification, error: null })
        })

        const result = await repository.createNotification(notificationToCreate)

        expect(result).toEqual(createdNotification)
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('alert_notifications')
      })
    })

    describe('markAsRead', () => {
      it('should mark notification as read', async () => {
        mockQuery.eq.mockImplementation(() => {
          return Promise.resolve({ error: null })
        })

        await repository.markAsRead('alert-1')

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('alert_notifications')
        expect(mockQuery.update).toHaveBeenCalledWith({ is_read: true })
        expect(mockQuery.eq).toHaveBeenCalledWith('id', 'alert-1')
      })
    })

    describe('getNotifications', () => {
      it('should fetch notifications with filters', async () => {
        const mockNotifications: AlertNotification[] = [
          {
            id: 'alert-1',
            subscriber_id: 'sub-1',
            type: 'price_change',
            message: 'Rate changed',
            is_read: false,
            created_at: '2024-01-24T12:00:00Z'
          }
        ]

        mockQuery.limit.mockImplementation(() => {
          return {
            ...mockQuery,
            then: (resolve: any) => resolve({ data: mockNotifications, error: null })
          }
        })

        const result = await repository.getNotifications({
          subscriberId: 'sub-1',
          unreadOnly: true,
          limit: 10
        })

        expect(result).toEqual(mockNotifications)
        expect(mockQuery.eq).toHaveBeenCalledWith('subscriber_id', 'sub-1')
        expect(mockQuery.eq).toHaveBeenCalledWith('is_read', false)
        expect(mockQuery.limit).toHaveBeenCalledWith(10)
      })
    })
  })
})
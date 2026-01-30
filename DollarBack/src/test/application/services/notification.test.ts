import { Telegraf } from 'telegraf'
import webPush from 'web-push'
import { NotificationManager } from '@/application/services/notification'
import type { NotificationSubscriber } from '@/domain/entities'

// Mock the external dependencies
jest.mock('telegraf')
jest.mock('web-push')

const MockedTelegraf = Telegraf as jest.MockedClass<typeof Telegraf>
const mockedWebPush = webPush as jest.Mocked<typeof webPush>

// Helper function
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

describe('NotificationManager', () => {
  let notificationManager: NotificationManager
  let mockTelegramBot: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock Telegram bot
    mockTelegramBot = {
      telegram: {
        sendMessage: jest.fn().mockResolvedValue({ message_id: '123' })
      },
      command: jest.fn(),
      launch: jest.fn(),
      stop: jest.fn()
    }
    
    MockedTelegraf.mockImplementation(() => mockTelegramBot as any)
    
    // Mock web-push
    mockedWebPush.sendNotification = jest.fn().mockResolvedValue(undefined)
    
    notificationManager = new NotificationManager()
  })

  describe('sendNotification', () => {
    it('should send notification to telegram subscriber', async () => {
      const telegramSubscriber: NotificationSubscriber = {
        id: 'sub-1',
        user_identifier: '123456789',
        platform: 'telegram',
        is_active: true,
        created_at: '2024-01-24T12:00:00Z',
        updated_at: '2024-01-24T12:00:00Z'
      }

      const notification = {
        type: 'price_change',
        message: 'USD/BOB rate has changed to 7.00'
      }

      await notificationManager.sendNotification(telegramSubscriber, notification)

      expect(mockTelegramBot.telegram.sendMessage).toHaveBeenCalledWith(
        '123456789',
        notification.message,
        {
          parse_mode: 'HTML',
          disable_web_page_preview: true
        }
      )
    })

    it('should send web push notification to web push subscriber', async () => {
      const webPushSubscriber: NotificationSubscriber = {
        id: 'sub-2',
        user_identifier: 'uuid-123',
        platform: 'web_push',
        push_subscription_data: {
          endpoint: 'https://fcm.googleapis.com/fcm/send/test',
          keys: { p256dh: 'test', auth: 'test' }
        },
        is_active: true,
        created_at: '2024-01-24T12:00:00Z',
        updated_at: '2024-01-24T12:00:00Z'
      }

      const notification = {
        type: 'threshold_alert',
        message: 'USD/BOB rate exceeded threshold: 7.50'
      }

      await notificationManager.sendNotification(webPushSubscriber, notification)

      expect(mockedWebPush.sendNotification).toHaveBeenCalledWith(
        webPushSubscriber.push_subscription_data,
        expect.stringContaining('"title":"DollarAlert 🇧🇴"')
      )
    })

    it('should handle unsupported platform gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      const unsupportedSubscriber: NotificationSubscriber = {
        id: 'sub-3',
        user_identifier: '123',
        platform: 'email' as any, // Unsupported platform
        is_active: true,
        created_at: '2024-01-24T12:00:00Z',
        updated_at: '2024-01-24T12:00:00Z'
      }

      await notificationManager.sendNotification(unsupportedSubscriber, {
        type: 'test',
        message: 'test message'
      })

      expect(consoleSpy).toHaveBeenCalledWith('Unsupported platform: email')
      consoleSpy.mockRestore()
    })

    it('should not send web push if subscription data is missing', async () => {
      const webPushSubscriber: NotificationSubscriber = {
        id: 'sub-4',
        user_identifier: 'uuid-456',
        platform: 'web_push',
        is_active: true,
        created_at: '2024-01-24T12:00:00Z',
        updated_at: '2024-01-24T12:00:00Z'
      }

      await notificationManager.sendNotification(webPushSubscriber, {
        type: 'test',
        message: 'test message'
      })

      expect(mockedWebPush.sendNotification).not.toHaveBeenCalled()
    })
  })

  describe('sendTelegramMessage', () => {
    it('should send telegram message with correct parameters', async () => {
      const telegramId = '123456789'
      const message = 'Test message'

      await notificationManager.sendTelegramMessage(telegramId, message)

      expect(mockTelegramBot.telegram.sendMessage).toHaveBeenCalledWith(
        telegramId,
        message,
        {
          parse_mode: 'HTML',
          disable_web_page_preview: true
        }
      )
    })

    it('should handle telegram bot not initialized', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      // Reset the bot to null
      notificationManager['telegramBot'] = null

      await notificationManager.sendTelegramMessage('123', 'test')

      expect(consoleSpy).toHaveBeenCalledWith('Telegram bot not initialized')
      expect(mockTelegramBot.telegram.sendMessage).not.toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it('should handle telegram API errors', async () => {
      const error = new Error('Telegram API error')
      mockTelegramBot.telegram.sendMessage.mockRejectedValue(error)

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      await expect(notificationManager.sendTelegramMessage('123', 'test'))
        .rejects.toThrow('Telegram API error')

      expect(consoleSpy).toHaveBeenCalledWith('Error sending Telegram message to 123:', error)
      
      consoleSpy.mockRestore()
    })
  })

  describe('sendWebPushNotification', () => {
    it('should send web push with correct payload', async () => {
      const subscription = {
        endpoint: 'https://test-endpoint.com',
        keys: { p256dh: 'test', auth: 'test' }
      }
      const message = 'Test web push message'

      await notificationManager.sendWebPushNotification(subscription, message)

      expect(mockedWebPush.sendNotification).toHaveBeenCalledWith(
        subscription,
        expect.stringMatching(/"title":"DollarAlert 🇧🇴".*"body":"Test web push message"/)
      )
    })

    it('should include all required notification options', async () => {
      const subscription = { endpoint: 'test' }
      const message = 'Test message'

      await notificationManager.sendWebPushNotification(subscription, message)

      const payloadString = (mockedWebPush.sendNotification as jest.Mock).mock.calls[0][1]
      const payload = JSON.parse(payloadString)

      expect(payload).toMatchObject({
        title: 'DollarAlert 🇧🇴',
        body: message,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'dollar-alert',
        requireInteraction: true
      })

      expect(payload.actions).toHaveLength(2)
      expect(payload.actions[0]).toMatchObject({
        action: 'view',
        title: 'Ver tasas'
      })
      expect(payload.actions[1]).toMatchObject({
        action: 'dismiss',
        title: 'Cerrar'
      })
    })

    it('should handle web push errors', async () => {
      const error = new Error('Web push error')
      mockedWebPush.sendNotification.mockRejectedValue(error)

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      await expect(notificationManager.sendWebPushNotification({ endpoint: 'test' }, 'test'))
        .rejects.toThrow('Web push error')

      expect(consoleSpy).toHaveBeenCalledWith('Error sending web push notification:', error)
      
      consoleSpy.mockRestore()
    })
  })

  describe('Telegram Bot Commands', () => {
    it('should register all required commands', () => {
      expect(mockTelegramBot.command).toHaveBeenCalledWith('start', expect.any(Function))
      expect(mockTelegramBot.command).toHaveBeenCalledWith('help', expect.any(Function))
      expect(mockTelegramBot.command).toHaveBeenCalledWith('status', expect.any(Function))
      expect(mockTelegramBot.command).toHaveBeenCalledWith('unsubscribe', expect.any(Function))
    })

    it('should handle /start command', () => {
      const mockCtx = { reply: jest.fn() }
      const startHandler = mockTelegramBot.command.mock.calls.find((call: any) => call[0] === 'start')?.[1]
      
      startHandler(mockCtx)
      
      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('¡Bienvenido a DollarAlert 🇧🇴!')
      )
    })

    it('should handle /help command', () => {
      const mockCtx = { reply: jest.fn() }
      const helpHandler = mockTelegramBot.command.mock.calls.find((call: any) => call[0] === 'help')?.[1]
      
      helpHandler(mockCtx)
      
      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Comandos disponibles:')
      )
    })

    it('should handle /status command', () => {
      const mockCtx = { reply: jest.fn() }
      const statusHandler = mockTelegramBot.command.mock.calls.find((call: any) => call[0] === 'status')?.[1]
      
      statusHandler(mockCtx)
      
      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('📊 Consultando estado de tasas...')
      )
    })

    it('should handle /unsubscribe command', () => {
      const mockCtx = { reply: jest.fn() }
      const unsubscribeHandler = mockTelegramBot.command.mock.calls.find((call: any) => call[0] === 'unsubscribe')?.[1]
      
      unsubscribeHandler(mockCtx)
      
      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('🔕 Has sido desuscrito')
      )
    })
  })

  describe('Bot Lifecycle', () => {
    it('should start the bot', async () => {
      await notificationManager.startBot()
      
      expect(mockTelegramBot.launch).toHaveBeenCalled()
    })

    it('should stop the bot', async () => {
      await notificationManager.stopBot()
      
      expect(mockTelegramBot.stop).toHaveBeenCalledWith('SIGINT')
    })
  })

  describe('Telegram Initialization', () => {
    it('should not initialize bot when TELEGRAM_TOKEN is missing', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      delete process.env.TELEGRAM_TOKEN
      
      const newManager = new NotificationManager()
      
      // Wait for async initialization to complete
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(consoleSpy).toHaveBeenCalledWith('TELEGRAM_TOKEN not found, Telegram notifications disabled')
      expect(newManager['telegramBot']).toBeNull()
      
      consoleSpy.mockRestore()
      // Restore TELEGRAM_TOKEN for other tests
      process.env.TELEGRAM_TOKEN = 'test-token'
    })

    it('should handle telegram initialization errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      MockedTelegraf.mockImplementation(() => {
        throw new Error('Telegram init error')
      })
      
      new NotificationManager()
      
      // Wait for async initialization to complete
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(consoleSpy).toHaveBeenCalledWith('Error initializing Telegram bot:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })
})
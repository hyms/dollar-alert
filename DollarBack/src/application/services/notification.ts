import type { NotificationSubscriber } from '@/domain/entities'

export interface INotificationManager {
  sendNotification(subscriber: NotificationSubscriber, notification: { type: string; message: string }): Promise<void>
  sendTelegramMessage(telegramId: string, message: string): Promise<void>
  sendWebPushNotification(subscription: any, message: string): Promise<void>
}

export class NotificationManager implements INotificationManager {
  private telegramBot: any = null

  constructor() {
    this.initializeTelegram()
  }

  async sendNotification(subscriber: NotificationSubscriber, notification: { type: string; message: string }): Promise<void> {
    try {
      switch (subscriber.platform) {
        case 'telegram':
          await this.sendTelegramMessage(subscriber.user_identifier, notification.message)
          break
        case 'web_push':
          if (subscriber.push_subscription_data) {
            await this.sendWebPushNotification(subscriber.push_subscription_data, notification.message)
          }
          break
        default:
          console.warn(`Unsupported platform: ${subscriber.platform}`)
      }
    } catch (error) {
      console.error(`Error sending notification to ${subscriber.platform}:`, error)
      throw error
    }
  }

  async sendTelegramMessage(telegramId: string, message: string): Promise<void> {
    if (!this.telegramBot) {
      console.warn('Telegram bot not initialized')
      return
    }

    try {
      await this.telegramBot.telegram.sendMessage(telegramId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    } catch (error) {
      console.error(`Error sending Telegram message to ${telegramId}:`, error)
      throw error
    }
  }

  async sendWebPushNotification(subscription: any, message: string): Promise<void> {
    try {
      const webpush = await import('web-push')
      
      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title: 'DollarAlert 🇧🇴',
          body: message,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: 'dollar-alert',
          requireInteraction: true,
          actions: [
            {
              action: 'view',
              title: 'Ver tasas'
            },
            {
              action: 'dismiss',
              title: 'Cerrar'
            }
          ]
        })
      )
    } catch (error) {
      console.error('Error sending web push notification:', error)
      throw error
    }
  }

  private async initializeTelegram(): Promise<void> {
    try {
      const { Telegraf } = await import('telegraf')
      const telegramToken = process.env.TELEGRAM_TOKEN

      if (!telegramToken) {
        console.warn('TELEGRAM_TOKEN not found, Telegram notifications disabled')
        return
      }

      this.telegramBot = new Telegraf(telegramToken)

      this.telegramBot.command('start', (ctx: any) => {
        ctx.reply('¡Bienvenido a DollarAlert 🇧🇴!\n\n' +
          'Recibirás alertas cuando el dólar suba o baje.\n' +
          'Usa /help para ver todos los comandos disponibles.')
      })

      this.telegramBot.command('help', (ctx: any) => {
        ctx.reply('Comandos disponibles:\n\n' +
          '/start - Inicia el bot\n' +
          '/help - Muestra esta ayuda\n' +
          '/status - Muestra el estado actual de las tasas\n' +
          '/unsubscribe - Cancela las notificaciones')
      })

      this.telegramBot.command('status', async (ctx: any) => {
        ctx.reply('📊 Consultando estado de tasas...')
      })

      this.telegramBot.command('unsubscribe', (ctx: any) => {
        ctx.reply('🔕 Has sido desuscrito de las notificaciones.')
      })

      console.log('Telegram bot initialized successfully')
    } catch (error) {
      console.error('Error initializing Telegram bot:', error)
    }
  }

  async startBot(): Promise<void> {
    if (this.telegramBot) {
      await this.telegramBot.launch()
      console.log('Telegram bot started')
    }
  }

  async stopBot(): Promise<void> {
    if (this.telegramBot) {
      this.telegramBot.stop('SIGINT')
      console.log('Telegram bot stopped')
    }
  }
}
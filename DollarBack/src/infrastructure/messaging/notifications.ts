import { Telegraf, Context } from 'telegraf'
import webpush from 'web-push'

export class TelegramBotService {
  private bot: Telegraf | null = null
  private isEnabled: boolean

  constructor(token?: string) {
    this.isEnabled = !!token
    if (this.isEnabled && token) {
      this.bot = new Telegraf(token)
      this.setupCommands()
    } else {
      console.warn('Telegram bot disabled - no token provided')
    }
  }

  private setupCommands(): void {
    if (!this.bot) return

    this.bot.start((ctx: Context) => {
      ctx.reply('¡Bienvenido a DollarAlert 🇧🇴!\n\n' +
        'Te enviaré alertas cuando el dólar cambie significativamente.\n\n' +
        'Comandos disponibles:\n' +
        '/status - Ver tasas actuales\n' +
        '/unsubscribe - Cancelar notificaciones\n' +
        '/help - Ayuda')
    })

    this.bot.help((ctx: Context) => {
      ctx.reply('🤖 Comandos de DollarAlert:\n\n' +
        '/start - Inicia el bot\n' +
        '/help - Muestra esta ayuda\n' +
        '/status - Tasas de cambio actuales\n' +
        '/unsubscribe - Cancelar suscripción')
    })

    this.bot.command('status', async (ctx: Context) => {
      try {
        ctx.reply('📊 Consultando las tasas más recientes...')
        // Here you would fetch current rates from the database
      } catch (error) {
        ctx.reply('❌ Error al obtener las tasas. Inténtalo más tarde.')
      }
    })

    this.bot.command('unsubscribe', (ctx: Context) => {
      if (ctx.chat) {
        // Here you would deactivate the subscription in the database
        ctx.reply('🔕 Has sido desuscrito de las notificaciones.')
      }
    })

    this.bot.on('message', (ctx: Context) => {
      ctx.reply('Usa /help para ver los comandos disponibles.')
    })
  }

  async sendMessage(chatId: string, message: string): Promise<void> {
    if (!this.isEnabled || !this.bot) {
      console.warn(`Telegram bot disabled - message not sent to ${chatId}`)
      return
    }

    try {
      await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true }
      })
    } catch (error) {
      console.error(`Error sending Telegram message to ${chatId}:`, error)
      throw error
    }
  }

  async start(): Promise<void> {
    if (this.isEnabled && this.bot) {
      await this.bot.launch()
      console.log('Telegram bot started successfully')
    }
  }

  async stop(): Promise<void> {
    if (this.isEnabled && this.bot) {
      this.bot.stop('SIGINT')
      console.log('Telegram bot stopped')
    }
  }
}

export class WebPushService {
  private isEnabled: boolean

  constructor() {
    this.isEnabled = !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
    
    if (this.isEnabled) {
      webpush.setVapidDetails(
        'mailto:contact@dollaralert.bo',
        process.env.VAPID_PUBLIC_KEY!,
        process.env.VAPID_PRIVATE_KEY!
      )
    } else {
      console.warn('Web Push disabled - VAPID keys not provided')
    }
  }

  async sendNotification(subscription: any, payload: any): Promise<void> {
    if (!this.isEnabled) {
      console.warn('Web Push disabled - notification not sent')
      return
    }

    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify(payload),
        {
          TTL: 24 * 60 * 60, // 24 hours
          urgency: 'high'
        }
      )
    } catch (error) {
      console.error('Error sending Web Push notification:', error)
      throw error
    }
  }

  getVapidPublicKey(): string | null {
    return this.isEnabled ? process.env.VAPID_PUBLIC_KEY || null : null
  }
}
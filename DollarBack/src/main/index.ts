import Fastify from 'fastify'
import cors from '@fastify/cors'
import env from '@fastify/env'
import schedule from '@fastify/schedule'
import { createClient } from '@supabase/supabase-js'

import { 
  SupabaseExchangeRateRepository,
  SupabaseNotificationSubscriberRepository,
  SupabaseAdminConfigRepository,
  SupabaseAlertNotificationRepository
} from '@/infrastructure/database/supabase'

import { 
  registerRateRoutes,
  registerSubscriptionRoutes,
  registerNotificationRoutes,
  registerConfigRoutes,
  registerAuthRoutes
} from '@/infrastructure/delivery/routes'

import { ScrapingUseCase } from '@/application/use-cases/scraping'
import { NotificationUseCase } from '@/application/use-cases/notification'
import { AdminConfigUseCase } from '@/application/use-cases/admin'
import { ScraperEngine } from '@/application/services/scraper'
import { NotificationManager } from '@/application/services/notification'
import { TelegramBotService, WebPushService } from '@/infrastructure/messaging/notifications'
import { WebScraperService } from '@/infrastructure/external-api/webscraper'

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info'
  }
})

const envSchema = {
  type: 'object',
  required: ['PORT', 'SUPABASE_URL', 'SUPABASE_KEY'],
  properties: {
    PORT: { type: 'string', default: '3000' },
    NODE_ENV: { type: 'string', default: 'development' },
    SUPABASE_URL: { type: 'string' },
    SUPABASE_KEY: { type: 'string' },
    TELEGRAM_TOKEN: { type: 'string' },
    VAPID_PUBLIC_KEY: { type: 'string' },
    VAPID_PRIVATE_KEY: { type: 'string' },
    LOG_LEVEL: { type: 'string', default: 'info' }
  }
}

async function buildApp() {
  try {
    await server.register(env, {
      schema: envSchema,
      dotenv: true
    })

    await server.register(cors, {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    })

    await server.register(schedule)

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!
    )

    const exchangeRateRepository = new SupabaseExchangeRateRepository(supabase)
    const notificationSubscriberRepository = new SupabaseNotificationSubscriberRepository(supabase)
    const adminConfigRepository = new SupabaseAdminConfigRepository(supabase)
    const alertNotificationRepository = new SupabaseAlertNotificationRepository(supabase)

    const webScraperService = new WebScraperService()
    const telegramBotService = new TelegramBotService(process.env.TELEGRAM_TOKEN)
    const webPushService = new WebPushService()

    const notificationManager = new NotificationManager()
    const scraperEngine = new ScraperEngine()

    const scrapingUseCase = new ScrapingUseCase(exchangeRateRepository, scraperEngine)
    const notificationUseCase = new NotificationUseCase(
      notificationSubscriberRepository,
      alertNotificationRepository,
      notificationManager
    )
    const adminConfigUseCase = new AdminConfigUseCase(adminConfigRepository)

    await telegramBotService.start()

    server.get('/health', async (request, reply) => {
      return { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    })

    registerRateRoutes(server, scrapingUseCase)
    registerSubscriptionRoutes(server, notificationUseCase)
    registerNotificationRoutes(server, notificationUseCase)
    registerConfigRoutes(server, adminConfigUseCase)
    registerAuthRoutes(server, adminConfigUseCase)

    server.addHook('onRequest', async (request, reply) => {
      const config = await adminConfigUseCase.getConfig()
      if (config?.maintenance_mode && request.url !== '/api/config' && !request.url.startsWith('/api/auth')) {
        reply.status(503).send({
          error: 'Service Unavailable',
          message: config.site_config?.maintenance_message || 'System under maintenance'
        })
        return
      }
    })

    server.setErrorHandler((error, request, reply) => {
      server.log.error(error)
      reply.status(500).send({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      })
    })

    server.addHook('onClose', async () => {
      await telegramBotService.stop()
    })

    return server
  } catch (error) {
    server.log.error('Error building application:', error)
    throw error
  }
}

async function start() {
  try {
    const app = await buildApp()
    
    const port = parseInt(process.env.PORT || '3000')
    const host = process.env.HOST || '0.0.0.0'

    await app.listen({ port, host })
    console.log(`🚀 DollarBack API server listening on http://${host}:${port}`)
  } catch (err) {
    console.error('Error starting server:', err)
    process.exit(1)
  }
}

if (require.main === module) {
  start()
}

export { buildApp }
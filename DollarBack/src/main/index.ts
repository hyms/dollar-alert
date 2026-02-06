import Fastify from 'fastify'
import cors from '@fastify/cors'
import env from '@fastify/env'
import schedule from '@fastify/schedule'
import jwt from '@fastify/jwt'
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
  registerAuthRoutes,
  registerTestRoutes
} from '@/infrastructure/delivery/routes'

import { ScrapingUseCase } from '@/application/use-cases/scraping'
import { NotificationUseCase } from '@/application/use-cases/notification'
import { AdminConfigUseCase } from '@/application/use-cases/admin'
import { ScraperEngine } from '@/application/services/scraper'
import { NotificationManager } from '@/application/services/notification'
import { TelegramBotService } from '@/infrastructure/messaging/notifications'

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
    LOG_LEVEL: { type: 'string', default: 'info' },
    JWT_SECRET: { type: 'string' }
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

    await server.register(jwt, {
      secret: process.env.JWT_SECRET!,
    })

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!
    )

    const exchangeRateRepository = new SupabaseExchangeRateRepository(supabase)
    const notificationSubscriberRepository = new SupabaseNotificationSubscriberRepository(supabase)
    const adminConfigRepository = new SupabaseAdminConfigRepository(supabase)
    const alertNotificationRepository = new SupabaseAlertNotificationRepository(supabase)

    // Initialize Telegram bot only if valid token is provided
    let telegramBotService: TelegramBotService | null = null
    if (process.env.TELEGRAM_TOKEN && process.env.TELEGRAM_TOKEN !== 'your_telegram_bot_token_here') {
      telegramBotService = new TelegramBotService(process.env.TELEGRAM_TOKEN)
      try {
        await telegramBotService.start()
      } catch (error) {
        server.log.warn('Failed to start Telegram bot, continuing without it:', error)
        telegramBotService = null
      }
    } else {
      server.log.info('Telegram bot not configured, skipping...')
    }

    const notificationManager = new NotificationManager()
    const scraperEngine = new ScraperEngine()

    const scrapingUseCase = new ScrapingUseCase(exchangeRateRepository, scraperEngine)
    const notificationUseCase = new NotificationUseCase(
      notificationSubscriberRepository,
      alertNotificationRepository,
      notificationManager
    )
    const adminConfigUseCase = new AdminConfigUseCase(adminConfigRepository)

    server.get('/health', async () => {
      return { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    })

    registerRateRoutes(server, scrapingUseCase, exchangeRateRepository)
    registerSubscriptionRoutes(server, notificationUseCase, notificationSubscriberRepository)
    registerNotificationRoutes(server, notificationUseCase, alertNotificationRepository)
    registerConfigRoutes(server, adminConfigUseCase)
    registerAuthRoutes(server, adminConfigUseCase)
    registerTestRoutes(server, adminConfigUseCase)

    server.addHook('onRequest', async (request, reply) => {
      const publicPaths = ['/health', '/api/auth/login', '/api/rates', '/api/test']
      const isPublicPath = publicPaths.some(path => request.routerPath?.startsWith(path))
      
      if (!isPublicPath && request.routerPath && !['/api/auth/login', '/health'].includes(request.routerPath)) {
        try {
          await request.jwtVerify()
        } catch (err) {
          reply.send(err)
        }
      }
      const config = await adminConfigUseCase.getConfig()
      if (config?.maintenance_mode && !isPublicPath && request.url !== '/api/config' && !request.url.startsWith('/api/auth')) {
        reply.status(503).send({
          error: 'Service Unavailable',
          message: config.site_config?.maintenance_message || 'System under maintenance'
        })
        return
      }
    })

    server.addHook('preHandler', (request, reply, done) => {
      const publicPaths = ['/health', '/api/auth/login', '/api/rates', '/api/test']
      const isPublicPath = publicPaths.some(path => request.routerPath?.startsWith(path))
      
      if (!isPublicPath && request.routerPath && !['/api/auth/login', '/health'].includes(request.routerPath)) {
        if (!request.headers.authorization) {
          reply.status(401).send({ error: 'Unauthorized', message: 'Missing Authorization header' })
          return
        }
      }
      done()
    })

    server.setErrorHandler((error, request, reply) => {
      server.log.error(error)
      reply.status(500).send({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      })
    })

    server.addHook('onClose', async () => {
      if (telegramBotService) {
        await telegramBotService.stop()
      }
    })

    return server
  } catch (error) {
    server.log.error(`Error building application: ${error}`)
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
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { 
  IExchangeRateRepository, 
  INotificationSubscriberRepository,
  IAdminConfigRepository,
  IAlertNotificationRepository
} from '@/domain/repositories'
import type { 
  ScrapingUseCase, 
  NotificationUseCase,
  AdminConfigUseCase
} from '@/application/use-cases'

export async function registerRateRoutes(
  fastify: FastifyInstance,
  scrapingUseCase: ScrapingUseCase
) {
  fastify.get('/api/rates/current', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const rates = await scrapingUseCase.execute()
      return reply.send(rates)
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  fastify.get('/api/rates/history', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = request.query as any
      // Implementation would use exchangeRateRepository
      return reply.send({ data: [], total: 0 })
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}

export async function registerSubscriptionRoutes(
  fastify: FastifyInstance,
  notificationUseCase: NotificationUseCase
) {
  fastify.post('/api/subscriptions', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const subscription = request.body as any
      // Implementation would use subscriberRepository
      return reply.status(201).send(subscription)
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  fastify.put('/api/subscriptions/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string }
      const subscription = request.body as any
      // Implementation would use subscriberRepository
      return reply.send(subscription)
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}

export async function registerNotificationRoutes(
  fastify: FastifyInstance,
  notificationUseCase: NotificationUseCase
) {
  fastify.get('/api/notifications', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = request.query as any
      const notifications = await notificationUseCase.createNotification({
        subscriber_id: params.subscriberId || '',
        type: 'price_change',
        message: 'Test notification',
        is_read: false
      })
      return reply.send([notifications])
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  fastify.patch('/api/notifications/:id/read', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string }
      // Implementation would mark notification as read
      return reply.status(204).send()
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}

export async function registerConfigRoutes(
  fastify: FastifyInstance,
  adminConfigUseCase: AdminConfigUseCase
) {
  fastify.get('/api/config', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const config = await adminConfigUseCase.getConfig()
      return reply.send(config)
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  fastify.put('/api/config', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const configUpdate = request.body as any
      const config = await adminConfigUseCase.updateConfig(configUpdate)
      return reply.send(config)
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}

export async function registerAuthRoutes(
  fastify: FastifyInstance,
  adminConfigUseCase: AdminConfigUseCase
) {
  fastify.post('/api/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { username, password } = request.body as { username: string; password: string }
      const isValid = await adminConfigUseCase.validateAdminCredentials(username, password)
      
      if (isValid) {
        const token = Buffer.from(`${username}:${Date.now()}`).toString('base64')
        return reply.send({ token, user: { username } })
      } else {
        return reply.status(401).send({ error: 'Invalid credentials' })
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  fastify.post('/api/auth/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      return reply.send({ success: true })
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  fastify.get('/api/auth/verify', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      return reply.send({ valid: true })
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}
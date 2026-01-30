import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { IExchangeRateRepository, INotificationSubscriberRepository, IAlertNotificationRepository } from '@/domain/repositories'
import type { ScrapingUseCase } from '@/application/use-cases/scraping'
import type { NotificationUseCase } from '@/application/use-cases/notification'
import type { AdminConfigUseCase } from '@/application/use-cases/admin'

export async function registerRateRoutes(
  fastify: FastifyInstance,
  scrapingUseCase: ScrapingUseCase,
  exchangeRateRepository: IExchangeRateRepository
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
      const { startDate, endDate, rateType, limit, offset } = request.query as {
        startDate?: string
        endDate?: string
        rateType?: 'official' | 'parallel'
        limit?: number
        offset?: number
      }
      const rates = await exchangeRateRepository.getHistoricalRates({
        startDate,
        endDate,
        rateType,
        limit,
        offset,
      })
      return reply.send(rates)
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}

export async function registerSubscriptionRoutes(
  fastify: FastifyInstance,
  notificationUseCase: NotificationUseCase,
  subscriberRepository: INotificationSubscriberRepository
) {
  // POST /api/subscriptions - Create a new subscription
  fastify.post('/api/subscriptions', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { user_identifier, platform, push_subscription_data } = request.body as {
        user_identifier: string
        platform: 'telegram' | 'web_push'
        push_subscription_data?: any
      }

      // Validate required fields
      if (!user_identifier || !platform) {
        return reply.status(400).send({ 
          error: 'Bad Request', 
          message: 'user_identifier and platform are required' 
        })
      }

      // Check if subscriber already exists
      const existingSubscribers = await subscriberRepository.getActiveSubscribers()
      const existingSubscriber = existingSubscribers.find(
        sub => sub.user_identifier === user_identifier && sub.platform === platform
      )

      if (existingSubscriber) {
        return reply.status(409).send({
          error: 'Conflict',
          message: 'Subscription already exists for this user and platform'
        })
      }

      // Create new subscriber
      const subscriber = await subscriberRepository.createSubscriber({
        user_identifier,
        platform,
        push_subscription_data,
        is_active: true
      })

      // Send welcome notification
      try {
        await notificationUseCase.createNotification({
          subscriber_id: subscriber.id,
          type: 'price_change',
          message: `¡Bienvenido a DollarAlert! 🇧🇴\n\nHas sido suscrito exitosamente. Recibirás notificaciones cuando las tasas de cambio se actualicen.`,
          is_read: false
        })
      } catch (notifyError) {
        fastify.log.warn(`Failed to send welcome notification: ${notifyError}`)
      }

      return reply.status(201).send({
        success: true,
        data: subscriber,
        message: 'Subscription created successfully'
      })
    } catch (error) {
      fastify.log.error(`Error creating subscription: ${error}`)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // PUT /api/subscriptions/:id - Update a subscription
  fastify.put('/api/subscriptions/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string }
      const updateData = request.body as Partial<{
        is_active: boolean
        push_subscription_data: any
      }>

      // Check if subscriber exists
      const existingSubscriber = await subscriberRepository.getSubscriberById(id)
      if (!existingSubscriber) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Subscription not found'
        })
      }

      // Update subscriber
      const updatedSubscriber = await subscriberRepository.updateSubscriber(id, updateData)

      return reply.send({
        success: true,
        data: updatedSubscriber,
        message: 'Subscription updated successfully'
      })
    } catch (error) {
      fastify.log.error(`Error updating subscription: ${error}`)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // GET /api/subscriptions - Get all active subscriptions (admin only)
  fastify.get('/api/subscriptions', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { platform } = request.query as { platform?: 'telegram' | 'web_push' }

      let subscribers
      if (platform) {
        subscribers = await subscriberRepository.getSubscribersByPlatform(platform)
      } else {
        subscribers = await subscriberRepository.getActiveSubscribers()
      }

      return reply.send({
        success: true,
        data: subscribers,
        count: subscribers.length
      })
    } catch (error) {
      fastify.log.error(`Error fetching subscriptions: ${error}`)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // DELETE /api/subscriptions/:id - Delete a subscription
  fastify.delete('/api/subscriptions/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string }

      // Check if subscriber exists
      const existingSubscriber = await subscriberRepository.getSubscriberById(id)
      if (!existingSubscriber) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Subscription not found'
        })
      }

      // Delete subscriber
      await subscriberRepository.deleteSubscriber(id)

      return reply.send({
        success: true,
        message: 'Subscription deleted successfully'
      })
    } catch (error) {
      fastify.log.error(`Error deleting subscription: ${error}`)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}

export async function registerNotificationRoutes(
  fastify: FastifyInstance,
  notificationUseCase: NotificationUseCase,
  notificationRepository: IAlertNotificationRepository
) {
  // GET /api/notifications - Get notifications for a subscriber
  fastify.get('/api/notifications', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { subscriberId, unreadOnly, limit, offset } = request.query as {
        subscriberId?: string
        unreadOnly?: boolean
        limit?: number
        offset?: number
      }

      if (!subscriberId) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'subscriberId query parameter is required'
        })
      }

      const notifications = await notificationRepository.getNotifications({
        subscriberId,
        unreadOnly: unreadOnly || false,
        limit: limit || 25,
        offset: offset || 0
      })

      // Count unread notifications
      const unreadCount = await notificationRepository.getNotifications({
        subscriberId,
        unreadOnly: true
      }).then(notifs => notifs.length)

      return reply.send({
        success: true,
        data: notifications,
        unreadCount,
        total: notifications.length
      })
    } catch (error) {
      fastify.log.error(`Error fetching notifications: ${error}`)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // PATCH /api/notifications/:id/read - Mark a notification as read
  fastify.patch('/api/notifications/:id/read', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string }

      await notificationRepository.markAsRead(id)

      return reply.send({
        success: true,
        message: 'Notification marked as read'
      })
    } catch (error) {
      fastify.log.error(`Error marking notification as read: ${error}`)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // POST /api/notifications/:id/read-all - Mark all notifications as read for a subscriber
  fastify.post('/api/notifications/read-all', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { subscriberId } = request.body as { subscriberId: string }

      if (!subscriberId) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'subscriberId is required'
        })
      }

      await notificationRepository.markAllAsRead(subscriberId)

      return reply.send({
        success: true,
        message: 'All notifications marked as read'
      })
    } catch (error) {
      fastify.log.error(`Error marking all notifications as read: ${error}`)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // POST /api/notifications/send - Send a test notification (admin only)
  fastify.post('/api/notifications/send', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { subscriberId, message, type } = request.body as {
        subscriberId: string
        message: string
        type: 'price_change' | 'threshold_alert'
      }

      if (!subscriberId || !message || !type) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'subscriberId, message, and type are required'
        })
      }

      const notification = await notificationUseCase.createNotification({
        subscriber_id: subscriberId,
        type,
        message,
        is_read: false
      })

      return reply.status(201).send({
        success: true,
        data: notification,
        message: 'Notification sent successfully'
      })
    } catch (error) {
      fastify.log.error(`Error sending notification: ${error}`)
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
        const token = fastify.jwt.sign({ username })
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
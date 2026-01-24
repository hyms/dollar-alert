import type { INotificationSubscriberRepository, IAlertNotificationRepository } from '@/domain/repositories'
import type { ExchangeRate, AlertNotification } from '@/domain/entities'

export interface INotificationUseCase {
  notifyPriceChange(rates: ExchangeRate[]): Promise<void>
  notifyThresholdAlert(rate: ExchangeRate, threshold: number): Promise<void>
  createNotification(notification: Omit<AlertNotification, 'id' | 'created_at'>): Promise<AlertNotification>
}

export class NotificationUseCase implements INotificationUseCase {
  constructor(
    private subscriberRepository: INotificationSubscriberRepository,
    private notificationRepository: IAlertNotificationRepository,
    private notificationManager: INotificationManager
  ) {}

  async notifyPriceChange(rates: ExchangeRate[]): Promise<void> {
    try {
      const subscribers = await this.subscriberRepository.getActiveSubscribers()
      
      for (const rate of rates) {
        const relevantSubscribers = subscribers.filter(sub => 
          sub.is_active && (sub.user_identifier !== null || sub.push_subscription_data)
        )

        for (const subscriber of relevantSubscribers) {
          const message = this.formatPriceChangeMessage(rate)
          
          await this.notificationManager.sendNotification(subscriber, {
            type: 'price_change',
            message
          })

          await this.notificationRepository.createNotification({
            subscriber_id: subscriber.id,
            type: 'price_change',
            message,
            is_read: false
          })
        }
      }
    } catch (error) {
      console.error('Error in price change notification:', error)
      throw error
    }
  }

  async notifyThresholdAlert(rate: ExchangeRate, threshold: number): Promise<void> {
    try {
      const subscribers = await this.subscriberRepository.getActiveSubscribers()
      
      for (const subscriber of subscribers) {
        const message = this.formatThresholdMessage(rate, threshold)
        
        await this.notificationManager.sendNotification(subscriber, {
          type: 'threshold_alert',
          message
        })

        await this.notificationRepository.createNotification({
          subscriber_id: subscriber.id,
          type: 'threshold_alert',
          message,
          is_read: false
        })
      }
    } catch (error) {
      console.error('Error in threshold alert notification:', error)
      throw error
    }
  }

  async createNotification(notification: Omit<AlertNotification, 'id' | 'created_at'>): Promise<AlertNotification> {
    return await this.notificationRepository.createNotification(notification)
  }

  private formatPriceChangeMessage(rate: ExchangeRate): string {
    const emoji = rate.change_24h >= 0 ? '📈' : '📉'
    const changeText = rate.change_24h >= 0 ? 'subió' : 'bajó'
    const changePercent = Math.abs(rate.change_percentage_24h).toFixed(2)
    
    return `${emoji} Dólar ${rate.type === 'official' ? 'Oficial' : 'Paralelo'} ${changeText} ${changePercent}%\n` +
           `💰 Compra: Bs. ${rate.buy_price.toFixed(3)}\n` +
           `💸 Venta: Bs. ${rate.sell_price.toFixed(3)}\n` +
           `📊 Promedio: Bs. ${rate.average_price.toFixed(3)}`
  }

  private formatThresholdMessage(rate: ExchangeRate, threshold: number): string {
    return `🚨 ¡ALERTA DE UMBRAL! 🚨\n` +
           `El dólar ${rate.type === 'official' ? 'Oficial' : 'Paralelo'} ha superado el umbral del ${threshold}%\n` +
           `📈 Variación: ${rate.change_percentage_24h.toFixed(2)}%\n` +
           `💰 Compra: Bs. ${rate.buy_price.toFixed(3)}\n` +
           `💸 Venta: Bs. ${rate.sell_price.toFixed(3)}`
  }
}

export interface INotificationManager {
  sendNotification(subscriber: any, notification: { type: string; message: string }): Promise<void>
}
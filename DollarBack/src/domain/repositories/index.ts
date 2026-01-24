import type { ExchangeRate, HistoricalRate, NotificationSubscriber, ScrapingSource, AdminConfig, AlertNotification } from '../entities'

export interface IExchangeRateRepository {
  getCurrentRates(): Promise<ExchangeRate[]>
  getHistoricalRates(params: {
    startDate?: string
    endDate?: string
    rateType?: 'official' | 'parallel'
    limit?: number
    offset?: number
  }): Promise<{ data: HistoricalRate[]; total: number }>
  saveRate(rate: Omit<ExchangeRate, 'id' | 'last_updated'>): Promise<ExchangeRate>
  saveHistoricalRate(rate: Omit<HistoricalRate, 'id' | 'recorded_at'>): Promise<HistoricalRate>
}

export interface INotificationSubscriberRepository {
  createSubscriber(subscriber: Omit<NotificationSubscriber, 'id' | 'created_at' | 'updated_at'>): Promise<NotificationSubscriber>
  updateSubscriber(id: string, subscriber: Partial<NotificationSubscriber>): Promise<NotificationSubscriber>
  deleteSubscriber(id: string): Promise<void>
  getSubscriberById(id: string): Promise<NotificationSubscriber | null>
  getActiveSubscribers(): Promise<NotificationSubscriber[]>
  getSubscribersByPlatform(platform: 'telegram' | 'web_push'): Promise<NotificationSubscriber[]>
}

export interface IScrapingSourceRepository {
  createSource(source: Omit<ScrapingSource, 'id' | 'created_at'>): Promise<ScrapingSource>
  updateSource(id: string, source: Partial<ScrapingSource>): Promise<ScrapingSource>
  deleteSource(id: string): Promise<void>
  getActiveSources(): Promise<ScrapingSource[]>
  getAllSources(): Promise<ScrapingSource[]>
  getSourceById(id: string): Promise<ScrapingSource | null>
}

export interface IAdminConfigRepository {
  getConfig(): Promise<AdminConfig | null>
  updateConfig(config: Partial<AdminConfig>): Promise<AdminConfig>
  updateScrapingSources(sources: ScrapingSource[]): Promise<void>
}

export interface IAlertNotificationRepository {
  createNotification(notification: Omit<AlertNotification, 'id' | 'created_at'>): Promise<AlertNotification>
  markAsRead(notificationId: string): Promise<void>
  getNotifications(params?: {
    subscriberId?: string
    unreadOnly?: boolean
    limit?: number
    offset?: number
  }): Promise<AlertNotification[]>
  markAllAsRead(subscriberId?: string): Promise<void>
}
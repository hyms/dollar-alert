import type { SupabaseClient } from '@supabase/supabase-js'
import type { 
  IExchangeRateRepository, 
  INotificationSubscriberRepository,
  IAdminConfigRepository,
  IAlertNotificationRepository
} from '@/domain/repositories'
import type { 
  ExchangeRate, 
  HistoricalRate, 
  NotificationSubscriber, 
  ScrapingSource, 
  AdminConfig,
  AlertNotification
} from '@/domain/entities'

export class SupabaseExchangeRateRepository implements IExchangeRateRepository {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async getCurrentRates(): Promise<ExchangeRate[]> {
    const { data, error } = await this.supabase
      .from('exchange_rates')
      .select('*')
      .order('last_updated', { ascending: false })
      .limit(10)

    if (error) throw error
    return data as ExchangeRate[]
  }

  async getHistoricalRates(params: {
    startDate?: string
    endDate?: string
    rateType?: 'official' | 'parallel'
    limit?: number
    offset?: number
  }): Promise<{ data: HistoricalRate[]; total: number }> {
    let query = this.supabase
      .from('exchange_rates_history')
      .select('*', { count: 'exact' })

    if (params.startDate) query = query.gte('recorded_at', params.startDate)
    if (params.endDate) query = query.lte('recorded_at', params.endDate)
    if (params.rateType) query = query.eq('rate_type', params.rateType)

    if (params.offset) query = query.range(params.offset, params.offset! + (params.limit || 25) - 1)
    else if (params.limit) query = query.limit(params.limit)

    query = query.order('recorded_at', { ascending: false })

    const { data, error, count } = await query

    if (error) throw error
    return { data: data as HistoricalRate[], total: count || 0 }
  }

  async saveRate(rate: Omit<ExchangeRate, 'id' | 'last_updated'>): Promise<ExchangeRate> {
    const { data, error } = await this.supabase
      .from('exchange_rates')
      .upsert({
        ...rate,
        last_updated: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data as ExchangeRate
  }

  async saveHistoricalRate(rate: Omit<HistoricalRate, 'id' | 'recorded_at'>): Promise<HistoricalRate> {
    const { data, error } = await this.supabase
      .from('exchange_rates_history')
      .insert({
        ...rate,
        recorded_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data as HistoricalRate
  }
}

export class SupabaseNotificationSubscriberRepository implements INotificationSubscriberRepository {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async createSubscriber(subscriber: Omit<NotificationSubscriber, 'id' | 'created_at' | 'updated_at'>): Promise<NotificationSubscriber> {
    const { data, error } = await this.supabase
      .from('notification_subscribers')
      .insert({
        ...subscriber,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data as NotificationSubscriber
  }

  async updateSubscriber(id: string, subscriber: Partial<NotificationSubscriber>): Promise<NotificationSubscriber> {
    const { data, error } = await this.supabase
      .from('notification_subscribers')
      .update({
        ...subscriber,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as NotificationSubscriber
  }

  async deleteSubscriber(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('notification_subscribers')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async getSubscriberById(id: string): Promise<NotificationSubscriber | null> {
    const { data, error } = await this.supabase
      .from('notification_subscribers')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data as NotificationSubscriber || null
  }

  async getActiveSubscribers(): Promise<NotificationSubscriber[]> {
    const { data, error } = await this.supabase
      .from('notification_subscribers')
      .select('*')
      .eq('is_active', true)

    if (error) throw error
    return data as NotificationSubscriber[]
  }

  async getSubscribersByPlatform(platform: 'telegram' | 'web_push'): Promise<NotificationSubscriber[]> {
    const { data, error } = await this.supabase
      .from('notification_subscribers')
      .select('*')
      .eq('platform', platform)
      .eq('is_active', true)

    if (error) throw error
    return data as NotificationSubscriber[]
  }
}

export class SupabaseAdminConfigRepository implements IAdminConfigRepository {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async getConfig(): Promise<AdminConfig | null> {
    const { data, error } = await this.supabase
      .from('admin_configs')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data as AdminConfig || null
  }

  async updateConfig(config: Partial<AdminConfig>): Promise<AdminConfig> {
    const { data, error } = await this.supabase
      .from('admin_configs')
      .upsert({
        ...config,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data as AdminConfig
  }

  async updateScrapingSources(sources: ScrapingSource[]): Promise<void> {
    const config = await this.getConfig()
    if (!config) {
      throw new Error('No configuration found to update scraping sources')
    }

    await this.updateConfig({
      ...config,
      scraping_sources: sources
    })
  }
}

export class SupabaseAlertNotificationRepository implements IAlertNotificationRepository {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async createNotification(notification: Omit<AlertNotification, 'id' | 'created_at'>): Promise<AlertNotification> {
    const { data, error } = await this.supabase
      .from('alert_notifications')
      .insert({
        ...notification,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data as AlertNotification
  }

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('alert_notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    if (error) throw error
  }

  async getNotifications(params?: {
    subscriberId?: string
    unreadOnly?: boolean
    limit?: number
    offset?: number
  }): Promise<AlertNotification[]> {
    let query = this.supabase
      .from('alert_notifications')
      .select('*')

    if (params?.subscriberId) query = query.eq('subscriber_id', params.subscriberId)
    if (params?.unreadOnly) query = query.eq('is_read', false)

    query = query.order('created_at', { ascending: false })

    if (params?.limit) query = query.limit(params.limit)
    if (params?.offset) query = query.range(params.offset, params.offset + (params.limit || 25) - 1)

    const { data, error } = await query
    if (error) throw error
    return data as AlertNotification[]
  }

  async markAllAsRead(subscriberId?: string): Promise<void> {
    let query = this.supabase
      .from('alert_notifications')
      .update({ is_read: true })

    if (subscriberId) query = query.eq('subscriber_id', subscriberId)

    const { error } = await query
    if (error) throw error
  }
}
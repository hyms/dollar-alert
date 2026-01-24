import api from './index'
import type { ExchangeRate, HistoricalRate, UserSubscription, AlertNotification, SiteConfig } from '@/types'

export const exchangeRatesApi = {
  getCurrentRates: async (): Promise<ExchangeRate[]> => {
    const response = await api.get('/api/rates/current')
    return response.data
  },

  getHistoricalRates: async (params?: {
    startDate?: string
    endDate?: string
    rateType?: 'official' | 'parallel'
    limit?: number
    offset?: number
  }): Promise<{ data: HistoricalRate[]; total: number }> => {
    const response = await api.get('/api/rates/history', { params })
    return response.data
  },

  getRateById: async (id: string): Promise<ExchangeRate> => {
    const response = await api.get(`/api/rates/${id}`)
    return response.data
  }
}

export const subscriptionsApi = {
  createSubscription: async (subscription: Partial<UserSubscription>): Promise<UserSubscription> => {
    const response = await api.post('/api/subscriptions', subscription)
    return response.data
  },

  updateSubscription: async (id: string, subscription: Partial<UserSubscription>): Promise<UserSubscription> => {
    const response = await api.put(`/api/subscriptions/${id}`, subscription)
    return response.data
  },

  deleteSubscription: async (id: string): Promise<void> => {
    await api.delete(`/api/subscriptions/${id}`)
  },

  getUserSubscriptions: async (userId?: string): Promise<UserSubscription[]> => {
    const url = userId ? `/api/subscriptions?user_id=${userId}` : '/api/subscriptions'
    const response = await api.get(url)
    return response.data
  }
}

export const notificationsApi = {
  getNotifications: async (userId?: string, unreadOnly?: boolean): Promise<AlertNotification[]> => {
    const params: any = {}
    if (userId) params.user_id = userId
    if (unreadOnly) params.unread_only = true
    
    const response = await api.get('/api/notifications', { params })
    return response.data
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    await api.patch(`/api/notifications/${notificationId}/read`)
  },

  markAllAsRead: async (userId?: string): Promise<void> => {
    const url = userId ? `/api/notifications/read-all?user_id=${userId}` : '/api/notifications/read-all'
    await api.patch(url)
  }
}

export const configApi = {
  getSiteConfig: async (): Promise<SiteConfig> => {
    const response = await api.get('/api/config')
    return response.data
  },

  updateSiteConfig: async (config: Partial<SiteConfig>): Promise<SiteConfig> => {
    const response = await api.put('/api/config', config)
    return response.data
  }
}

export const authApi = {
  login: async (credentials: { username: string; password: string }): Promise<{ token: string; user: any }> => {
    const response = await api.post('/api/auth/login', credentials)
    return response.data
  },

  logout: async (): Promise<void> => {
    await api.post('/api/auth/logout')
  },

  refreshToken: async (): Promise<{ token: string }> => {
    const response = await api.post('/api/auth/refresh')
    return response.data
  },

  verifyToken: async (): Promise<{ valid: boolean; user?: any }> => {
    const response = await api.get('/api/auth/verify')
    return response.data
  }
}
import type { IAdminConfigRepository } from '@/domain/repositories'
import type { AdminConfig, ScrapingSource } from '@/domain/entities'
import bcrypt from 'bcryptjs'

export interface IAdminConfigUseCase {
  getConfig(): Promise<AdminConfig | null>
  updateConfig(config: Partial<AdminConfig>): Promise<AdminConfig>
  updateScrapingSources(sources: ScrapingSource[]): Promise<void>
  validateAdminCredentials(username: string, password: string): Promise<boolean>
  setMaintenanceMode(enabled: boolean, message?: string): Promise<void>
}

export class AdminConfigUseCase implements IAdminConfigUseCase {
  constructor(private adminConfigRepository: IAdminConfigRepository) {}

  async getConfig(): Promise<AdminConfig | null> {
    return await this.adminConfigRepository.getConfig()
  }

  async updateConfig(config: Partial<AdminConfig>): Promise<AdminConfig> {
    const currentConfig = await this.adminConfigRepository.getConfig()
    
    if (!currentConfig) {
      throw new Error('No configuration found')
    }

    const updatedConfig: AdminConfig = {
      ...currentConfig,
      ...config,
      updated_at: new Date().toISOString()
    }

    if (config.admin_username && config.admin_password) {
      updatedConfig.admin_password_hash = await bcrypt.hash(config.admin_password, 10)
    }

    return await this.adminConfigRepository.updateConfig(updatedConfig)
  }

  async updateScrapingSources(sources: ScrapingSource[]): Promise<void> {
    await this.adminConfigRepository.updateScrapingSources(sources)
  }

  async validateAdminCredentials(username: string, password: string): Promise<boolean> {
    const config = await this.adminConfigRepository.getConfig()
    
    if (!config) {
      return false
    }

    const isValidUsername = username === config.admin_username
    const isValidPassword = await bcrypt.compare(password, config.admin_password_hash)
    
    return isValidUsername && isValidPassword
  }

  async setMaintenanceMode(enabled: boolean, message?: string): Promise<void> {
    const config = await this.adminConfigRepository.getConfig()
    
    if (!config) {
      throw new Error('No configuration found')
    }

    await this.adminConfigRepository.updateConfig({
      ...config,
      maintenance_mode: enabled,
      site_config: {
        ...config.site_config,
        maintenance_message: message || config.site_config.maintenance_message
      },
      updated_at: new Date().toISOString()
    })
  }
}
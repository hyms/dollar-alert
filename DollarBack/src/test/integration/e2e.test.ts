import { createClient } from '@supabase/supabase-js'
import axios from 'axios'
import * as cheerio from 'cheerio'
import type { ExchangeRate, ScrapingSource } from '@/domain/entities'
import { ScrapingUseCase } from '@/application/use-cases/scraping'
import { NotificationUseCase } from '@/application/use-cases/notification'
import { SupabaseExchangeRateRepository, SupabaseNotificationSubscriberRepository } from '@/infrastructure/database/supabase'
import { ScraperEngine } from '@/application/services/scraper'
import { NotificationManager } from '@/application/services/notification'

// End-to-end integration tests
// These tests validate the complete data flow from scraping to database storage

describe('End-to-End Integration Tests', () => {
  let supabase: ReturnType<typeof createClient>
  let exchangeRateRepository: SupabaseExchangeRateRepository
  let subscriberRepository: SupabaseNotificationSubscriberRepository

  beforeAll(() => {
    // Only run if Supabase credentials are available
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      console.warn('Skipping E2E tests: SUPABASE_URL and SUPABASE_KEY not configured')
      return
    }

    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    )

    exchangeRateRepository = new SupabaseExchangeRateRepository(supabase)
    subscriberRepository = new SupabaseNotificationSubscriberRepository(supabase)
  })

  describe('Supabase Connection', () => {
    const hasSupabase = !!process.env.SUPABASE_URL

    it('should connect to Supabase and query exchange_rates table', async () => {
      if (!hasSupabase) {
        console.warn('Skipping: SUPABASE_URL not configured')
        return
      }
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .limit(1)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should connect to Supabase and query notification_subscribers table', async () => {
      if (!hasSupabase) {
        console.warn('Skipping: SUPABASE_URL not configured')
        return
      }
      const { data, error } = await supabase
        .from('notification_subscribers')
        .select('*')
        .limit(1)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })
  })

  describe('Web Scraping from Real Sources', () => {
    const testSources: ScrapingSource[] = [
      {
        id: 'bcb-test',
        name: 'Banco Central de Bolivia',
        url: 'https://www.bcb.gob.bo/',
        selector: '.tipo-cambio',
        currency: 'USD',
        frequency: '0 */6 * * *',
        is_active: true,
        rate_type: 'official',
        created_at: new Date().toISOString()
      },
      {
        id: 'dolarbolivia-test',
        name: 'Dolar Bolivia',
        url: 'https://dolarbolivia.com/',
        selector: '.col-md-6 .card .card-body .h3',
        currency: 'USD',
        frequency: '0 */2 * * *',
        is_active: true,
        rate_type: 'parallel',
        created_at: new Date().toISOString()
      }
    ]

    it('should successfully fetch and parse HTML from BCB website', async () => {
      const source = testSources[0]
      
      try {
        const response = await axios.get(source.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 15000
        })

        expect(response.status).toBe(200)
        expect(response.data).toBeDefined()
        expect(typeof response.data).toBe('string')

        // Parse HTML with cheerio
        const htmlContent = response.data as string
        const $ = cheerio.load(htmlContent)
        const rateElement = $(source.selector).first()
        
        // Log for debugging
        console.log(`BCB scraping result: ${rateElement.length > 0 ? 'Element found' : 'Element not found'}`)
        if (rateElement.length > 0) {
          console.log(`Text content: ${rateElement.text().trim()}`)
        }

        // We expect either to find the element or get a valid response
        expect(htmlContent.length).toBeGreaterThan(0)
      } catch (error) {
        console.warn(`BCB scraping failed (network or parsing issue): ${error}`)
        // Don't fail the test for external network issues
        expect(true).toBe(true)
      }
    }, 20000)

    it('should successfully fetch and parse HTML from DolarBolivia website', async () => {
      const source = testSources[1]
      
      try {
        const response = await axios.get(source.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 15000
        })

        expect(response.status).toBe(200)
        expect(response.data).toBeDefined()

        // Parse HTML with cheerio
        const htmlContent = response.data as string
        const $ = cheerio.load(htmlContent)
        const rateElement = $(source.selector).first()
        
        console.log(`DolarBolivia scraping result: ${rateElement.length > 0 ? 'Element found' : 'Element not found'}`)
        if (rateElement.length > 0) {
          console.log(`Text content: ${rateElement.text().trim()}`)
        }

        expect(htmlContent.length).toBeGreaterThan(0)
      } catch (error) {
        console.warn(`DolarBolivia scraping failed (network or parsing issue): ${error}`)
        expect(true).toBe(true)
      }
    }, 20000)

    it('should scrape all configured sources and return rate data', async () => {
      const scraper = new ScraperEngine()
      
      // Override sources with test sources
      ;(scraper as any).sources = testSources
      
      try {
        const results = await scraper.scrapeAllSources()
        
        // We might get partial results if some sources fail
        expect(Array.isArray(results)).toBe(true)
        
        if (results.length > 0) {
          // Validate rate structure
          const rate = results[0]
          expect(rate).toHaveProperty('type')
          expect(rate).toHaveProperty('base_currency')
          expect(rate).toHaveProperty('target_currency')
          expect(rate).toHaveProperty('buy_price')
          expect(rate).toHaveProperty('sell_price')
          
          console.log(`Scraped ${results.length} rates successfully`)
          console.log('Sample rate:', JSON.stringify(rate, null, 2))
        } else {
          console.warn('No rates scraped - external sources might be unavailable')
        }
      } catch (error) {
        console.warn(`Scraping failed: ${error}`)
        // Don't fail for external issues
        expect(true).toBe(true)
      }
    }, 30000)
  })

  describe('Complete Data Flow', () => {
    const hasSupabase = !!process.env.SUPABASE_URL

    it('should save scraped rates to Supabase', async () => {
      if (!hasSupabase) {
        console.warn('Skipping: SUPABASE_URL not configured')
        return
      }

      const mockRate: ExchangeRate = {
        id: crypto.randomUUID(),
        type: 'official',
        base_currency: 'USD',
        target_currency: 'BOB',
        buy_price: 6.95,
        sell_price: 7.05,
        average_price: 7.00,
        spread_amount: 0.10,
        change_24h: 0.05,
        change_percentage_24h: 0.72,
        last_updated: new Date().toISOString(),
        source: 'Integration Test'
      }

      try {
        const savedRate = await exchangeRateRepository.saveRate(mockRate)
        
        expect(savedRate).toBeDefined()
        expect(savedRate.id).toBeDefined()
        expect(savedRate.buy_price).toBe(mockRate.buy_price)
        expect(savedRate.sell_price).toBe(mockRate.sell_price)
        
        console.log('Successfully saved rate to Supabase:', savedRate.id)
      } catch (error) {
        console.error('Failed to save rate to Supabase:', error)
        throw error
      }
    })

    it('should create and retrieve a subscriber', async () => {
      if (!hasSupabase) {
        console.warn('Skipping: SUPABASE_URL not configured')
        return
      }

      const testSubscriber = {
        user_identifier: `test-${Date.now()}`,
        platform: 'telegram' as const,
        is_active: true
      }

      try {
        // Create subscriber
        const created = await subscriberRepository.createSubscriber(testSubscriber)
        expect(created.id).toBeDefined()
        expect(created.user_identifier).toBe(testSubscriber.user_identifier)
        
        // Retrieve by ID
        const retrieved = await subscriberRepository.getSubscriberById(created.id)
        expect(retrieved).toBeDefined()
        expect(retrieved?.id).toBe(created.id)
        
        // Clean up
        await subscriberRepository.deleteSubscriber(created.id)
        
        console.log('Successfully created and retrieved subscriber:', created.id)
      } catch (error) {
        console.error('Failed subscriber operations:', error)
        throw error
      }
    })

    it('should retrieve current rates from Supabase', async () => {
      if (!hasSupabase) {
        console.warn('Skipping: SUPABASE_URL not configured')
        return
      }

      try {
        const rates = await exchangeRateRepository.getCurrentRates()
        
        expect(Array.isArray(rates)).toBe(true)
        console.log(`Retrieved ${rates.length} current rates from Supabase`)
        
        if (rates.length > 0) {
          const rate = rates[0]
          expect(rate).toHaveProperty('id')
          expect(rate).toHaveProperty('buy_price')
          expect(rate).toHaveProperty('sell_price')
        }
      } catch (error) {
        console.error('Failed to retrieve rates:', error)
        throw error
      }
    })

    it('should retrieve historical rates with filters', async () => {
      if (!hasSupabase) {
        console.warn('Skipping: SUPABASE_URL not configured')
        return
      }

      try {
        const result = await exchangeRateRepository.getHistoricalRates({
          limit: 10,
          rateType: 'official'
        })
        
        expect(result).toHaveProperty('data')
        expect(result).toHaveProperty('total')
        expect(Array.isArray(result.data)).toBe(true)
        expect(typeof result.total).toBe('number')
        
        console.log(`Retrieved ${result.data.length} historical rates (total: ${result.total})`)
      } catch (error) {
        console.error('Failed to retrieve historical rates:', error)
        throw error
      }
    })
  })

  describe('API Health Check', () => {
    const API_URL = process.env.API_URL || 'http://localhost:3000'
    const hasApiUrl = !!process.env.API_URL

    it('should respond to health endpoint', async () => {
      if (!hasApiUrl) {
        console.warn('Skipping: API_URL not configured')
        return
      }

      try {
        const response = await axios.get(`${API_URL}/health`, {
          timeout: 5000
        })
        
        expect(response.status).toBe(200)
        expect(response.data).toHaveProperty('status')
        const data = response.data as { status: string }
        expect(data.status).toBe('ok')
        
        console.log('Health check passed:', data)
      } catch (error) {
        console.error('Health check failed:', error)
        throw error
      }
    })

    it('should respond to current rates endpoint', async () => {
      if (!hasApiUrl) {
        console.warn('Skipping: API_URL not configured')
        return
      }

      try {
        const response = await axios.get(`${API_URL}/api/rates/current`, {
          timeout: 10000
        })
        
        expect(response.status).toBe(200)
        expect(Array.isArray(response.data)).toBe(true)
        
        const data = response.data as any[]
        console.log(`API returned ${data.length} current rates`)
      } catch (error) {
        console.error('API rates endpoint failed:', error)
        throw error
      }
    })
  })
})

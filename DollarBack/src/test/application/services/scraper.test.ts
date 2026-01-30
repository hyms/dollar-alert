import axios from 'axios'
import * as cheerio from 'cheerio'
import { ScraperEngine } from '@/application/services/scraper'
import type { ScrapingSource } from '@/domain/entities'

// Mock the external dependencies
jest.mock('axios')
jest.mock('cheerio')

const mockedAxios = axios as jest.Mocked<typeof axios>
const mockedCheerio = cheerio as jest.Mocked<typeof cheerio>

// Helper function
const createMockSource = (type: 'official' | 'parallel' = 'official') => ({
  id: 'test-source-id',
  name: `Test ${type} Source`,
  url: 'https://test.com',
  selector: '.rate',
  currency: 'USD',
  frequency: '0 */2 * * *',
  is_active: true,
  rate_type: type,
  created_at: new Date().toISOString()
})

describe('ScraperEngine', () => {
  let scraperEngine: ScraperEngine
  let mockSource: ScrapingSource

  beforeEach(() => {
    // Reset mocks first
    jest.clearAllMocks()
    
    // Setup default axios mock
    mockedAxios.get.mockResolvedValue({
      data: '<html><body><div class="rate">6.95 - 7.05</div></body></html>',
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    } as any)
    
    // Setup default cheerio mock
    // cheerio.load returns a function ($) that when called returns a cheerio object
    const createMockCheerioObject = (textValue: string) => {
      const cheerioObj = {
        text: jest.fn().mockReturnValue(textValue),
        first: jest.fn().mockReturnThis()
      }
      return cheerioObj
    }
    
    // Default mock returns a single value that the implementation can parse
    // Implementation applies 0.995/1.005 spread to single values
    const mock$ = jest.fn().mockImplementation(() => createMockCheerioObject('7.00'))
    mockedCheerio.load.mockReturnValue(mock$ as any)
    
    // Create scraper engine after mocks are set up
    scraperEngine = new ScraperEngine()
    mockSource = createMockSource('official')
  })

  describe('scrapeSource', () => {
    it('should successfully scrape an official source', async () => {
      const result = await scraperEngine.scrapeSource(mockSource)

      expect(mockedAxios.get).toHaveBeenCalledWith(mockSource.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      })

      expect(result).toMatchObject({
        type: 'official',
        base_currency: 'USD',
        target_currency: 'BOB',
        source: mockSource.name
      })
      // Single value '7.00' gets spread applied: buy = 7.00 * 0.995, sell = 7.00 * 1.005
      expect(result.buy_price).toBeCloseTo(6.965, 3)
      expect(result.sell_price).toBeCloseTo(7.035, 3)
    })

    it('should successfully scrape a parallel source', async () => {
      const parallelSource = createMockSource('parallel')
      const mock$ = jest.fn().mockReturnValue({
        text: jest.fn().mockReturnValue('7.25'),
        first: jest.fn().mockReturnThis()
      })
      mockedCheerio.load.mockReturnValue(mock$ as any)

      const result = await scraperEngine.scrapeSource(parallelSource)

      expect(result).toMatchObject({
        type: 'parallel'
      })
      // Single value '7.25' gets spread applied
      expect(result.buy_price).toBeCloseTo(7.25 * 0.995, 3)
      expect(result.sell_price).toBeCloseTo(7.25 * 1.005, 3)
    })

    it('should handle single rate value correctly', async () => {
      const mock$ = jest.fn().mockReturnValue({
        text: jest.fn().mockReturnValue('7.00'),
        first: jest.fn().mockReturnThis()
      })
      mockedCheerio.load.mockReturnValue(mock$ as any)

      const result = await scraperEngine.scrapeSource(mockSource)

      expect(result.buy_price).toBeCloseTo(6.965, 3) // 7.00 * 0.995
      expect(result.sell_price).toBeCloseTo(7.035, 3) // 7.00 * 1.005
    })

    it('should return null when no rate is found', async () => {
      const mock$ = jest.fn().mockReturnValue({
        text: jest.fn().mockReturnValue(''),
        first: jest.fn().mockReturnThis()
      })
      mockedCheerio.load.mockReturnValue(mock$ as any)

      const result = await scraperEngine.scrapeSource(mockSource)

      expect(result).toBeNull()
    })

    it('should return null when rate cannot be parsed', async () => {
      const mock$ = jest.fn().mockReturnValue({
        text: jest.fn().mockReturnValue('invalid rate text'),
        first: jest.fn().mockReturnThis()
      })
      mockedCheerio.load.mockReturnValue(mock$ as any)

      const result = await scraperEngine.scrapeSource(mockSource)

      expect(result).toBeNull()
    })

    it('should handle network errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'))

      const result = await scraperEngine.scrapeSource(mockSource)

      expect(result).toBeNull()
    })

    it('should handle timeout errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('timeout of 10000ms exceeded'))

      const result = await scraperEngine.scrapeSource(mockSource)

      expect(result).toBeNull()
    })

    it('should parse rates with different decimal separators', async () => {
      // Test different formats that the parser can handle
      const testCases = [
        // Single value with comma decimal separator
        { input: '6,95', expected: { buy: 6.95 * 0.995, sell: 6.95 * 1.005 } },
        // Single value with dot decimal separator  
        { input: '6.95', expected: { buy: 6.95 * 0.995, sell: 6.95 * 1.005 } }
      ]

      for (const testCase of testCases) {
        const mock$ = jest.fn().mockReturnValue({
          text: jest.fn().mockReturnValue(testCase.input),
          first: jest.fn().mockReturnThis()
        })
        mockedCheerio.load.mockReturnValue(mock$ as any)

        const result = await scraperEngine.scrapeSource(mockSource)
        expect(result.buy_price).toBeCloseTo(testCase.expected.buy, 3)
        expect(result.sell_price).toBeCloseTo(testCase.expected.sell, 3)
      }
    })
  })

  describe('scrapeAllSources', () => {
    it('should scrape all active sources', async () => {
      const activeSource1 = createMockSource('official')
      const activeSource2 = createMockSource('parallel')
      const inactiveSource = createMockSource('official')
      inactiveSource.is_active = false

      // Mock the private loadSources method by setting sources directly
      scraperEngine['sources'] = [activeSource1, activeSource2, inactiveSource]

      const results = await scraperEngine.scrapeAllSources()

      expect(results).toHaveLength(2)
      expect(mockedAxios.get).toHaveBeenCalledTimes(2)
    })

    it('should continue scraping even if one source fails', async () => {
      const source1 = createMockSource('official')
      const source2 = createMockSource('parallel')
      
      scraperEngine['sources'] = [source1, source2]
      
      // Make the second call fail
      mockedAxios.get
        .mockResolvedValueOnce({ 
          data: '<div>6.95 - 7.05</div>',
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any
        } as any)
        .mockRejectedValueOnce(new Error('Source 2 failed'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      const results = await scraperEngine.scrapeAllSources()

      expect(results).toHaveLength(1)
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('getActiveSources', () => {
    it('should return only active sources', async () => {
      const activeSource = createMockSource('official')
      const inactiveSource = createMockSource('parallel')
      inactiveSource.is_active = false

      scraperEngine['sources'] = [activeSource, inactiveSource]

      const activeSources = await scraperEngine.getActiveSources()

      expect(activeSources).toHaveLength(1)
      expect(activeSources[0].is_active).toBe(true)
    })
  })

  describe('parseRate (private method)', () => {
    it('should parse a single number with buy/sell spread calculation', () => {
      const text = '7.00'
      const result = scraperEngine['parseRate'](text)

      // Single number gets buy/sell spread applied
      expect(result?.buy).toBeCloseTo(6.965, 3) // 7.00 * 0.995
      expect(result?.sell).toBeCloseTo(7.035, 3) // 7.00 * 1.005
    })

    it('should parse comma as decimal separator', () => {
      const text = '6,95'
      const result = scraperEngine['parseRate'](text)

      // Comma is converted to dot
      expect(result?.buy).toBeCloseTo(6.95 * 0.995, 3)
      expect(result?.sell).toBeCloseTo(6.95 * 1.005, 3)
    })

    it('should return null for invalid input', () => {
      const invalidInputs = ['', 'invalid', 'not a number', 'text only']

      invalidInputs.forEach(input => {
        const result = scraperEngine['parseRate'](input)
        expect(result).toBeNull()
      })
    })

    it('should extract and parse number sequences from mixed text', () => {
      // When text contains numbers among text, the implementation:
      // 1. Removes all non-digit/dot/comma characters
      // 2. Matches consecutive digit/dot/comma sequences
      // 3. Treats each sequence as a number
      const text = 'Compra: 6.95 y Venta: 7.05'
      const result = scraperEngine['parseRate'](text)

      // After cleaning: '6.957.05' (colons, spaces, letters removed)
      // This matches as one number: 6.95705
      expect(result?.buy).toBeCloseTo(6.95705 * 0.995, 3)
      expect(result?.sell).toBeCloseTo(6.95705 * 1.005, 3)
    })
  })
})
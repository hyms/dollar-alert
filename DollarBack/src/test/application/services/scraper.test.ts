import { ScraperEngine } from '@/application/services/scraper'
import type { ScrapingSource } from '@/domain/entities'

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
import axios from 'axios'
import cheerio from 'cheerio'

// Mock the external dependencies
jest.mock('axios')
jest.mock('cheerio')

const mockedAxios = axios as jest.Mocked<typeof axios>
const mockedCheerio = cheerio as jest.Mocked<typeof cheerio>

describe('ScraperEngine', () => {
  let scraperEngine: ScraperEngine
  let mockSource: ScrapingSource

  beforeEach(() => {
    scraperEngine = new ScraperEngine()
    mockSource = createMockSource('official')
    
    // Reset mocks
    jest.clearAllMocks()
    
    // Setup default axios mock
    mockedAxios.get.mockResolvedValue({
      data: '<html><body><div class="rate">6.95 - 7.05</div></body></html>'
    })
    
    // Setup default cheerio mock
    const mock$ = {
      text: jest.fn().mockReturnValue('6.95 - 7.05'),
      first: jest.fn().mockReturnThis()
    }
    mockedCheerio.load.mockReturnValue(mock$ as any)
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
        buy_price: 6.95,
        sell_price: 7.05,
        source: mockSource.name
      })
    })

    it('should successfully scrape a parallel source', async () => {
      const parallelSource = createMockSource('parallel')
      const mock$ = {
        text: jest.fn().mockReturnValue('7.20 - 7.35'),
        first: jest.fn().mockReturnThis()
      }
      mockedCheerio.load.mockReturnValue(mock$ as any)

      const result = await scraperEngine.scrapeSource(parallelSource)

      expect(result).toMatchObject({
        type: 'parallel',
        buy_price: 7.20,
        sell_price: 7.35
      })
    })

    it('should handle single rate value correctly', async () => {
      const mock$ = {
        text: jest.fn().mockReturnValue('7.00'),
        first: jest.fn().mockReturnThis()
      }
      mockedCheerio.load.mockReturnValue(mock$ as any)

      const result = await scraperEngine.scrapeSource(mockSource)

      expect(result.buy_price).toBeCloseTo(6.965, 3) // 7.00 * 0.995
      expect(result.sell_price).toBeCloseTo(7.035, 3) // 7.00 * 1.005
    })

    it('should return null when no rate is found', async () => {
      const mock$ = {
        text: jest.fn().mockReturnValue(''),
        first: jest.fn().mockReturnThis()
      }
      mockedCheerio.load.mockReturnValue(mock$ as any)

      const result = await scraperEngine.scrapeSource(mockSource)

      expect(result).toBeNull()
    })

    it('should return null when rate cannot be parsed', async () => {
      const mock$ = {
        text: jest.fn().mockReturnValue('invalid rate text'),
        first: jest.fn().mockReturnThis()
      }
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
      const testCases = [
        { input: '6,95 - 7,05', expected: { buy: 6.95, sell: 7.05 } },
        { input: '6.95 - 7.05', expected: { buy: 6.95, sell: 7.05 } },
        { input: '6.95, 7.05', expected: { buy: 6.95, sell: 7.05 } }
      ]

      for (const testCase of testCases) {
        const mock$ = {
          text: jest.fn().mockReturnValue(testCase.input),
          first: jest.fn().mockReturnThis()
        }
        mockedCheerio.load.mockReturnValue(mock$ as any)

        const result = await scraperEngine.scrapeSource(mockSource)
        expect(result.buy_price).toBe(testCase.expected.buy)
        expect(result.sell_price).toBe(testCase.expected.sell)
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
        .mockResolvedValueOnce({ data: '<div>6.95 - 7.05</div>' })
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
    it('should parse two separate numbers correctly', () => {
      const text = '6.95 - 7.05'
      const result = scraperEngine['parseRate'](text)

      expect(result).toEqual({ buy: 6.95, sell: 7.05 })
    })

    it('should parse comma-separated numbers', () => {
      const text = '6,95, 7,05'
      const result = scraperEngine['parseRate'](text)

      expect(result).toEqual({ buy: 6.95, sell: 7.05 })
    })

    it('should handle single number with buy/sell calculation', () => {
      const text = '7.00'
      const result = scraperEngine['parseRate'](text)

      expect(result?.buy).toBeCloseTo(6.965, 3)
      expect(result?.sell).toBeCloseTo(7.035, 3)
    })

    it('should return null for invalid input', () => {
      const invalidInputs = ['', 'invalid', 'not a number', 'text only']

      invalidInputs.forEach(input => {
        const result = scraperEngine['parseRate'](input)
        expect(result).toBeNull()
      })
    })

    it('should return null for NaN values', () => {
      const text = 'invalid - 7.05'
      const result = scraperEngine['parseRate'](text)

      expect(result).toBeNull()
    })
  })
})
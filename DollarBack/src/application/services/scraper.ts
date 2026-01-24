import type { ScrapingSource } from '@/domain/entities'

export interface IScraperEngine {
  scrapeAllSources(): Promise<any[]>
  scrapeSource(source: ScrapingSource): Promise<any | null>
  getActiveSources(): Promise<ScrapingSource[]>
}

export class ScraperEngine implements IScraperEngine {
  private sources: ScrapingSource[] = []

  constructor() {
    this.loadSources()
  }

  async scrapeAllSources(): Promise<any[]> {
    const results: any[] = []
    
    for (const source of this.sources.filter(s => s.is_active)) {
      try {
        const result = await this.scrapeSource(source)
        if (result) {
          results.push(result)
        }
      } catch (error) {
        console.error(`Error scraping source ${source.name}:`, error)
      }
    }
    
    return results
  }

  async scrapeSource(source: ScrapingSource): Promise<any | null> {
    try {
      const { default: axios } = await import('axios')
      const { default: cheerio } = await import('cheerio')

      const response = await axios.get(source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      })

      const $ = cheerio.load(response.data)
      const rateText = $(source.selector).first().text().trim()

      if (!rateText) {
        console.warn(`No rate found for source ${source.name} with selector ${source.selector}`)
        return null
      }

      const rateValue = this.parseRate(rateText)
      if (!rateValue) {
        console.warn(`Could not parse rate from text: ${rateText}`)
        return null
      }

      return {
        type: source.rate_type,
        base_currency: source.currency,
        target_currency: 'BOB',
        buy_price: rateValue.buy,
        sell_price: rateValue.sell,
        source: source.name,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error(`Error scraping ${source.name}:`, error)
      return null
    }
  }

  async getActiveSources(): Promise<ScrapingSource[]> {
    return this.sources.filter(source => source.is_active)
  }

  private async loadSources(): Promise<void> {
    const defaultSources: ScrapingSource[] = [
      {
        id: '1',
        name: 'Banco Central de Bolivia',
        url: 'https://www.bcb.gob.bo/',
        selector: '.tipo-cambio .valor',
        currency: 'USD',
        frequency: '0 */6 * * *',
        is_active: true,
        rate_type: 'official',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Mercado Paralelo',
        url: 'https://dolarbolivia.com/',
        selector: '.price-value',
        currency: 'USD',
        frequency: '0 */2 * * *',
        is_active: true,
        rate_type: 'parallel',
        created_at: new Date().toISOString()
      }
    ]

    this.sources = defaultSources
  }

  private parseRate(text: string): { buy: number; sell: number } | null {
    const cleanText = text.replace(/[^\d.,]/g, '')
    const numbers = cleanText.match(/[\d.,]+/g)
    
    if (!numbers || numbers.length === 0) {
      return null
    }

    if (numbers.length === 1) {
      const rate = parseFloat(numbers[0].replace(',', '.'))
      return {
        buy: rate * 0.995,
        sell: rate * 1.005
      }
    }

    const buy = parseFloat(numbers[0].replace(',', '.'))
    const sell = parseFloat(numbers[1].replace(',', '.'))

    if (isNaN(buy) || isNaN(sell)) {
      return null
    }

    return { buy, sell }
  }
}
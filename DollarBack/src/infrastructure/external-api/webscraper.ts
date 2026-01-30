import type { ScrapingSource } from '@/domain/entities'
import type { IScraperEngine } from '@/application/services/scraper'
import axios from 'axios'
import * as cheerio from 'cheerio'

export class WebScraperService implements IScraperEngine {
  async scrapeAllSources(): Promise<any[]> {
    const sources = await this.getActiveSources()
    const results: any[] = []
    
    for (const source of sources) {
      const result = await this.scrapeSource(source)
      if (result) {
        results.push(result)
      }
    }
    
    return results
  }

  async scrapeSource(source: ScrapingSource): Promise<any | null> {
    try {
      const response = await axios.get(source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-BO,es;q=0.8,en-US;q=0.5,en;q=0.3',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 20000
      })

      const $ = cheerio.load(response.data as string)
      const rateElement = $(source.selector).first()
      
      if (!rateElement.length) {
        console.warn(`No element found for selector: ${source.selector}`)
        return null
      }

      const rateText = rateElement.text().trim()
      const parsedRate = this.parseRate(rateText)
      
      if (!parsedRate) {
        console.warn(`Could not parse rate from text: ${rateText}`)
        return null
      }

      return {
        type: source.rate_type,
        base_currency: source.currency,
        target_currency: 'BOB',
        buy_price: parsedRate.buy,
        sell_price: parsedRate.sell,
        source: source.name,
        timestamp: new Date().toISOString()
      }
    } catch (err) {
      const error = err as any
      if (error && typeof error.isAxiosError === 'function' && error.isAxiosError()) {
        if (error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout'))) {
          console.error(`Timeout scraping ${source.name}: La página es muy lenta o no responde`)
        } else if (error.response) {
          console.error(`HTTP ${error.response.status} error scraping ${source.name}: ${error.response.statusText}`)
        } else if (error.request) {
          console.error(`No response from ${source.name}: La página podría estar bloqueando peticiones`)
        } else {
          console.error(`Error scraping ${source.name}: ${error.message}`)
        }
      } else {
        console.error(`Unexpected error scraping ${source.name}: ${error}`)
      }
      return null
    }
  }

  async getActiveSources(): Promise<ScrapingSource[]> {
    return [
      {
        id: '1',
        name: 'Banco Central de Bolivia',
        url: 'https://www.bcb.gob.bo/',
        selector: '.tipo-cambio-',
        currency: 'USD',
        frequency: '0 */6 * * *',
        is_active: true,
        rate_type: 'official',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
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
  }

  private parseRate(text: string): { buy: number; sell: number } | null {
    const cleanText = text.replace(/[^\d.,\s]/g, '').trim()
    
    const buyMatch = cleanText.match(/compra[:\s]*([\d.,]+)/i)
    const sellMatch = cleanText.match(/venta[:\s]*([\d.,]+)/i)
    
    const numbers = cleanText.match(/[\d.,]+/g)
    
    if (buyMatch && sellMatch) {
      return {
        buy: parseFloat(buyMatch[1].replace(',', '.')),
        sell: parseFloat(sellMatch[1].replace(',', '.'))
      }
    }
    
    if (numbers && numbers.length >= 2) {
      return {
        buy: parseFloat(numbers[0].replace(',', '.')),
        sell: parseFloat(numbers[1].replace(',', '.'))
      }
    }
    
    if (numbers && numbers.length === 1) {
      const avgRate = parseFloat(numbers[0].replace(',', '.'))
      if (avgRate > 5 && avgRate < 10) {
        return {
          buy: avgRate * 0.995,
          sell: avgRate * 1.005
        }
      }
    }
    
    return null
  }
}
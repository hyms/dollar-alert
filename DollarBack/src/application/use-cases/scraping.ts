import type { IExchangeRateRepository } from '@/domain/repositories'
import type { ExchangeRate } from '@/domain/entities'

export interface IScrapingUseCase {
  execute(): Promise<ExchangeRate[]>
}

export class ScrapingUseCase implements IScrapingUseCase {
  constructor(
    private exchangeRateRepository: IExchangeRateRepository,
    private scraperService: IScraperService
  ) {}

  async execute(): Promise<ExchangeRate[]> {
    try {
      const sources = await this.scraperService.getActiveSources()
      const rates: ExchangeRate[] = []

      for (const source of sources) {
        const rateData = await this.scraperService.scrapeSource(source)
        if (rateData) {
          const rate: ExchangeRate = {
            id: crypto.randomUUID(),
            type: rateData.type,
            base_currency: rateData.base_currency,
            target_currency: rateData.target_currency,
            buy_price: rateData.buy_price,
            sell_price: rateData.sell_price,
            average_price: (rateData.buy_price + rateData.sell_price) / 2,
            spread_amount: rateData.sell_price - rateData.buy_price,
            change_24h: 0, // Will be calculated comparing with previous rate
            change_percentage_24h: 0, // Will be calculated comparing with previous rate
            last_updated: new Date().toISOString(),
            source: source.name
          }

          await this.exchangeRateRepository.saveRate(rate)
          await this.exchangeRateRepository.saveHistoricalRate({
            rate_type: rate.type,
            base_currency: rate.base_currency,
            target_currency: rate.target_currency,
            buy_price: rate.buy_price,
            sell_price: rate.sell_price,
            average_price: rate.average_price
          })

          rates.push(rate)
        }
      }

      return rates
    } catch (error) {
      console.error('Error in scraping use case:', error)
      throw error
    }
  }
}

export interface IScraperService {
  getActiveSources(): Promise<any[]>
  scrapeSource(source: any): Promise<any | null>
}
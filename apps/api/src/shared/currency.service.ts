import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";

interface ExchangeRateCache {
  rates: Record<string, number>;
  updatedAt: Date;
}

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private cache: ExchangeRateCache | null = null;
  private readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

  private async fetchRates(): Promise<Record<string, number>> {
    const now = new Date();

    if (
      this.cache &&
      now.getTime() - this.cache.updatedAt.getTime() < this.CACHE_TTL_MS
    ) {
      return this.cache.rates;
    }

    try {
      this.logger.log("Fetching fresh exchange rates from open.er-api.com");
      const url =
        process.env.EXCHANGE_RATE_API_URL ||
        "https://open.er-api.com/v6/latest/INR";
      const response = await axios.get(url);

      if (response.data && response.data.rates) {
        this.cache = {
          rates: response.data.rates,
          updatedAt: now,
        };
        return this.cache.rates;
      }
      throw new Error("Invalid response format from ER-API");
    } catch (error) {
      this.logger.error("Failed to fetch exchange rates", error);
      if (this.cache) {
        this.logger.warn("Using stale exchange rates from cache");
        return this.cache.rates;
      }
      throw error;
    }
  }

  async getRate(toCurrency: string): Promise<number> {
    const rates = await this.fetchRates();
    const rate = rates[toCurrency.toUpperCase()];
    if (!rate) {
      throw new Error(`Exchange rate for currency ${toCurrency} not found`);
    }
    return rate;
  }

  async convert(amountINR: number, toCurrency: string): Promise<number> {
    if (toCurrency.toUpperCase() === "INR") {
      return amountINR;
    }
    const rate = await this.getRate(toCurrency);
    return Number((amountINR * rate).toFixed(2));
  }
}

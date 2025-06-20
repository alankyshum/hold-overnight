import axios from "axios";
import { addDays, nextFriday, format } from "date-fns";
import { StockQuote, OptionData } from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function getCurrentPrice(ticker: string): Promise<StockQuote> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker.toUpperCase()}`;
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    const data = response.data;

    if (!data.chart?.result?.[0]?.meta) {
      throw new ApiError(`Invalid ticker symbol: ${ticker}`);
    }

    const meta = data.chart.result[0].meta;

    return {
      symbol: meta.symbol,
      price: meta.regularMarketPrice || meta.previousClose,
      currency: meta.currency || "USD",
      marketState: meta.marketState || "REGULAR",
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as {
        response?: { status: number };
        message?: string;
      };
      if (axiosError.response?.status === 404) {
        throw new ApiError(`Ticker ${ticker} not found`);
      }
      throw new ApiError(
        `Failed to fetch stock price: ${axiosError.message || "Network error"}`,
      );
    }
    throw new ApiError(`Unexpected error fetching stock price: ${error}`);
  }
}

export function getExpirationDate(holdingPeriod: string): string {
  const today = new Date();

  switch (holdingPeriod) {
    case "1w":
      return format(nextFriday(today), "yyyyMMdd");
    case "2w":
      return format(nextFriday(addDays(today, 7)), "yyyyMMdd");
    case "1m":
      return format(nextFriday(addDays(today, 28)), "yyyyMMdd");
    default:
      return format(nextFriday(today), "yyyyMMdd");
  }
}

// Get put premium - requires IEX Cloud API key for real options data
export async function getPutPremium(
  ticker: string,
  strike: number,
  holdingPeriod: string,
  iexApiKey: string,
): Promise<number> {
  if (!iexApiKey || !iexApiKey.trim()) {
    throw new ApiError(
      "IEX Cloud API key is required for options data. Please configure your API key in extension preferences.",
    );
  }

  try {
    const expirationDate = getExpirationDate(holdingPeriod);
    const realOptionData = await getRealPutPremium(
      ticker,
      strike,
      expirationDate,
      iexApiKey,
    );
    return realOptionData.midPrice;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Failed to fetch options data: ${error}`);
  }
}

interface RawOptionData {
  side: string;
  strike: number;
  bid: number;
  ask: number;
}

// Alternative function for when real options data is available
export async function getRealPutPremium(
  ticker: string,
  strike: number,
  expirationDate: string,
  apiKey: string,
): Promise<OptionData> {
  try {
    // This would be used with IEX Cloud or similar service
    const url = `https://cloud.iexapis.com/stable/stock/${ticker}/options/${expirationDate}?token=${apiKey}`;
    const response = await axios.get(url);

    const putOptions = response.data.filter(
      (option: RawOptionData) => option.side === "put",
    );

    if (putOptions.length === 0) {
      throw new ApiError("No put options available for this expiration");
    }

    // Find the closest strike price
    const closest = putOptions.reduce(
      (prev: RawOptionData, curr: RawOptionData) => {
        return Math.abs(curr.strike - strike) < Math.abs(prev.strike - strike)
          ? curr
          : prev;
      },
    );

    return {
      strike: closest.strike,
      bid: closest.bid,
      ask: closest.ask,
      midPrice: (closest.bid + closest.ask) / 2,
      expiration: expirationDate,
    };
  } catch (error) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { message?: string };
      throw new ApiError(
        `Options API error: ${axiosError.message || "Network error"}`,
      );
    }
    throw new ApiError(`Failed to fetch options data: ${error}`);
  }
}

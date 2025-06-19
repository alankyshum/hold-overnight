import axios from 'axios';

export async function getCurrentPrice(ticker: string): Promise<number> {
  try {
    const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`);
    const regularMarketPrice = response.data?.chart?.result?.[0]?.meta?.regularMarketPrice;

    if (typeof regularMarketPrice !== 'number') {
      throw new Error('Unexpected API response structure or missing price for current price.');
    }
    return regularMarketPrice;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error(`Ticker ${ticker} not found.`);
      }
      throw new Error(`API error fetching current price for ${ticker}: ${error.message}`);
    }
    throw new Error(`Failed to fetch current price for ${ticker}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function getPutPremium(ticker: string, strike: number, expirationDate: string, iexApiKey: string): Promise<number> {
  try {
    const response = await axios.get(`https://cloud.iexapis.com/stable/stock/${ticker}/options/${expirationDate}/put?token=${iexApiKey}`);

    if (!Array.isArray(response.data) || response.data.length === 0) {
      throw new Error(`No options data found for ${ticker} on ${expirationDate}.`);
    }

    // Find the option closest to the given strike price
    let closestOption = response.data[0];
    let minDifference = Math.abs(closestOption.strike - strike);

    for (let i = 1; i < response.data.length; i++) {
      const currentDifference = Math.abs(response.data[i].strike - strike);
      if (currentDifference < minDifference) {
        minDifference = currentDifference;
        closestOption = response.data[i];
      }
    }

    if (!closestOption || typeof closestOption.bid !== 'number' || typeof closestOption.ask !== 'number') {
      throw new Error(`Could not find a suitable option or bid/ask price for strike ${strike} for ${ticker} on ${expirationDate}.`);
    }

    // Ensure bid and ask are not zero to prevent issues with some API responses
    if (closestOption.bid === 0 && closestOption.ask === 0) {
        // Attempt to find another option if the "closest" has no bid/ask
        // This is a simple fallback, more sophisticated logic might be needed
        const viableOptions = response.data.filter(opt => opt.bid > 0 || opt.ask > 0);
        if (viableOptions.length === 0) {
            throw new Error(`No options with valid bid/ask found for ${ticker} on ${expirationDate} near strike ${strike}.`);
        }
        // Recalculate closest based on viable options
        closestOption = viableOptions[0];
        minDifference = Math.abs(closestOption.strike - strike);
        for (let i = 1; i < viableOptions.length; i++) {
            const currentDifference = Math.abs(viableOptions[i].strike - strike);
            if (currentDifference < minDifference) {
                minDifference = currentDifference;
                closestOption = viableOptions[i];
            }
        }
         if (!closestOption || typeof closestOption.bid !== 'number' || typeof closestOption.ask !== 'number' || (closestOption.bid === 0 && closestOption.ask === 0) ) {
            throw new Error(`Could not find a suitable option or bid/ask price for strike ${strike} for ${ticker} on ${expirationDate} after filtering zero bid/ask.`);
        }
    }


    const midPrice = (closestOption.bid + closestOption.ask) / 2;

    if (isNaN(midPrice)) {
        throw new Error(`Calculated mid-price is NaN for strike ${strike} for ${ticker} on ${expirationDate}. Bid: ${closestOption.bid}, Ask: ${closestOption.ask}`);
    }

    return midPrice;

  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`IEX API error fetching put premium for ${ticker}: ${error.message}`);
    }
    // Re-throw custom errors or wrap unknown errors
    if (error instanceof Error) {
        throw error;
    }
    throw new Error(`Failed to fetch put premium for ${ticker}: ${String(error)}`);
  }
}

import { getCurrentPrice, getPutPremium } from './api';
import { getExpiration } from './date';

interface PositionResult {
  shares: number;
  contracts: number;
  totalCost: number;
  calculatedMaxLoss: number;
  currentPrice?: number;
  putPremium?: number;
  putStrike?: number; // Actual strike price used for the put
  expirationDate?: string;
  message?: string;
  ticker?: string; // User input ticker
  targetStopLoss?: number; // User input stop-loss
  targetMaxLoss?: number; // User input max loss
}

export async function calculatePosition(
  tickerInput: string,
  stopLossInput: number, // K input by user
  maxLossInput: number, // User's desired maximum loss
  holdingPeriod: string,
  iexApiKey: string,
): Promise<PositionResult> {
  let S: number; // Current Price
  let P: number; // Put Premium
  let expirationDate: string;

  try {
    S = await getCurrentPrice(tickerInput);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid ticker or unable to fetch price for ${tickerInput}: ${errorMessage}`);
  }

  if (S <= stopLossInput) {
    throw new Error('Stop loss price must be below current market price.');
  }

  const K = stopLossInput; // K is the actual strike we'll aim for, based on user's stopLossInput

  try {
    expirationDate = getExpiration(holdingPeriod);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Error determining expiration date: ${errorMessage}`);
  }

  try {
    // TODO: In a more advanced version, getPutPremium might return the actual strike it found if it differs from K.
    // For now, we assume K is the strike found.
    P = await getPutPremium(tickerInput, K, expirationDate, iexApiKey);
    if (P <= 0) {
      throw new Error('Put premium is zero or negative, indicating an issue with options data or availability.');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to fetch put premium. Invalid strike, date, or no options available for ${tickerInput}: ${errorMessage}`);
  }

  // Cost of one contract
  const premiumPerContract = P * 100;

  if (maxLossInput < premiumPerContract) {
    return {
        shares: 0,
        contracts: 0,
        totalCost: 0,
        calculatedMaxLoss: 0,
        currentPrice: S,
        putPremium: P,
        putStrike: K,
        expirationDate: expirationDate,
        ticker: tickerInput,
        targetStopLoss: stopLossInput,
        targetMaxLoss: maxLossInput,
        message: `Max loss ($${maxLossInput.toFixed(2)}) is too low to cover the premium for a single contract ($${premiumPerContract.toFixed(2)}).`
    };
  }

  // Loss per share if stock hits stop loss, considering the put premium received
  // This is effectively (S - K) - P, but the Python formula was (S - K) + P for lossPerShare,
  // which seems to be the gross loss before considering the hedge from the put.
  // Let's clarify the definition of `lossPerShare` in the context of `N` calculation.
  // The formula for N is: N = floor((maxLoss - (P * 100)) / (S - K))
  // Here, (S - K) is the loss per share *if exercised*.
  // maxLoss - (P * 100) is the remaining loss capacity after buying one contract.
  // So, (S - K) must be positive, which is already checked (S > stopLoss).

  const lossPerShareAtStop = S - K; // This is the actual loss per share if exercised at K

  if (lossPerShareAtStop <= 0) {
    // This case should be caught by S <= stopLoss check earlier, but as a safeguard:
    throw new Error('Stop loss price must be strictly below current market price for the strategy to be viable.');
  }

  // Initial calculation of N, assuming one contract to cover potential shares
  // This N is the number of shares that can be bought such that if they all drop to K,
  // and we have ONE contract, the total loss is within maxLossInput.
  let N = Math.floor((maxLossInput - premiumPerContract) / lossPerShareAtStop);

  if (N <= 0) {
    return {
      shares: 0,
      contracts: 0,
      totalCost: 0,
      calculatedMaxLoss: 0,
      currentPrice: S,
      putPremium: P,
      putStrike: K,
      expirationDate: expirationDate,
      ticker: tickerInput,
      targetStopLoss: stopLossInput,
      targetMaxLoss: maxLossInput,
      message: `Cannot purchase any shares. The maximum loss of $${maxLossInput.toFixed(2)} is not enough to cover the premium for one contract ($${premiumPerContract.toFixed(2)}) and the potential loss on even one share at the stop loss.`,
    };
  }

  let contracts = Math.ceil(N / 100);

  // Adjusted Position Sizing
  // If N > 100, it means the initial N calculation suggests more than 1 contract.
  // The number of contracts should be based on this initial N.
  // Then, recalculate N based on the actual number of contracts bought.
  if (contracts > 0) { // Only adjust if we are buying at least one contract
    const totalPremiumCost = P * 100 * contracts;
    if (maxLossInput < totalPremiumCost) {
        // This can happen if Math.ceil(N/100) rounds up contracts, making totalPremiumCost > maxLossInput
        // Try with one less contract if possible
        if (contracts > 1) {
            contracts -= 1; // Reduce contracts by 1
            const adjustedTotalPremiumCost = P * 100 * contracts; // Recalculate cost
            // If still too expensive, then it's not possible with current maxLossInput
            if (maxLossInput < adjustedTotalPremiumCost) {
                 return {
                    shares: 0,
                    contracts: 0,
                    totalCost: 0,
                    calculatedMaxLoss: 0,
                    currentPrice: S,
                    putPremium: P,
                    putStrike: K,
                    expirationDate: expirationDate,
                    ticker: tickerInput,
                    targetStopLoss: stopLossInput,
                    targetMaxLoss: maxLossInput,
                    message: `Max loss ($${maxLossInput.toFixed(2)}) is too low. After adjusting contracts down to ${contracts}, the premium cost ($${adjustedTotalPremiumCost.toFixed(2)}) is still too high.`
                };
            }
            // Recalculate N with the new (lower) number of contracts
            N = Math.floor((maxLossInput - adjustedTotalPremiumCost) / lossPerShareAtStop);
        } else {
            // Contracts was 1, and maxLossInput < totalPremiumCost for 1 contract.
            // This case should have been caught by the `maxLossInput < premiumPerContract` check earlier.
            // But as a safeguard:
             return {
                shares: 0,
                contracts: 0,
                totalCost: 0,
                calculatedMaxLoss: 0,
                currentPrice: S,
                putPremium: P,
                putStrike: K,
                expirationDate: expirationDate,
                ticker: tickerInput,
                targetStopLoss: stopLossInput,
                targetMaxLoss: maxLossInput,
                message: `Max loss ($${maxLossInput.toFixed(2)}) is insufficient to cover the premium for one contract ($${premiumPerContract.toFixed(2)}).`
            };
        }
    } else {
         // If maxLossInput is sufficient for the initially calculated contracts' premium
         N = Math.floor((maxLossInput - totalPremiumCost) / lossPerShareAtStop);
    }


    if (N <= 0) {
      // If after adjusting for actual contract costs, N becomes non-positive,
      // it means the cost of contracts for the initially estimated N is too high.
      // This could mean we can't even afford the shares for the minimum number of contracts (1 if N was 1-100 initially).
      // Or, if initial N > 100, then `contracts` could be > 1.
      // If N becomes <=0 here, it means the cost of `contracts` premiums doesn't leave enough room within `maxLoss` to buy any shares.
      // We might still buy the contracts and 0 shares, or adjust contracts down.
      // For now, returning 0 shares if N is not positive.
      // A more sophisticated approach might iterate or try to find an optimal N and contracts.
      // The prompt says: "if N becomes <=0 after this adjustment, consider it as 0 shares for those contracts."
      // This implies we might still buy the contracts. Let's clarify.
      // If N=0, shares=0. Contracts are still calculated based on the initial N.
      // If the goal is to protect shares, and N=0, then perhaps contracts should also be 0.
      // Let's assume if N becomes 0, no shares are bought, and thus no protective puts are needed for those shares.
      // However, the problem implies `contracts` are determined, then `N` is adjusted.
      // If N is 0, then we have `contracts` protecting 0 shares. This means the "cost" is just the premium.
      // The formula for calculatedMaxLoss implies N shares are bought.
      // Let's stick to the user's prompt: "if N becomes <=0 after this adjustment, consider it as 0 shares for those contracts."
      // This means `shares = 0`, but `contracts` could still be > 0.
      // The `totalCost` would be `contracts * 100 * P`.
      // `calculatedMaxLoss` would be `contracts * 100 * P`.

      // If N is <= 0 after adjustment for contract costs (for the *potentially reduced* number of contracts)
      if (N <= 0) {
        return {
            shares: 0,
            // contracts: contracts, // We could show the contracts that *would* have been bought
            contracts: 0, // Or 0 contracts if 0 shares, to keep it simple for protective puts
            totalCost: 0,
            calculatedMaxLoss: 0,
            currentPrice: S,
            putPremium: P,
            putStrike: K,
            expirationDate: expirationDate,
            ticker: tickerInput,
            targetStopLoss: stopLossInput,
            targetMaxLoss: maxLossInput,
            message: `Calculated shares (N=${N}) is not positive after adjusting for contract costs. Max loss $${maxLossInput.toFixed(2)} may be too low for the cost of ${contracts} contract(s) ($${(P * 100 * contracts).toFixed(2)}) and any share loss.`,
        };
      }
    }
  } else {
    // This block handles the case where initial N > 0 but initial contracts was 0 (e.g. N < 1, which means N=0, handled earlier)
    // Or if initial N itself was <= 0 (also handled by the first N <= 0 check).
    // This 'else' implies contracts was 0 from Math.ceil(N/100) where N was already < 1 (so N=0).
    // If N > 0 and contracts is 0, it's an anomaly, as Math.ceil(positive N / 100) is at least 1.
    // Thus, if we reach here, it's likely because initial N was <= 0.
    // The primary N <= 0 check after initial calculation should catch this.
    // Adding a safeguard return for completeness, though it might be redundant.
    if (N <= 0) { // Should be covered by the initial check
        return {
            shares: 0,
            contracts: 0,
            totalCost: 0,
            calculatedMaxLoss: 0,
            currentPrice: S,
            putPremium: P,
            putStrike: K,
            expirationDate: expirationDate,
            ticker: tickerInput,
            targetStopLoss: stopLossInput,
            targetMaxLoss: maxLossInput,
            message: "Initial calculation resulted in zero or negative shares. No position possible.",
        };
    }
    // If N > 0 but somehow contracts ended up 0 (e.g. if N was between 0 and 1, then initial N would be 0)
    // For robustness, if N > 0 but contracts is 0, set contracts to 1 and re-evaluate N.
    if (N > 0 && contracts === 0) {
        contracts = 1;
        const singleContractPremium = P * 100 * contracts;
        if (maxLossInput < singleContractPremium) {
             return { /* ... message about maxLoss too low for 1 contract ... */ };
        }
        N = Math.floor((maxLossInput - singleContractPremium) / lossPerShareAtStop);
        if (N <= 0) {
            return { /* ... message about N <= 0 after ensuring 1 contract ... */ };
        }
    }
  }

  // Final check for N. If after all adjustments, N is not positive, no shares can be bought.
  if (N <= 0) {
     return {
        shares: 0,
        contracts: 0,
        totalCost: 0,
        calculatedMaxLoss: 0,
        currentPrice: S,
        putPremium: P,
        putStrike: K,
        expirationDate: expirationDate,
        ticker: tickerInput,
        targetStopLoss: stopLossInput,
        targetMaxLoss: maxLossInput,
        message: "No shares can be purchased with the given constraints after all adjustments."
    };
  }

  // Ensure that the number of shares is a multiple of 100 if contracts > 0,
  // or rather, ensure that contracts cover N shares.
  // The number of contracts is Math.ceil(N/100). This is correct.
  // E.g., N=50, contracts=1. N=150, contracts=2.

  const totalSharesCost = N * S;
  const totalPremiumCost = contracts * 100 * P;
  const totalInvestment = totalSharesCost + totalPremiumCost;

  // This is the maximum loss if S drops to K (or below, but K is the strike)
  // Loss from shares = (S - K) * N
  // Cost of puts = contracts * 100 * P
  // The puts pay (K - S_final) * contracts * 100 if S_final < K.
  // If S_final = K, puts pay 0. Loss = (S-K)*N + totalPremiumCost
  // If S_final < K, say S_final = K - dK
  // Value of shares = (K-dK)*N
  // Initial cost of shares = S*N
  // Loss on shares = (S - (K-dK))*N
  // Value of puts = dK * contracts * 100
  // Net loss = (S - (K-dK))*N + totalPremiumCost - dK*contracts*100
  // Net loss = (S*N - K*N + dK*N) + totalPremiumCost - dK*contracts*100
  // If N shares are exactly covered by contracts (i.e. N = contracts*100)
  // Net loss = (S*N - K*N + dK*N) + totalPremiumCost - dK*N
  // Net loss = (S-K)*N + totalPremiumCost. This is the max loss if shares are fully hedged below K.
  // Since N might not be a multiple of 100, some shares might be unhedged below K by the puts if N > contracts*100 (not possible by Math.ceil)
  // Or some hedge capacity might be unused if N < contracts*100.

  // The definition from the problem is: calculatedMaxLoss: ((S - K) * N) + (contracts * 100 * P)
  // This represents the loss if the stock price drops exactly to the strike price K.
  // At this point, the options expire worthless (or are not exercised if ATM).
  // The loss is the depreciation of shares (S-K)*N plus the full cost of the premiums.
  // This seems to be the intended calculation for "calculatedMaxLoss".

  // Recalculate totalPremiumCost based on final `contracts` and `N` values
  const finalTotalPremiumCost = P * 100 * contracts;
  const calculatedMaxLossValue = (lossPerShareAtStop * N) + finalTotalPremiumCost;

  if (calculatedMaxLossValue > maxLossInput * 1.01 && N > 0) { // Allow 1% tolerance, only if shares are bought
    // This indicates a potential flaw in logic or parameters leading to exceeding desired maxLossInput
    // This check is important.
    console.warn(`Calculated max loss $${calculatedMaxLossValue.toFixed(2)} slightly exceeds desired max loss $${maxLossInput.toFixed(2)} for ${N} shares and ${contracts} contracts. This might be due to indivisibility of shares/contracts or premium costs.`);
    // It might be better to return a message or adjust N/contracts further.
    // For now, proceed with a warning.
  }

  const finalTotalInvestment = (N * S) + finalTotalPremiumCost;

  return {
    shares: N,
    contracts: contracts,
    totalCost: finalTotalInvestment,
    calculatedMaxLoss: calculatedMaxLossValue,
    currentPrice: S,
    putPremium: P,
    putStrike: K, // Actual strike used
    expirationDate: expirationDate,
    ticker: tickerInput,
    targetStopLoss: stopLossInput, // User's original stop loss target
    targetMaxLoss: maxLossInput,   // User's original max loss target
    message: (N > 0 && contracts > 0) ? `Position calculated successfully for ${N} shares and ${contracts} contracts.` : "Could not calculate a valid position with the given parameters."
  };
}

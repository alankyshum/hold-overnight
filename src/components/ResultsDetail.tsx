import React from 'react';
import { Detail, ActionPanel, Action, Icon } from '@raycast/api';

// Assuming PositionResult is defined in calculator.ts and includes all necessary fields.
// If not, this interface should be adjusted or imported.
interface PositionResult {
  ticker?: string; // Added for display
  stopLoss?: number; // Added for display
  targetMaxLoss?: number; // Added for display

  shares: number;
  contracts: number;
  totalCost: number;
  calculatedMaxLoss: number;
  currentPrice?: number;
  putPremium?: number;
  putStrike?: number; // Added for display (K from calculation)
  expirationDate?: string;
  message?: string;
}

interface ResultsDetailProps {
  result: PositionResult;
  // Original form inputs can be passed if needed for display, e.g., original stopLoss if different from putStrike
  // For now, assuming `result` object from calculator contains all necessary display data or it's added to it.
  // Let's assume calculator.ts can populate result.ticker, result.stopLoss (as K), result.targetMaxLoss
}

export default function ResultsDetail({ result }: ResultsDetailProps) {
  const stockCost = (result.currentPrice && result.shares ? result.currentPrice * result.shares : 0);
  const optionsCost = (result.putPremium && result.contracts ? result.putPremium * result.contracts * 100 : 0);

  let markdownContent = `# Protective Put Calculation Results\n\n`;

  if (result.message) {
    markdownContent += `## Calculation Notes\n`;
    markdownContent += `${result.message}\n\n`;
    markdownContent += `---\n\n`;
  }

  markdownContent += `## Strategy Overview\n`;
  markdownContent += `*   **Ticker:** ${result.ticker || 'N/A'}\n`;
  markdownContent += `*   **Current Stock Price (S):** ${result.currentPrice ? `$${result.currentPrice.toFixed(2)}` : 'N/A'}\n`;
  markdownContent += `*   **Chosen Stop Loss / Put Strike (K):** ${result.putStrike ? `$${result.putStrike.toFixed(2)}` : (result.stopLoss ? `$${result.stopLoss.toFixed(2)}` : 'N/A')}\n`; // Assuming putStrike is K
  markdownContent += `*   **Put Option Premium (P per share):** ${result.putPremium ? `$${result.putPremium.toFixed(2)}` : 'N/A'}\n`;
  markdownContent += `*   **Option Expiration Date:** ${result.expirationDate || 'N/A'} (YYYYMMDD)\n\n`;

  markdownContent += `## Position Sizing & Cost\n`;
  if (result.shares > 0) {
    markdownContent += `*   **Shares to Purchase (N):** ${result.shares}\n`;
    markdownContent += `*   **Put Contracts to Buy:** ${result.contracts} (1 contract = 100 shares)\n`;
    markdownContent += `*   **Estimated Total Investment:** $${result.totalCost?.toFixed(2)}\n`;
    markdownContent += `    *   *Stock Cost: ($${result.currentPrice?.toFixed(2)} x ${result.shares} shares) = $${stockCost.toFixed(2)}*\n`;
    markdownContent += `    *   *Options Cost: ($${result.putPremium?.toFixed(2)} x ${result.contracts} contracts x 100) = $${optionsCost.toFixed(2)}*\n\n`;
  } else {
    markdownContent += `*   **Shares to Purchase (N):** 0\n`;
    markdownContent += `*   **Put Contracts to Buy:** 0\n`;
    markdownContent += `*   **Estimated Total Investment:** $0.00\n\n`;
  }


  markdownContent += `## Risk Management\n`;
  markdownContent += `*   **Your Target Max Loss:** ${result.targetMaxLoss ? `$${result.targetMaxLoss.toFixed(2)}` : 'N/A'}\n`;
  markdownContent += `*   **Calculated Max Potential Loss:** ${result.calculatedMaxLoss ? `$${result.calculatedMaxLoss.toFixed(2)}` : 'N/A'}\n`;
  if (result.shares > 0) {
    markdownContent += `    *   *This is the maximum you could lose if the stock price drops to or below your stop loss (strike price) by expiration, assuming the put options are exercised or sold to offset share losses.*\n\n`;
  }


  markdownContent += `## Disclaimer\n`;
  markdownContent += `This information is for educational purposes only. Market conditions can change rapidly. Past performance is not indicative of future results. Always conduct your own research and consider your risk tolerance before making any investment decisions. This calculator does not account for commissions, taxes, or other trading fees. Option liquidity and bid-ask spreads can also significantly affect outcomes.`;

  return (
    <Detail
      markdown={markdownContent}
      navigationTitle="Calculation Results"
      actions={
        <ActionPanel>
          <Action.Pop title="Back to Form" icon={Icon.ArrowLeft} />
          <Action.CopyToClipboard title="Copy Results to Clipboard" content={markdownContent} />
        </ActionPanel>
      }
    />
  );
}

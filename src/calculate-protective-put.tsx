import React, { useState } from "react";
import {
  Action,
  ActionPanel,
  Detail,
  Form,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { calculateProtectivePut, formatCurrency, formatPercentage, formatShares } from "./calculator";
import { CalculationResult, HoldingPeriod } from "./types";

interface FormValues {
  ticker: string;
  stopLoss: string;
  maxLoss: string;
  holdingPeriod: HoldingPeriod;
}

export default function CalculateProtectivePut() {
  const { push } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(values: FormValues) {
    setIsLoading(true);

    try {
      // Validate inputs
      const ticker = values.ticker.trim().toUpperCase();
      const stopLoss = parseFloat(values.stopLoss);
      const maxLoss = parseFloat(values.maxLoss);

      if (!ticker) {
        throw new Error("Please enter a valid ticker symbol");
      }

      if (isNaN(stopLoss) || stopLoss <= 0) {
        throw new Error("Stop loss must be a positive number");
      }

      if (isNaN(maxLoss) || maxLoss <= 0) {
        throw new Error("Max loss must be a positive number");
      }

      if (maxLoss > 10000) {
        await showToast({
          style: Toast.Style.Animated,
          title: "Large Position Warning",
          message: "Consider position sizing carefully for amounts over $10,000"
        });
      }

      // Calculate protective put strategy
      const result = await calculateProtectivePut({
        ticker,
        stopLoss,
        maxLoss,
        holdingPeriod: values.holdingPeriod
      });

      // Navigate to results page
      push(<ResultsView result={result} inputs={values} />);

    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Calculation Failed",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Calculate Position"
            onSubmit={handleSubmit}
          />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="ticker"
        title="Stock Ticker"
        placeholder="e.g., OKLO, AAPL, TSLA"
        info="Enter the stock symbol you want to protect"
      />

      <Form.TextField
        id="stopLoss"
        title="Stop Loss Price"
        placeholder="e.g., 57.00"
        info="The price at which you want protection (strike price)"
      />

      <Form.TextField
        id="maxLoss"
        title="Maximum Loss (USD)"
        placeholder="e.g., 500"
        info="Your maximum acceptable loss including premium"
      />

      <Form.Dropdown
        id="holdingPeriod"
        title="Holding Period"
        defaultValue="1w"
        info="How long you plan to hold the position"
      >
        <Form.Dropdown.Item value="1w" title="1 Week" />
        <Form.Dropdown.Item value="2w" title="2 Weeks" />
        <Form.Dropdown.Item value="1m" title="1 Month" />
      </Form.Dropdown>

      <Form.Separator />

      <Form.Description
        title="Disclaimer"
        text="This tool is for educational purposes only. Not financial advice. Options trading involves substantial risk."
      />
    </Form>
  );
}

function ResultsView({ result, inputs }: { result: CalculationResult; inputs: FormValues }) {
  const markdown = `
# Protective Put Strategy Results

## Position Summary
- **Stock**: ${inputs.ticker.toUpperCase()}
- **Shares**: ${formatShares(result.shares)}
- **Contracts**: ${result.contracts}
- **Stop Loss**: $${inputs.stopLoss}

## Cost Breakdown
- **Stock Cost**: ${formatCurrency(result.stockCost)}
- **Option Premium**: ${formatCurrency(result.optionCost)}
- **Total Investment**: ${formatCurrency(result.totalCost)}

## Risk Analysis
- **Maximum Loss**: ${formatCurrency(result.actualMaxLoss)}
- **Target Max Loss**: ${formatCurrency(parseFloat(inputs.maxLoss))}
- **Protection Level**: ${formatPercentage(result.protectionLevel)}
- **Breakeven Price**: ${formatCurrency(result.breakeven)}

## Strategy Details
This protective put position provides downside protection at $${inputs.stopLoss} per share. If the stock falls below this level, your puts will limit losses to the maximum calculated above.

### Key Points:
- ✅ **Protected**: ${formatShares(result.shares)} shares fully protected
- ✅ **Loss Cap**: Maximum loss of ${formatCurrency(result.actualMaxLoss)}
- ⚠️ **Breakeven**: Stock needs to rise above ${formatCurrency(result.breakeven)}
- ⚠️ **Time Decay**: Options lose value over time

### Execution Steps:
1. **Buy ${formatShares(result.shares)} shares** of ${inputs.ticker} at current market price
2. **Buy ${result.contracts} put contract(s)** with strike $${inputs.stopLoss}
3. **Monitor position** and consider rolling or closing before expiration

---
*This is for educational purposes only. Not financial advice.*
`;

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy Results"
            content={markdown}
          />
          <Action.OpenInBrowser
            title="Learn More About Protective Puts"
            url="https://www.investopedia.com/terms/p/protective-put.asp"
          />
        </ActionPanel>
      }
    />
  );
}

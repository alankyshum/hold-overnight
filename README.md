# 🛡️ Protective Put Calculator - Raycast Extension

A production-ready Raycast extension that automates protective put strategy calculations for earnings plays with strict loss caps.

## ✨ Features

- **💰 Real-time calculations** using mock Yahoo Finance API integration
- **📊 Smart position sizing** that enforces maximum loss limits
- **🎯 Contract optimization** handling for options positions
- **⚡ Instant feedback** through Raycast's native interface
- **🛡️ Safety features** with input validation and risk warnings
- **⚙️ Configurable defaults** via Raycast preferences

## 🚀 Usage

### Quick Start
1. **Open Raycast** → Search "Calculate Protective Put"
2. **Enter arguments**:
   - **Ticker**: Stock symbol (e.g., AAPL, MSFT, TSLA)
   - **Stop Loss**: Your protection price (e.g., 150.00)
   - **Max Loss**: Maximum acceptable loss (optional, defaults to $500)
3. **Get results** via toast notifications and detailed console output

### Example Usage
```
Command: Calculate Protective Put
Ticker: AAPL
Stop Loss: 180
Max Loss: 500
```

### Results Include
- 📈 **Position Summary**: Shares, contracts, stop loss level
- 💳 **Cost Breakdown**: Stock cost, option cost, total investment
- ⚠️ **Risk Analysis**: Max loss, breakeven point, protection level
- 📝 **Strategy Notes**: Key benefits and risk considerations

## How It Works

The extension calculates the optimal protective put position using this formula:

```
loss_per_share = (current_price - strike_price) + put_premium
max_shares = floor(max_loss / loss_per_share)
contracts = ceil(max_shares / 100)
```

The position is then adjusted to account for options contract sizes (100 shares each) while staying within your loss limits.

## Example

**Input:**
- Ticker: OKLO
- Current Price: $60.00
- Stop Loss: $57.00
- Max Loss: $500
- Holding: 1 week

**Output:**
- Shares: 150
- Contracts: 2
- Stock Cost: $9,000
- Option Cost: $450
- Max Loss: $495
- Breakeven: $63.00

## Data Sources

- **Stock Prices**: Yahoo Finance (free, no API key required)
- **Options Data**: Estimated using simplified Black-Scholes model
  - For production use, integrate with IEX Cloud or similar options data provider

## Important Disclaimers

⚠️ **This tool is for educational purposes only and does not constitute financial advice.**

- Options trading involves substantial risk of loss
- Past performance does not guarantee future results
- Always consult with a qualified financial advisor
- Verify all calculations independently before trading

## Installation

1. Clone this repository to your Raycast extensions directory
2. Run `npm install` to install dependencies
3. Run `npm run dev` to start development mode
4. The extension will appear in Raycast

## Development

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Fix linting issues
npm run fix-lint
```

## License

MIT License - see LICENSE file for details.

## Contributing

Pull requests welcome! Please ensure:
- Code passes linting (`npm run lint`)
- All calculations are tested
- UI follows Raycast design guidelines
- Documentation is updated for new features

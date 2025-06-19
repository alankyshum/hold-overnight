# Protective Put Calculator Raycast Extension

## Overview

The Protective Put Calculator is a Raycast extension designed to help stock market investors and traders automate the calculations required for a protective put strategy. This strategy involves buying put options to hedge a long stock position, effectively setting a maximum potential loss on the trade.

This extension fetches near real-time market data to calculate the optimal number of shares to buy and put option contracts to purchase, ensuring that the total potential loss does not exceed a user-defined maximum.

## Features

*   **Optimal Position Sizing:** Calculates the ideal number of shares and put option contracts based on your risk tolerance.
*   **Max Loss Enforcement:** Ensures the calculated position aligns with your specified maximum acceptable loss for the trade.
*   **Real-Time Data:** Fetches current stock prices from Yahoo Finance and put option premiums from IEX Cloud.
*   **Configurable Holding Periods:** Initially supports a "1 Week" holding period, automatically targeting the nearest Friday option expiration. (Future updates may include more options).
*   **Secure API Key Storage:** Your IEX Cloud API key is stored securely using Raycast's local storage on your device.
*   **Detailed Breakdown:** Provides a comprehensive summary of the position, including estimated costs, share count, contract count, and the calculated maximum potential loss.

## Setup / Installation

1.  **Install the Extension:**
    *   (This section will be updated based on distribution, e.g., "Install directly from the Raycast Store.")
    *   Alternatively, for manual installation: Clone the repository, navigate to the project directory, and run `npm install && ray build`. Then import the extension into Raycast.

2.  **API Key Configuration:**
    *   This extension requires a **free or paid API key from IEX Cloud** to fetch options data.
    *   You can sign up for an IEX Cloud account and obtain an API key at [https://iexcloud.io/](https://iexcloud.io/). They offer a free tier that should be sufficient for typical use of this extension.
    *   **Entering Your API Key:**
        *   The first time you run the "Calculate Protective Put" command, or if no API key is currently saved, the "IEX Cloud API Key" field will be empty. Enter your publishable API key (it usually starts with `pk_`).
        *   Upon a successful calculation, or by using the "Save API Key" action (accessible via `⌘K` or `CMD+K` in the form), your API key will be saved securely in Raycast's local storage on your machine.
        *   You do not need to enter the key every time. If a key is saved, the extension will use it automatically. You can update or clear the saved API key using the "Save API Key" or "Clear Saved API Key" actions in the form's action panel.

## How to Use

1.  **Open Raycast** and type the extension's command name (e.g., "Calculate Protective Put").
2.  **Fill in the Form Fields:**
    *   **Stock Ticker:** Enter the U.S. stock ticker symbol for the desired company (e.g., `AAPL`, `MSFT`, `OKLO`). The ticker will be automatically converted to uppercase.
    *   **Target Stop Loss Price ($):** Specify the price per share at which you would ideally want to limit your stock losses. The extension will try to find put options with a strike price at or near this value.
    *   **Target Max Acceptable Loss ($):** Define the maximum total dollar amount you are willing to lose on this specific trade (including the cost of options). This is a crucial input for risk management.
    *   **Holding Period:** Select how long you plan to hold the position. Currently, "1 Week" is available, which targets the put option expiring on the nearest upcoming Friday.
    *   **IEX Cloud API Key:** If you haven't saved your API key yet, or if you wish to override the saved key for this session, enter your IEX Cloud publishable API key here. If a key is already saved and this field is left blank, the saved key will be used.
3.  **Submit:** Click the "Calculate Position" button or press `Enter`.
4.  **Review Results:** The extension will display a detailed breakdown of the calculated position:
    *   Number of shares to purchase.
    *   Number of put option contracts to buy.
    *   Estimated total cost for the shares and options.
    *   The calculated maximum potential loss based on your inputs.
    *   Key market data used (stock price, option premium, expiration date).
5.  **Actions on Results Page:**
    *   You can go back to the form using the "Back to Form" action.
    *   You can copy the full results to your clipboard using the "Copy Results to Clipboard" action.

## Calculation Logic Summary

The extension determines a position size (number of shares and contracts) that aims to protect your investment against significant drops while respecting your maximum loss threshold.

1.  It fetches the current stock price (S).
2.  It uses your "Target Stop Loss Price" as the desired strike price (K) for the put options.
3.  It fetches put option premium data (P) for the specified ticker, strike (K), and expiration date (derived from the holding period).
4.  The core calculation determines the number of shares (N) such that if the stock price drops from S to K, the loss on shares `(S - K) * N`, plus the total cost of the put option contracts `Contracts * P * 100`, does not exceed your "Target Max Acceptable Loss".
5.  The number of contracts is typically `ceil(N / 100)`. The calculation involves an iterative adjustment to ensure the constraints are met.
6.  If a position cannot be calculated within the given risk parameters (e.g., max loss too small to cover even one contract's premium), it will indicate that 0 shares and 0 contracts should be bought, along with an explanatory message.

## Disclaimer

**For Educational and Informational Purposes Only.**

This tool is not financial advice. Trading stocks and options involves significant risk of loss and is not suitable for every investor. The calculations and data provided are based on third-party APIs (Yahoo Finance for stock prices, IEX Cloud for options data) and may contain inaccuracies, errors, or delays. Market conditions can change rapidly.

Always conduct your own thorough research and consult with a qualified financial advisor before making any investment decisions. The creators of this extension are not liable for any financial losses or decisions made based on the information provided by this tool. Understand the risks before trading. This calculator does not account for commissions, taxes, slippage, or other trading fees, nor does it guarantee the availability or liquidity of any specific options.

## Core Dependencies (for development)
*   `axios`: For making HTTP requests to external APIs.
*   `date-fns`: For date calculations, particularly for determining option expiration dates.
*   `@raycast/api`: Raycast API for building the extension.
*   `react`: For UI components.

import { calculateProtectivePut } from "../src/calculator";

// Mock the API functions for testing
jest.mock("../src/api", () => ({
  getCurrentPrice: jest.fn().mockResolvedValue({
    symbol: "TEST",
    price: 60.0,
    currency: "USD",
    marketState: "REGULAR"
  }),
  getPutPremium: jest.fn().mockResolvedValue(3.0)
}));

describe("Protective Put Calculator", () => {
  test("calculates position correctly for basic scenario", async () => {
    const result = await calculateProtectivePut({
      ticker: "TEST",
      stopLoss: 57.0,
      maxLoss: 500,
      holdingPeriod: "1w"
    });

    expect(result.shares).toBeGreaterThan(0);
    expect(result.contracts).toBeGreaterThan(0);
    expect(result.actualMaxLoss).toBeLessThanOrEqual(500);
    expect(result.totalCost).toBeGreaterThan(0);
  });

  test("throws error for invalid stop loss", async () => {
    await expect(calculateProtectivePut({
      ticker: "TEST",
      stopLoss: 65.0, // Above current price
      maxLoss: 500,
      holdingPeriod: "1w"
    })).rejects.toThrow("Stop loss must be below current price");
  });

  test("throws error for too small max loss", async () => {
    await expect(calculateProtectivePut({
      ticker: "TEST",
      stopLoss: 57.0,
      maxLoss: 1, // Too small
      holdingPeriod: "1w"
    })).rejects.toThrow();
  });
});

import { showToast, Toast } from "@raycast/api";
import { calculateProtectivePut, formatCurrency } from "./calculator";
import { CalculationInputs } from "./types";

export default function CalculateProtectivePut() {
  console.log("Protective Put Calculator loaded");

  // For now, show a demo calculation
  const demoCalculation = async () => {
    try {
      const inputs: CalculationInputs = {
        ticker: "AAPL",
        stopLoss: 180,
        maxLoss: 500,
        holdingPeriod: "2w",
      };

      showToast(
        Toast.Style.Animated,
        "Calculating...",
        "Running protective put calculation",
      );

      const result = await calculateProtectivePut(inputs);

      const message = `${inputs.ticker}: ${result.shares} shares, ${result.contracts} put contracts, Max Loss: ${formatCurrency(result.actualMaxLoss)}`;

      showToast(Toast.Style.Success, "Calculation Complete", message);

      console.log("Calculation result:", result);
    } catch (error) {
      console.error("Calculation error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Calculation failed";
      showToast(Toast.Style.Failure, "Error", errorMessage);
    }
  };

  // Run demo calculation
  demoCalculation();

  return null;
}

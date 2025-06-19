import React, { useState } from 'react';
import {
  Form,
  ActionPanel,
  Action,
  Detail,
  Icon,
  Toast,
  showToast,
  useNavigation,
  LocalStorage,
} from '@raycast/api';
import { calculatePosition } from './utils/calculator';
import type { PositionResult } from './utils/calculator'; // Import the type
import ResultsDetail from './components/ResultsDetail'; // Import the new component
// import { getExpiration } from './utils/date';

export default function Command() {
  const { push } = useNavigation();
  // No longer need local PositionResult interface, it's imported.
  // No longer need placeholder ResultsDetail, it's imported.

  const [ticker, setTicker] = useState<string>("");
  const [stopLoss, setStopLoss] = useState<string>(""); // User input for target stop loss
  const [maxLoss, setMaxLoss] = useState<string>("500"); // User input for target max loss
  const [holdingPeriod, setHoldingPeriod] = useState<string>("1w");
  const [iexApiKey, setIEXApiKey] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  async function handleSubmit() {
    setIsLoading(true);

    const currentTicker = ticker.trim().toUpperCase();
    if (!currentTicker) {
      showToast({ style: Toast.Style.Failure, title: "Validation Error", message: "Stock Ticker is required." });
      setIsLoading(false);
      return;
    }

    let finalApiKey = iexApiKey.trim();
    const storedApiKey = await LocalStorage.getItem<string>("iexApiKey");
    if (storedApiKey) {
        finalApiKey = storedApiKey;
    }

    if (!finalApiKey) {
      showToast({ style: Toast.Style.Failure, title: "API Key Missing", message: "IEX Cloud API Key not found. Please enter it or save it." });
      setIsLoading(false);
      return;
    }

    const parsedStopLoss = parseFloat(stopLoss);
    const parsedMaxLoss = parseFloat(maxLoss);

    if (isNaN(parsedStopLoss) || parsedStopLoss <= 0) {
      showToast({ style: Toast.Style.Failure, title: "Validation Error", message: "Stop Loss Price must be a positive number." });
      setIsLoading(false);
      return;
    }
    if (isNaN(parsedMaxLoss) || parsedMaxLoss <= 0) {
      showToast({ style: Toast.Style.Failure, title: "Validation Error", message: "Max Loss must be a positive number." });
      setIsLoading(false);
      return;
    }

    try {
      // Pass the current form state values to calculatePosition
      // The calculator function now expects tickerInput, stopLossInput, maxLossInput
      const result: PositionResult = await calculatePosition(
        currentTicker, // tickerInput
        parsedStopLoss,  // stopLossInput
        parsedMaxLoss,   // maxLossInput
        holdingPeriod,
        finalApiKey
      );

      // Save API key on successful calculation if it was manually entered via iexApiKey state
      // and it's different from a stored key, or if no key was stored.
      if (iexApiKey.trim() && iexApiKey.trim() !== storedApiKey) {
          await LocalStorage.setItem("iexApiKey", iexApiKey.trim());
          // No need for a toast here if the user explicitly used the "Save API Key" action
          // Or, if you want to confirm auto-save:
          // showToast({ style: Toast.Style.Success, title: "API Key Saved", message: "IEX API Key input was saved." });
      }

      // Display messages from calculator logic
      if (result.message) {
        const style = (result.shares > 0 || result.contracts > 0) ? Toast.Style.Success : Toast.Style.Important;
        showToast({
          style: style,
          title: "Calculation Note",
          message: result.message,
        });
      } else {
         showToast({
          style: Toast.Style.Success,
          title: "Calculation Complete",
          message: `Details for ${result.shares} shares and ${result.contracts} contracts.`,
        });
      }

      // The `result` object from `calculatePosition` should now match the extended PositionResult type
      // required by the new ResultsDetail component.
      push(<ResultsDetail result={result} />);

    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      showToast({
        style: Toast.Style.Failure,
        title: "Calculation Error",
        message: message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Effect to load API key from LocalStorage when component mounts
  React.useEffect(() => {
    async function loadApiKey() {
      const storedKey = await LocalStorage.getItem<string>("iexApiKey");
      if (storedKey) {
        setIEXApiKey(storedKey); // Prefill the field if key is found in storage
        console.log("Loaded API key from storage and set to state.");
      } else {
        console.log("No API key found in storage on mount.");
      }
    }
    loadApiKey();
  }, []); // Empty dependency array ensures this runs only on mount


  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Calculate Position" onSubmit={handleSubmit} icon={Icon.Calculator} />
          <Action title="Save API Key" icon={Icon.Key} onAction={async () => {
            const keyToSave = iexApiKey.trim();
            if (keyToSave) {
              await LocalStorage.setItem("iexApiKey", keyToSave);
              showToast({style: Toast.Style.Success, title: "API Key Saved", message: "IEX API Key has been saved."});
            } else {
              showToast({style: Toast.Style.Failure, title: "No API Key", message: "Please enter an API Key in the form to save."});
            }
          }} />
           <Action title="Clear Saved API Key" icon={Icon.Trash} onAction={async () => {
              await LocalStorage.removeItem("iexApiKey");
              setIEXApiKey(""); // Clear the field as well
              showToast({style: Toast.Style.Success, title: "API Key Cleared", message: "Saved IEX API Key has been removed."});
          }} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="ticker"
        title="Stock Ticker"
        placeholder="e.g., OKLO, AAPL"
        value={ticker}
        onChange={(val) => setTicker(val.toUpperCase())} // Ensure ticker is uppercase
      />
      <Form.TextField
        id="stopLoss"
        title="Target Stop Loss Price ($)" // Clarified title
        placeholder="e.g., 57.00"
        value={stopLoss}
        onChange={setStopLoss}
      />
      <Form.TextField
        id="maxLoss"
        title="Target Max Acceptable Loss ($)" // Clarified title
        placeholder="e.g., 500"
        value={maxLoss}
        onChange={setMaxLoss}
      />
      <Form.Dropdown id="holdingPeriod" title="Holding Period" value={holdingPeriod} onChange={setHoldingPeriod}>
        <Form.Dropdown.Item value="1w" title="1 Week (Next Friday)" />
        {/* Future: Add more options once getExpiration supports them */}
      </Form.Dropdown>
      <Form.PasswordField
        id="iexApiKey"
        title="IEX Cloud API Key"
        placeholder="pk_yourkey (leave blank if already saved)" // Updated placeholder
        value={iexApiKey}
        onChange={setIEXApiKey}
      />
       <Form.Description text="Your IEX API key is stored locally on your device. Use actions (⌘K) to save/clear." />
    </Form>
  );
}

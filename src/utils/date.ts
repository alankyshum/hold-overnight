import { nextFriday, format } from 'date-fns';

export function getExpiration(holdingPeriod: string): string {
  // Get today's date
  const today = new Date();

  if (holdingPeriod === '1w') {
    // Calculate the next Friday from today
    const nextFridayDate = nextFriday(today);
    // Format the date as 'YYYYMMDD'
    return format(nextFridayDate, 'yyyyMMdd');
  } else {
    // Placeholder for other holding periods
    // For now, let's throw an error if an unsupported period is provided.
    // Alternatively, could default to next Friday or handle other specific cases.
    console.warn(`Unsupported holding period: ${holdingPeriod}. Defaulting to next Friday.`);
    // Returning next Friday as a default for now as per instructions "return next Friday for now"
    const nextFridayDate = nextFriday(today);
    return format(nextFridayDate, 'yyyyMMdd');
    // Or throw an error:
    // throw new Error(`Unsupported holding period: ${holdingPeriod}. Only '1w' is currently supported.`);
  }
}

// Currency conversion utilities
// All prices are stored in Kenya Shillings (KES) in the database

export interface CurrencyInfo {
  code: string;
  symbol: string;
  rate: number; // Rate from KES to this currency
  name: string;
}

// Exchange rates from KES (Kenya Shillings) to other currencies
// These rates should be updated periodically
const CURRENCY_RATES: Record<string, CurrencyInfo> = {
  // East Africa - Keep in KES
  'Kenya': { code: 'KES', symbol: 'KSH', rate: 1, name: 'Kenya Shillings' },
  'Uganda': { code: 'UGX', symbol: 'UGX', rate: 30.5, name: 'Uganda Shillings' },
  'Tanzania': { code: 'TZS', symbol: 'TSH', rate: 21.8, name: 'Tanzania Shillings' },
  'Rwanda': { code: 'RWF', symbol: 'RWF', rate: 11.2, name: 'Rwanda Francs' },
  'Burundi': { code: 'BIF', symbol: 'FBu', rate: 22.5, name: 'Burundi Francs' },
  'South Sudan': { code: 'SSP', symbol: 'SSP', rate: 1.05, name: 'South Sudanese Pounds' },
  
  // Other African countries
  'Nigeria': { code: 'NGN', symbol: '₦', rate: 11.2, name: 'Nigerian Naira' },
  'South Africa': { code: 'ZAR', symbol: 'R', rate: 0.14, name: 'South African Rand' },
  'Ghana': { code: 'GHS', symbol: 'GH₵', rate: 0.095, name: 'Ghanaian Cedi' },
  'Ethiopia': { code: 'ETB', symbol: 'Br', rate: 0.95, name: 'Ethiopian Birr' },
  'Egypt': { code: 'EGP', symbol: 'E£', rate: 0.38, name: 'Egyptian Pound' },
  'Morocco': { code: 'MAD', symbol: 'DH', rate: 0.078, name: 'Moroccan Dirham' },
  'Algeria': { code: 'DZD', symbol: 'DA', rate: 1.05, name: 'Algerian Dinar' },
  'Tunisia': { code: 'TND', symbol: 'DT', rate: 0.024, name: 'Tunisian Dinar' },
  'Zimbabwe': { code: 'USD', symbol: '$', rate: 0.0078, name: 'US Dollar' },
  
  // International (Default to USD for PayPal)
  'DEFAULT': { code: 'USD', symbol: '$', rate: 0.0078, name: 'US Dollar' },
};

/**
 * Get currency information for a country
 */
export function getCurrencyForCountry(country: string | null | undefined): CurrencyInfo {
  if (!country) return CURRENCY_RATES['DEFAULT'];
  
  const currencyInfo = CURRENCY_RATES[country];
  return currencyInfo || CURRENCY_RATES['DEFAULT'];
}

/**
 * Convert KES amount to target currency
 */
export function convertFromKES(amountKES: number, country: string | null | undefined): number {
  const currency = getCurrencyForCountry(country);
  return Math.round(amountKES * currency.rate * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert from any currency back to KES
 */
export function convertToKES(amount: number, country: string | null | undefined): number {
  const currency = getCurrencyForCountry(country);
  return Math.round((amount / currency.rate) * 100) / 100; // Round to 2 decimal places
}

/**
 * Format price with currency symbol
 */
export function formatPrice(amountKES: number, country: string | null | undefined): string {
  const currency = getCurrencyForCountry(country);
  const convertedAmount = convertFromKES(amountKES, country);
  
  // Format with appropriate decimal places
  const formattedAmount = currency.code === 'KES' || currency.code === 'UGX' || currency.code === 'TZS' || currency.code === 'RWF' || currency.code === 'BIF'
    ? Math.round(convertedAmount).toLocaleString() // No decimals for large-value currencies
    : convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  return `${currency.symbol} ${formattedAmount}`;
}

/**
 * Get currency code for a country
 */
export function getCurrencyCode(country: string | null | undefined): string {
  return getCurrencyForCountry(country).code;
}

/**
 * Get currency symbol for a country
 */
export function getCurrencySymbol(country: string | null | undefined): string {
  return getCurrencyForCountry(country).symbol;
}

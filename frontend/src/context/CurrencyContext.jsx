import { createContext, useState, useEffect, useContext } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export const CurrencyContext = createContext();

const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
];

// Static fallback rates relative to USD (prices are stored in PKR)
const FALLBACK_RATES = { USD: 1, PKR: 278, EUR: 0.92, GBP: 0.79, AED: 3.67, SAR: 3.75 };

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('preferredCurrency') || 'USD';
  });
  const [rates, setRates] = useState(FALLBACK_RATES);
  const [ratesLoading, setRatesLoading] = useState(true);

  // Fetch live exchange rates (free tier, no key required)
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        if (data.result === 'success') {
          setRates(data.rates);
        }
      } catch {
        // silently fall back to static rates
      } finally {
        setRatesLoading(false);
      }
    };
    fetchRates();
    // Refresh every 30 minutes
    const interval = setInterval(fetchRates, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const changeCurrency = (code) => {
    setCurrency(code);
    localStorage.setItem('preferredCurrency', code);
  };

  // Prices are stored in PKR. Convert from PKR to the selected currency.
  const convert = (pkrAmount) => {
    if (!pkrAmount || isNaN(pkrAmount)) return 0;
    if (currency === 'PKR') return pkrAmount;
    const pkrRate = rates['PKR'] || 278;
    const inUSD = pkrAmount / pkrRate;
    const rate = rates[currency] || 1;
    return inUSD * rate;
  };

  const format = (pkrAmount) => {
    if (!pkrAmount || isNaN(pkrAmount)) return currency === 'PKR' ? '₨0' : '$0.00';
    const info = SUPPORTED_CURRENCIES.find((c) => c.code === currency);
    const symbol = info?.symbol || '₨';
    if (currency === 'PKR') return `₨${Math.round(pkrAmount).toLocaleString()}`;
    const converted = convert(pkrAmount);
    if (currency === 'SAR' || currency === 'AED') return `${symbol}${Math.round(converted).toLocaleString()}`;
    return `${symbol}${converted.toFixed(2)}`;
  };

  // Always format in PKR — prices are already in PKR so no conversion needed
  const formatPKR = (pkrAmount) => {
    if (!pkrAmount || isNaN(pkrAmount)) return '₨0';
    return `₨${Math.round(pkrAmount).toLocaleString()}`;
  };

  return (
    <CurrencyContext.Provider
      value={{ currency, changeCurrency, convert, format, formatPKR, rates, ratesLoading, SUPPORTED_CURRENCIES }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCurrency = () => useContext(CurrencyContext);

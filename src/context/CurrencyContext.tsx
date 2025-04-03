
import React, { createContext, useContext, useState, useEffect } from "react";

interface Currency {
  code: string;
  symbol: string;
  format: string;
}

interface CurrencyContextType {
  currency: Currency;
  setCurrencyCode: (code: string) => void;
  setNumberFormat: (format: string) => void;
  formatAmount: (amount: number) => string;
}

const currencies: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "CA$",
  AUD: "A$",
  CHF: "CHF",
  CNY: "¥"
};

const CurrencyContext = createContext<CurrencyContextType>({
  currency: { code: "INR", symbol: "₹", format: "1,000.00" },
  setCurrencyCode: () => {},
  setNumberFormat: () => {},
  formatAmount: () => "",
});

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>({
    code: "INR",
    symbol: "₹",
    format: "1,000.00"
  });

  useEffect(() => {
    // Load currency preferences from local storage on mount
    const storedCurrency = localStorage.getItem("currency") || "INR";
    const storedFormat = localStorage.getItem("numberFormat") || "1,000.00";
    
    setCurrency({
      code: storedCurrency,
      symbol: currencies[storedCurrency] || "₹",
      format: storedFormat
    });
  }, []);

  const setCurrencyCode = (code: string) => {
    setCurrency(prev => ({
      ...prev,
      code,
      symbol: currencies[code] || "₹"
    }));
    localStorage.setItem("currency", code);
  };

  const setNumberFormat = (format: string) => {
    setCurrency(prev => ({
      ...prev,
      format
    }));
    localStorage.setItem("numberFormat", format);
  };

  const formatAmount = (amount: number): string => {
    const { symbol, format } = currency;
    
    // Basic formatting based on selected format
    let formattedNumber = "";
    switch (format) {
      case "1,000.00":
        formattedNumber = amount.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        break;
      case "1 000,00":
        formattedNumber = amount.toLocaleString('fr-FR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        break;
      case "1.000,00":
        formattedNumber = amount.toLocaleString('de-DE', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        break;
      default:
        formattedNumber = amount.toFixed(2);
    }
    
    return `${symbol}${formattedNumber}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrencyCode, setNumberFormat, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
};

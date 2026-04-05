import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

interface CurrencyContextType {
  exchangeRate: number;
  isLoading: boolean;
  toINR: (usdc: number) => number;
  toUSDC: (inr: number) => number;
  formatINR: (usdc: number, hideSymbol?: boolean) => string;
  formatUSDC: (usdc: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [exchangeRate, setExchangeRate] = useState<number>(88.50); // Default fallback
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getRate = async () => {
      try {
        const { rate } = await api.fetchExchangeRate();
        setExchangeRate(rate);
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getRate();
    // Refresh every 10 minutes
    const interval = setInterval(getRate, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const toINR = (usdc: number) => usdc * exchangeRate;
  const toUSDC = (inr: number) => inr / exchangeRate;

  const formatINR = (usdc: number, hideSymbol = false) => {
    const inrValue = toINR(usdc);
    return `${hideSymbol ? '' : '₹'}${inrValue.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatUSDC = (usdc: number) => {
    return `$${usdc.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <CurrencyContext.Provider value={{ exchangeRate, isLoading, toINR, toUSDC, formatINR, formatUSDC }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

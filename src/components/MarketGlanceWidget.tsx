'use client';

import React, { useState, useEffect } from 'react';

// Helper function to format indices - show raw API values without decimals
const formatIndexValue = (value: string | number | undefined | null): string => {
  if (value === null || value === undefined || value === '') return 'N/A';
  
  // Handle comma-separated numbers from API
  let num: number;
  if (typeof value === 'string') {
    // Remove commas and parse as float
    const cleanValue = value.replace(/,/g, '');
    num = parseFloat(cleanValue);
  } else {
    num = value;
  }
  
  if (isNaN(num)) return 'N/A';
  
  const result = Math.floor(num).toString();
  
  // Show raw API value but remove decimals
  return result;
};

// Helper function to format ETF prices with rupee symbol
const formatETFPrice = (value: string | number | undefined | null): string => {
  if (value === null || value === undefined || value === '') return 'N/A';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'N/A';
  return `₹${num.toFixed(2)}`;
};

// Helper function to format percentages with 2 decimals
const formatPercentage = (value: string | number | undefined | null): string => {
  if (value === null || value === undefined || value === '') return 'N/A';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? 'N/A' : num.toFixed(2);
};

// Helper function to get color class for percentage values
const getColorClass = (value: string | number | undefined | null): string => {
  if (value === null || value === undefined || value === '') return 'text-gray-400';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'text-gray-400';
  return num >= 0 ? 'text-green-600' : 'text-red-600';
};

// Data interfaces - Adjust to match your page.tsx types
interface Index {
  name: string;
  current_price: string | number;
  daily_change_pct: string | number;
  returns: { '1m'?: string | number; '6m'?: string | number; '1y'?: string | number; '2y'?: string | number };
}
interface ETF {
  name: string;
  current_price: string | number;
  daily_change_pct: string | number;
  returns: { '1m'?: string | number; '6m'?: string | number; '1y'?: string | number; '2y'?: string | number };
}
interface Sector {
  name: string;
  current_price?: string | number;
  daily_change_pct: string | number;
  returns: { '1m'?: string | number; '6m'?: string | number; '1y'?: string | number; '2y'?: string | number };
}

// Table Components - REPLACE THESE WITH YOUR FULL CODE FROM page.tsx (keep all columns/colors/tooltips)
const IndicesPerformanceCard: React.FC<{ indices: Index[] }> = ({ indices }) => {
  return (
    <div className="space-y-1">
      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Indices Performance</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-1 px-2 font-medium text-gray-600">Index</th>
              <th className="text-right py-1 px-2 font-medium text-gray-600">Value</th>
              <th className="text-right py-1 px-2 font-medium text-gray-600" title="1 Day">1D</th>
              <th className="text-right py-1 px-2 font-medium text-gray-600" title="1 Month">1M</th>
              <th className="text-right py-1 px-2 font-medium text-gray-600" title="6 Months">6M</th>
              <th className="text-right py-1 px-2 font-medium text-gray-600" title="1 Year">1Y</th>
              <th className="text-right py-1 px-2 font-medium text-gray-600" title="2 Years">2Y</th>
            </tr>
          </thead>
          <tbody>
            {indices.map((index) => (
              <tr key={index.name} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-2 font-medium text-gray-900">{index.name}</td>
                <td className="py-2 px-2 text-right text-gray-900">{formatIndexValue(index.current_price)}</td>
                <td className="py-2 px-2 text-right">
                  <span className={`font-medium ${getColorClass(index.daily_change_pct)}`}>
                    {formatPercentage(index.daily_change_pct)}%
                  </span>
                </td>
                <td className="py-2 px-2 text-right">
                  <span className={`font-medium ${getColorClass(index.returns['1m'])}`}>
                    {formatPercentage(index.returns['1m'])}%
                  </span>
                </td>
                <td className="py-2 px-2 text-right">
                  <span className={`font-medium ${getColorClass(index.returns['6m'])}`}>
                    {formatPercentage(index.returns['6m'])}%
                  </span>
                </td>
                <td className="py-2 px-2 text-right">
                  <span className={`font-medium ${getColorClass(index.returns['1y'])}`}>
                    {formatPercentage(index.returns['1y'])}%
                  </span>
                </td>
                <td className="py-2 px-2 text-right">
                  <span className={`font-medium ${getColorClass(index.returns['2y'])}`}>
                    {formatPercentage(index.returns['2y'])}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ETFsPerformanceCard: React.FC<{ etfs: ETF[] }> = ({ etfs }) => (
  <div className="space-y-1">
    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">ETFs Performance</h4>
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-1 px-2 font-medium text-gray-600">ETF</th>
            <th className="text-right py-1 px-2 font-medium text-gray-600">Price</th>
            <th className="text-right py-1 px-2 font-medium text-gray-600" title="1 Day">1D</th>
            <th className="text-right py-1 px-2 font-medium text-gray-600" title="1 Month">1M</th>
            <th className="text-right py-1 px-2 font-medium text-gray-600" title="6 Months">6M</th>
            <th className="text-right py-1 px-2 font-medium text-gray-600" title="1 Year">1Y</th>
            <th className="text-right py-1 px-2 font-medium text-gray-600" title="2 Years">2Y</th>
          </tr>
        </thead>
        <tbody>
          {etfs.map((etf) => (
            <tr key={etf.name} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-2 px-2 font-medium text-gray-900">{etf.name}</td>
              <td className="py-2 px-2 text-right text-gray-900">{formatETFPrice(etf.current_price)}</td>
              <td className="py-2 px-2 text-right">
                <span className={`font-medium ${getColorClass(etf.daily_change_pct)}`}>
                  {formatPercentage(etf.daily_change_pct)}%
                </span>
              </td>
              <td className="py-2 px-2 text-right">
                <span className={`font-medium ${getColorClass(etf.returns['1m'])}`}>
                  {formatPercentage(etf.returns['1m'])}%
                </span>
              </td>
              <td className="py-2 px-2 text-right">
                <span className={`font-medium ${getColorClass(etf.returns['6m'])}`}>
                  {formatPercentage(etf.returns['6m'])}%
                </span>
              </td>
              <td className="py-2 px-2 text-right">
                <span className={`font-medium ${getColorClass(etf.returns['1y'])}`}>
                  {formatPercentage(etf.returns['1y'])}%
                </span>
              </td>
              <td className="py-2 px-2 text-right">
                <span className={`font-medium ${getColorClass(etf.returns['2y'])}`}>
                  {formatPercentage(etf.returns['2y'])}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const SectorsPerformanceTable: React.FC<{ sectors: Sector[] }> = ({ sectors }) => (
  <div className="space-y-1">
    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Sectoral Performance</h4>
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-1 px-2 font-medium text-gray-600">Sector</th>
            <th className="text-right py-1 px-2 font-medium text-gray-600">Value</th>
            <th className="text-right py-1 px-2 font-medium text-gray-600" title="1 Day">1D</th>
            <th className="text-right py-1 px-2 font-medium text-gray-600" title="1 Month">1M</th>
            <th className="text-right py-1 px-2 font-medium text-gray-600" title="6 Months">6M</th>
            <th className="text-right py-1 px-2 font-medium text-gray-600" title="1 Year">1Y</th>
            <th className="text-right py-1 px-2 font-medium text-gray-600" title="2 Years">2Y</th>
          </tr>
        </thead>
        <tbody>
          {sectors.map((sector) => (
            <tr key={sector.name} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-2 px-2 font-medium text-gray-900">{sector.name}</td>
              <td className="py-2 px-2 text-right text-gray-900">{formatIndexValue(sector.current_price)}</td>
              <td className="py-2 px-2 text-right">
                <span className={`font-medium ${getColorClass(sector.daily_change_pct)}`}>
                  {formatPercentage(sector.daily_change_pct)}%
                </span>
              </td>
              <td className="py-2 px-2 text-right">
                <span className={`font-medium ${getColorClass(sector.returns['1m'])}`}>
                  {formatPercentage(sector.returns['1m'])}%
                </span>
              </td>
              <td className="py-2 px-2 text-right">
                <span className={`font-medium ${getColorClass(sector.returns['6m'])}`}>
                  {formatPercentage(sector.returns['6m'])}%
                </span>
              </td>
              <td className="py-2 px-2 text-right">
                <span className={`font-medium ${getColorClass(sector.returns['1y'])}`}>
                  {formatPercentage(sector.returns['1y'])}%
                </span>
              </td>
              <td className="py-2 px-2 text-right">
                <span className={`font-medium ${getColorClass(sector.returns['2y'])}`}>
                  {formatPercentage(sector.returns['2y'])}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

interface Props {
  sectors: Sector[];
  etfs: ETF[];
  indices: Index[];
  financialLoading: boolean;
  financialData?: any;
}

export default function MarketGlanceWidget({ sectors, etfs, indices, financialLoading, financialData }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load modal state from localStorage
  useEffect(() => {
    const savedModalState = localStorage.getItem('marketGlanceModalOpen');
    if (savedModalState !== null) {
      setIsModalOpen(JSON.parse(savedModalState));
    }
  }, []);

  // Save modal state to localStorage
  useEffect(() => {
    localStorage.setItem('marketGlanceModalOpen', JSON.stringify(isModalOpen));
  }, [isModalOpen]);

  // Escape key handler for closing modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isModalOpen]);

  if (financialLoading) {
    return (
      <button
        disabled
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gray-400 rounded-full shadow-lg flex items-center justify-center text-white opacity-50 cursor-not-allowed"
        aria-label="Market Data Loading"
      >
        <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    );
  }

  if (!financialData || (sectors.length === 0 && etfs.length === 0 && indices.length === 0)) {
    return null;
  }

  return (
    <>
      {/* Circular FAB for Desktop and Mobile */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-transform duration-200 group"
        aria-label="Open Market Data"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        {/* Tooltip for desktop only */}
        <span className="absolute right-full mr-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none hidden md:block">
          Market Glance
        </span>
      </button>

      {/* Modal for Desktop and Mobile */}
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
            aria-hidden="true"
          />
          
          {/* Modal Content - Full screen on mobile, centered panel on desktop */}
          <div
            className="fixed inset-0 z-[60] md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[90vw] md:max-w-[600px] md:h-[85vh] bg-white shadow-2xl rounded-2xl overflow-hidden transition-all duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="market-glance-title"
          >
            {/* Sticky header with close button */}
            <div className="sticky top-0 bg-gradient-to-r from-gray-50 via-gray-100 to-gray-200 border-b border-gray-200 p-4 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 id="market-glance-title" className="text-lg font-semibold text-gray-900">Market Glance</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                aria-label="Close Market Data"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tables */}
            <div className="overflow-y-auto h-full md:h-[calc(100%-73px)] p-4 space-y-6 pb-24">
              <IndicesPerformanceCard indices={indices} />
              <ETFsPerformanceCard etfs={etfs} />
              <SectorsPerformanceTable sectors={sectors} />
            </div>
          </div>
        </>
      )}
    </>
  );
}

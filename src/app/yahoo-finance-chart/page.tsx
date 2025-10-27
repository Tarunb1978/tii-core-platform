'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

// Type definitions for Yahoo Finance API response
interface YahooFinanceResponse {
  chart: {
    result: Array<{
      meta: {
        symbol: string;
        currency: string;
        exchangeName: string;
      };
      timestamp: number[];
      indicators: {
        quote: Array<{
          close: number[];
          high: number[];
          low: number[];
          open: number[];
        }>;
      };
    }>;
    error: any;
  };
}

// Chart options configuration
const getChartOptions = (symbol: string, chartData?: { series: [number, number][] }) => ({
  chart: {
    type: 'line' as const,
    height: 400,
    toolbar: {
      show: true,
    },
    zoom: {
      enabled: true,
    },
    // Ensure chart displays full data range
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 800,
    },
    // Force chart to redraw with full data
    redrawOnParentResize: true,
    redrawOnWindowResize: true,
  },
  title: {
    text: `1 Year Closing Prices for ${symbol}`,
    align: 'center' as const,
    style: {
      fontSize: '16px',
      fontWeight: 'bold',
    },
  },
  xaxis: {
    type: 'datetime' as const,
    labels: {
      format: 'MMM yyyy',
      rotate: -45,
      // Force all month labels to be shown
      show: true,
      style: {
        fontSize: '12px',
      },
    },
    title: {
      text: 'Date',
    },
    // Force display of full 1-year range by setting explicit min/max
    min: chartData && chartData.series.length > 0 ? chartData.series[0][0] : undefined,
    max: chartData && chartData.series.length > 0 ? chartData.series[chartData.series.length - 1][0] : undefined,
    // Increase tick amount to ensure all months are shown
    tickAmount: 15, // Show more ticks to ensure all months appear
    forceNiceScale: false, // Disable nice scaling to show exact months
    // Alternative: Use explicit tick placement for months
    tickPlacement: 'on',
    // Ensure even distribution of time intervals
    axisTicks: {
      show: true,
    },
    axisBorder: {
      show: true,
    },
  },
  yaxis: {
    title: {
      text: 'Price (₹)',
    },
    labels: {
      formatter: (value: number) => `₹${value.toFixed(2)}`,
    },
  },
  stroke: {
    curve: 'smooth' as const,
    width: 2,
  },
  colors: ['#4A90E2'],
  grid: {
    borderColor: '#e7e7e7',
    strokeDashArray: 4,
  },
  tooltip: {
    x: {
      format: 'MMM dd, yyyy',
    },
    y: {
      formatter: (value: number) => `₹${value.toFixed(2)}`,
    },
  },
  dataLabels: {
    enabled: false,
  },
  markers: {
    size: 0,
    hover: {
      size: 6,
    },
  },
  // Ensure all data points are displayed
  noData: {
    text: 'No data available',
    align: 'center',
    verticalAlign: 'middle',
  },
});

export default function YahooFinanceStockChart() {
  // State management for the component
  const [symbol, setSymbol] = useState('');
  const [chartData, setChartData] = useState<{ series: [number, number][] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displaySymbol, setDisplaySymbol] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Function to normalize stock symbol (add .NS if not present)
  const normalizeSymbol = (inputSymbol: string): string => {
    const trimmedSymbol = inputSymbol.trim().toUpperCase();
    if (!trimmedSymbol.endsWith('.NS')) {
      return `${trimmedSymbol}.NS`;
    }
    return trimmedSymbol;
  };

  // Function to fetch stock data via Supabase Edge Function proxy
  const fetchStockData = async (stockSymbol: string) => {
    try {
      setLoading(true);
      setError(null);
      setErrorMessage(null); // Clear previous error messages
      setChartData(null); // Clear previous chart data

      // Normalize the symbol
      const normalizedSymbol = normalizeSymbol(stockSymbol);
      setDisplaySymbol(normalizedSymbol);

      // CHANGED: Use Supabase Edge Function proxy instead of direct Yahoo Finance API
      // MVP: Using 1 year range for comprehensive data view (user-selectable range is future enhancement)
      const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/yahoo-proxy?symbol=${encodeURIComponent(normalizedSymbol)}&range=1y&interval=1d`;
      
      // Fetch data via Supabase Edge Function proxy
      const response = await fetch(apiUrl);
      
      // Enhanced error handling for different HTTP status codes
      if (!response.ok) {
        if (response.status === 404) {
          setErrorMessage(`Data not found for ticker ${normalizedSymbol}. Please check the symbol and try again.`);
          return;
        } else if (response.status === 400) {
          setErrorMessage(`Invalid request for ticker ${normalizedSymbol}. Please verify the symbol format.`);
          return;
        } else if (response.status >= 500) {
          setErrorMessage(`Server error occurred. Please try again later.`);
          return;
        } else {
          setErrorMessage(`Failed to fetch data: HTTP ${response.status}`);
          return;
        }
      }

      const data: YahooFinanceResponse = await response.json();

      // Debug: Log the full API response structure
      
      if (data.chart?.result?.[0]) {
        const result = data.chart.result[0];
      }

      // Check if the API returned an error in the response body
      if (data.chart?.error) {
        setErrorMessage(`Invalid symbol: ${normalizedSymbol}. The ticker may not exist or may not be available.`);
        return;
      }
      
      // Check for error field in the response
      if (data?.error) {
        setErrorMessage(`API Error: ${data?.error}`);
        return;
      }

      // CHANGED: Parse response using new format for Supabase proxy
      const result = data.chart?.result?.[0];
      const closePrices = result?.indicators?.quote?.[0]?.close ?? [];
      const timestamps = result?.timestamp ?? [];

      // Check if we have valid data
      if (!result || closePrices.length === 0 || timestamps.length === 0) {
        setErrorMessage(`No data found for symbol: ${normalizedSymbol}. The ticker may not have sufficient historical data.`);
        return;
      }

      // Debug: Log data lengths to verify we're getting full 1-year data
      
      // Debug: Log first and last timestamps to see actual date range
      if (timestamps.length > 0) {
        const firstDate = new Date(timestamps[0] * 1000);
        const lastDate = new Date(timestamps[timestamps.length - 1] * 1000);
        
        // Debug: Check for timestamp duplicates or gaps
        const sortedTimestamps = [...timestamps].sort((a, b) => a - b);
        const duplicates = sortedTimestamps.filter((ts, i) => i > 0 && ts === sortedTimestamps[i - 1]);
        
        // Debug: Check for large gaps in timestamps
        const gaps = [];
        for (let i = 1; i < sortedTimestamps.length; i++) {
          const gap = sortedTimestamps[i] - sortedTimestamps[i - 1];
          if (gap > 7 * 24 * 60 * 60) { // More than 7 days gap
            gaps.push({
              from: new Date(sortedTimestamps[i - 1] * 1000).toLocaleDateString(),
              to: new Date(sortedTimestamps[i] * 1000).toLocaleDateString(),
              gapDays: Math.ceil(gap / (24 * 60 * 60))
            });
          }
        }
        
        // Debug: Specifically check March 2025 data
        const march2025Start = new Date('2025-03-01').getTime();
        const march2025End = new Date('2025-03-31').getTime();
        const march2025Timestamps = sortedTimestamps.filter(ts => {
          const timestampMs = ts * 1000;
          return timestampMs >= march2025Start && timestampMs <= march2025End;
        });
        if (march2025Timestamps.length > 0) {
        } else {
        }
        
        // Debug: Check for timestamp clustering (multiple timestamps on same day)
        const timestampClusters = {};
        sortedTimestamps.forEach(ts => {
          const dateKey = new Date(ts * 1000).toLocaleDateString();
          if (!timestampClusters[dateKey]) {
            timestampClusters[dateKey] = [];
          }
          timestampClusters[dateKey].push(ts);
        });
        
        const clusteredDates = Object.entries(timestampClusters).filter(([date, timestamps]) => timestamps.length > 1);
        if (clusteredDates.length > 0) {
        }
      }
      
      // Debug: Log sample of raw data

      // Filter out null/undefined/NaN prices (Yahoo Finance returns nulls for holidays/missing dates)
      // This ensures we only display valid trading days in our 1-year chart
      const mapped = timestamps.map((ts, i) => ({ 
        date: ts * 1000, // Convert Unix timestamp to milliseconds for JavaScript Date
        price: closePrices[i] 
      }));
      
      // Debug: Log mapping results
      
      // Count null/undefined prices
      const nullCount = mapped.filter(pt => pt.price == null || isNaN(pt.price)).length;
      
      // Filter out invalid data points (null/NaN prices and invalid timestamps)
      const filtered = mapped.filter(pt => 
        pt.price != null && 
        !isNaN(pt.price) && 
        pt.date != null && 
        !isNaN(pt.date) &&
        pt.date > 0
      );
      
      // CRITICAL: Sort data by timestamp ascending to ensure strictly increasing x-axis timescale
      // This eliminates bunched or uneven spacing on the x-axis for time series data
      const sortedData = filtered.sort((a, b) => a.date - b.date);
      
      // Remove duplicate timestamps to prevent data compression issues
      const uniqueData = [];
      const seenTimestamps = new Set();
      
      for (const point of sortedData) {
        if (!seenTimestamps.has(point.date)) {
          seenTimestamps.add(point.date);
          uniqueData.push(point);
        }
      }
      
      
      // Debug: Log sorting results
      if (uniqueData.length > 0) {
        
        // Debug: Check for any remaining timestamp issues
        const timestamps = uniqueData.map(p => p.date);
        const isStrictlyIncreasing = timestamps.every((ts, i) => i === 0 || ts > timestamps[i - 1]);
      }

      if (uniqueData.length === 0) {
        setErrorMessage('No chart data available for this symbol/timeframe. The ticker may not have valid trading data.');
        return;
      }

      
      // Debug: Log date range to verify we have full 1-year data
      if (uniqueData.length > 0) {
        const startDate = new Date(uniqueData[0].date);
        const endDate = new Date(uniqueData[uniqueData.length - 1].date);
        
        // Debug: Check March 2025 in final processed data
        const march2025Data = uniqueData.filter(point => {
          const pointDate = new Date(point.date);
          return pointDate.getFullYear() === 2025 && pointDate.getMonth() === 2; // March is month 2 (0-indexed)
        });
        if (march2025Data.length > 0) {
        } else {
        }
        
        // Debug: Show monthly distribution of final data
        const monthlyDistribution = {};
        uniqueData.forEach(point => {
          const date = new Date(point.date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlyDistribution[monthKey] = (monthlyDistribution[monthKey] || 0) + 1;
        });
      }

      // For ApexCharts datetime type, data should be [timestamp, value] pairs in strictly increasing order
      // This format allows ApexCharts to automatically handle date formatting and scaling
      const seriesData = uniqueData.map(pt => [pt.date, pt.price]);
      setChartData({ series: seriesData });

    } catch (err) {
      console.error('Error fetching stock data:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to fetch stock data. Please try again.');
      setChartData(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbol.trim()) {
      fetchStockData(symbol.trim());
    }
  };

  // Prepare chart series data for ApexCharts
  const chartSeries = chartData ? [{
    name: 'Closing Price',
    data: chartData.series, // Already in [timestamp, value] format
  }] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Yahoo Finance Stock Chart
            </h1>
            <p className="text-gray-600">
              View 1-year stock price charts for NSE stocks using real-time data from Yahoo Finance.
            </p>
          </div>

          {/* Stock Symbol Input Form */}
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Symbol
                </label>
                <input
                  type="text"
                  id="symbol"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="Enter stock symbol (e.g., TCS, INFY, HDFCBANK)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  .NS suffix will be automatically added for NSE stocks
                </p>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading || !symbol.trim()}
                  className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Loading...
                    </div>
                  ) : (
                    'Get Chart'
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Error Message */}
          {(error || errorMessage) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {errorMessage ? 'Chart Unavailable' : 'Error'}
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {errorMessage || error}
                  </div>
                  {errorMessage && (
                    <div className="mt-2 text-xs text-red-600">
                      Chart is currently not available for this symbol.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Chart Display - Only show when we have valid data and no errors */}
          {chartData && !errorMessage && (
            <div className="mt-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <Chart
                  options={getChartOptions(displaySymbol, chartData)}
                  series={chartSeries}
                  type="line"
                  height={400}
                />
              </div>
              
              {/* Chart Info */}
              <div className="mt-4 text-sm text-gray-600">
                <p>
                  <strong>Symbol:</strong> {displaySymbol} | 
                  <strong> Data Points:</strong> {chartData.series.length} | 
                  <strong> Period:</strong> 1 year
                </p>
              </div>
            </div>
          )}

          {/* Instructions */}
          {!chartData && !loading && !error && !errorMessage && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                How to use:
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Enter any NSE stock symbol (e.g., TCS, INFY, HDFCBANK)</li>
                <li>• The .NS suffix will be automatically added</li>
                <li>• Click "Get Chart" to fetch and display 1 year of price data</li>
                <li>•• The chart is interactive - you can zoom and hover for details</li>
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

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

interface YahooFinanceChartProps {
  symbol: string;
  initialData?: any;
  height?: number;
  showTitle?: boolean;
}

// Chart options configuration
const getChartOptions = (symbol: string, chartData?: { series: [number, number][] }, showTitle: boolean = true) => {
  console.log('[DIAGNOSTIC] Creating chart options:', {
    symbol,
    hasChartData: !!chartData,
    dataLength: chartData?.series?.length,
    showTitle,
    timestamp: Date.now()
  });
  
  return {
  chart: {
    type: 'line' as const,
    height: '100%',
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
  title: showTitle ? {
    text: `1 Year Closing Prices for ${symbol}`,
    align: 'center' as const,
    style: {
      fontSize: '16px',
      fontWeight: 'bold',
    },
  } : undefined,
  xaxis: {
    type: 'datetime' as const,
    labels: {
      format: 'MMM yyyy',
      rotate: -45,
      show: true, // Force all month labels to be shown
      style: {
        fontSize: '12px',
      },
    },
    title: {
      text: 'Date',
    },
    min: chartData && chartData.series.length > 0 ? chartData.series[0][0] : undefined,
    max: chartData && chartData.series.length > 0 ? chartData.series[chartData.series.length - 1][0] : undefined,
    tickAmount: 15, // Show more ticks to ensure all months appear
    forceNiceScale: false, // Disable nice scaling to show exact months
    tickPlacement: 'on', // Ensure ticks are placed on the axis line
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
      formatter: (value: number) => {
        // Simplified formatter - no event references
        console.log('[DIAGNOSTIC] Tooltip Y formatter called with value:', value);
        return `₹${value.toFixed(2)}`;
      }
    },
    // Add custom tooltip to debug all parameters
    custom: (opt: any) => {
      console.log('[DIAGNOSTIC] Custom tooltip callback:', {
        seriesIndex: opt.seriesIndex,
        dataPointIndex: opt.dataPointIndex,
        w: opt.w ? Object.keys(opt.w) : 'N/A',
        hasOffsetY: opt.w?.chartY !== undefined,
        chartY: opt.w?.chartY,
        cursorOffsetY: opt.w?.cursorOffsetY,
        timestamp: Date.now()
      });
      return '<div></div>';
    }
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
  noData: {
    text: 'No data available',
    align: 'center',
    verticalAlign: 'middle',
  },
  events: {
    mounted: (chartContext: any, config: any) => {
      console.log('[DIAGNOSTIC] ApexCharts mounted event:', {
        hasContext: !!chartContext,
        hasConfig: !!config,
        chartContextType: chartContext?.constructor?.name,
        timestamp: Date.now()
      });
    },
    init: (chartContext: any, config: any) => {
      console.log('[DIAGNOSTIC] ApexCharts init event:', {
        hasContext: !!chartContext,
        hasConfig: !!config,
        chartContextType: chartContext?.constructor?.name,
        timestamp: Date.now()
      });
    },
    rendered: () => {
      console.log('[DIAGNOSTIC] ApexCharts rendered event');
    }
  }
  };
};

export default function YahooFinanceChart({ 
  symbol, 
  initialData, 
  height = 400, 
  showTitle = true
}: YahooFinanceChartProps) {
  const [chartData, setChartData] = useState<{ series: [number, number][] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displaySymbol, setDisplaySymbol] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    console.log('[DIAGNOSTIC] YahooFinanceChart mounting, symbol:', symbol);
    setIsMounted(true);
    console.log('[DIAGNOSTIC] isMounted set to true');
  }, [symbol]);

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
      setErrorMessage(null);
      setChartData(null);

      const normalizedSymbol = normalizeSymbol(stockSymbol);
      setDisplaySymbol(normalizedSymbol);

      const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/yahoo-proxy?symbol=${encodeURIComponent(normalizedSymbol)}&range=1y&interval=1d`;
      
      console.log('Fetching data from:', apiUrl);

      const response = await fetch(apiUrl);
      
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

      if (data.chart?.error) {
        setErrorMessage(`Invalid symbol: ${normalizedSymbol}. The ticker may not exist or may not be available.`);
        return;
      }
      
      if (data.error) {
        setErrorMessage(`API Error: ${data.error}`);
        return;
      }

      const result = data.chart?.result?.[0];
      const closePrices = result?.indicators?.quote?.[0]?.close ?? [];
      const timestamps = result?.timestamp ?? [];

      if (!result || closePrices.length === 0 || timestamps.length === 0) {
        setErrorMessage(`No data found for symbol: ${normalizedSymbol}. The ticker may not have sufficient historical data.`);
        return;
      }

      // Filter out null/undefined/NaN prices
      const mapped = timestamps.map((ts, i) => ({ 
        date: ts * 1000,
        price: closePrices[i] 
      }));
      
      const filtered = mapped.filter(pt => 
        pt.price != null && 
        !isNaN(pt.price) && 
        pt.date != null && 
        !isNaN(pt.date) &&
        pt.date > 0
      );

      // Sort data by timestamp ascending
      const sortedData = filtered.sort((a, b) => a.date - b.date);
      
      // Remove duplicate timestamps
      const uniqueData = [];
      const seenTimestamps = new Set();
      
      for (const point of sortedData) {
        if (!seenTimestamps.has(point.date)) {
          seenTimestamps.add(point.date);
          uniqueData.push(point);
        }
      }

      if (uniqueData.length === 0) {
        setErrorMessage('No chart data available for this symbol/timeframe. The ticker may not have valid trading data.');
        return;
      }

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

  // Fetch data when symbol changes
  useEffect(() => {
    if (symbol && symbol.trim()) {
      fetchStockData(symbol.trim());
    }
  }, [symbol]);

  // Prepare chart series data for ApexCharts
  const chartSeries = chartData ? [{
    name: 'Closing Price',
    data: chartData.series,
  }] : [];

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4" style={{ height: `${height}px` }}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading chart...</p>
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4" style={{ height: `${height}px` }}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <svg className="h-8 w-8 text-red-400 mx-auto mb-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  // Diagnostic: Log all render conditions
  console.log('[CHART RENDER] All conditions:', {
    loading: loading,
    errorMessage: errorMessage,
    hasChartData: !!chartData,
    chartDataLength: chartData?.series?.length || 0,
    isMounted: isMounted,
    chartSeriesLength: chartSeries.length,
    symbol: displaySymbol
  });

  // Simplified rendering: only check for valid data, not mounted state
  if (chartData && chartData.series && chartData.series.length > 0) {
    console.log('[CHART RENDER] ✅ RENDERING CHART with', chartData.series.length, 'data points');

    return (
      <div className="bg-gray-50 rounded-lg p-4" key="chart-container">
        <Chart
          key={`chart-${symbol}-${chartData.series.length}`}
          options={getChartOptions(displaySymbol, chartData, showTitle)}
          series={chartSeries}
          type="line"
          height={height}
        />
      </div>
    );
  }

  // Fallback for no data
  console.log('[CHART RENDER] ❌ Using fallback - no valid chart data');
  return (
    <div className="bg-gray-50 rounded-lg p-4" style={{ height: `${height}px` }}>
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-sm text-gray-600">No chart data available</p>
        </div>
      </div>
    </div>
  );
}
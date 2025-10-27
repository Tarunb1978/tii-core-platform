'use client';

import { useState, useEffect, useRef } from 'react';

interface SimpleStockChartProps {
  symbol: string;
  height?: number;
  showTitle?: boolean;
}

interface ChartData {
  date: string;
  price: number;
}

export default function SimpleStockChart({ 
  symbol, 
  height = 400, 
  showTitle = true 
}: SimpleStockChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to normalize stock symbol (add .NS if not present)
  const normalizeSymbol = (inputSymbol: string): string => {
    const trimmedSymbol = inputSymbol.trim().toUpperCase();
    if (!trimmedSymbol.endsWith('.NS')) {
      return `${trimmedSymbol}.NS`;
    }
    return trimmedSymbol;
  };

  // Function to fetch stock data
  const fetchStockData = async (stockSymbol: string) => {
    try {
      setLoading(true);
      setError(null);

      const normalizedSymbol = normalizeSymbol(stockSymbol);
      const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/yahoo-proxy?symbol=${encodeURIComponent(normalizedSymbol)}&range=1y&interval=1d`;
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: HTTP ${response.status}`);
      }

      const data = await response.json();
      const result = data.chart?.result?.[0];
      const closePrices = result?.indicators?.quote?.[0]?.close ?? [];
      const timestamps = result?.timestamp ?? [];

      if (!result || closePrices.length === 0 || timestamps.length === 0) {
        throw new Error('No data found for this symbol');
      }

      // Process data
      const chartData: ChartData[] = timestamps.map((ts: number, i: number) => ({
        date: new Date(ts * 1000).toISOString().split('T')[0],
        price: closePrices[i]
      })).filter((item: ChartData) => item.price != null && !isNaN(item.price));

      setData(chartData);

    } catch (err) {
      console.error('Error fetching stock data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stock data');
    } finally {
      setLoading(false);
    }
  };

  // Draw chart on canvas
  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height: canvasHeight } = canvas;
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = canvasHeight - 2 * padding;

    // Clear canvas
    ctx.clearRect(0, 0, width, canvasHeight);

    if (data.length === 0) return;

    // Find min/max values
    const prices = data.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    // Draw axes
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvasHeight - padding);
    ctx.stroke();

    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding, canvasHeight - padding);
    ctx.lineTo(width - padding, canvasHeight - padding);
    ctx.stroke();

    // Draw price line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((point, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = canvasHeight - padding - ((point.price - minPrice) / priceRange) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw data points
    ctx.fillStyle = '#3b82f6';
    data.forEach((point, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = canvasHeight - padding - ((point.price - minPrice) / priceRange) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    // Y-axis labels
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const price = minPrice + (i / ySteps) * priceRange;
      const y = canvasHeight - padding - (i / ySteps) * chartHeight;
      
      ctx.fillText(`₹${price.toFixed(2)}`, padding - 10, y + 4);
    }

    // X-axis labels (show every 30th point to avoid crowding)
    const xStep = Math.max(1, Math.floor(data.length / 6));
    for (let i = 0; i < data.length; i += xStep) {
      const x = padding + (i / (data.length - 1)) * chartWidth;
      const date = new Date(data[i].date);
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      
      ctx.fillText(month, x, canvasHeight - padding + 20);
    }
  };

  // Fetch data when symbol changes
  useEffect(() => {
    if (symbol && symbol.trim()) {
      fetchStockData(symbol.trim());
    }
  }, [symbol]);

  // Draw chart when data changes
  useEffect(() => {
    drawChart();
  }, [data]);

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

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4" style={{ height: `${height}px` }}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <svg className="h-8 w-8 text-red-400 mx-auto mb-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
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

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      {showTitle && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          1 Year Closing Prices for {normalizeSymbol(symbol)}
        </h3>
      )}
      <canvas
        ref={canvasRef}
        width={600}
        height={height}
        className="w-full h-full"
        style={{ maxWidth: '100%', height: `${height}px` }}
      />
      <div className="mt-2 text-sm text-gray-600 text-center">
        <p>
          <strong>Symbol:</strong> {normalizeSymbol(symbol)} | 
          <strong> Data Points:</strong> {data.length} | 
          <strong> Period:</strong> 1 year
        </p>
      </div>
    </div>
  );
}

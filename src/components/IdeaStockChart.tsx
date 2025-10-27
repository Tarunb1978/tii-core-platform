'use client';

import dynamic from 'next/dynamic';

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface IdeaStockChartProps {
  symbol: string;              // Display symbol (e.g., "TCS.NS")
  series: [number, number][];  // Pre-processed [timestamp, price] pairs
  height?: number;             // Chart height (default: 400)
  showTitle?: boolean;         // Show chart title (default: true)
}

// Chart options configuration - uses exact config from working yahoo-finance-chart page
const getChartOptions = (symbol: string, chartData?: { series: [number, number][] }, showTitle: boolean = true) => ({
  chart: {
    type: 'line' as const,
    height: 400,
    toolbar: {
      show: true,
    },
    zoom: {
      enabled: true,
    },
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 800,
    },
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
      show: true,
      style: {
        fontSize: '12px',
      },
    },
    title: {
      text: 'Date',
    },
    min: chartData && chartData.series.length > 0 ? chartData.series[0][0] : undefined,
    max: chartData && chartData.series.length > 0 ? chartData.series[chartData.series.length - 1][0] : undefined,
    tickAmount: 15,
    forceNiceScale: false,
    tickPlacement: 'on',
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
  noData: {
    text: 'No data available',
    align: 'center',
    verticalAlign: 'middle',
  },
});

export default function IdeaStockChart({ 
  symbol, 
  series, 
  height = 400, 
  showTitle = true
}: IdeaStockChartProps) {
  // Validate series
  if (!series || series.length === 0) {
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

  // Prepare for ApexCharts
  const chartSeries = [{
    name: 'Closing Price',
    data: series
  }];

  // Render chart
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <Chart
        options={getChartOptions(symbol, { series }, showTitle)}
        series={chartSeries}
        type="line"
        height={height}
        width="100%"
      />
    </div>
  );
}


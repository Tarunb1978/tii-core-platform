<!-- 81e564eb-8bb0-40f8-a5ba-7a012fc04cd0 576cc519-eaeb-4fb4-9a87-17f269470997 -->
# Update Market Data Tables with New Data Structure

## Problem

The current implementation needs to be updated to handle the new API response structure where:

- Data is in `financial_data.data.sectors`, `financial_data.data.indices`, `financial_data.data.etfs`
- **All three (sectors, indices, etfs) are ARRAYS, not objects**
- Each entity has `name`, `current_price`, `daily_change_pct`, and nested `returns` object with keys "1m", "6m", "1y", "2y"
- **No "1d" key exists in returns** - use `daily_change_pct` for 1D column
- Tables need to display all 5 return periods (1D, 1M, 6M, 1Y, 2Y) with proper color coding

## Changes Required

### 1. Update Type Definitions (lines 45-94)

**File:** `src/app/ideas-forum/page.tsx`

Update the Sector, ETF, and Index type definitions to match the API response:

```typescript
type Sector = {
  name: string;
  current_price: number | string;
  daily_change_pct: string;
  returns: {
    '1m'?: string;
    '6m'?: string;
    '1y'?: string;
    '2y'?: string;
  };
};

type ETF = {
  name: string;
  current_price: string | number;
  daily_change_pct: string;
  returns: {
    '1m'?: string;
    '6m'?: string;
    '1y'?: string;
    '2y'?: string;
  };
};

type Index = {
  name: string;
  current_price: string | number;
  daily_change_pct: string;
  returns: {
    '1m'?: string;
    '6m'?: string;
    '1y'?: string;
    '2y'?: string;
  };
};
```

### 2. Update parseInvestIndiaData Function (lines 343-469)

Replace the parsing logic to directly map the new API structure (arrays):

```typescript
function parseInvestIndiaData(rawData: any) {
  if (!rawData) {
    return {
      sectors: [],
      etfs: [],
      indices: [],
      market_sentiment: null
    };
  }

  // Extract from new structure: financial_data.data
  const data = rawData.financial_data?.data || {};
  
  console.log('Parsing financial data:', data);
  
  // Parse sectors - already an array in API response
  const parsedSectors: Sector[] = (data.sectors || []).map((sector: any) => ({
    name: sector.name,
    current_price: sector.current_price,
    daily_change_pct: sector.daily_change_pct || 'N/A',
    returns: {
      '1m': sector.returns?.['1m'] || 'N/A',
      '6m': sector.returns?.['6m'] || 'N/A',
      '1y': sector.returns?.['1y'] || 'N/A',
      '2y': sector.returns?.['2y'] || 'N/A'
    }
  }));

  // Parse ETFs - array in API response
  const parsedETFs: ETF[] = (data.etfs || []).map((etf: any) => ({
    name: etf.name,
    current_price: etf.current_price || 'N/A',
    daily_change_pct: etf.daily_change_pct || 'N/A',
    returns: {
      '1m': etf.returns?.['1m'] || 'N/A',
      '6m': etf.returns?.['6m'] || 'N/A',
      '1y': etf.returns?.['1y'] || 'N/A',
      '2y': etf.returns?.['2y'] || 'N/A'
    }
  }));

  // Parse indices - array in API response
  const parsedIndices: Index[] = (data.indices || []).map((index: any) => ({
    name: index.name,
    current_price: index.current_price || 'N/A',
    daily_change_pct: index.daily_change_pct || 'N/A',
    returns: {
      '1m': index.returns?.['1m'] || 'N/A',
      '6m': index.returns?.['6m'] || 'N/A',
      '1y': index.returns?.['1y'] || 'N/A',
      '2y': index.returns?.['2y'] || 'N/A'
    }
  }));

  console.log('Parsed sectors:', parsedSectors);
  console.log('Parsed ETFs:', parsedETFs);
  console.log('Parsed indices:', parsedIndices);

  return {
    sectors: parsedSectors,
    etfs: parsedETFs,
    indices: parsedIndices,
    market_sentiment: data.market_sentiment || null
  };
}
```

### 3. Update State Declarations (lines 650-656)

Change etfs and indices state to use arrays instead of objects:

```typescript
const [sectors, setSectors] = useState<Sector[]>([]);
const [etfs, setETFs] = useState<ETF[]>([]);
const [indices, setIndices] = useState<Index[]>([]);
```

### 4. Update SectorsPerformanceTable Component (lines 472-538)

Replace with 5-column table structure (1D uses daily_change_pct):

```typescript
function SectorsPerformanceTable({ sectors }: { sectors: Sector[] }) {
  if (sectors.length === 0) return null;

  // Helper to parse percentage and determine color
  const getColorClass = (value: string) => {
    if (value === 'N/A' || value === '-') return 'text-gray-400';
    const numValue = parseFloat(value.replace('%', ''));
    return isNaN(numValue) ? 'text-gray-400' : numValue >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📈</span>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Sectoral Performance
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            Returns across 5 periods: 1D, 1M, 6M, 1Y, 2Y
          </p>
        </div>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full table-fixed divide-y divide-blue-200">
          <thead className="bg-blue-100">
            <tr>
              <th className="w-1/4 px-2 py-2 text-left text-xs font-medium text-blue-800 uppercase">Sector</th>
              <th className="w-3/20 px-1 py-2 text-center text-xs font-medium text-blue-800 uppercase">1D</th>
              <th className="w-3/20 px-1 py-2 text-center text-xs font-medium text-blue-800 uppercase">1M</th>
              <th className="w-3/20 px-1 py-2 text-center text-xs font-medium text-blue-800 uppercase">6M</th>
              <th className="w-3/20 px-1 py-2 text-center text-xs font-medium text-blue-800 uppercase">1Y</th>
              <th className="w-3/20 px-1 py-2 text-center text-xs font-medium text-blue-800 uppercase">2Y</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sectors.map((sector, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-2 py-2 text-xs font-medium text-gray-900 truncate" title={sector.name}>
                  {sector.name}
                </td>
                <td className="px-1 py-2 text-center text-xs">
                  <span className={`font-medium ${getColorClass(sector.daily_change_pct)}`}>
                    {sector.daily_change_pct}
                  </span>
                </td>
                <td className="px-1 py-2 text-center text-xs">
                  <span className={`font-medium ${getColorClass(sector.returns['1m'] || 'N/A')}`}>
                    {sector.returns['1m'] || 'N/A'}
                  </span>
                </td>
                <td className="px-1 py-2 text-center text-xs">
                  <span className={`font-medium ${getColorClass(sector.returns['6m'] || 'N/A')}`}>
                    {sector.returns['6m'] || 'N/A'}
                  </span>
                </td>
                <td className="px-1 py-2 text-center text-xs">
                  <span className={`font-medium ${getColorClass(sector.returns['1y'] || 'N/A')}`}>
                    {sector.returns['1y'] || 'N/A'}
                  </span>
                </td>
                <td className="px-1 py-2 text-center text-xs">
                  <span className={`font-medium ${getColorClass(sector.returns['2y'] || 'N/A')}`}>
                    {sector.returns['2y'] || 'N/A'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### 5. Update ETFsPerformanceCard Component (lines 540-572)

Update to show 5-column table for ETFs array:

```typescript
function ETFsPerformanceCard({ etfs }: { etfs: ETF[] }) {
  if (etfs.length === 0) return null;

  const getColorClass = (value: string) => {
    if (value === 'N/A' || value === '-') return 'text-gray-400';
    const numValue = parseFloat(value.replace('%', ''));
    return isNaN(numValue) ? 'text-gray-400' : numValue >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📊</span>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">ETFs Performance</h3>
          <p className="text-xs text-gray-600 mt-1">Returns across 5 periods: 1D, 1M, 6M, 1Y, 2Y</p>
        </div>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-green-100">
            <tr>
              <th className="px-2 py-1 text-left text-xs font-medium text-green-800 uppercase">ETF</th>
              <th className="px-1 py-1 text-center text-xs font-medium text-green-800 uppercase">Price</th>
              <th className="px-1 py-1 text-center text-xs font-medium text-green-800 uppercase">1D</th>
              <th className="px-1 py-1 text-center text-xs font-medium text-green-800 uppercase">1M</th>
              <th className="px-1 py-1 text-center text-xs font-medium text-green-800 uppercase">6M</th>
              <th className="px-1 py-1 text-center text-xs font-medium text-green-800 uppercase">1Y</th>
              <th className="px-1 py-1 text-center text-xs font-medium text-green-800 uppercase">2Y</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {etfs.map((etf, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-2 py-1 text-xs font-medium text-gray-900 truncate">{etf.name}</td>
                <td className="px-1 py-1 text-center text-xs text-gray-700">{etf.current_price}</td>
                <td className="px-1 py-1 text-center text-xs"><span className={`font-medium ${getColorClass(etf.daily_change_pct)}`}>{etf.daily_change_pct}</span></td>
                <td className="px-1 py-1 text-center text-xs"><span className={`font-medium ${getColorClass(etf.returns['1m'] || 'N/A')}`}>{etf.returns['1m'] || 'N/A'}</span></td>
                <td className="px-1 py-1 text-center text-xs"><span className={`font-medium ${getColorClass(etf.returns['6m'] || 'N/A')}`}>{etf.returns['6m'] || 'N/A'}</span></td>
                <td className="px-1 py-1 text-center text-xs"><span className={`font-medium ${getColorClass(etf.returns['1y'] || 'N/A')}`}>{etf.returns['1y'] || 'N/A'}</span></td>
                <td className="px-1 py-1 text-center text-xs"><span className={`font-medium ${getColorClass(etf.returns['2y'] || 'N/A')}`}>{etf.returns['2y'] || 'N/A'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### 6. Update IndicesPerformanceCard Component (lines 574-606)

Update to show 5-column table and filter for NIFTY 50 and SENSEX from array:

```typescript
function IndicesPerformanceCard({ indices }: { indices: Index[] }) {
  if (indices.length === 0) return null;

  const getColorClass = (value: string) => {
    if (value === 'N/A' || value === '-') return 'text-gray-400';
    const numValue = parseFloat(value.replace('%', ''));
    return isNaN(numValue) ? 'text-gray-400' : numValue >= 0 ? 'text-green-600' : 'text-red-600';
  };

  // Filter for NIFTY 50 and SENSEX only (case insensitive)
  const filteredIndices = indices.filter((index) => {
    const name = index.name.toLowerCase();
    return name.includes('nifty 50') || name.includes('sensex');
  });

  if (filteredIndices.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📊</span>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Indices Performance</h3>
          <p className="text-xs text-gray-600 mt-1">NIFTY 50 & SENSEX returns: 1D, 1M, 6M, 1Y, 2Y</p>
        </div>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-orange-100">
            <tr>
              <th className="px-2 py-1 text-left text-xs font-medium text-orange-800 uppercase">Index</th>
              <th className="px-1 py-1 text-center text-xs font-medium text-orange-800 uppercase">Price</th>
              <th className="px-1 py-1 text-center text-xs font-medium text-orange-800 uppercase">1D</th>
              <th className="px-1 py-1 text-center text-xs font-medium text-orange-800 uppercase">1M</th>
              <th className="px-1 py-1 text-center text-xs font-medium text-orange-800 uppercase">6M</th>
              <th className="px-1 py-1 text-center text-xs font-medium text-orange-800 uppercase">1Y</th>
              <th className="px-1 py-1 text-center text-xs font-medium text-orange-800 uppercase">2Y</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredIndices.map((index, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-2 py-1 text-xs font-medium text-gray-900 truncate">{index.name}</td>
                <td className="px-1 py-1 text-center text-xs text-gray-700">{index.current_price}</td>
                <td className="px-1 py-1 text-center text-xs"><span className={`font-medium ${getColorClass(index.daily_change_pct)}`}>{index.daily_change_pct}</span></td>
                <td className="px-1 py-1 text-center text-xs"><span className={`font-medium ${getColorClass(index.returns['1m'] || 'N/A')}`}>{index.returns['1m'] || 'N/A'}</span></td>
                <td className="px-1 py-1 text-center text-xs"><span className={`font-medium ${getColorClass(index.returns['6m'] || 'N/A')}`}>{index.returns['6m'] || 'N/A'}</span></td>
                <td className="px-1 py-1 text-center text-xs"><span className={`font-medium ${getColorClass(index.returns['1y'] || 'N/A')}`}>{index.returns['1y'] || 'N/A'}</span></td>
                <td className="px-1 py-1 text-center text-xs"><span className={`font-medium ${getColorClass(index.returns['2y'] || 'N/A')}`}>{index.returns['2y'] || 'N/A'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### 7. Update "No Data" Check (line 1085)

Update to check array length instead of object keys:

```typescript
{sectors.length === 0 && etfs.length === 0 && indices.length === 0 && !marketSentiment && (
```

## Expected Result

- Sectors table displays 5 columns: 1D (daily_change_pct), 1M, 6M, 1Y, 2Y with proper color coding
- ETFs table shows name, current price, and 5 return period columns
- Indices table filtered to show only NIFTY 50 and SENSEX with 5 return columns
- Missing data displays as "N/A" or "-"
- Percentage values stripped and parsed for color coding (green for positive, red for negative)
- Maintains existing UI styling and responsiveness
- Refresh button and loading states work correctly with new structure
- All data structures use arrays (not objects) matching the API response
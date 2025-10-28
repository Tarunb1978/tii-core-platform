/**
 * MarketCapClassifier.tsx
 * 
 * Utility function to classify companies into market cap categories
 * based on SEBI/AMFI 2025 Indian guidelines.
 * 
 * Classification thresholds:
 * - Large Cap: Market Cap > 75,000 crore
 * - Mid Cap: 30,600 crore < Market Cap <= 75,000 crore
 * - Small Cap: 11,000 crore < Market Cap <= 30,600 crore
 * - Micro Cap: Market Cap <= 11,000 crore
 */

export type MarketCapCategory = 'Large Cap' | 'Mid Cap' | 'Small Cap' | 'Micro Cap' | 'Unknown';

/**
 * Converts a market cap string or number to a numeric value in crores.
 * Handles formatted strings like "22,088 Crs", "1,50,000 Crores", etc.
 * 
 * @param value - Market cap as string (e.g., "22,088 Crs") or number
 * @returns Numeric value in crores, or null if invalid
 */
function parseMarketCapValue(value: string | number | null | undefined): number | null {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return null;
  }

  // If already a number, return as is
  if (typeof value === 'number') {
    return value;
  }

  // If string, extract numeric value
  if (typeof value === 'string') {
    // Remove common suffixes (Crs, Crores, Cr)
    const cleaned = value.trim()
      .replace(/Crs|Crores|Cr|₹|,/gi, '')
      .replace(/\s+/g, '');
    
    // Convert to number
    const numericValue = parseFloat(cleaned);
    
    // Return null if not a valid number
    if (isNaN(numericValue) || !isFinite(numericValue)) {
      return null;
    }
    
    return numericValue;
  }

  return null;
}

/**
 * Classifies a company's market capitalization into SEBI categories.
 * 
 * Classification logic:
 * 1. Large Cap: > 75,000 crore (Top 100 companies by market cap)
 * 2. Mid Cap: 30,600 to 75,000 crore (101-250 ranked companies)
 * 3. Small Cap: 11,000 to 30,600 crore (251-500 ranked companies)
 * 4. Micro Cap: <= 11,000 crore (beyond top 500 companies)
 * 
 * @param marketCap - Market cap as string (e.g., "22,088 Crs") or number in crores
 * @returns Classification string or 'Unknown' if invalid input
 * 
 * @example
 * classifyMarketCap("22,088 Crs") // Returns "Small Cap"
 * classifyMarketCap(75001) // Returns "Large Cap"
 * classifyMarketCap("5000") // Returns "Micro Cap"
 */
export function classifyMarketCap(marketCap: string | number | null | undefined): MarketCapCategory {
  // Parse the input value to a number
  const numericValue = parseMarketCapValue(marketCap);
  
  // Handle invalid input
  if (numericValue === null) {
    return 'Unknown';
  }
  
  // Classification based on SEBI/AMFI 2025 thresholds
  if (numericValue > 75000) {
    return 'Large Cap';
  } else if (numericValue > 30600) {
    return 'Mid Cap';
  } else if (numericValue > 11000) {
    return 'Small Cap';
  } else {
    return 'Micro Cap';
  }
}

/**
 * Gets the color scheme for a market cap category (for UI theming).
 * 
 * @param category - Market cap category
 * @returns Color name as string
 */
export function getMarketCapColor(category: MarketCapCategory): string {
  switch (category) {
    case 'Large Cap':
      return 'blue'; // Stable, established companies
    case 'Mid Cap':
      return 'green'; // Growth potential
    case 'Small Cap':
      return 'yellow'; // Higher risk, higher reward
    case 'Micro Cap':
      return 'red'; // Highest risk category
    default:
      return 'gray';
  }
}

/**
 * Gets the background color class for a market cap category (Tailwind).
 * 
 * @param category - Market cap category
 * @returns Tailwind background color class
 */
export function getMarketCapBackgroundClass(category: MarketCapCategory): string {
  switch (category) {
    case 'Large Cap':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Mid Cap':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'Small Cap':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'Micro Cap':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

// ============================================================================
// Unit Test Skeleton (for reference)
// ============================================================================
/*
describe('classifyMarketCap', () => {
  test('should classify Large Cap correctly', () => {
    expect(classifyMarketCap('100000 Crs')).toBe('Large Cap');
    expect(classifyMarketCap(75001)).toBe('Large Cap');
  });

  test('should classify Mid Cap correctly', () => {
    expect(classifyMarketCap('50,000 Crs')).toBe('Mid Cap');
    expect(classifyMarketCap(30601)).toBe('Mid Cap');
    expect(classifyMarketCap(75000)).toBe('Mid Cap');
  });

  test('should classify Small Cap correctly', () => {
    expect(classifyMarketCap('22,088 Crs')).toBe('Small Cap');
    expect(classifyMarketCap(11001)).toBe('Small Cap');
    expect(classifyMarketCap(30600)).toBe('Small Cap');
  });

  test('should classify Micro Cap correctly', () => {
    expect(classifyMarketCap('5,000 Crs')).toBe('Micro Cap');
    expect(classifyMarketCap(11000)).toBe('Micro Cap');
    expect(classifyMarketCap(0)).toBe('Micro Cap');
  });

  test('should handle edge cases', () => {
    expect(classifyMarketCap(null)).toBe('Unknown');
    expect(classifyMarketCap(undefined)).toBe('Unknown');
    expect(classifyMarketCap('invalid')).toBe('Unknown');
    expect(classifyMarketCap('')).toBe('Unknown');
  });

  test('should parse various string formats', () => {
    expect(classifyMarketCap('100000')).toBe('Large Cap');
    expect(classifyMarketCap('100,000')).toBe('Large Cap');
    expect(classifyMarketCap('₹100000 Crores')).toBe('Large Cap');
    expect(classifyMarketCap('100000 Crs')).toBe('Large Cap');
  });

  test('should handle boundary values', () => {
    expect(classifyMarketCap(75000)).toBe('Mid Cap');
    expect(classifyMarketCap(75001)).toBe('Large Cap');
    expect(classifyMarketCap(30600)).toBe('Small Cap');
    expect(classifyMarketCap(30601)).toBe('Mid Cap');
    expect(classifyMarketCap(11000)).toBe('Micro Cap');
    expect(classifyMarketCap(11001)).toBe('Small Cap');
  });
});
*/



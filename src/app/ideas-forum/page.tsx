'use client';

import Navbar from '@/components/Navbar';
import IdeaCard from '@/components/IdeaCard';
import MarketGlanceWidget from '@/components/MarketGlanceWidget';
import { ChevronDown } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/authProvider';
import { createClient } from '@/lib/supabase/client';

// Define Comment and Idea types
type Comment = {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user_name?: string;
};

type Idea = {
  id: string;
  user_id?: string;
  data: {
    title: string;
    ticker: string;
    description: string; // HTML
    company_name: string;
    market_cap: string; // 'Large' | 'Mid' | 'Small'
    position_type?: string; // Long/Short
    investment_horizon?: string;
    current_price?: number;
    submission_timestamp?: string;
    week52_low?: number;
    week52_high?: number;
    target_price?: number;
  };
  likes_count?: number;
  bookmarks_count?: number;
  discussions_count?: number;
  created_at?: string;
  status?: string;
  idea_discussion?: Comment[];
};

// Types for INVEST_INDIA market overview data
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

type MarketSentiment = {
  analysis_time: string;
  major_indices: any;
  total_sectors: number;
  sentiment_score: number;
  negative_sectors: string[];
  positive_sectors: string[];
  overall_sentiment: string;
  sector_performance: Array<{
    sector: string;
    change: string;
    performance: string;
  }>;
};


const API_URL_ACTIONS = process.env.NEXT_PUBLIC_API_URL_ACTIONS || '';

// Symbol mapping for display names
function getDisplaySymbol(symbol: string): string {
  const symbolMap: { [key: string]: string } = {
    '^BSESN': 'Sensex',
    'NSEI': 'Nifty50',
    '^NSEI': 'Nifty',
    '^CNX100': 'CNX100',
    'ITBEES.NS': 'ITBEES',
    'BANKBEES.NS': 'BANKBEES',
    'NIFTYBEES.NS': 'NIFTYBEES'
  };
  
  return symbolMap[symbol] || symbol;
}

// In-memory cache store for finance data
interface FinanceDataCache {
  data: any;
  timestamp: number;
  ticker: string;
}

// Global cache store (session-level)
let financeDataCache: FinanceDataCache | null = null;

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Enhanced Environment verification function with color-coded output
function verifyEnvironment() {
  // Check Supabase URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Check anon key with detailed validation
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Construct API URL
  if (supabaseUrl) {
    const apiUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/finance-data`;
  }
  
  // Return validation results
  return {
    supabaseUrl: !!supabaseUrl,
    anonKey: !!(anonKey && anonKey.trim() !== ''),
    allValid: !!(supabaseUrl && anonKey && anonKey.trim() !== '')
  };
}

/**
 * Helper function to fetch financial data with robust token extraction and caching
 * 
 * CACHING LOGIC:
 * - Uses in-memory session-level cache to avoid redundant API calls
 * - Cache is valid for 5 minutes from the time of first fetch
 * - Cache is ticker-specific (INVEST_INDIA data is cached separately)
 * - Only fetches from API if no cached data exists or cache has expired
 * - Manual refresh can bypass cache when needed
 * 
 * TOKEN EXTRACTION STRATEGY (in order of preference):
 * 1. currentUser?.access_token - Direct access token on currentUser
 * 2. currentUser?.session?.access_token - Nested session access token
 * 3. currentUser?.provider_token - Provider-specific token
 * 4. currentUser?.session - Entire session object (fallback)
 * 
 * If no valid token is found, the function will proceed with only the anon key
 * (apikey header) for the API request, which may have limited functionality
 * depending on the edge function's security policy.
 * 
 * @param ticker - The stock ticker symbol to fetch financial data for
 * @param currentUser - The current user object from auth context (may be null/undefined)
 * @param forceRefresh - Optional flag to bypass cache and force API fetch
 * @returns Promise<any> - The financial data or null if fetch fails
 */
async function fetchFinancialData(ticker: string, currentUser?: any, forceRefresh: boolean = false) {
  // Check cache first (unless force refresh is requested)
  if (!forceRefresh && financeDataCache && financeDataCache.ticker === ticker) {
    const now = Date.now();
    const cacheAge = now - financeDataCache.timestamp;
    
    if (cacheAge < CACHE_DURATION) {
      return financeDataCache.data;
    } else {
      financeDataCache = null; // Clear expired cache
    }
  }
  
  // Fetching financial data for ticker
  
  // Debug auth state
  
  // Multiple attempts to find a valid token - check all likely locations
  // This comprehensive approach ensures we don't miss tokens in any possible structure
  const candidates = [
    currentUser?.access_token,           // Direct access token (most common)
    currentUser?.session?.access_token,  // Nested session access token
    currentUser?.provider_token,         // Provider-specific token (OAuth, etc.)
    currentUser?.session,                // Entire session object (fallback)
  ];
  
  // Access token extraction
  
  // Robust algorithm to pick the token - check all likely locations
  // Validates that the token is a string with sufficient length (>10 chars)
  const accessToken = candidates.find(x => {
    if (typeof x === "string" && x.length > 10) {
      return true;
    }
    return false;
  });
  
  // Log which path, if any, produced a valid token for debugging
  // Access token validation
  
  // Fallback logic - warn if no token found but continue with anon key
  if (!accessToken) {
    // No access token found - using anon key only
  }
  
  // Fix API Endpoint Construction - ensure correct URL format
  const baseSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Supabase Edge Functions require '/v1/' in the functions endpoint path (see official docs)
  const FINANCIALDATAAPIURL = `${baseSupabaseUrl?.replace(/\/$/, '')}/functions/v1/finance-data`;
  
  const fullFetchUrl = `${FINANCIALDATAAPIURL}?ticker=${ticker}`;
  
  // Get Supabase anon key from environment
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Fail gracefully if anon key is missing
  if (!apiKey) {
    // Missing environment variable
    throw new Error('Supabase anon key is not configured');
  }
  
  // Supabase anon key validation
  
  // Validate that we have the required anon key for both headers
  if (!apiKey || apiKey.trim() === '') {
    // Supabase anon key is missing
    throw new Error('Supabase anon key is missing or empty');
  }
  
  // Restore Auth Headers - ensure BOTH apikey and Authorization are included
  const headers = {
    "apikey": apiKey,
    "Authorization": `Bearer ${apiKey}`, // Use anon key for Authorization header
    "Content-Type": "application/json",
    ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}) // Override with user JWT if available
  };
  
  // Validate headers before fetch
  if (!headers.apikey || headers.apikey.trim() === '') {
    throw new Error('apikey header is missing or empty');
  }
  
  if (!headers.Authorization || headers.Authorization.trim() === '') {
    throw new Error('Authorization header is missing or empty');
  }
  
  // Log full headers object with security truncation
  // Headers prepared for fetch
  
  try {
    // Making fetch request
    
    const response = await fetch(fullFetchUrl, {
      method: 'GET',
      headers
    });
    
    
    if (!response.ok) {
      const errorText = await response.text();
      // Financial data fetch failed
      // Error details logged
      
      // Log specific error types with detailed guidance
      if (response.status === 401) {
      } else if (response.status === 404) {
      } else if (response.status === 0) {
      } else {
      }
      
      throw new Error(`Error fetching financial data: HTTP status ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    // API Response received successfully
    
    const financialData = result.data || result || null;
    
    // Store in cache for future use
    if (financialData) {
      financeDataCache = {
        data: financialData,
        timestamp: Date.now(),
        ticker: ticker
      };
    }
    
    return financialData;
  } catch (error) {
    // Financial data fetch failed
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : 'Unknown';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Error details logged
    
    // Log specific error types
    if (error instanceof Error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
      } else if (error.message.includes('401')) {
      }
    }
    
    return null;
  }
}

/**
 * Parse INVEST_INDIA market overview data into structured sections
 */
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


  return {
    sectors: parsedSectors,
    etfs: parsedETFs,
    indices: parsedIndices,
    market_sentiment: data.market_sentiment || null
  };
}

// Modular component for Sectors Performance Table (Long-Term Returns)
function SectorsPerformanceTable({ sectors }: { sectors: Sector[] }) {
  if (sectors.length === 0) return null;

  // Helper to parse percentage and determine color
  const getColorClass = (value: string) => {
    if (value === 'N/A' || value === '-') return 'text-gray-400';
    const numValue = parseFloat(value.replace('%', ''));
    return isNaN(numValue) ? 'text-gray-400' : numValue >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="bg-gradient-to-br from-blue-50/40 to-indigo-50/40 rounded-xl border border-blue-100/60 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📈</span>
        <div>
          <h3 className="text-sm font-semibold text-gray-600">
            Sectoral Performance
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Returns across 5 periods: 1D, 1M, 6M, 1Y, 2Y
          </p>
        </div>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full table-fixed divide-y divide-blue-100/60">
          <thead className="bg-blue-50/60">
            <tr>
              <th className="w-1/4 px-2 py-2 text-left text-xs font-medium text-blue-500 uppercase">Sector</th>
              <th className="w-3/20 px-1 py-2 text-center text-xs font-medium text-blue-500 uppercase">1D</th>
              <th className="w-3/20 px-1 py-2 text-center text-xs font-medium text-blue-500 uppercase">1M</th>
              <th className="w-3/20 px-1 py-2 text-center text-xs font-medium text-blue-500 uppercase">6M</th>
              <th className="w-3/20 px-1 py-2 text-center text-xs font-medium text-blue-500 uppercase">1Y</th>
              <th className="w-3/20 px-1 py-2 text-center text-xs font-medium text-blue-500 uppercase">2Y</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {sectors.map((sector, index) => (
              <tr key={index} className="hover:bg-blue-50/20">
                <td className="px-2 py-2 text-xs font-medium text-gray-600 truncate" title={sector.name}>
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

// Modular component for ETFs Performance (Daily Changes)
function ETFsPerformanceCard({ etfs }: { etfs: ETF[] }) {
  if (etfs.length === 0) return null;

  const getColorClass = (value: string) => {
    if (value === 'N/A' || value === '-') return 'text-gray-400';
    const numValue = parseFloat(value.replace('%', ''));
    return isNaN(numValue) ? 'text-gray-400' : numValue >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="bg-gradient-to-br from-green-50/40 to-emerald-50/40 rounded-xl border border-green-100/60 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📊</span>
        <div>
          <h3 className="text-sm font-semibold text-gray-600">ETFs Performance</h3>
          <p className="text-xs text-gray-400 mt-1">Returns across 5 periods: 1D, 1M, 6M, 1Y, 2Y</p>
        </div>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-green-50/60">
            <tr>
              <th className="px-2 py-1 text-left text-xs font-medium text-green-600 uppercase">ETF</th>
              <th className="px-1 py-1 text-center text-xs font-medium text-green-600 uppercase">Price</th>
              <th className="px-1 py-1 text-center text-xs font-medium text-green-600 uppercase">1D</th>
              <th className="px-1 py-1 text-center text-xs font-medium text-green-600 uppercase">1M</th>
              <th className="px-1 py-1 text-center text-xs font-medium text-green-600 uppercase">6M</th>
              <th className="px-1 py-1 text-center text-xs font-medium text-green-600 uppercase">1Y</th>
              <th className="px-1 py-1 text-center text-xs font-medium text-green-600 uppercase">2Y</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {etfs.map((etf, index) => (
              <tr key={index} className="hover:bg-green-50/20">
                <td className="px-2 py-1 text-xs font-medium text-gray-600 truncate">{etf.name}</td>
                <td className="px-1 py-1 text-center text-xs text-gray-500">{etf.current_price}</td>
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

// Modular component for Indices Performance (Daily Changes)
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

  // If no indices match the filter, show all indices as fallback
  const indicesToShow = filteredIndices.length > 0 ? filteredIndices : indices;

  if (indicesToShow.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-orange-50/40 to-amber-50/40 rounded-xl border border-orange-100/60 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📊</span>
        <div>
          <h3 className="text-sm font-semibold text-gray-600">Indices Performance</h3>
          <p className="text-xs text-gray-400 mt-1">NIFTY 50 & SENSEX returns: 1D, 1M, 6M, 1Y, 2Y</p>
        </div>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-orange-50/60">
            <tr>
              <th className="px-2 py-1 text-left text-xs font-medium text-orange-600 uppercase">Index</th>
              <th className="px-1 py-1 text-center text-xs font-medium text-orange-600 uppercase">Price</th>
              <th className="px-1 py-1 text-center text-xs font-medium text-orange-600 uppercase">1D</th>
              <th className="px-1 py-1 text-center text-xs font-medium text-orange-600 uppercase">1M</th>
              <th className="px-1 py-1 text-center text-xs font-medium text-orange-600 uppercase">6M</th>
              <th className="px-1 py-1 text-center text-xs font-medium text-orange-600 uppercase">1Y</th>
              <th className="px-1 py-1 text-center text-xs font-medium text-orange-600 uppercase">2Y</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {indicesToShow.map((index, idx) => (
              <tr key={idx} className="hover:bg-orange-50/20">
                <td className="px-2 py-1 text-xs font-medium text-gray-600 truncate">{index.name}</td>
                <td className="px-1 py-1 text-center text-xs text-gray-500">{index.current_price}</td>
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

// Modular component for Market Sentiment
function MarketSentimentCard({ marketSentiment }: { marketSentiment: MarketSentiment | null }) {
  if (!marketSentiment) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        Market Sentiment
      </h3>
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Overall Sentiment</span>
          <span className={`font-medium ${marketSentiment.overall_sentiment?.toLowerCase().includes('positive') ? 'text-green-600' : marketSentiment.overall_sentiment?.toLowerCase().includes('negative') ? 'text-red-600' : 'text-gray-900'}`}>
            {marketSentiment.overall_sentiment}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Sentiment Score</span>
          <span className="font-medium text-gray-900">{marketSentiment.sentiment_score}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Total Sectors</span>
          <span className="font-medium text-gray-900">{marketSentiment.total_sectors}</span>
        </div>
      </div>
    </div>
  );
}

export default function IdeasForumPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [filteredIdeas, setFilteredIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'most_recent' | 'most_liked' | 'most_bookmarked' | 'most_commented'>('most_recent');
  const [marketCapFilter, setMarketCapFilter] = useState<'all' | 'Large' | 'Medium' | 'Small'>('all');
  const [userActions, setUserActions] = useState<{
    likes: string[];
    bookmarks: string[];
    comments: string[];
  }>({ likes: [], bookmarks: [], comments: [] });
  
  // Finance data state
  const [financialData, setFinancialData] = useState<any>(null);
  const [financialLoading, setFinancialLoading] = useState(false);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [etfs, setETFs] = useState<ETF[]>([]);
  const [indices, setIndices] = useState<Index[]>([]);
  const [marketSentiment, setMarketSentiment] = useState<MarketSentiment | null>(null);
  
  
  const user = useAuth();
  const supabase = createClient();
  const isAuthenticated = !!user?.currentUser?.access_token;

  // Fetch ideas
  useEffect(() => {
    async function fetchIdeas() {
      setLoading(true);
      try {
        let token: string | null = null;

        // Try to get session token (if logged in)
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          token = session.access_token;
        }

        // Call your API (send token only if logged in)
        const res = await fetch('/api/fetchIdeas', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) throw new Error('Failed to fetch ideas');

        const json = await res.json();
        
        // Print the full structure
        console.log('=== Investment Ideas List Structure ===');
        console.log('Full response:', json);
        console.log('Response keys:', Object.keys(json));
        console.log('Number of ideas:', json.ideas?.length || 0);

        // Print structure of first idea if available
        if (json.ideas && json.ideas.length > 0) {
          console.log('=== First Idea Structure ===');
          console.log('First idea:', json.ideas[0]);
          console.log('First idea keys:', Object.keys(json.ideas[0]));
          console.log('First idea (formatted):', JSON.stringify(json.ideas[0], null, 2));
        }
        
        const fetchedIdeas = Array.isArray(json.ideas) ? json.ideas : [];
        

        setIdeas(fetchedIdeas);
        setFilteredIdeas(fetchedIdeas);

        // Optional: show a friendly hint for guests
        if (!token && fetchedIdeas.length > 0) {
        }

      } catch (err) {
        console.error('Error fetching ideas:', err);
        setError('Failed to load ideas');
      } finally {
        setLoading(false);
      }
    }

    fetchIdeas();
  }, []);



  // Fetch user actions
  useEffect(() => {
    async function fetchUserActions() {
      if (!user?.currentUser?.access_token) return;

      try {
        const res = await fetch(`${API_URL_ACTIONS}/self`, {
          headers: {
            Authorization: `Bearer ${user.currentUser.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUserActions({
            likes: data.likes || [],
            bookmarks: data.bookmarks || [],
            comments: data.comments || [],
          });
        }
      } catch (err) {
        console.error('Error fetching user actions:', err);
      }
    }

    fetchUserActions();
  }, [user?.currentUser?.access_token]);

  // Fetch INVEST_INDIA finance data
  useEffect(() => {
    async function fetchInvestIndiaData() {
      // Clear console for clean debugging
      console.clear();
      
      // Runtime Environment Check - Critical validation before any fetch
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      // Enhanced environment logging with safe key masking
      
      // Strict validation - both must be present and non-empty
      const isSupabaseUrlValid = supabaseUrl && supabaseUrl.trim() !== '';
      const isAnonKeyValid = anonKey && anonKey.trim() !== '';
      
      
      if (!isSupabaseUrlValid || !isAnonKeyValid) {
        
        setFinancialData({ 
          error: 'Configuration error: Supabase credentials missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment and redeploy.',
          envError: true,
          missingVars: {
            supabaseUrl: !isSupabaseUrlValid,
            anonKey: !isAnonKeyValid
          },
          timestamp: new Date().toISOString()
        });
        setFinancialLoading(false);
        return;
      }
      
      
      // Use robust token extraction - pass entire currentUser object
      setFinancialLoading(true);
      
      try {
        const financialData = await fetchFinancialData('INVEST_INDIA', user?.currentUser);
        
        // CRITICAL: Log raw API response immediately after receiving JSON
        
        if (financialData) {
          setFinancialData(financialData);
          
          // Parse the data into structured sections
          const parsedData = parseInvestIndiaData(financialData);
          
          // Set each section in state with individual logging
          setSectors(parsedData.sectors);
          
          setETFs(parsedData.etfs);
          
          setIndices(parsedData.indices);
          
          setMarketSentiment(parsedData.market_sentiment);
          
        } else {
        }
      } catch (error) {
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorName = error instanceof Error ? error.name : 'Unknown';
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        
        // Log HTTP status if available
        if (errorMessage?.includes('HTTP status')) {
        }
        
        // Set comprehensive error state with full details
        const errorDetails = {
          type: errorName,
          message: errorMessage,
          stack: errorStack,
          timestamp: new Date().toISOString(),
          url: typeof window !== 'undefined' ? window.location.href : 'server-side'
        };
        
        let userFriendlyMessage = 'Unknown error occurred';
        
        if (errorMessage?.includes('anon key is not configured')) {
          userFriendlyMessage = 'Configuration error: Missing Supabase anon key';
        } else if (errorMessage?.includes('401')) {
          userFriendlyMessage = 'Authentication error: Invalid credentials or missing authorization';
        } else if (errorMessage?.includes('404')) {
          userFriendlyMessage = 'API endpoint not found: Check Supabase edge function deployment';
        } else if (errorMessage?.includes('Network error') || errorName === 'TypeError') {
          userFriendlyMessage = 'Network error: Check internet connection and CORS settings';
        } else if (errorMessage?.includes('CORS')) {
          userFriendlyMessage = 'CORS error: Check Supabase edge function CORS configuration';
        } else {
          userFriendlyMessage = `API Error: ${errorMessage}`;
        }
        
        setFinancialData({ 
          error: userFriendlyMessage,
          errorDetails: errorDetails,
          timestamp: new Date().toISOString()
        });
      } finally {
        setFinancialLoading(false);
      }
    }

    fetchInvestIndiaData();
  }, [user?.currentUser]);

  // Filter + sort ideas based on selected filters
  useEffect(() => {
    if (!ideas.length) return;

    // Market cap filtering
    let filtered: Idea[] = ideas.filter((idea) => {
      if (marketCapFilter === 'all') return true;
      const mc = (idea.data.market_cap || '').toLowerCase();
      if (marketCapFilter === 'Large') return mc.includes('large');
      if (marketCapFilter === 'Medium') return mc.includes('medium');
      if (marketCapFilter === 'Small') return mc.includes('small');
      return true;
    });

    switch (filterType) {
      case 'most_recent':
        filtered = [...filtered].sort((a, b) => {
          const dateA = new Date(a.created_at || a.data.submission_timestamp || '').getTime();
          const dateB = new Date(b.created_at || b.data.submission_timestamp || '').getTime();
          return dateB - dateA;
        });
        break;
      case 'most_liked':
        filtered = [...filtered].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
        break;
      case 'most_bookmarked':
        // Only ideas the user bookmarked, then sort by bookmarks_count desc
        filtered = filtered.filter(idea => userActions.bookmarks.includes(idea.id))
          .sort((a, b) => (b.bookmarks_count || 0) - (a.bookmarks_count || 0));
        break;
      case 'most_commented':
        filtered = [...filtered].sort((a, b) => (b.discussions_count || 0) - (a.discussions_count || 0));
        break;
      default:
        filtered = filtered;
    }

    setFilteredIdeas(filtered);
  }, [ideas, marketCapFilter, filterType, userActions]);


  const handleIdeaUpdate = (updatedIdea: Idea) => {
    setIdeas(prev => prev.map(idea => idea.id === updatedIdea.id ? updatedIdea : idea));
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar (can be client) */}
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Ideas Forum
            </h1>
            <p className="text-gray-600 mt-1">
              Discover community-submitted investment ideas.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select 
                value={marketCapFilter}
                onChange={(e) => setMarketCapFilter(e.target.value as 'all' | 'Large' | 'Medium' | 'Small')}
                className="appearance-none flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 pr-10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Market Caps</option>
                <option value="Large">Large Cap</option>
                <option value="Medium">Medium Cap</option>
                <option value="Small">Small Cap</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" />
            </div>
            <div className="relative">
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'most_recent' | 'most_liked' | 'most_bookmarked' | 'most_commented')}
                className="appearance-none flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 pr-10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="most_recent">Most Recent</option>
                <option value="most_liked">Most Liked</option>
                <option value="most_commented">Most Commented</option>
                <option value="most_bookmarked">Most Bookmarked</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="w-full">

            {loading ? (
              <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-gray-500 text-sm">
                Loading ideas...
              </div>
            ) : error ? (
              <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-red-500 text-sm">
                {error}
              </div>
            ) : filteredIdeas.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-gray-500 text-sm">
                {!isAuthenticated
                  ? 'Login to see latest ideas'
                  : filterType === 'most_recent' 
                    ? 'No ideas found.'
                    : `No ${filterType} ideas found.`}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredIdeas.map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    disabledNavigate={false}
                    onIdeaUpdate={handleIdeaUpdate}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Market Glance Widget */}
      <MarketGlanceWidget 
        sectors={sectors} 
        etfs={etfs} 
        indices={indices}
        financialLoading={financialLoading}
        financialData={financialData}
      />

      <Toaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        className:
          "bg-transparent border border-blue-200 backdrop-blur-md text-white font-medium shadow-lg rounded-2xl px-4 py-3 flex items-center justify-center",
        style: {
          background: "transparent",
        },
      }}
    />
    </div>
  );
}

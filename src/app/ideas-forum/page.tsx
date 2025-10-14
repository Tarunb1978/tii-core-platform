'use client';

import Navbar from '@/components/Navbar';
import IdeaCard from '@/components/IdeaCard';
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
  sector: string;
  price: number;
  '1d_return': string;
  '1m_return': string;
  '6m_return': string;
  '1y_return': string;
  '2y_return': string;
};

type ETF = {
  name: string;
  symbol: string;
  current_price: string | number;
  returns: {
    '1m_return'?: string;
    '1y_return'?: string;
    '2y_return'?: string;
  };
  daily_change_pct: string;
  year_high_low: {
    year_low?: number;
    year_high?: number;
    distances?: any;
  };
  volume_analysis?: any;
  fundamental_metrics?: any;
  technical_indicators?: any;
};

type Index = {
  name: string;
  symbol: string;
  current_price: string | number;
  returns: {
    '1m_return'?: string;
    '1y_return'?: string;
    '2y_return'?: string;
  };
  daily_change?: string;
  year_high_low: {
    year_low?: number;
    year_high?: number;
    distances?: any;
  };
  volume_analysis?: any;
  fundamental_metrics?: any;
  technical_indicators?: any;
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
      console.log(`Using cached finance data for ${ticker} (age: ${Math.round(cacheAge / 1000)}s)`);
      return financeDataCache.data;
    } else {
      console.log(`Cache expired for ${ticker} (age: ${Math.round(cacheAge / 1000)}s), fetching fresh data`);
      financeDataCache = null; // Clear expired cache
    }
  }
  
  console.log(`Fetching fresh finance data for ${ticker}${forceRefresh ? ' (forced refresh)' : ''}`);
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
    console.log("Raw API response after fetch:", result);
    console.log("result.data:", result.data);
    
    const financialData = result.data || result || null;
    
    // Store in cache for future use
    if (financialData) {
      financeDataCache = {
        data: financialData,
        timestamp: Date.now(),
        ticker: ticker
      };
      console.log(`Cached finance data for ${ticker}`);
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
  // Parsing INVEST_INDIA data
  
  if (!rawData) {
    // No raw data provided to parse
    return {
      sectors: [],
      etfs: {},
      indices: {},
      market_sentiment: null
    };
  }

  // CORRECT PARSING STRATEGY - Use rawData.financial_data.data.data structure
  // Starting correct parsing strategy
  
  // Extract data from the correct structure: rawData.financial_data.data.data
  console.log("Raw API response:", rawData);
  const deep = rawData.financial_data?.data?.data || {};
  // Using correct path: rawData.financial_data.data.data
  
  // Extract market data sections from the correct structure
  // Extracting market data sections from rawData.financial_data.data.data
  const sectors = deep.sectors || {};
  const etfs = deep.etfs || {};
  const indices = deep.indices || {};
  const marketSentiment = deep.market_sentiment || null;
  
  // Market data sections extracted

  // Starting to parse each section from rawData.financial_data.data.data structure

  // Parse sectors
  
  const parsedSectors: Sector[] = Object.keys(sectors).map((sectorKey, index) => {
    const sector = sectors[sectorKey];
    return {
      sector: sector.name || sectorKey,
      price: parseFloat(sector.current_price) || 0,
      '1d_return': sector.daily_change_pct || 'N/A',
      '1m_return': sector.returns?.['1m_return'] || 'N/A',
      '6m_return': sector.returns?.['6m_return'] || 'N/A',
      '1y_return': sector.returns?.['1y_return'] || 'N/A',
      '2y_return': sector.returns?.['2y_return'] || 'N/A'
    };
  });
  
  // Sectors parsed

  // Parse ETFs
  
  const parsedETFs: { [key: string]: ETF } = Object.keys(etfs).reduce((acc, symbol) => {
    const etf = etfs[symbol];
    acc[symbol] = {
      name: etf.name || 'N/A',
      symbol: etf.symbol || symbol,
      current_price: etf.current_price || 'N/A',
      returns: {
        '1m_return': etf.returns?.['1m_return'] || 'N/A',
        '1y_return': etf.returns?.['1y_return'] || 'N/A',
        '2y_return': etf.returns?.['2y_return'] || 'N/A'
      },
      daily_change_pct: etf.daily_change_pct || 'N/A',
      year_high_low: etf.year_high_low || {},
      volume_analysis: etf.volume_analysis,
      fundamental_metrics: etf.fundamental_metrics,
      technical_indicators: etf.technical_indicators
    };
    return acc;
  }, {} as { [key: string]: ETF });
  
  // ETFs parsed

  // Parse indices
  
  const parsedIndices: { [key: string]: Index } = Object.keys(indices).reduce((acc, indexName) => {
    const index = indices[indexName];
    acc[indexName] = {
      name: index.name || 'N/A',
      symbol: index.symbol || indexName,
      current_price: index.current_price || 'N/A',
      returns: {
        '1m_return': index.returns?.['1m_return'] || 'N/A',
        '1y_return': index.returns?.['1y_return'] || 'N/A',
        '2y_return': index.returns?.['2y_return'] || 'N/A'
      },
      daily_change: index.daily_change || 'N/A',
      year_high_low: index.year_high_low || {},
      volume_analysis: index.volume_analysis,
      fundamental_metrics: index.fundamental_metrics,
      technical_indicators: index.technical_indicators
    };
    return acc;
  }, {} as { [key: string]: Index });
  
  if (Object.keys(parsedIndices).length > 0) {
  } else {
  }

  // Parse market sentiment with detailed logging
  
  const parsedMarketSentiment: MarketSentiment | null = marketSentiment ? {
    analysis_time: marketSentiment.analysis_time || 'N/A',
    major_indices: marketSentiment.major_indices || {},
    total_sectors: marketSentiment.total_sectors || 0,
    sentiment_score: marketSentiment.sentiment_score || 0,
    negative_sectors: marketSentiment.negative_sectors || [],
    positive_sectors: marketSentiment.positive_sectors || [],
    overall_sentiment: marketSentiment.overall_sentiment || 'N/A',
    sector_performance: marketSentiment.sector_performance || []
  } : null;
  
  if (parsedMarketSentiment) {
  } else {
  }

  // Final parsing summary
  const parseResult = {
    sectors: parsedSectors,
    etfs: parsedETFs,
    indices: parsedIndices,
    market_sentiment: parsedMarketSentiment
  };
  

  return parseResult;
}

// Modular component for Sectors Performance Table (Long-Term Returns)
function SectorsPerformanceTable({ sectors }: { sectors: Sector[] }) {
  if (sectors.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📈</span>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Sector Performance (Long-Term Returns)
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            Multi-period return data for key Nifty sectors: 1M, 6M, 1Y, and 2Y
          </p>
        </div>
      </div>
      <div className="w-full">
        <table className="w-full table-fixed divide-y divide-blue-200">
          <thead className="bg-blue-100">
            <tr>
              <th className="w-2/5 px-2 py-2 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Sector</th>
              <th className="w-1/5 px-1 py-2 text-center text-xs font-medium text-blue-800 uppercase tracking-wider">1M Return</th>
              <th className="w-1/5 px-1 py-2 text-center text-xs font-medium text-blue-800 uppercase tracking-wider">6M Return</th>
              <th className="w-1/5 px-1 py-2 text-center text-xs font-medium text-blue-800 uppercase tracking-wider">
                <div>1Y</div>
                <div>Return</div>
              </th>
              <th className="w-1/5 px-1 py-2 text-center text-xs font-medium text-blue-800 uppercase tracking-wider">
                <div>2Y</div>
                <div>Return</div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sectors.map((sector, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-2 py-2 text-xs font-medium text-gray-900 truncate" title={sector.sector}>
                  {sector.sector}
                </td>
                <td className="px-1 py-2 text-center text-xs">
                  <span className={`font-medium ${sector['1m_return']?.startsWith('-') ? 'text-red-600' : 'text-green-600'}`}>
                    {sector['1m_return']}
                  </span>
                </td>
                <td className="px-1 py-2 text-center text-xs">
                  <span className={`font-medium ${sector['6m_return']?.startsWith('-') ? 'text-red-600' : 'text-green-600'}`}>
                    {sector['6m_return']}
                  </span>
                </td>
                <td className="px-1 py-2 text-center text-xs">
                  <span className={`font-medium ${sector['1y_return']?.startsWith('-') ? 'text-red-600' : 'text-green-600'}`}>
                    {sector['1y_return']}
                  </span>
                </td>
                <td className="px-1 py-2 text-center text-xs">
                  <span className={`font-medium ${sector['2y_return']?.startsWith('-') ? 'text-red-600' : 'text-green-600'}`}>
                    {sector['2y_return']}
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
function ETFsPerformanceCard({ etfs }: { etfs: { [key: string]: ETF } }) {
  if (Object.keys(etfs).length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">⚡️</span>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            ETFs Performance
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            Today's price and daily percent changes
          </p>
        </div>
      </div>
      <div className="space-y-2">
        {Object.entries(etfs).slice(0, 3).map(([symbol, etf]) => (
          <div key={symbol} className="text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium truncate">{getDisplaySymbol(etf.symbol)}</span>
              <span className="font-medium text-gray-900 ml-2">{etf.current_price}</span>
            </div>
            <div className={`text-xs font-medium ${etf.daily_change_pct?.startsWith('-') ? 'text-red-600' : 'text-green-600'}`}>
              1D Change: {etf.daily_change_pct}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Modular component for Indices Performance (Daily Changes)
function IndicesPerformanceCard({ indices }: { indices: { [key: string]: Index } }) {
  if (Object.keys(indices).length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">⚡️</span>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Indices Performance
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            Today's price and daily percent changes
          </p>
        </div>
      </div>
      <div className="space-y-2">
        {Object.entries(indices).slice(0, 3).map(([indexName, index]) => (
          <div key={indexName} className="text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium truncate">{getDisplaySymbol(index.symbol)}</span>
              <span className="font-medium text-gray-900 ml-2">{index.current_price}</span>
            </div>
            <div className={`text-xs font-medium ${index.daily_change?.startsWith('-') ? 'text-red-600' : 'text-green-600'}`}>
              1D Change: {index.daily_change}
            </div>
          </div>
        ))}
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
  const [etfs, setETFs] = useState<{ [key: string]: ETF }>({});
  const [indices, setIndices] = useState<{ [key: string]: Index }>({});
  const [marketSentiment, setMarketSentiment] = useState<MarketSentiment | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const user = useAuth();
  const supabase = createClient();
  const isAuthenticated = !!user?.currentUser?.access_token;

  // Fetch ideas
  useEffect(() => {
    async function fetchIdeas() {
    if (!user) {
      console.log('No current user, skipping profile fetch');
      return;
    }
    setLoading(true);
      try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.access_token) {
            throw new Error('No access token available');
          }
          const res = await fetch('/api/fetchIdeas', {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });
          if (!res.ok) throw new Error('Failed to fetch ideas');

          const json = await res.json();
          const fetchedIdeas = Array.isArray(json.ideas) ? json.ideas : [];
          setIdeas(fetchedIdeas);
          setFilteredIdeas(fetchedIdeas);
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

  // Manual refresh function for finance data
  const handleRefreshFinanceData = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    setFinancialLoading(true);
    
    try {
      const financialData = await fetchFinancialData('INVEST_INDIA', user?.currentUser, true); // Force refresh
      
      if (financialData) {
        setFinancialData(financialData);
        
        // Parse the data into structured sections
        const parsedData = parseInvestIndiaData(financialData);
        
        // Set each section in state
        setSectors(parsedData.sectors);
        setETFs(parsedData.etfs);
        setIndices(parsedData.indices);
        setMarketSentiment(parsedData.market_sentiment);
      }
    } catch (error) {
      console.error('Error refreshing finance data:', error);
    } finally {
      setFinancialLoading(false);
      setIsRefreshing(false);
    }
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

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">

            {loading ? (
              <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-gray-500">
                Loading ideas...
              </div>
            ) : error ? (
              <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-red-500">
                {error}
              </div>
            ) : filteredIdeas.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-gray-500">
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

          <aside className="lg:col-span-2">
            {/* Finance Data Card */}
            {financialLoading ? (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Market Data
                  </h3>
                  <button
                    onClick={handleRefreshFinanceData}
                    disabled={isRefreshing}
                    className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
                <div className="text-center text-gray-500 text-sm">
                  Markets Data Loading...
                </div>
              </div>
            ) : financialData?.error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-red-900">
                    {financialData.envError ? 'Configuration Error' : 'API Error'}
                  </h4>
                  <button
                    onClick={handleRefreshFinanceData}
                    disabled={isRefreshing}
                    className="text-xs text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {isRefreshing ? 'Retrying...' : 'Retry'}
                  </button>
                </div>
                <p className="text-red-700 text-sm">{financialData.error}</p>
                {financialData.envError && (
                  <div className="mt-3 p-3 bg-red-100 rounded">
                    <p className="text-red-800 text-xs font-medium mb-2">Missing Environment Variables:</p>
                    <ul className="text-red-700 text-xs space-y-1">
                      {financialData.missingVars?.supabaseUrl && <li>• NEXT_PUBLIC_SUPABASE_URL</li>}
                      {financialData.missingVars?.anonKey && <li>• NEXT_PUBLIC_SUPABASE_ANON_KEY</li>}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Market Data Header with Refresh */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Market Data
                  </h3>
                  <button
                    onClick={handleRefreshFinanceData}
                    disabled={isRefreshing}
                    className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>

                {/* Explanatory Note */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">💡 Data Purpose:</span> Long-term data is suitable for trend analysis, daily change highlights current market momentum.
                  </p>
                </div>
                
                {/* Long-Term Returns Section */}
                <div className="space-y-4">
                  <SectorsPerformanceTable sectors={sectors} />
                </div>

                {/* Market Movers Section (Daily Changes) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">⚡️</span>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        Market Movers (Daily Changes)
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">
                        Today's price and daily percent changes for major indices and ETFs
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <ETFsPerformanceCard etfs={etfs} />
                    <IndicesPerformanceCard indices={indices} />
                  </div>
                </div>

                {/* Market Sentiment */}
                <MarketSentimentCard marketSentiment={marketSentiment} />

                {/* No Data State */}
                {sectors.length === 0 && Object.keys(etfs).length === 0 && Object.keys(indices).length === 0 && !marketSentiment && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="text-yellow-800 font-medium text-xs mb-1">No market data available</div>
                    <div className="text-yellow-700 text-xs">
                      Check console for debugging information
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      </main>

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

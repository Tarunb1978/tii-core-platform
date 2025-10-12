'use client';

import Navbar from '@/components/Navbar';
import IdeaCard from '@/components/IdeaCard';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@/context/authProvider';
import { createClient } from '@/lib/supabase/client';

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


const API_URL_ACTIONS = process.env.NEXT_PUBLIC_API_URL_ACTIONS || '';
const FINANCIAL_DATA_API_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')}/functions/finance-data`;

/**
 * ACCESS TOKEN EXTRACTION LOGIC
 * 
 * The currentUser object from useAuth() is a Supabase Session object with additional properties.
 * The access token can be found in multiple locations:
 * 
 * 1. currentUser.access_token - Direct access token (most common)
 * 2. currentUser.session.access_token - Nested session access token
 * 3. currentUser.provider_token - Provider-specific token
 * 
 * If none of these are available, we fall back to getting the session directly
 * from supabase.auth.getSession() as a last resort.
 * 
 * The token is used for Authorization: Bearer {token} headers in API calls.
 */

// Enhanced Environment verification function with color-coded output
function verifyEnvironment() {
  console.log('🔍 Environment Verification:');
  console.log('='.repeat(50));
  
  // Check Supabase URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    console.log('✅ NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  } else {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is missing');
  }
  
  // Check anon key with detailed validation
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (anonKey && anonKey.trim() !== '') {
    console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: present (length:', anonKey.length, ')');
    console.log('✅ Anon key starts with "eyJ":', anonKey.startsWith('eyJ'));
  } else {
    console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or empty');
    console.error('❌ This will cause 401/404/CORS errors on API calls');
  }
  
  // Construct and verify API URL
  if (supabaseUrl) {
    const apiUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/finance-data`;
    console.log('🔗 Constructed API URL:', apiUrl);
    console.log('🔗 URL validation:');
    console.log('  - Contains functions.supabase.co:', apiUrl.includes('functions.supabase.co'));
    console.log('  - Contains /functions/v1/:', apiUrl.includes('/functions/v1/'));
    console.log('  - Contains /v1/ (required):', apiUrl.includes('/v1/'));
    console.log('  - Ends with /finance-data:', apiUrl.endsWith('/finance-data'));
  }
  
  console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
  console.log('🌐 Current URL:', typeof window !== 'undefined' ? window.location.href : 'server-side');
  console.log('='.repeat(50));
  
  // Return validation results
  return {
    supabaseUrl: !!supabaseUrl,
    anonKey: !!(anonKey && anonKey.trim() !== ''),
    allValid: !!(supabaseUrl && anonKey && anonKey.trim() !== '')
  };
}

// Helper function for dividend yield formatting
function formatDividendYield(rawValue: any): string {
  if (!rawValue) return "N/A";
  if (typeof rawValue === "string" && rawValue.includes("%")) {
    // API already provides the final formatted percentage string
    return rawValue;
  }
  const num = parseFloat(rawValue);
  if (isNaN(num)) return "N/A";
  if (num >= 1) return `${num.toFixed(2)}%`;
  return `${(num * 100).toFixed(2)}%`;
}

// Helper function for dividend yield display formatting
function getDividendYieldDisplay(yieldStr?: string, formatAsFraction = false) {
  if (!yieldStr) return 'N/A';
  const yieldNum = parseFloat(yieldStr.replace('%','').trim());
  if (isNaN(yieldNum)) return 'N/A';
  return formatAsFraction ? (yieldNum / 100).toString() : yieldNum.toFixed(2) + '%';
}

// Helper function for other percentage formatting (for margins, returns, etc.)
function formatPercentage(rawValue: any): string {
  if (!rawValue) return "N/A";
  
  // String containing % (already formatted)
  if (typeof rawValue === 'string' && rawValue.includes('%')) {
    return rawValue;
  }
  
  // Numeric or string value needing conversion
  const num = parseFloat(rawValue);
  if (!isNaN(num)) {
    // If greater than or equal to 1, treat as percentage
    if (num >= 1) return `${num.toFixed(2)}%`;
    // If less than 1, convert to percentage
    return `${(num * 100).toFixed(2)}%`;
  }
  
  return "N/A";
}

/**
 * Helper function to organize raw financial data into structured metrics
 * 
 * This function takes the raw financial data from the API and restructures it
 * into organized groups for easier consumption in the UI components.
 * 
 * IMPORTANT: This function validates and ensures all returned values are valid defaults
 * (null, empty strings, or zeros) rather than undefined. Missing fields are logged for debugging.
 * 
 * @param rawFinancialData - The raw financial data object from the API
 * @returns Object with organized metrics grouped by category or null if data is missing
 */
function organizeFinancialData(rawFinancialData: any) {
  // Accept the field as your API actually provides it
  const data = rawFinancialData?.data; 
  if (!data) {
    console.error("No financial data to organize - missing data section");
    return null;
  }
  
  // Now destructure the real keys
  const companyinfo = data.company_info ?? {};
  const growthmetrics = data.growth_metrics ?? {};
  const liquiditymetrics = data.liquidity_metrics ?? {};
  const valuationmetrics = data.valuation_metrics ?? {};
  const profitabilitymetrics = data.profitability_metrics ?? {};

  // Proceed as before - mapping fields as per your UI's expectation
  const dividendYieldFormatted = formatDividendYield(growthmetrics["Dividend Yield"]);
  console.log("Formatted Dividend Yield in organizeFinancialData:", dividendYieldFormatted);
  
  const organized = {
    companyOverview: {
      marketCap: valuationmetrics["Market Cap"] ?? "N/A",
      industry: companyinfo.Industry ?? "N/A",
      dividendYield: dividendYieldFormatted,
      peRatio: valuationmetrics["Trailing P/E"] ?? "N/A",
      city: companyinfo.City ?? "N/A",
      website: companyinfo.Website ?? "N/A",
      fullTimeEmployees: companyinfo["Full Time Employees"] ?? "N/A"
    },
    profitability: {
      ebitdaMargin: formatPercentage(profitabilitymetrics["EBITDA Margins"]),
      netProfitMargin: formatPercentage(profitabilitymetrics["Net Profit Margins"]),
      grossMargin: formatPercentage(profitabilitymetrics["Gross Margins"]),
      ebitda: profitabilitymetrics["EBITDA"] ?? "N/A",
      netProfits: profitabilitymetrics["Net Profits"] ?? "N/A"
    },
    valuation: {
      priceToBook: valuationmetrics["Price to Book"] ?? "N/A",
      priceToSales: valuationmetrics["Price to Sales"] ?? "N/A",
      trailingPE: valuationmetrics["Trailing P/E"] ?? "N/A"
    },
    growthReturns: {
      threeYearReturn: formatPercentage(growthmetrics["3-Year Return"]),
      oneYearReturn: formatPercentage(growthmetrics["1-Year Return"]),
      weekRange:
        growthmetrics["52-Week Low"] && growthmetrics["52-Week High"]
          ? `${growthmetrics["52-Week Low"]} - ${growthmetrics["52-Week High"]}`
          : 'N/A',
      avgVolume10Days: growthmetrics["Avg Volume (10 days)"] ?? "N/A",
      lastExDividendDate: growthmetrics["Last Ex-Dividend Date"] ?? "N/A"
    },
    financialHealth: {
      debtToEquity: profitabilitymetrics["Debt to Equity"] ?? "N/A",
      totalCash: liquiditymetrics["Total Cash"] ?? "N/A",
      totalDebt: liquiditymetrics["Total Debt"] ?? "N/A",
      cashPerShare: liquiditymetrics["Cash per Share"] ?? "N/A",
      outstandingShares: liquiditymetrics["Outstanding Shares"] ?? "N/A"
    },
    companyDetails: {
      businessSummary: companyinfo["Business Summary"] ?? "N/A",
      location: companyinfo.City ?? "N/A",
      employees: companyinfo["Full Time Employees"] ?? "N/A",
      website: companyinfo.Website ?? "N/A"
    }
  };

  // Add logging for debug
  console.log("organizeFinancialData output", organized);
  return organized;
}

/**
 * Helper function to fetch financial data with robust token extraction
 * 
 * This function implements a comprehensive token extraction strategy that checks
 * multiple possible locations for the user's access token in the currentUser object.
 * 
 * Token extraction strategy (in order of preference):
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
 * @returns Promise<any> - The financial data or null if fetch fails
 */
async function fetchFinancialData(ticker: string, currentUser?: any) {
  console.debug('Fetching financial data for ticker:', ticker);
  
  // Debug auth state - print entire currentUser object for comprehensive analysis
  console.debug("currentUser object:", currentUser);
  console.debug("currentUser type:", typeof currentUser);
  console.debug("currentUser is null?", currentUser === null);
  console.debug("currentUser is undefined?", currentUser === undefined);
  
  // Multiple attempts to find a valid token - check all likely locations
  // This comprehensive approach ensures we don't miss tokens in any possible structure
  const candidates = [
    currentUser?.access_token,           // Direct access token (most common)
    currentUser?.session?.access_token,  // Nested session access token
    currentUser?.provider_token,         // Provider-specific token (OAuth, etc.)
    currentUser?.session,                // Entire session object (fallback)
  ];
  
  console.debug("Access token extract candidates:", candidates);
  console.debug("Candidate details:");
  console.debug("- currentUser?.access_token:", currentUser?.access_token);
  console.debug("- currentUser?.session?.access_token:", currentUser?.session?.access_token);
  console.debug("- currentUser?.provider_token:", currentUser?.provider_token);
  console.debug("- currentUser?.session:", currentUser?.session);
  
  // Robust algorithm to pick the token - check all likely locations
  // Validates that the token is a string with sufficient length (>10 chars)
  const accessToken = candidates.find(x => {
    if (typeof x === "string" && x.length > 10) {
      console.debug("Found valid token candidate:", x.substring(0, 20) + "...");
      return true;
    }
    return false;
  });
  
  // Log which path, if any, produced a valid token for debugging
  console.debug("Chosen access token (if any):", accessToken ? accessToken.substring(0, 20) + "..." : "none");
  console.debug("Access token type:", typeof accessToken);
  console.debug("Access token length:", accessToken ? accessToken.length : 0);
  console.debug("Access token starts with 'eyJ'?", accessToken ? accessToken.startsWith('eyJ') : false);
  
  // Fallback logic - warn if no token found but continue with anon key
  if (!accessToken) {
    console.warn("Ticker available but no access token found in currentUser - attempting fallback");
    console.warn("Will proceed with only anon key (apikey) for the API request");
    console.warn("This may result in limited functionality depending on edge function security policy");
  }
  
  // Fix API Endpoint Construction - ensure correct URL format
  const baseSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  console.debug("NEXT_PUBLIC_SUPABASE_URL:", baseSupabaseUrl);
  
  // Supabase Edge Functions require '/v1/' in the functions endpoint path (see official docs)
  const FINANCIALDATAAPIURL = `${baseSupabaseUrl?.replace(/\/$/, '')}/functions/v1/finance-data`;
  console.log("Finance Data API URL:", FINANCIALDATAAPIURL);
  
  const fullFetchUrl = `${FINANCIALDATAAPIURL}?ticker=${ticker}`;
  console.debug("Full financial data fetch URL:", fullFetchUrl);
  
  // Verify URL format against Supabase docs
  console.debug("URL format verification:");
  console.debug("- Contains 'functions.supabase.co'?", fullFetchUrl.includes('functions.supabase.co'));
  console.debug("- Contains '/functions/v1/' (correct path)?", fullFetchUrl.includes('/functions/v1/'));
  console.debug("- Contains '/v1/' (required)?", fullFetchUrl.includes('/v1/'));
  console.debug("- Ends with '/finance-data'?", fullFetchUrl.includes('/finance-data'));
  console.debug("- Has query parameter?", fullFetchUrl.includes('?ticker='));
  
  // Get Supabase anon key from environment
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Fail gracefully if anon key is missing
  if (!apiKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
    console.error('❌ This will cause 401 Unauthorized errors');
    throw new Error('Supabase anon key is not configured');
  }
  
  console.debug("Supabase anon key present:", apiKey ? 'yes' : 'no');
  console.debug("Supabase anon key length:", apiKey ? apiKey.length : 0);
  
  // Validate that we have the required anon key for both headers
  if (!apiKey || apiKey.trim() === '') {
    console.error('❌ CRITICAL: Supabase anon key is missing or empty');
    console.error('❌ Cannot proceed with API call - both apikey and Authorization headers require the anon key');
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
    console.error('❌ CRITICAL: apikey header is missing or empty');
    console.error('❌ This will cause 401 Unauthorized errors');
    throw new Error('apikey header is missing or empty');
  }
  
  if (!headers.Authorization || headers.Authorization.trim() === '') {
    console.error('❌ CRITICAL: Authorization header is missing or empty');
    console.error('❌ This will cause 401 Unauthorized errors');
    throw new Error('Authorization header is missing or empty');
  }
  
  // Log full headers object with security truncation
  console.log("📤 Headers being sent in fetch:");
  console.log("📤 Full headers object:", {
    apikey: headers.apikey ? `${headers.apikey.substring(0, 20)}...` : 'missing',
    Authorization: headers.Authorization ? `${headers.Authorization.substring(0, 30)}...` : 'missing',
    'Content-Type': headers['Content-Type']
  });
  console.debug("Authorization header present:", !!headers.Authorization);
  console.debug("Apikey header present:", !!headers.apikey);
  
  // Document the authentication strategy being used
  if (accessToken) {
    console.debug("Authentication strategy: User JWT + Anon Key (full permissions)");
  } else {
    console.debug("Authentication strategy: Anon Key only (limited permissions)");
  }
  
  try {
    // Debug log for Supabase API headers
    console.log("Supabase API headers:", {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` : 'missing',
      Authorization: headers.Authorization ? `${headers.Authorization.substring(0, 30)}...` : 'missing'
    });
    
    // Log API URL and headers before fetch
    console.log("🚀 Making fetch request to:", fullFetchUrl);
    console.log("📤 Headers being sent:", {
      apikey: headers.apikey ? `${headers.apikey.substring(0, 20)}...` : 'missing',
      Authorization: headers.Authorization ? `${headers.Authorization.substring(0, 30)}...` : 'missing',
      'Content-Type': headers['Content-Type']
    });
    console.log("🔗 Full fetch URL:", fullFetchUrl);
    console.log("📋 Full headers object:", headers);
    
    const response = await fetch(fullFetchUrl, {
      method: 'GET',
      headers
    });
    
    console.log("Fetched API response:", response);
    console.debug('Financial data fetch response status:', response.status);
    console.debug('Financial data fetch response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Financial data fetch failed');
      console.error('❌ Full error details:', {
        status: response.status,
        statusText: response.statusText,
        url: fullFetchUrl,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText,
        timestamp: new Date().toISOString()
      });
      
      // Log specific error types with detailed guidance
      if (response.status === 401) {
        console.error('❌ 401 Unauthorized - Possible causes:');
        console.error('   - Missing or invalid apikey header');
        console.error('   - Missing or invalid Authorization header');
        console.error('   - Supabase anon key is incorrect');
        console.error('   - User session token is expired');
      } else if (response.status === 404) {
        console.error('❌ 404 Not Found - Possible causes:');
        console.error('   - API endpoint URL is incorrect');
        console.error('   - Supabase edge function not deployed');
        console.error('   - Wrong Supabase project URL');
      } else if (response.status === 0) {
        console.error('❌ Network error or CORS issue - Possible causes:');
        console.error('   - CORS not configured on Supabase edge function');
        console.error('   - Network connectivity issues');
        console.error('   - Firewall blocking the request');
      } else {
        console.error(`❌ HTTP ${response.status} error - Check server logs`);
      }
      
      throw new Error(`Error fetching financial data: HTTP status ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log("✅ API Response received successfully");
    console.log("📊 Full API response:", result);
    console.log("📊 Response data type:", typeof result);
    console.log("📊 Response keys:", Object.keys(result || {}));
    console.debug('Financial data received:', result);
    return result.financial_data || result || null;
  } catch (error) {
    console.error('❌ CRITICAL: Financial data fetch failed');
    console.error('❌ Error type:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Full error object:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Fetch details:', {
      url: fullFetchUrl,
      headers: headers,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server-side'
    });
    
    // Log specific error types
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('❌ Network/Fetch Error - Possible CORS or connectivity issue');
    } else if (error.message.includes('401')) {
      console.error('❌ Authentication Error - Check apikey and Authorization headers');
    } else if (error.message.includes('404')) {
      console.error('❌ Endpoint Not Found - Check API URL and edge function deployment');
    }
    
    return null;
  }
}

export default function IdeaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient();
  const { currentUser } = useAuth();
  
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState<string>('');
  const [financialData, setFinancialData] = useState(null);
  const [financialLoading, setFinancialLoading] = useState(false);
  const [organizedMetrics, setOrganizedMetrics] = useState(null);
  const [userActions, setUserActions] = useState<{
    likes: string[];
    bookmarks: string[];
    comments: string[];
  }>({ likes: [], bookmarks: [], comments: [] });

  useEffect(() => {
    async function getParams() {
      const resolvedParams = await params;
      setId(resolvedParams.id);
    }
    getParams();
  }, [params]);

  // Monitor currentUser changes for debugging
  useEffect(() => {
    console.debug('🔄 IdeaDetailPage: currentUser changed');
    console.debug('🔄 currentUser value:', currentUser);
    console.debug('🔄 currentUser is null?', currentUser === null);
    console.debug('🔄 currentUser is undefined?', currentUser === undefined);
    
    // Verify environment on component mount
    verifyEnvironment();
    
    if (currentUser) {
      console.debug('🔄 currentUser structure analysis:');
      console.debug('🔄 - currentUser.access_token:', currentUser.access_token ? 'present' : 'missing');
      console.debug('🔄 - currentUser.session:', currentUser.session ? 'present' : 'missing');
      console.debug('🔄 - currentUser.user:', currentUser.user ? 'present' : 'missing');
      console.debug('🔄 - currentUser.provider_token:', currentUser.provider_token ? 'present' : 'missing');
      console.debug('🔄 - currentUser.refresh_token:', currentUser.refresh_token ? 'present' : 'missing');
      
      // Check if session exists and has access_token
      if (currentUser.session) {
        console.debug('🔄 - session.access_token:', currentUser.session.access_token ? 'present' : 'missing');
      }
    } else {
      console.debug('🔄 No currentUser - user not authenticated');
    }
  }, [currentUser]);

  // Monitor organizedMetrics state changes for debugging
  useEffect(() => {
    console.debug('🔄 organizedMetrics state changed:', organizedMetrics);
    if (organizedMetrics) {
      console.debug('🔄 Organized metrics available:');
      console.debug('🔄 - companyOverview:', organizedMetrics.companyOverview ? 'present' : 'missing');
      console.debug('🔄 - profitability:', organizedMetrics.profitability ? 'present' : 'missing');
      console.debug('🔄 - valuation:', organizedMetrics.valuation ? 'present' : 'missing');
      console.debug('🔄 - growthReturns:', organizedMetrics.growthReturns ? 'present' : 'missing');
      console.debug('🔄 - financialHealth:', organizedMetrics.financialHealth ? 'present' : 'missing');
      console.debug('🔄 - companyDetails:', organizedMetrics.companyDetails ? 'present' : 'missing');
    } else {
      console.debug('🔄 No organized metrics available');
    }
  }, [organizedMetrics]);

useEffect(() => {
  if (!id) return;
  
  // Clear console for clean debugging
  console.clear();
  console.log('🚀 Starting idea fetch process for ID:', id);

  async function getIdea() {
    console.debug('Starting to fetch idea with ID:', id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.warn("No access token found – user may not be signed in");
        setIdea(null);
        setLoading(false);
        return;
      }
      
      console.debug('Access token found, proceeding with idea fetch');

      // ✅ Use dynamic route instead of query param
      const res = await fetch(`/api/fetchIdeas/${id}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error fetching idea:", errorText);
        throw new Error("Failed to fetch idea");
      }

      const json = await res.json();
      const ideaData = json.idea || null;
      console.debug('Idea data fetched successfully:', ideaData);
      setIdea(ideaData);
      
      // Fetch financial data if idea has a ticker and user is authenticated
      if (ideaData?.data?.ticker) {
        console.debug('Idea has ticker, checking authentication for financial data fetch:', ideaData.data.ticker);
        
        // Comprehensive diagnostic logging for currentUser structure
        console.debug('Auth context currentUser:', currentUser);
        console.debug('currentUser type:', typeof currentUser);
        console.debug('currentUser keys:', currentUser ? Object.keys(currentUser) : 'null');
        
        // Check multiple possible locations for access token
        const accessToken = 
          currentUser?.access_token ||           // Direct access token on currentUser
          currentUser?.session?.access_token ||  // Nested session access token
          currentUser?.provider_token ||         // Provider token
          '';
        
        console.debug('Token extraction results:');
        console.debug('- currentUser?.access_token:', currentUser?.access_token ? 'present' : 'missing');
        console.debug('- currentUser?.session?.access_token:', currentUser?.session?.access_token ? 'present' : 'missing');
        console.debug('- currentUser?.provider_token:', currentUser?.provider_token ? 'present' : 'missing');
        console.debug('- Final accessToken:', accessToken ? 'present' : 'missing');
        
        // Additional session verification
        console.debug('Verifying session directly from Supabase...');
        const { data: { session } } = await supabase.auth.getSession();
        console.debug('Direct session result:', session);
        console.debug('Direct session access_token:', session?.access_token ? 'present' : 'missing');
        console.debug('Session expires at:', session?.expires_at);
        console.debug('Session expires in:', session?.expires_at ? new Date(session.expires_at * 1000) : 'N/A');
        
        // Runtime Environment Check - Critical validation before any fetch
        console.log('🔍 Runtime Environment Check - Validating Supabase credentials...');
        
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        // Strict validation - both must be present and non-empty
        const isSupabaseUrlValid = supabaseUrl && supabaseUrl.trim() !== '';
        const isAnonKeyValid = anonKey && anonKey.trim() !== '';
        
        console.log('🔍 Environment Check Results:');
        console.log('  - NEXT_PUBLIC_SUPABASE_URL:', isSupabaseUrlValid ? '✅ Present' : '❌ Missing/Empty');
        console.log('  - NEXT_PUBLIC_SUPABASE_ANON_KEY:', isAnonKeyValid ? '✅ Present' : '❌ Missing/Empty');
        
        if (!isSupabaseUrlValid || !isAnonKeyValid) {
          console.error('❌ CRITICAL: Supabase credentials missing - aborting fetch');
          console.error('❌ Missing variables:', {
            supabaseUrl: !isSupabaseUrlValid,
            anonKey: !isAnonKeyValid
          });
          
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
        
        console.log('✅ Environment validation passed - both credentials present');
        
        console.log('✅ Environment validation passed - proceeding with fetch');
        
        // Use robust token extraction - pass entire currentUser object
        console.debug('Proceeding with financial data fetch using robust token extraction');
        setFinancialLoading(true);
        
        try {
          const financialData = await fetchFinancialData(ideaData.data.ticker, currentUser);
          if (financialData) {
            console.log('✅ Financial data fetched successfully');
            console.log('Raw API Response:', financialData);
            setFinancialData(financialData);
            
            // COMPREHENSIVE DEBUGGING: Log raw API response
            console.debug('🔍 RAW API RESPONSE DEBUG:');
            console.debug('Raw financialData structure:', financialData);
            console.debug('Raw financialData type:', typeof financialData);
            console.debug('Raw financialData keys:', Object.keys(financialData || {}));
            
            // Log nested structure details
            if (financialData) {
              console.debug('🔍 NESTED STRUCTURE DEBUG:');
              console.debug('company_info:', financialData.company_info);
              console.debug('growth_metrics:', financialData.growth_metrics);
              console.debug('liquidity_metrics:', financialData.liquidity_metrics);
              console.debug('valuation_metrics:', financialData.valuation_metrics);
              console.debug('profitability_metrics:', financialData.profitability_metrics);
              
              // Log specific field access attempts
              console.debug('🔍 FIELD ACCESS DEBUG:');
              console.debug('valuation_metrics["Market Cap"]:', financialData.valuation_metrics?.["Market Cap"]);
              console.debug('company_info.Industry:', financialData.company_info?.Industry);
              console.debug('growth_metrics["Dividend Yield"]:', financialData.growth_metrics?.["Dividend Yield"]);
              console.debug('profitability_metrics["EBITDA Margins"]:', financialData.profitability_metrics?.["EBITDA Margins"]);
            }
            
            // Organize the raw financial data into structured metrics
            console.log('🔍 TRANSFORMATION DEBUG: Starting organizeFinancialData...');
            console.log('Input to organizeFinancialData:', financialData);
            const organized = organizeFinancialData(financialData);
            
            if (organized) {
              console.log('🔍 TRANSFORMATION SUCCESS: Financial data organized successfully');
              console.log('🔍 FINAL ORGANIZED METRICS:', organized);
              
              // Log each section with detailed field analysis
              console.log('🔍 COMPANY OVERVIEW DEBUG:', {
                marketCap: organized.companyOverview?.marketCap,
                industry: organized.companyOverview?.industry,
                dividendYield: organized.companyOverview?.dividendYield,
                peRatio: organized.companyOverview?.peRatio
              });
              
              console.log('🔍 PROFITABILITY DEBUG:', {
                ebitdaMargin: organized.profitability?.ebitdaMargin,
                netProfitMargin: organized.profitability?.netProfitMargin,
                grossMargin: organized.profitability?.grossMargin
              });
              
              console.log('🔍 VALUATION DEBUG:', {
                priceToBook: organized.valuation?.priceToBook,
                priceToSales: organized.valuation?.priceToSales,
                trailingPE: organized.valuation?.trailingPE
              });
              
              console.log('organizedMetrics set to:', organized);
              setOrganizedMetrics(organized);
              console.log("Set organizedMetrics:", organized);
            } else {
              console.error('❌ TRANSFORMATION FAILED: Failed to organize financial data');
              setOrganizedMetrics(null);
            }
          } else {
            console.debug('No financial data available for ticker:', ideaData.data.ticker);
            setOrganizedMetrics(null);
          }
        } catch (error) {
          console.error('❌ CRITICAL: Financial data fetch failed in main logic');
          console.error('❌ Error type:', error.name);
          console.error('❌ Error message:', error.message);
          console.error('❌ Full error object:', error);
          console.error('❌ Error stack:', error.stack);
          console.error('❌ Timestamp:', new Date().toISOString());
          
          // Set comprehensive error state with full details
          const errorDetails = {
            type: error.name,
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            url: typeof window !== 'undefined' ? window.location.href : 'server-side'
          };
          
          let userFriendlyMessage = 'Unknown error occurred';
          
          if (error.message?.includes('anon key is not configured')) {
            userFriendlyMessage = 'Configuration error: Missing Supabase anon key';
          } else if (error.message?.includes('401')) {
            userFriendlyMessage = 'Authentication error: Invalid credentials or missing authorization';
          } else if (error.message?.includes('404')) {
            userFriendlyMessage = 'API endpoint not found: Check Supabase edge function deployment';
          } else if (error.message?.includes('Network error') || error.name === 'TypeError') {
            userFriendlyMessage = 'Network error: Check internet connection and CORS settings';
          } else if (error.message?.includes('CORS')) {
            userFriendlyMessage = 'CORS error: Check Supabase edge function CORS configuration';
          } else {
            userFriendlyMessage = `API Error: ${error.message}`;
          }
          
          setFinancialData({ 
            error: userFriendlyMessage,
            errorDetails: errorDetails,
            timestamp: new Date().toISOString()
          });
          setOrganizedMetrics(null);
        } finally {
          setFinancialLoading(false);
        }
      } else {
        console.debug('Idea has no ticker, skipping financial data fetch');
      }
    } catch (e) {
      console.error(e);
      setIdea(null);
    } finally {
      setLoading(false);
    }
  }

  getIdea();
}, [id]);

// Fetch user actions
  useEffect(() => {
    async function fetchUserActions() {
      if (!currentUser?.access_token) return;

      try {
        const res = await fetch(`${API_URL_ACTIONS}/self`, {
          headers: {
            Authorization: `Bearer ${currentUser.access_token}`,
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
  }, [currentUser?.access_token]);

  const handleIdeaUpdate = (updatedIdea: Idea) => {
    setIdea(updatedIdea);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Back button */}
        <div className="mb-6">
          <Link
            href="/ideas-forum"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <div className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors">
              <ArrowLeft className="w-4 h-4 text-gray-700" />
            </div>
            <span className="text-sm font-medium">Back to Ideas Forum</span>
          </Link>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-gray-500">
            Loading idea...
          </div>
        ) : !idea ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-8 text-center">
            Idea not found
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            {/* Company Details Card - Top */}
            {organizedMetrics?.companyDetails && (
              <div className="mb-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Details</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-2">Business Summary</h4>
                        <p className="text-sm text-gray-900 leading-relaxed">
                          {organizedMetrics.companyDetails.businessSummary || 'No business summary available.'}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-600 mb-1">Location</h4>
                          <p className="text-sm text-gray-900">
                            {organizedMetrics.companyDetails.location || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-600 mb-1">Employees</h4>
                          <p className="text-sm text-gray-900">
                            {organizedMetrics.companyDetails.employees || 'N/A'}
                          </p>
                        </div>
                        {organizedMetrics.companyDetails.website && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-1">Website</h4>
                            <a 
                              href={organizedMetrics.companyDetails.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {organizedMetrics.companyDetails.website}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Split Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Left Column - Investment Thesis (60% width) */}
              <div className="lg:col-span-3">
          <IdeaCard 
            idea={idea} 
            showBreadcrumb={false} 
            onIdeaUpdate={handleIdeaUpdate}
          />
              </div>

              {/* Right Column - Financial Data (40% width) */}
              <div className="lg:col-span-2">
                {idea?.data?.ticker && (
                  <div className="space-y-4">
                    {(() => {
                      console.log("Debug - idea.data:", idea.data);
                      console.log("Debug - financialData state:", financialData);
                      console.log("Debug - company_info:", financialData?.data?.company_info);
                      console.log("Debug - organizedMetrics:", organizedMetrics);
                      const companyShortName = financialData?.data?.company_info?.["Short Name"];
                      const companyNameFromOrganized = organizedMetrics?.companyDetails?.businessSummary ? 
                        organizedMetrics.companyDetails.businessSummary.split('.')[0] : null;
                      console.log("Debug - companyShortName:", companyShortName);
                      console.log("Debug - companyNameFromOrganized:", companyNameFromOrganized);
                      console.log("Debug - ticker:", idea.data.ticker);
                      return (
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Financial Data for {companyShortName || companyNameFromOrganized || idea.data.ticker}
                        </h3>
                      );
                    })()}
                
                {financialLoading ? (
                  <div className="text-center text-gray-500 py-4">
                    Loading financial data...
                  </div>
                ) : financialData?.error ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-900 mb-2">
                      {financialData.envError ? 'Environment Configuration Error' : 'API Error'}
                    </h4>
                    <p className="text-red-700 text-sm">{financialData.error}</p>
                    {financialData.envError && (
                      <div className="mt-3 p-3 bg-red-100 rounded">
                        <p className="text-red-800 text-xs font-medium mb-2">Missing Environment Variables:</p>
                        <ul className="text-red-700 text-xs space-y-1">
                          {financialData.missingVars?.supabaseUrl && <li>• NEXT_PUBLIC_SUPABASE_URL</li>}
                          {financialData.missingVars?.anonKey && <li>• NEXT_PUBLIC_SUPABASE_ANON_KEY</li>}
                        </ul>
                        <p className="text-red-800 text-xs mt-2">
                          💡 <strong>Reminder:</strong> If using Vercel/Render/Netlify, always remember to set all process.env.* keys as protected environment variables and redeploy when updating them.
                        </p>
                      </div>
                    )}
                  </div>
                ) : organizedMetrics ? (
                      <div className="space-y-4">
                        {/* Compact Company Overview Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                          <h4 className="text-md font-semibold text-gray-900 mb-3">Company Overview</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <p className="text-xs text-gray-600">Market Cap</p>
                              <p className="text-sm font-medium text-gray-900">
                                {organizedMetrics.companyOverview?.marketCap || 'N/A'}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-gray-600">Industry</p>
                              <p className="text-sm font-medium text-gray-900">
                                {organizedMetrics.companyOverview?.industry || 'N/A'}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-gray-600">Dividend Yield</p>
                              <p className="text-sm font-medium text-gray-900">
                                {getDividendYieldDisplay(organizedMetrics.companyOverview?.dividendYield, false)}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-gray-600">P/E Ratio</p>
                              <p className="text-sm font-medium text-gray-900">
                                {organizedMetrics.companyOverview?.peRatio || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Financial Metrics Cards - Vertical Stack */}
                        <div className="space-y-4">
                          {/* Profitability Card */}
                          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <h4 className="text-md font-semibold text-gray-900 mb-3">Profitability</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">EBITDA Margin</span>
                                <span className="text-xs font-medium text-gray-900">
                                  {organizedMetrics.profitability?.ebitdaMargin || 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Net Profit Margin</span>
                                <span className="text-xs font-medium text-gray-900">
                                  {organizedMetrics.profitability?.netProfitMargin || 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Gross Margin</span>
                                <span className="text-xs font-medium text-gray-900">
                                  {organizedMetrics.profitability?.grossMargin || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Valuation Card */}
                          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <h4 className="text-md font-semibold text-gray-900 mb-3">Valuation</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Price to Book</span>
                                <span className="text-xs font-medium text-gray-900">
                                  {organizedMetrics.valuation?.priceToBook || 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Price to Sales</span>
                                <span className="text-xs font-medium text-gray-900">
                                  {organizedMetrics.valuation?.priceToSales || 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Trailing P/E</span>
                                <span className="text-xs font-medium text-gray-900">
                                  {organizedMetrics.valuation?.trailingPE || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Growth & Returns Card */}
                          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <h4 className="text-md font-semibold text-gray-900 mb-3">Growth & Returns</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">3-Year Return</span>
                                <span className={`text-xs font-medium ${
                                  organizedMetrics.growthReturns?.threeYearReturn && 
                                  parseFloat(organizedMetrics.growthReturns.threeYearReturn.replace('%', '')) >= 0 
                                    ? 'text-green-600' 
                                    : 'text-red-600'
                                }`}>
                                  {organizedMetrics.growthReturns?.threeYearReturn || 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">1-Year Return</span>
                                <span className={`text-xs font-medium ${
                                  organizedMetrics.growthReturns?.oneYearReturn && 
                                  parseFloat(organizedMetrics.growthReturns.oneYearReturn.replace('%', '')) >= 0 
                                    ? 'text-green-600' 
                                    : 'text-red-600'
                                }`}>
                                  {organizedMetrics.growthReturns?.oneYearReturn || 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">52-Week Range</span>
                                <span className="text-xs font-medium text-gray-900">
                                  {organizedMetrics.growthReturns?.weekRange || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Financial Health Card */}
                          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <h4 className="text-md font-semibold text-gray-900 mb-3">Financial Health</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Debt to Equity</span>
                                <span className="text-xs font-medium text-gray-900">
                                  {organizedMetrics.financialHealth?.debtToEquity || 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Total Cash</span>
                                <span className="text-xs font-medium text-gray-900">
                                  {organizedMetrics.financialHealth?.totalCash || 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Cash per Share</span>
                                <span className="text-xs font-medium text-gray-900">
                                  {organizedMetrics.financialHealth?.cashPerShare || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        No financial data available for {idea.data.ticker}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  );
}
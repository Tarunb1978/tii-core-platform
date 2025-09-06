import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/app/auth/action'

type IdeaData = {
  title: string
  description: string
  expected_return?: number
  risk_level?: string
  // Additional optional metadata captured from flat inputs
  name?: string
  email?: string
  company_name?: string
  position_type?: string
  investment_horizon?: string
}

type StockDetails = {
  ticker: string
  exchange?: string
  current_price: number
  target_price?: number
  // Optional extended financial metrics captured from flat inputs
  week52_high?: number
  week52_low?: number
  annual_revenue?: number
  eps?: number
  pe_ratio?: number
}

type IdeaPayload = {
  user_id: string
  data: IdeaData
  stock_details: StockDetails
  status: 'pending' | 'approved' | 'rejected'
}

type SubmitIdeaRequest = {
  idea: IdeaPayload
}

const routeContext = 'api/submit-idea'
const timestamp = () => new Date().toISOString()
function logDebug(step: string, message: string, data?: unknown) {
  try {
    const suffix = data === undefined ? '' : `\n${JSON.stringify(data, null, 2)}`
    console.debug(`[${timestamp()}][${routeContext}][${step}] ${message}${suffix}`)
  } catch {
    console.debug(`[${timestamp()}][${routeContext}][${step}] ${message}`)
  }
}
function logError(step: string, message: string, data?: unknown) {
  try {
    const suffix = data === undefined ? '' : `\n${JSON.stringify(data, null, 2)}`
    console.error(`[${timestamp()}][${routeContext}][${step}] ${message}${suffix}`)
  } catch {
    console.error(`[${timestamp()}][${routeContext}][${step}] ${message}`)
  }
}

function validateIdea(idea: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!idea || typeof idea !== 'object') {
    return { valid: false, errors: ['idea is missing or not an object'] }
  }
  if (typeof idea.status !== 'string' || idea.status.trim().length === 0) {
    errors.push('status is required and must be a non-empty string')
  }
  if (!idea.data || typeof idea.data !== 'object') {
    errors.push('data is required and must be an object')
  } else {
    if (typeof idea.data.title !== 'string' || idea.data.title.trim().length === 0) {
      errors.push('data.title is required and must be a non-empty string')
    }
    if (typeof idea.data.description !== 'string' || idea.data.description.trim().length === 0) {
      errors.push('data.description is required and must be a non-empty string')
    }
    if (idea.data.expected_return !== undefined && typeof idea.data.expected_return !== 'number') {
      errors.push('data.expected_return must be a number if provided')
    }
    if (idea.data.risk_level !== undefined && typeof idea.data.risk_level !== 'string') {
      errors.push('data.risk_level must be a string if provided')
    }
  }
  if (!idea.stock_details || typeof idea.stock_details !== 'object') {
    errors.push('stock_details is required and must be an object')
  } else {
    if (typeof idea.stock_details.ticker !== 'string' || idea.stock_details.ticker.trim().length === 0) {
      errors.push('stock_details.ticker is required and must be a non-empty string')
    }
    if (typeof idea.stock_details.current_price !== 'number' || Number.isNaN(idea.stock_details.current_price)) {
      errors.push('stock_details.current_price is required and must be a number')
    }
    if (idea.stock_details.target_price !== undefined && typeof idea.stock_details.target_price !== 'number') {
      errors.push('stock_details.target_price must be a number if provided')
    }
    if (idea.stock_details.exchange !== undefined && typeof idea.stock_details.exchange !== 'string') {
      errors.push('stock_details.exchange must be a string if provided')
    }
    if (idea.stock_details.week52_high !== undefined && typeof idea.stock_details.week52_high !== 'number') {
      errors.push('stock_details.week52_high must be a number if provided')
    }
    if (idea.stock_details.week52_low !== undefined && typeof idea.stock_details.week52_low !== 'number') {
      errors.push('stock_details.week52_low must be a number if provided')
    }
    if (idea.stock_details.annual_revenue !== undefined && typeof idea.stock_details.annual_revenue !== 'number') {
      errors.push('stock_details.annual_revenue must be a number if provided')
    }
    if (idea.stock_details.eps !== undefined && typeof idea.stock_details.eps !== 'number') {
      errors.push('stock_details.eps must be a number if provided')
    }
    if (idea.stock_details.pe_ratio !== undefined && typeof idea.stock_details.pe_ratio !== 'number') {
      errors.push('stock_details.pe_ratio must be a number if provided')
    }
  }
  return { valid: errors.length === 0, errors }
}

// Accept both nested and flat inputs. Convert flat inputs into the nested JSON
// structure expected by the database JSON columns.
type FlatIdeaInput = {
  name?: string
  email?: string
  companyName?: string
  stockSymbol?: string
  positionType?: string
  investmentHorizon?: string
  currentStockPrice?: string | number
  week52High?: string | number
  week52Low?: string | number
  annualRevenue?: string | number
  eps?: string | number
  peRatio?: string | number
  investmentDescription?: string
  title?: string
  description?: string
  expected_return?: number | string
  risk_level?: string
  exchange?: string
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isNaN(value) ? undefined : value
  if (typeof value === 'string') {
    const n = parseFloat(value)
    return Number.isNaN(n) ? undefined : n
  }
  return undefined
}

function normalizeToNestedIdea(input: any, userId: string): IdeaPayload {
  // If already nested and typed reasonably, coerce numeric fields and return
  if (input && typeof input === 'object' && input.data && input.stock_details) {
    const statusValue = typeof input.status === 'string' && ['pending', 'approved', 'rejected'].includes(input.status)
      ? input.status
      : 'pending'
    const currentPrice = parseNumber(input.stock_details.current_price)
    const targetPrice = parseNumber(input.stock_details.target_price)
    const nested: IdeaPayload = {
      user_id: userId,
      data: {
        title: String(input.data.title ?? ''),
        description: String(input.data.description ?? ''),
        expected_return: parseNumber(input.data.expected_return),
        risk_level: typeof input.data.risk_level === 'string' ? input.data.risk_level : undefined,
        name: typeof input.data.name === 'string' ? input.data.name : undefined,
        email: typeof input.data.email === 'string' ? input.data.email : undefined,
        company_name: typeof input.data.company_name === 'string' ? input.data.company_name : undefined,
        position_type: typeof input.data.position_type === 'string' ? input.data.position_type : undefined,
        investment_horizon: typeof input.data.investment_horizon === 'string' ? input.data.investment_horizon : undefined,
      },
      stock_details: {
        ticker: String(input.stock_details.ticker ?? ''),
        exchange: typeof input.stock_details.exchange === 'string' ? input.stock_details.exchange : undefined,
        current_price: currentPrice ?? NaN,
        target_price: targetPrice,
        week52_high: parseNumber(input.stock_details.week52_high),
        week52_low: parseNumber(input.stock_details.week52_low),
        annual_revenue: parseNumber(input.stock_details.annual_revenue),
        eps: parseNumber(input.stock_details.eps),
        pe_ratio: parseNumber(input.stock_details.pe_ratio),
      },
      status: statusValue,
    }
    return nested
  }

  // Treat as flat input and split into nested objects
  const flat = input as FlatIdeaInput
  const ticker = typeof flat.stockSymbol === 'string' && flat.stockSymbol.trim().length > 0
    ? flat.stockSymbol
    : typeof (flat as any).ticker === 'string' ? (flat as any).ticker : ''
  const title = typeof flat.title === 'string' && flat.title.trim().length > 0
    ? flat.title
    : [flat.companyName, ticker].filter(Boolean).join(' ').trim() || 'Idea'
  const description = typeof flat.description === 'string' && flat.description.trim().length > 0
    ? flat.description
    : (flat.investmentDescription ?? '')
  const currentPrice = parseNumber(flat.currentStockPrice)
  const targetPrice = parseNumber(flat.week52High)

  const nested: IdeaPayload = {
    user_id: userId,
    data: {
      title,
      description: String(description ?? ''),
      expected_return: parseNumber(flat.expected_return),
      risk_level: typeof flat.risk_level === 'string' ? flat.risk_level : undefined,
      name: flat.name,
      email: flat.email,
      company_name: flat.companyName,
      position_type: flat.positionType,
      investment_horizon: flat.investmentHorizon,
    },
    stock_details: {
      ticker: String(ticker),
      exchange: typeof flat.exchange === 'string' ? flat.exchange : undefined,
      current_price: currentPrice ?? NaN,
      target_price: targetPrice,
      week52_high: parseNumber(flat.week52High),
      week52_low: parseNumber(flat.week52Low),
      annual_revenue: parseNumber(flat.annualRevenue),
      eps: parseNumber(flat.eps),
      pe_ratio: parseNumber(flat.peRatio),
    },
    status: 'pending',
  }
  return nested
}

export async function POST(request: Request) {
  try {
    logDebug('request', 'Incoming POST /api/submit-idea received')
    const body = (await request.json()) as SubmitIdeaRequest
    logDebug('request.body', 'Parsed request payload', body)
    const incoming = body?.idea
    // Obtain authenticated user id before transformation
    const supabase = await createSupabaseServerClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) {
      logError('auth.user', 'Failed to get user', { message: userError.message })
    }
    const userId = userData?.user?.id
    if (!userId) {
      logError('auth', 'Unauthorized: missing session user id')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    logDebug('transform.start', 'Normalizing incoming idea into nested structure')
    const idea = normalizeToNestedIdea(incoming, userId)
    logDebug('transform.result', 'Normalized idea payload', idea)

    logDebug('validation.start', 'Validating idea payload')
    const validation = validateIdea(idea)
    if (!validation.valid) {
      logDebug('validation.fail', 'Validation errors', { errors: validation.errors })
      return NextResponse.json(
        {
          error: 'Invalid request body: missing or malformed fields',
          details: { errors: validation.errors },
        },
        { status: 400 }
      )
    }
    logDebug('validation.pass', 'Idea payload validated successfully')

    // Never trust client-sent user_id; we already injected server user_id during normalization
    const forwardPayload: SubmitIdeaRequest = { idea }

    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey =
      process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      logError('config', 'Supabase environment variables missing', {
        hasSupabaseUrl: Boolean(supabaseUrl),
        hasSupabaseKey: Boolean(supabaseKey),
      })
      return NextResponse.json(
        { error: 'Server misconfiguration: Supabase env vars missing' },
        { status: 500 }
      )
    }

    const functionUrl = `${supabaseUrl}/functions/v1/rest-idea-submitted`

    logDebug('edgeFunction.request', 'Forwarding payload to Supabase Edge Function', {
      url: functionUrl,
      // Do not log Authorization or tokens
      body: forwardPayload,
    })
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify(forwardPayload),
      // Ensure we don't reuse cached responses inadvertently
      cache: 'no-store',
    })

    const text = await response.text()
    let json: unknown
    try {
      json = text ? JSON.parse(text) : {}
    } catch {
      json = { message: text }
    }

    if (!response.ok) {
      logError('edgeFunction.response', 'Edge Function returned error', {
        status: response.status,
        ok: response.ok,
        body: json,
      })
      return NextResponse.json(
        { error: 'Failed to submit idea', details: json },
        { status: response.status }
      )
    }

    logDebug('edgeFunction.response', 'Edge Function succeeded', {
      status: response.status,
      ok: response.ok,
      body: json,
    })
    return NextResponse.json({ success: true, data: json }, { status: 200 })
  } catch (error: any) {
    logError('catch', 'Unexpected server error', {
      message: error?.message ?? String(error),
      stack: error?.stack ?? null,
    })
    return NextResponse.json(
      { error: 'Unexpected server error', details: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}



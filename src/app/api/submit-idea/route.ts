import { NextResponse } from 'next/server'

type IdeaPayload = {
  name: string
  email: string
  companyName: string
  stockSymbol: string
  positionType: string
  investmentHorizon: string
  currentStockPrice: string
  week52High: string
  week52Low: string
  annualRevenue: string
  eps: string
  peRatio: string
  investmentDescription: string
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

function isValidIdea(idea: any): idea is IdeaPayload {
  if (!idea || typeof idea !== 'object') return false
  const requiredFields: Array<keyof IdeaPayload> = [
    'name',
    'email',
    'companyName',
    'stockSymbol',
    'positionType',
    'investmentHorizon',
    'currentStockPrice',
    'week52High',
    'week52Low',
    'annualRevenue',
    'eps',
    'peRatio',
    'investmentDescription',
  ]
  for (const field of requiredFields) {
    if (typeof idea[field] !== 'string' || idea[field].trim().length === 0) {
      return false
    }
  }
  return true
}

function validateIdea(idea: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!idea || typeof idea !== 'object') {
    return { valid: false, errors: ['idea is missing or not an object'] }
  }
  const requiredFields: Array<keyof IdeaPayload> = [
    'name',
    'email',
    'companyName',
    'stockSymbol',
    'positionType',
    'investmentHorizon',
    'currentStockPrice',
    'week52High',
    'week52Low',
    'annualRevenue',
    'eps',
    'peRatio',
    'investmentDescription',
  ]
  for (const field of requiredFields) {
    const value = idea[field]
    if (typeof value !== 'string' || value.trim().length === 0) {
      errors.push(`Field ${String(field)} is required and must be a non-empty string`)
    }
  }
  return { valid: errors.length === 0, errors }
}

export async function POST(request: Request) {
  try {
    logDebug('request', 'Incoming POST /api/submit-idea received')
    const body = (await request.json()) as SubmitIdeaRequest
    logDebug('request.body', 'Parsed request payload', body)
    const idea = body?.idea

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
      body: { idea },
    })
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ idea }),
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



/**
 * CHECKPOINT: route.v1.ts
 * Purpose: Backup of /api/submit-idea at the time of creation for easy rollback.
 * Note: Do not modify this file. To revert, replace route.ts with this file's contents.
 */

import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/app/auth/action'

type IdeaData = {
  title: string
  description: string
  expected_return?: number
  risk_level?: string
}

type StockDetails = {
  ticker: string
  exchange?: string
  current_price: number
  target_price?: number
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

    // Authenticate request using server cookies-bound client and obtain verified user
    // Note: createSupabaseServerClient uses next/headers cookies() which are request-scoped in route handlers
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

    // Never trust client-sent user_id; enforce server-side user id
    const statusValue = typeof idea.status === 'string' && ['pending', 'approved', 'rejected'].includes(idea.status)
      ? idea.status
      : 'pending'
    const forwardPayload: SubmitIdeaRequest = {
      idea: {
        user_id: userId,
        data: idea.data,
        stock_details: idea.stock_details,
        status: statusValue,
      },
    }

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



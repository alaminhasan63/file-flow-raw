import { NextRequest, NextResponse } from 'next/server'

const MOCK_RESPONSES = [
  { status: 'AVAILABLE', message: 'Name is available for registration' },
  { status: 'CONFLICT', message: 'Name conflicts with existing entity' },
  { status: 'AVAILABLE', message: 'Name is available for registration' },
  { status: 'AVAILABLE', message: 'Name is available for registration' },
  { status: 'CONFLICT', message: 'Name is too similar to existing entity' },
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const state = searchParams.get('state')
  const name = searchParams.get('name')

  if (!state || !name) {
    return NextResponse.json(
      { error: 'State and name parameters are required' },
      { status: 400 }
    )
  }

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Mock response - randomly pick from predefined responses
  const response = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)]

  return NextResponse.json({
    state,
    name,
    ...response,
    checkedAt: new Date().toISOString(),
  })
}
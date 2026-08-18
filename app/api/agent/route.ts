import { getFreeOpenRouterModel } from '@/lib/ai/openrouter'
import { UIMessage, convertToModelMessages, streamText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json()

    try {
      const result = streamText({
        model: getFreeOpenRouterModel(),
        system:
          'You are an expert Senior Customer Support Specialist for Airtm. Your goal is to assist users with a comprehensive range of inquiries, including Account Management, Verification (KYC), P2P Transactions, Internal Sends, Cryptocurrency operations, and the Airtm Virtual Card.',
        messages: await convertToModelMessages(messages),
      })
      return result.toUIMessageStreamResponse()
    } catch (error) {
      console.warn('Model failed:', error)
      return NextResponse.json({ error: 'Model failed' }, { status: 500 })
    }
  } catch (error) {
    console.error('AI API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

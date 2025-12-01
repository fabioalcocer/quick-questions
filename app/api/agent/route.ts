import { google } from '@ai-sdk/google'
import { UIMessage, convertToModelMessages, streamText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'

const models = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite']

export async function POST(req: NextRequest) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 },
      )
    }

    let lastError: any = null

    for (const modelName of models) {
      try {
        const model = google(modelName)
        const result = streamText({
          model,
          system:
            'You are an expert Senior Customer Support Specialist for Airtm. Your goal is to assist users with a comprehensive range of inquiries, including Account Management, Verification (KYC), P2P Transactions, Internal Sends, Cryptocurrency operations, and the Airtm Virtual Card.',
          prompt: convertToModelMessages(messages),
        })
        return result.toUIMessageStreamResponse()
      } catch (error) {
        console.warn(`Model ${modelName} failed:`, error)
        lastError = error
      }
    }

    // If all models failed
    console.error('All AI models failed:', lastError)
    return NextResponse.json(
      { error: 'All AI models failed to respond' },
      { status: 500 },
    )
  } catch (error) {
    console.error('AI API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

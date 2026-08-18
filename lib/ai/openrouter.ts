import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import type { LanguageModel } from 'ai'

const FREE_MODEL_ID = 'openrouter/free'

export function getFreeOpenRouterModel(): LanguageModel {
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured')
  }

  const openrouter = createOpenRouter({ apiKey })

  return openrouter(FREE_MODEL_ID) as unknown as LanguageModel
}

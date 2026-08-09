import type { Session } from '@supabase/supabase-js'

const SAVED_ACCOUNTS_KEY = 'quick-responses:saved-accounts:v1'

export const SAVED_ACCOUNTS_UPDATED_EVENT =
  'quick-responses:saved-accounts-updated'

export interface SavedAccount {
  id: string
  email: string
  accessToken: string
  refreshToken: string
  updatedAt: number
}

function isSavedAccount(value: unknown): value is SavedAccount {
  if (!value || typeof value !== 'object') return false

  const account = value as Partial<SavedAccount>

  return (
    typeof account.id === 'string' &&
    typeof account.email === 'string' &&
    typeof account.accessToken === 'string' &&
    typeof account.refreshToken === 'string' &&
    typeof account.updatedAt === 'number'
  )
}

function notifyAccountsUpdated() {
  window.dispatchEvent(new Event(SAVED_ACCOUNTS_UPDATED_EVENT))
}

export function getSavedAccounts(): SavedAccount[] {
  if (typeof window === 'undefined') return []

  try {
    const storedValue = window.localStorage.getItem(SAVED_ACCOUNTS_KEY)
    if (!storedValue) return []

    const parsedValue: unknown = JSON.parse(storedValue)
    if (!Array.isArray(parsedValue)) return []

    return parsedValue
      .filter(isSavedAccount)
      .sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

export function saveAccountSession(session: Session): SavedAccount {
  const account: SavedAccount = {
    id: session.user.id,
    email: session.user.email ?? 'Account without email',
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    updatedAt: Date.now(),
  }
  const otherAccounts = getSavedAccounts().filter(
    (item) => item.id !== account.id,
  )

  try {
    window.localStorage.setItem(
      SAVED_ACCOUNTS_KEY,
      JSON.stringify([account, ...otherAccounts]),
    )
    notifyAccountsUpdated()
  } catch {
    // The active Supabase session remains valid when storage is unavailable.
  }

  return account
}

export function removeSavedAccount(accountId: string) {
  const nextAccounts = getSavedAccounts().filter(
    (account) => account.id !== accountId,
  )
  try {
    window.localStorage.setItem(
      SAVED_ACCOUNTS_KEY,
      JSON.stringify(nextAccounts),
    )
    notifyAccountsUpdated()
  } catch {
    // There is nothing else to remove when browser storage is unavailable.
  }
}

export function getAccountInitials(email: string) {
  const localPart = email.split('@')[0] ?? email
  const words = localPart.split(/[._-]+/).filter(Boolean)

  if (words.length > 1) {
    return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase()
  }

  return localPart.slice(0, 2).toUpperCase()
}

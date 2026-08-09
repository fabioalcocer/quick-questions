'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SAVED_ACCOUNTS_UPDATED_EVENT,
  type SavedAccount,
  getAccountInitials,
  getSavedAccounts,
  removeSavedAccount,
  saveAccountSession,
} from '@/lib/auth/saved-accounts'
import { createClient } from '@/lib/supabase/client'
import { Check, ChevronsUpDown, Loader2, LogOut, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

export function AccountSwitcher() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [accounts, setAccounts] = useState<SavedAccount[]>([])
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null)
  const [pendingAccountId, setPendingAccountId] = useState<string | null>(null)

  const syncAccounts = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session) {
      const savedAccount = saveAccountSession(session)
      const savedAccounts = getSavedAccounts()
      setActiveAccountId(session.user.id)
      setAccounts(savedAccounts.length > 0 ? savedAccounts : [savedAccount])
    } else {
      setActiveAccountId(null)
      setAccounts(getSavedAccounts())
    }
  }, [supabase])

  useEffect(() => {
    void syncAccounts()

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const savedAccount = saveAccountSession(session)
        const savedAccounts = getSavedAccounts()
        setActiveAccountId(session.user.id)
        setAccounts(savedAccounts.length > 0 ? savedAccounts : [savedAccount])
      } else {
        setActiveAccountId(null)
        setAccounts(getSavedAccounts())
      }
    })
    const handleAccountsUpdated = () => setAccounts(getSavedAccounts())

    window.addEventListener('storage', handleAccountsUpdated)
    window.addEventListener(SAVED_ACCOUNTS_UPDATED_EVENT, handleAccountsUpdated)

    return () => {
      data.subscription.unsubscribe()
      window.removeEventListener('storage', handleAccountsUpdated)
      window.removeEventListener(
        SAVED_ACCOUNTS_UPDATED_EVENT,
        handleAccountsUpdated,
      )
    }
  }, [supabase, syncAccounts])

  const activeAccount =
    accounts.find((account) => account.id === activeAccountId) ?? accounts[0]

  const handleSwitchAccount = async (account: SavedAccount) => {
    if (account.id === activeAccountId || pendingAccountId) return

    setPendingAccountId(account.id)

    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession()
    if (currentSession) saveAccountSession(currentSession)

    const { data, error } = await supabase.auth.setSession({
      access_token: account.accessToken,
      refresh_token: account.refreshToken,
    })

    if (error || !data.session) {
      removeSavedAccount(account.id)
      setPendingAccountId(null)
      toast.error('This saved session expired. Sign in to that account again.')
      return
    }

    saveAccountSession(data.session)
    window.location.assign('/')
  }

  const handleAddAccount = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session) saveAccountSession(session)

    router.push('/auth/login?mode=add-account&returnTo=/')
  }

  const handleLogout = async () => {
    if (pendingAccountId) return

    setPendingAccountId(activeAccountId ?? 'logout')
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const accountId = session?.user.id ?? activeAccountId
    const { error } = await supabase.auth.signOut({ scope: 'local' })

    if (error) {
      setPendingAccountId(null)
      toast.error(error.message)
      return
    }

    if (accountId) removeSavedAccount(accountId)

    const nextAccount = getSavedAccounts()[0]
    if (!nextAccount) {
      window.location.replace('/auth/login')
      return
    }

    const { data, error: switchError } = await supabase.auth.setSession({
      access_token: nextAccount.accessToken,
      refresh_token: nextAccount.refreshToken,
    })

    if (switchError || !data.session) {
      removeSavedAccount(nextAccount.id)
      window.location.replace('/auth/login')
      return
    }

    saveAccountSession(data.session)
    window.location.replace('/')
  }

  if (!activeAccount) {
    return (
      <div className="flex h-12 items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-3">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Loading account...
        </span>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group flex w-full items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar-accent/35 p-2 text-left transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <div className="relative">
            <Avatar className="size-9 border border-sidebar-border bg-background">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {getAccountInitials(activeAccount.email)}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-sidebar bg-emerald-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {activeAccount.email.split('@')[0]}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {activeAccount.email}
            </p>
          </div>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-sidebar-foreground" />
          <span className="sr-only">Open account menu</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-[276px] p-1.5"
      >
        <DropdownMenuLabel className="px-2 pb-1 pt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Accounts
        </DropdownMenuLabel>

        {accounts.map((account) => {
          const isActive = account.id === activeAccountId
          const isPending = account.id === pendingAccountId

          return (
            <DropdownMenuItem
              key={account.id}
              disabled={Boolean(pendingAccountId)}
              onSelect={() => void handleSwitchAccount(account)}
              className="gap-3 rounded-md p-2"
            >
              <Avatar className="size-8 border">
                <AvatarFallback className="bg-muted text-[11px] font-semibold">
                  {getAccountInitials(account.email)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{account.email}</p>
                <p className="text-xs text-muted-foreground">
                  {isActive ? 'Active now' : 'Switch account'}
                </p>
              </div>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isActive ? (
                <Check className="size-4 text-emerald-500" />
              ) : null}
            </DropdownMenuItem>
          )
        })}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => void handleAddAccount()}
          className="gap-2 rounded-md"
        >
          <UserPlus className="size-4" />
          Add another account
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={Boolean(pendingAccountId)}
          onSelect={() => void handleLogout()}
          className="gap-2 rounded-md text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="size-4" />
          Sign out of this account
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

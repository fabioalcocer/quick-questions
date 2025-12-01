'use client'

import type React from 'react'

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useChat } from '@ai-sdk/react'
import {
  IconMicrophone,
  IconPaperclip,
  IconPlus,
  IconSearch,
  IconSend,
  IconSparkles,
  IconWaveSine,
} from '@tabler/icons-react'
import { DefaultChatTransport } from 'ai'
import { MessageSquare } from 'lucide-react'
import { useRef, useState } from 'react'
import { ShimmeringText } from './ui/shadcn-io/shimmering-text'

export default function Ai01() {
  const [message, setMessage] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/agent',
    }),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim() || status === 'streaming') return

    const userMessage = message.trim()

    sendMessage({ text: userMessage })
    setMessage('')
    setIsExpanded(false)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }

    setIsExpanded(e.target.value.length > 100 || e.target.value.includes('\n'))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <div className="w-full">
      <h1 className="mb-7 mx-auto max-w-2xl text-center text-2xl font-semibold leading-9 text-foreground px-1 text-pretty whitespace-pre-wrap">
        Hello, how can I help you?
      </h1>

      <div className="w-full max-w-2xl mx-auto mb-8 max-h-[70vh] overflow-y-auto">
        {/* Chat Messages */}
        <Conversation className="relative size-full">
          <ConversationContent>
            {messages.length === 0 ? (
              <ConversationEmptyState
                description="Messages will appear here as the conversation progresses."
                icon={<MessageSquare className="size-6" />}
                title="Start a conversation"
              />
            ) : (
              messages.map((message) => (
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    {message.parts.map((part, i) => {
                      switch (part.type) {
                        case 'text': // we don't use any reasoning or tool calls in this example
                          return (
                            <MessageResponse key={`${message.id}-${i}`}>
                              {part.text}
                            </MessageResponse>
                          )
                        default:
                          return null
                      }
                    })}
                  </MessageContent>
                </Message>
              ))
            )}
            {status !== 'ready' && (
              <ShimmeringText
                text="Reasoning..."
                duration={1.5}
                wave={true}
                className="text-white mx-auto"
                shimmeringColor="var(--muted-foreground)"
              />
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>

      <form onSubmit={handleSubmit} className="group/composer w-full">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="sr-only"
          onChange={(e) => {}}
        />

        <div
          className={cn(
            'w-full max-w-2xl mx-auto bg-transparent dark:bg-muted/50 cursor-text overflow-clip bg-clip-padding p-2.5 shadow-lg border border-border transition-all duration-200',
            {
              'rounded-3xl grid grid-cols-1 grid-rows-[auto_1fr_auto]':
                isExpanded,
              'rounded-[28px] grid grid-cols-[auto_1fr_auto] grid-rows-[auto_1fr_auto]':
                !isExpanded,
            },
          )}
          style={{
            gridTemplateAreas: isExpanded
              ? "'header' 'primary' 'footer'"
              : "'header header header' 'leading primary trailing' '. footer .'",
          }}
        >
          <div
            className={cn(
              'flex min-h-14 items-center overflow-x-hidden px-1.5',
              {
                'px-2 py-1 mb-0': isExpanded,
                '-my-2.5': !isExpanded,
              },
            )}
            style={{ gridArea: 'primary' }}
          >
            <div className="flex-1 overflow-auto max-h-52">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything"
                className="min-h-0 resize-none rounded-none border-0 p-0 text-base placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 scrollbar-thin dark:bg-transparent"
                rows={1}
                disabled={status === 'streaming'}
              />
            </div>
          </div>

          <div
            className={cn('flex', { hidden: isExpanded })}
            style={{ gridArea: 'leading' }}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full hover:bg-accent outline-none ring-0"
                >
                  <IconPlus className="size-6 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="start"
                className="max-w-xs rounded-2xl p-1.5"
              >
                <DropdownMenuGroup className="space-y-1">
                  <DropdownMenuItem
                    className="rounded-[calc(1rem-6px)]"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <IconPaperclip size={20} className="opacity-60" />
                    Add photos & files
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-[calc(1rem-6px)]"
                    onClick={() => {}}
                  >
                    <div className="flex items-center gap-2">
                      <IconSparkles size={20} className="opacity-60" />
                      Agent mode
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-[calc(1rem-6px)]"
                    onClick={() => {}}
                  >
                    <IconSearch size={20} className="opacity-60" />
                    Deep Research
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div
            className="flex items-center gap-2"
            style={{ gridArea: isExpanded ? 'footer' : 'trailing' }}
          >
            <div className="ms-auto flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-accent"
              >
                <IconMicrophone className="size-5 text-muted-foreground" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-accent relative"
              >
                <IconWaveSine className="size-5 text-muted-foreground" />
              </Button>

              {message.trim() && status !== 'streaming' && (
                <Button
                  type="submit"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  disabled={status !== 'ready'}
                >
                  <IconSend className="size-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

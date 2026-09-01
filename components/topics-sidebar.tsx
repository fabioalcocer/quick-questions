'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
  Download,
  Edit,
  LayoutGrid,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react'
import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Input } from './ui/input'
import { useSidebar } from './ui/sidebar'

interface Topic {
  id: string
  title: string
  description: string
}

interface TopicsSidebarProps {
  topics: Topic[]
  selectedTopicId?: string
  onTopicSelect: (topicId: string) => void
  onAddTopic: () => void
  onEditTopic: (topic: Topic) => void
  onDeleteTopic: (topic: Topic) => void
  onExportLibrary: () => void
  onImportLibrary: () => void
}

export function TopicsSidebar({
  topics,
  selectedTopicId,
  onTopicSelect,
  onAddTopic,
  onEditTopic,
  onDeleteTopic,
  onExportLibrary,
  onImportLibrary,
}: TopicsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { open } = useSidebar()

  const filteredTopics = topics.filter((topic) => {
    const query = searchQuery.toLowerCase()
    return (
      topic.title.toLowerCase().includes(query) ||
      topic.description.toLowerCase().includes(query)
    )
  })

  return (
    <Sidebar
      collapsible="none"
      className={cn(
        'border-r border-sidebar-border w-[250px] bg-sidebar transition-all duration-300 ease-in-out',
        !open && 'w-0 border-r-0 opacity-0 pointer-events-none',
      )}
    >
      <SidebarHeader className="h-15 shrink-0 gap-0 border-b border-sidebar-border p-0">
        <div className="flex h-full items-center justify-between px-3">
          <h1 className="text-xl font-bold text-sidebar-foreground">Topics</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Library actions"
                className="h-8 w-8 p-0"
                size="icon"
                variant="ghost"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onSelect={onExportLibrary}>
                <Download className="mr-2 h-4 w-4" />
                Export library
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onImportLibrary}>
                <Upload className="mr-2 h-4 w-4" />
                Import library
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2 pt-0 pr-0">
        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="px-0">
            <div className="relative max-w-48">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-input bg-background/70 pl-10"
              />
            </div>
          </SidebarGroupLabel>
          <SidebarGroupAction onClick={onAddTopic}>
            <Plus className="min-h-5 min-w-5" />
          </SidebarGroupAction>
          <ScrollArea className="h-[calc(100svh-190px)] mt-1">
            <SidebarGroupContent className="mt-3">
              <SidebarMenu className="space-y-2 pl-1 pr-2">
                <SidebarMenuItem>
                  <Card
                    className={`group/card cursor-pointer transition-all duration-300 rounded-md py-0 hover:bg-sidebar-accent ${
                      selectedTopicId === 'all'
                        ? 'bg-sidebar-accent border-sidebar-primary ring-1 ring-sidebar-primary'
                        : ''
                    }`}
                    onClick={() => onTopicSelect('all')}
                  >
                    <CardHeader className="p-3 relative">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-semibold text-sidebar-foreground">
                            Todos los Temas
                          </CardTitle>
                          <CardDescription className="text-xs mt-1 line-clamp-1 text-foreground/80">
                            Ver todas las categorías
                          </CardDescription>
                        </div>
                        <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardHeader>
                  </Card>
                </SidebarMenuItem>

                {filteredTopics.map((topic) => (
                  <SidebarMenuItem key={topic.id}>
                    <Card
                      className={`group/card cursor-pointer transition-all duration-300 rounded-md py-0 hover:bg-sidebar-accent ${
                        selectedTopicId === topic.id
                          ? 'bg-sidebar-accent border-sidebar-primary ring-1 ring-sidebar-primary'
                          : ''
                      }`}
                      onClick={() => onTopicSelect(topic.id)}
                    >
                      <CardHeader className="p-3 relative">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm font-semibold text-sidebar-foreground">
                              {topic.title}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1 line-clamp-2 text-foreground/80 pr-2">
                              {topic.description}
                            </CardDescription>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 hover:bg-transparent group-hover/card:opacity-100 opacity-0 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation()
                                onEditTopic(topic)
                              }}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 group-hover/card:opacity-100 opacity-0 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteTopic(topic)
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </ScrollArea>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

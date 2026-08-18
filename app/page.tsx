'use client'

import { AccountSwitcher } from '@/components/account-switcher'
import { AppSidebar } from '@/components/app-sidebar'
import { CategoryFormSheet } from '@/components/category-form-sheet'
import { DeleteCategoryDialog } from '@/components/delete-category-dialog'
import { DeleteResponseDialog } from '@/components/delete-response-dialog'
import { DeleteTopicDialog } from '@/components/delete-topic-dialog'
import { GlobalSearch } from '@/components/global-search'
import { ModeToggle } from '@/components/mode-toggle'
import { RephraseDialog } from '@/components/rephrase-dialog'
import { ResponseCard } from '@/components/response-card'
import { ResponseFormSheet } from '@/components/response-form-sheet'
import { ResponseListRow } from '@/components/response-list-row'
import { TopicFormSheet } from '@/components/topic-form-sheet'
import { TopicsSidebar } from '@/components/topics-sidebar'
import { Button } from '@/components/ui/button'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import type { Category, QuickResponse, Topic } from '@/lib/quick-responses'
import { createClient } from '@/lib/supabase/client'
import { Grid2X2, List, Loader2, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

type ViewMode = 'cards' | 'compact'

const VIEW_MODE_STORAGE_KEY = 'quick-responses:view-mode:v1'

export default function HomePage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState<string>('all')
  const [categories, setCategories] = useState<Category[]>([])
  const [allResponses, setAllResponses] = useState<QuickResponse[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [reorderedCategoryIds, setReorderedCategoryIds] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('cards')

  // Topic modals
  const [topicFormOpen, setTopicFormOpen] = useState(false)
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null)
  const [deleteTopicOpen, setDeleteTopicOpen] = useState(false)
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null)

  // Category modals
  const [categoryFormOpen, setCategoryFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteCategoryOpen, setDeleteCategoryOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  )

  // Response modals
  const [responseFormOpen, setResponseFormOpen] = useState(false)
  const [editingResponse, setEditingResponse] = useState<QuickResponse | null>(
    null,
  )
  const [deleteResponseOpen, setDeleteResponseOpen] = useState(false)
  const [responseToDelete, setResponseToDelete] =
    useState<QuickResponse | null>(null)
  const [responseToRephrase, setResponseToRephrase] =
    useState<QuickResponse | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    try {
      const savedMode = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY)
      if (savedMode === 'cards' || savedMode === 'compact') {
        setViewMode(savedMode)
      }
    } catch {
      // Storage access can be unavailable in privacy-restricted browsers.
    }
  }, [])

  useEffect(() => {
    if (user) {
      loadTopics()
      loadCategories()
      loadAllResponses()
    }
  }, [user])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    setUser(user)
  }

  const loadTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      setTopics(data || [])

      if (data && data.length > 0 && !selectedTopicId) {
        setSelectedTopicId('all')
      }
    } catch (error) {
      console.error('Error loading topics:', error)
    }
  }

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error

      // Optimize: Fetch all responses counts in a single query if possible or fetch all and count locally
      const { data: responsesData, error: responsesError } = await supabase
        .from('responses')
        .select('category_id')

      if (responsesError) throw responsesError

      const countMap = (responsesData || []).reduce(
        (acc: Record<string, number>, curr) => {
          acc[curr.category_id] = (acc[curr.category_id] || 0) + 1
          return acc
        },
        {},
      )

      const categoriesWithCounts = (data || []).map((category) => ({
        ...category,
        responseCount: countMap[category.id] || 0,
      }))

      setCategories(categoriesWithCounts)

      // Handle default category selection when topic changes or initially
      if (categoriesWithCounts.length > 0 && !selectedCategoryId) {
        const firstCatInTopic = categoriesWithCounts.find(
          (c) => c.topic_id === selectedTopicId,
        )
        if (firstCatInTopic) {
          setSelectedCategoryId(firstCatInTopic.id)
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAllResponses = async () => {
    try {
      const { data, error } = await supabase.from('responses').select('*')

      if (error) throw error

      const languageOrder = { Spanish: 0, English: 1, Portuguese: 2 }
      const sortedResponses = (data || []).sort((a, b) => {
        const aOrder =
          languageOrder[a.language as keyof typeof languageOrder] ?? 999
        const bOrder =
          languageOrder[b.language as keyof typeof languageOrder] ?? 999
        return aOrder - bOrder
      })

      setAllResponses(sortedResponses)
    } catch (error) {
      console.error('Error loading all responses:', error)
    }
  }

  const updateCategoryOrder = async (reorderedCategories: Category[]) => {
    try {
      // Find all categories first to maintain full list
      const otherTopicsCategories =
        selectedTopicId === 'all'
          ? []
          : categories.filter((c) => c.topic_id !== selectedTopicId)

      const newCategories = [...otherTopicsCategories, ...reorderedCategories]
      setCategories(newCategories)

      const now = new Date()
      const updates = reorderedCategories.map((category, index) => {
        const newTimestamp = new Date(
          now.getTime() - (reorderedCategories.length - index) * 1000,
        )

        return supabase
          .from('categories')
          .update({ created_at: newTimestamp.toISOString() })
          .eq('id', category.id)
      })

      await Promise.all(updates)
      setReorderedCategoryIds(reorderedCategories.map((cat) => cat.id))
      await loadCategories()

      setTimeout(() => {
        setReorderedCategoryIds([])
      }, 1000)
    } catch (error) {
      console.error('Error updating category order:', error)
      await loadCategories()
    }
  }

  // Topic handlers
  const handleAddTopic = () => {
    setEditingTopic(null)
    setTopicFormOpen(true)
  }

  const handleEditTopic = (topic: Topic) => {
    setEditingTopic(topic)
    setTopicFormOpen(true)
  }

  const handleDeleteTopic = (topic: Topic) => {
    setTopicToDelete(topic)
    setDeleteTopicOpen(true)
  }

  const handleTopicFormSuccess = () => {
    loadTopics()
  }

  const handleDeleteTopicSuccess = () => {
    loadTopics()
    loadCategories()
    if (selectedTopicId === topicToDelete?.id) {
      setSelectedTopicId('all')
    }
  }

  // Category handlers
  const handleAddCategory = () => {
    setEditingCategory(null)
    setCategoryFormOpen(true)
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryFormOpen(true)
  }

  const handleDeleteCategory = (category: Category) => {
    setCategoryToDelete(category)
    setDeleteCategoryOpen(true)
  }

  const handleCategoryFormSuccess = () => {
    loadCategories()
  }

  const handleDeleteCategorySuccess = () => {
    loadCategories()
    loadAllResponses()
    if (selectedCategoryId === categoryToDelete?.id) {
      setSelectedCategoryId('')
    }
  }

  // Response handlers
  const handleAddResponse = () => {
    setEditingResponse(null)
    setResponseFormOpen(true)
  }

  const handleEditResponse = (response: QuickResponse) => {
    setEditingResponse(response)
    setResponseFormOpen(true)
  }

  const handleDeleteResponse = (response: QuickResponse) => {
    setResponseToDelete(response)
    setDeleteResponseOpen(true)
  }

  const handleResponseFormSuccess = () => {
    loadAllResponses()
    loadCategories()
  }

  const handleDeleteResponseSuccess = () => {
    loadAllResponses()
    loadCategories()
  }

  const handleCopyResponse = async (response: QuickResponse) => {
    try {
      await navigator.clipboard.writeText(response.text)
      toast.success('Response copied to clipboard!')
    } catch (error) {
      toast.error('Unable to copy this response.')
      throw error
    }
  }

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    try {
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode)
    } catch {
      // Keep the in-memory preference when storage is unavailable.
    }
  }

  if (loading) {
    return (
      <div className="flex items-center w-full inset-0 absolute justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin m-4 size-14 text-primary" />
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const filteredCategories =
    selectedTopicId === 'all'
      ? categories
      : categories.filter((c) => c.topic_id === selectedTopicId)
  const filteredResponses = selectedCategoryId
    ? allResponses.filter(
        (response) => response.category_id === selectedCategoryId,
      )
    : []
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)

  return (
    <SidebarProvider>
      <TopicsSidebar
        topics={topics}
        selectedTopicId={selectedTopicId}
        onTopicSelect={(id) => {
          setSelectedTopicId(id)
          const filtered =
            id === 'all'
              ? categories
              : categories.filter((c) => c.topic_id === id)
          setSelectedCategoryId(filtered[0]?.id || '')
        }}
        onAddTopic={handleAddTopic}
        onEditTopic={handleEditTopic}
        onDeleteTopic={handleDeleteTopic}
      />

      <AppSidebar
        categories={filteredCategories}
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={setSelectedCategoryId}
        onAddCategory={handleAddCategory}
        onEditCategory={handleEditCategory}
        onDeleteCategory={handleDeleteCategory}
        onCategoryReorder={updateCategoryOrder}
        reorderedCategoryIds={reorderedCategoryIds}
      />

      <SidebarInset className="min-w-0">
        <main className="flex min-w-0 flex-1 flex-col max-h-[100dvh] overflow-y-auto">
          <header className="sticky top-0 z-20 shrink-0 border-b border-border/80 bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
            <div className="flex min-h-9 w-full items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <SidebarTrigger className="-ml-1 shrink-0" />
                <GlobalSearch
                  categories={categories}
                  responses={allResponses}
                  topics={topics}
                  onCopy={handleCopyResponse}
                />
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <ModeToggle className="shrink-0 border-border/70 bg-muted/35 shadow-none hover:bg-muted" />
                {selectedCategory ? (
                  <Button
                    onClick={handleAddResponse}
                    className="size-9 shrink-0 p-0 shadow-sm sm:w-auto sm:px-4"
                    aria-label="Create Response"
                  >
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Create Response</span>
                  </Button>
                ) : null}
                <div
                  className="mx-0.5 hidden h-6 w-px shrink-0 bg-border sm:block"
                  aria-hidden="true"
                />
                <AccountSwitcher />
              </div>
            </div>
          </header>

          {selectedCategory ? (
            <>
              <div className="p-6 container mx-auto">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h1 className="text-2xl font-semibold text-foreground">
                      {selectedCategory.title}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                      {selectedCategory.description}
                    </p>
                  </div>
                  <fieldset className="flex h-9 shrink-0 items-center rounded-md border border-border/80 bg-muted/25 p-0.5">
                    <legend className="sr-only">Response view</legend>
                    <Button
                      aria-label="Card view"
                      aria-pressed={viewMode === 'cards'}
                      className="size-8 p-0"
                      onClick={() => handleViewModeChange('cards')}
                      size="icon"
                      title="Card view"
                      variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                    >
                      <Grid2X2 className="size-4" />
                    </Button>
                    <Button
                      aria-label="Compact view"
                      aria-pressed={viewMode === 'compact'}
                      className="size-8 p-0"
                      onClick={() => handleViewModeChange('compact')}
                      size="icon"
                      title="Compact view"
                      variant={viewMode === 'compact' ? 'secondary' : 'ghost'}
                    >
                      <List className="size-4" />
                    </Button>
                  </fieldset>
                </div>

                <div className="flex-1 mt-5">
                  {filteredResponses.length > 0 ? (
                    <div
                      className={
                        viewMode === 'cards'
                          ? 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'
                          : 'space-y-2'
                      }
                    >
                      {filteredResponses.map((response) =>
                        viewMode === 'cards' ? (
                          <ResponseCard
                            key={response.id}
                            response={response}
                            onCopy={handleCopyResponse}
                            onDelete={handleDeleteResponse}
                            onEdit={handleEditResponse}
                            onRephrase={setResponseToRephrase}
                          />
                        ) : (
                          <ResponseListRow
                            key={response.id}
                            response={response}
                            onCopy={handleCopyResponse}
                            onDelete={handleDeleteResponse}
                            onEdit={handleEditResponse}
                            onRephrase={setResponseToRephrase}
                          />
                        ),
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <p className="text-muted-foreground mb-4">
                          No responses yet in this category
                        </p>
                        <Button onClick={handleAddResponse}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Response
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                  {topics.length === 0 ? (
                    <>
                      <p className="text-muted-foreground mb-6">
                        No topics yet. Create your first topic to start
                        organizing your categories and responses.
                      </p>
                      <Button onClick={handleAddTopic} size="lg">
                        <Plus className="h-5 w-5 mr-2" />
                        Create First Topic
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-muted-foreground mb-6">
                        {filteredCategories.length === 0
                          ? "This topic doesn't have any categories yet. Create your first category to get started."
                          : 'Select a category from the sidebar to view its responses.'}
                      </p>
                      {filteredCategories.length === 0 && (
                        <Button onClick={handleAddCategory} size="lg">
                          <Plus className="h-5 w-5 mr-2" />
                          Create First Category
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </SidebarInset>

      {/* Topic Modals */}
      <TopicFormSheet
        isOpen={topicFormOpen}
        onClose={() => setTopicFormOpen(false)}
        topic={editingTopic}
        onSuccess={handleTopicFormSuccess}
      />

      <DeleteTopicDialog
        isOpen={deleteTopicOpen}
        onClose={() => setDeleteTopicOpen(false)}
        topic={topicToDelete}
        onSuccess={handleDeleteTopicSuccess}
      />

      {/* Category Modals */}
      <CategoryFormSheet
        isOpen={categoryFormOpen}
        onClose={() => setCategoryFormOpen(false)}
        category={editingCategory}
        topics={topics}
        defaultTopicId={selectedTopicId}
        onSuccess={handleCategoryFormSuccess}
      />

      <DeleteCategoryDialog
        isOpen={deleteCategoryOpen}
        onClose={() => setDeleteCategoryOpen(false)}
        category={categoryToDelete}
        onSuccess={handleDeleteCategorySuccess}
      />

      {/* Response Modals */}
      <ResponseFormSheet
        isOpen={responseFormOpen}
        onClose={() => setResponseFormOpen(false)}
        response={editingResponse}
        categoryId={selectedCategoryId}
        onSuccess={handleResponseFormSuccess}
      />

      <DeleteResponseDialog
        isOpen={deleteResponseOpen}
        onClose={() => setDeleteResponseOpen(false)}
        response={responseToDelete}
        onSuccess={handleDeleteResponseSuccess}
      />

      <RephraseDialog
        response={responseToRephrase}
        onClose={() => setResponseToRephrase(null)}
      />
    </SidebarProvider>
  )
}

"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { ResponseCard } from "@/components/response-card"
import { CategoryFormSheet } from "@/components/category-form-sheet"
import { DeleteCategoryDialog } from "@/components/delete-category-dialog"
import { ResponseFormSheet } from "@/components/response-form-sheet"
import { DeleteResponseDialog } from "@/components/delete-response-dialog"
import { Button } from "@/components/ui/button"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Category {
  id: string
  title: string
  description: string
  responseCount?: number
}

interface Response {
  id: string
  text: string
  language: string
  category_id: string
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [responses, setResponses] = useState<Response[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  // Category modals
  const [categoryFormOpen, setCategoryFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteCategoryOpen, setDeleteCategoryOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)

  // Response modals
  const [responseFormOpen, setResponseFormOpen] = useState(false)
  const [editingResponse, setEditingResponse] = useState<Response | null>(null)
  const [deleteResponseOpen, setDeleteResponseOpen] = useState(false)
  const [responseToDelete, setResponseToDelete] = useState<Response | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadCategories()
    }
  }, [user])

  useEffect(() => {
    if (selectedCategoryId) {
      loadResponses(selectedCategoryId)
    }
  }, [selectedCategoryId])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }
    setUser(user)
  }

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase.from("categories").select("*").order("created_at", { ascending: false })

      if (error) throw error

      // Load response counts for each category
      const categoriesWithCounts = await Promise.all(
        data.map(async (category) => {
          const { count } = await supabase
            .from("responses")
            .select("*", { count: "exact", head: true })
            .eq("category_id", category.id)

          return {
            ...category,
            responseCount: count || 0,
          }
        }),
      )

      setCategories(categoriesWithCounts)

      // Select first category by default
      if (categoriesWithCounts.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(categoriesWithCounts[0].id)
      }
    } catch (error) {
      console.error("Error loading categories:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadResponses = async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from("responses")
        .select("*")
        .eq("category_id", categoryId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setResponses(data || [])
    } catch (error) {
      console.error("Error loading responses:", error)
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
    if (selectedCategoryId === categoryToDelete?.id) {
      setSelectedCategoryId("")
      setResponses([])
    }
  }

  // Response handlers
  const handleAddResponse = () => {
    setEditingResponse(null)
    setResponseFormOpen(true)
  }

  const handleEditResponse = (response: Response) => {
    setEditingResponse(response)
    setResponseFormOpen(true)
  }

  const handleDeleteResponse = (response: Response) => {
    setResponseToDelete(response)
    setDeleteResponseOpen(true)
  }

  const handleResponseFormSuccess = () => {
    loadResponses(selectedCategoryId)
    loadCategories() // Refresh counts
  }

  const handleDeleteResponseSuccess = () => {
    loadResponses(selectedCategoryId)
    loadCategories() // Refresh counts
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)

  return (
    <>
      <AppSidebar
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={setSelectedCategoryId}
        onAddCategory={handleAddCategory}
        onEditCategory={handleEditCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1" />
        </header>

        <main className="flex-1 flex flex-col">
          {selectedCategory ? (
            <>
              {/* Header */}
              <div className="border-b border-border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-semibold text-foreground">{selectedCategory.title}</h1>
                    <p className="text-muted-foreground mt-1">{selectedCategory.description}</p>
                  </div>
                  <Button onClick={handleAddResponse}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Response
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-6">
                {responses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {responses.map((response) => (
                      <ResponseCard
                        key={response.id}
                        response={response}
                        onEdit={handleEditResponse}
                        onDelete={handleDeleteResponse}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <p className="text-muted-foreground mb-4">No responses yet in this category</p>
                      <Button onClick={handleAddResponse}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Response
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  {categories.length === 0
                    ? "No categories yet. Create your first category to get started."
                    : "Select a category to view responses"}
                </p>
                {categories.length === 0 && (
                  <Button onClick={handleAddCategory}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Category
                  </Button>
                )}
              </div>
            </div>
          )}
        </main>
      </SidebarInset>

      {/* Category Modals */}
      <CategoryFormSheet
        isOpen={categoryFormOpen}
        onClose={() => setCategoryFormOpen(false)}
        category={editingCategory}
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
    </>
  )
}

"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface Category {
  id: string
  title: string
  description: string
}

interface CategoryFormSheetProps {
  isOpen: boolean
  onClose: () => void
  category?: Category | null
  onSuccess: () => void
}

export function CategoryFormSheet({ isOpen, onClose, category, onSuccess }: CategoryFormSheetProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const isEditing = !!category

  useEffect(() => {
    if (category) {
      setTitle(category.title)
      setDescription(category.description)
    } else {
      setTitle("")
      setDescription("")
    }
    setError(null)
  }, [category, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("User not authenticated")
      }

      if (isEditing && category) {
        // Update existing category
        const { error } = await supabase
          .from("categories")
          .update({
            title: title.trim(),
            description: description.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", category.id)

        if (error) throw error
      } else {
        // Create new category
        const { error } = await supabase.from("categories").insert({
          title: title.trim(),
          description: description.trim(),
          user_id: user.id,
        })

        if (error) throw error
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      setError(error.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setTitle("")
    setDescription("")
    setError(null)
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-lg w-full">
        <SheetHeader className="pb-8">
          <SheetTitle className="text-2xl font-semibold text-foreground">
            {isEditing ? "Edit Category" : "Create New Category"}
          </SheetTitle>
          <SheetDescription className="text-base text-muted-foreground leading-relaxed">
            {isEditing
              ? "Update the category information below."
              : "Add a new category to organize your quick responses."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <Label htmlFor="title" className="text-sm font-medium text-foreground">
              Category Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Offline advice and close"
              required
              maxLength={100}
              className="h-12 px-4 bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-blue-100 shadow-lg hover:shadow-xl focus:shadow-xl transition-all duration-200 focus:ring-2 focus:ring-primary/20 text-base hover:border-blue-200 focus:border-primary"
            />
          </div>

          <div className="space-y-4">
            <Label htmlFor="description" className="text-sm font-medium text-foreground">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of when to use this category..."
              rows={4}
              maxLength={500}
              className="resize-none p-4 bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-blue-100 shadow-lg hover:shadow-xl focus:shadow-xl transition-all duration-200 focus:ring-2 focus:ring-primary/20 text-base leading-relaxed hover:border-blue-200 focus:border-primary"
            />
            <p
              className={`text-sm font-medium ${description.length > 450 ? "text-destructive" : "text-muted-foreground"}`}
            >
              {description.length}/500 characters
            </p>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}

          <div className="flex gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-12 bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] font-medium hover:border-blue-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="flex-1 h-12 bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 hover:from-blue-700 hover:to-blue-800"
            >
              {isLoading ? "Saving..." : isEditing ? "Update Category" : "Create Category"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

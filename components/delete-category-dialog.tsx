"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface DeleteCategoryDialogProps {
  isOpen: boolean
  onClose: () => void
  category: { id: string; title: string; responseCount?: number } | null
  onSuccess: () => void
}

export function DeleteCategoryDialog({ isOpen, onClose, category, onSuccess }: DeleteCategoryDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleDelete = async () => {
    if (!category) return

    setIsLoading(true)
    try {
      const { error } = await supabase.from("categories").delete().eq("id", category.id)

      if (error) throw error

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error deleting category:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!category) return null

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Category</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{category.title}"?
            {category.responseCount && category.responseCount > 0 && (
              <span className="block mt-2 text-destructive font-medium">
                This will also delete {category.responseCount} response{category.responseCount !== 1 ? "s" : ""} in this
                category.
              </span>
            )}
            <span className="block mt-2">This action cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Deleting..." : "Delete Category"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

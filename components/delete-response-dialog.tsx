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

interface DeleteResponseDialogProps {
  isOpen: boolean
  onClose: () => void
  response: { id: string; text: string; language: string } | null
  onSuccess: () => void
}

export function DeleteResponseDialog({ isOpen, onClose, response, onSuccess }: DeleteResponseDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleDelete = async () => {
    if (!response) return

    setIsLoading(true)
    try {
      const { error } = await supabase.from("responses").delete().eq("id", response.id)

      if (error) throw error

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error deleting response:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!response) return null

  const truncatedText = response.text.length > 100 ? response.text.substring(0, 100) + "..." : response.text

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Response</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this {response.language} response?
            <div className="mt-3 p-3 bg-muted rounded-md">
              <p className="text-sm font-medium text-foreground">"{truncatedText}"</p>
            </div>
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
            {isLoading ? "Deleting..." : "Delete Response"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

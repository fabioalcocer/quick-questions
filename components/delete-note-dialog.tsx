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

interface DeleteNoteDialogProps {
  isOpen: boolean
  onClose: () => void
  note: { id: string; text: string } | null
  onSuccess: () => void
}

export function DeleteNoteDialog({ isOpen, onClose, note, onSuccess }: DeleteNoteDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleDelete = async () => {
    if (!note) return

    setIsLoading(true)
    try {
      const { error } = await supabase.from("notes").delete().eq("id", note.id)

      if (error) throw error

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error deleting note:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!note) return null

  const truncatedText = note.text.length > 100 ? note.text.substring(0, 100) + "..." : note.text

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Note</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this note?
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
            {isLoading ? "Deleting..." : "Delete Note"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

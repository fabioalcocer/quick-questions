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
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"

interface DeleteTopicDialogProps {
  isOpen: boolean
  onClose: () => void
  topic: { id: string; title: string } | null
  onSuccess: () => void
}

export function DeleteTopicDialog({ isOpen, onClose, topic, onSuccess }: DeleteTopicDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleDelete = async () => {
    if (!topic) return

    setIsLoading(true)
    setError(null)
    try {
      // 1. Unlink all categories from this topic first to avoid foreign key constraint error
      const { error: updateError } = await supabase
        .from("categories")
        .update({ topic_id: null })
        .eq("topic_id", topic.id)

      if (updateError) throw updateError

      // 2. Delete the topic
      const { error: deleteError } = await supabase
        .from("topics")
        .delete()
        .eq("id", topic.id)

      if (deleteError) throw deleteError

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error("Error deleting topic:", err)
      setError(err.message || "No se pudo eliminar el tema")
    } finally {
      setIsLoading(false)
    }
  }

  if (!topic) return null

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar Tema</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que quieres eliminar "{topic.title}"?
            <span className="block mt-2 text-destructive font-medium">
              Las categorías vinculadas pasarán a estar "Sin Tema".
            </span>
            <span className="block mt-2">Esta acción no se puede deshacer.</span>

            {error && (
              <span className="block mt-4 p-2 text-sm bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
                {error}
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Eliminando..." : "Eliminar Tema"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

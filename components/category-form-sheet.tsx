"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

interface Category {
  id: string;
  title: string;
  description: string;
  topic_id?: string;
}

interface Topic {
  id: string;
  title: string;
}

interface CategoryFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null;
  topics: Topic[];
  defaultTopicId?: string;
  onSuccess: () => void;
}

export function CategoryFormSheet({
  isOpen,
  onClose,
  category,
  topics,
  defaultTopicId,
  onSuccess,
}: CategoryFormSheetProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topicId, setTopicId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const isEditing = !!category;

  useEffect(() => {
    if (category) {
      setTitle(category.title);
      setDescription(category.description);
      setTopicId(category.topic_id || "unassigned");
    } else {
      setTitle("");
      setDescription("");
      setTopicId(defaultTopicId === "all" ? "unassigned" : (defaultTopicId || "unassigned"));
    }
    setError(null);
  }, [category, isOpen, defaultTopicId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const categoryData = {
        title: title.trim(),
        description: description.trim(),
        topic_id: topicId === "unassigned" ? null : topicId,
        updated_at: isEditing ? new Date().toISOString() : undefined,
        user_id: isEditing ? undefined : user.id,
      };

      if (isEditing && category) {
        // Update existing category
        const { error } = await supabase
          .from("categories")
          .update(categoryData)
          .eq("id", category.id);

        if (error) throw error;
      } else {
        // Create new category
        const { error } = await supabase.from("categories").insert(categoryData);

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      setError(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setTopicId("");
    setError(null);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-lg w-full">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-2xl font-semibold text-foreground">
            {isEditing ? "Edit Category" : "Create New Category"}
          </SheetTitle>
          <SheetDescription className="text-base text-muted-foreground leading-relaxed">
            {isEditing
              ? "Update the category information below."
              : "Add a new category to organize your quick responses."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-4 pt-4">
          <div className="space-y-4">
            <Label
              htmlFor="topic-select"
              className="text-sm font-medium text-foreground"
            >
              Select Topic
            </Label>
            <Select value={topicId} onValueChange={setTopicId}>
              <SelectTrigger id="topic-select">
                <SelectValue placeholder="Seleccionar un tema..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Selecciona un topic</SelectItem>
                {topics.map((topic) => (
                  <SelectItem key={topic.id} value={topic.id}>
                    {topic.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label
              htmlFor="title"
              className="text-sm font-medium text-foreground"
            >
              Category Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Offline advice and close"
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-4">
            <Label
              htmlFor="description"
              className="text-sm font-medium text-foreground"
            >
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of when to use this category..."
              rows={4}
              maxLength={500}
              className="resize-vertical p-4 focus:shadow-sm border-border transition-all duration-200 text-base leading-relaxed focus:border-primary"
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

          <div className="flex gap-4 pt-6 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading
                ? "Saving..."
                : isEditing
                  ? "Update Category"
                  : "Create Category"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

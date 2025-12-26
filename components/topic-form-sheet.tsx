"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface Topic {
  id: string;
  title: string;
  description: string;
}

interface TopicFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  topic?: Topic | null;
  onSuccess: () => void;
}

export function TopicFormSheet({
  isOpen,
  onClose,
  topic,
  onSuccess,
}: TopicFormSheetProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const isEditing = !!topic;

  useEffect(() => {
    if (topic) {
      setTitle(topic.title);
      setDescription(topic.description);
    } else {
      setTitle("");
      setDescription("");
    }
    setError(null);
  }, [topic, isOpen]);

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

      if (isEditing && topic) {
        // Update existing topic
        const { error } = await supabase
          .from("topics")
          .update({
            title: title.trim(),
            description: description.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", topic.id);

        if (error) throw error;
      } else {
        // Create new topic
        const { error } = await supabase.from("topics").insert({
          title: title.trim(),
          description: description.trim(),
          user_id: user.id,
        });

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
    setError(null);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-lg w-full">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-2xl font-semibold text-foreground">
            {isEditing ? "Edit Topic" : "Create New Topic"}
          </SheetTitle>
          <SheetDescription className="text-base text-muted-foreground leading-relaxed">
            {isEditing
              ? "Update the topic information below."
              : "Add a new topic to organize your categories."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-4 pt-4">
          <div className="space-y-4">
            <Label
              htmlFor="topic-title"
              className="text-sm font-medium text-foreground"
            >
              Topic Title
            </Label>
            <Input
              id="topic-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., General Inquiries"
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-4">
            <Label
              htmlFor="topic-description"
              className="text-sm font-medium text-foreground"
            >
              Description
            </Label>
            <Textarea
              id="topic-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this topic..."
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
              className="hover:bg-gray-100 hover:text-black"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading
                ? "Saving..."
                : isEditing
                  ? "Update Topic"
                  : "Create Topic"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

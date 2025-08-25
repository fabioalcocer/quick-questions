"use client";

import type React from "react";

import { Badge } from "@/components/ui/badge";
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
import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

interface Note {
	id: string;
	text: string;
	tags: string[];
}

interface NoteFormSheetProps {
	isOpen: boolean;
	onClose: () => void;
	note?: Note | null;
	onSuccess: () => void;
}

export function NoteFormSheet({
	isOpen,
	onClose,
	note,
	onSuccess,
}: NoteFormSheetProps) {
	const [text, setText] = useState("");
	const [tags, setTags] = useState<string[]>([]);
	const [newTag, setNewTag] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const supabase = createClient();

	const isEditing = !!note;

	useEffect(() => {
		if (note) {
			setText(note.text);
			setTags(note.tags || []);
		} else {
			setText("");
			setTags([]);
		}
		setNewTag("");
		setError(null);
	}, [note, isOpen]);

	const handleAddTag = () => {
		const trimmedTag = newTag.trim().toLowerCase();
		if (trimmedTag && !tags.includes(trimmedTag)) {
			setTags([...tags, trimmedTag]);
			setNewTag("");
		}
	};

	const handleRemoveTag = (tagToRemove: string) => {
		setTags(tags.filter((tag) => tag !== tagToRemove));
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleAddTag();
		}
	};

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

			if (isEditing && note) {
				// Update existing note
				const { error } = await supabase
					.from("notes")
					.update({
						text: text.trim(),
						tags,
						updated_at: new Date().toISOString(),
					})
					.eq("id", note.id);

				if (error) throw error;
			} else {
				// Create new note
				const { error } = await supabase.from("notes").insert({
					text: text.trim(),
					tags,
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
		setText("");
		setTags([]);
		setNewTag("");
		setError(null);
		onClose();
	};

	return (
		<Sheet open={isOpen} onOpenChange={handleClose}>
			<SheetContent className="sm:max-w-md">
				<SheetHeader>
					<SheetTitle>{isEditing ? "Edit Note" : "Create New Note"}</SheetTitle>
					<SheetDescription>
						{isEditing
							? "Update your note and tags below."
							: "Add a new note with optional tags for organization."}
					</SheetDescription>
				</SheetHeader>

				<form onSubmit={handleSubmit} className="space-y-4 mt-2 px-4">
					<div className="space-y-2">
						<Label htmlFor="text">Note Text</Label>
						<Textarea
							id="text"
							value={text}
							onChange={(e) => setText(e.target.value)}
							placeholder="Enter your note here..."
							rows={6}
							required
							maxLength={2000}
							className="resize-none"
						/>
						<p className="text-xs text-muted-foreground">
							{text.length}/2000 characters
						</p>
					</div>

					<div className="space-y-3">
						<Label>Tags</Label>
						<div className="flex gap-2">
							<Input
								value={newTag}
								onChange={(e) => setNewTag(e.target.value)}
								onKeyPress={handleKeyPress}
								placeholder="Add a tag..."
								maxLength={20}
								className="flex-1"
							/>
							<Button
								type="button"
								size="sm"
								onClick={handleAddTag}
								disabled={!newTag.trim()}
							>
								<Plus className="h-4 w-4" />
							</Button>
						</div>

						{tags.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{tags.map((tag) => (
									<Badge
										key={tag}
										variant="secondary"
										className="flex items-center gap-1"
									>
										{tag}
										<button
											type="button"
											onClick={() => handleRemoveTag(tag)}
											className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
										>
											<X className="h-3 w-3" />
										</button>
									</Badge>
								))}
							</div>
						)}
					</div>

					{error && <p className="text-sm text-destructive">{error}</p>}

					<div className="flex gap-3 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={handleClose}
							className="flex-1 hover:text-black hover:bg-gray-100"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isLoading || !text.trim()}
							className="flex-1"
						>
							{isLoading
								? "Saving..."
								: isEditing
									? "Update Note"
									: "Create Note"}
						</Button>
					</div>
				</form>
			</SheetContent>
		</Sheet>
	);
}

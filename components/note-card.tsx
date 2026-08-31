"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit, Trash2 } from "lucide-react";
import { useState } from "react";

interface Note {
	id: string;
	text: string;
	tags: string[];
	created_at: string;
}

interface NoteCardProps {
	note: Note;
	onEdit: (note: Note) => void;
	onDelete: (note: Note) => void;
}

export function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	const handleCardClick = () => {
		setIsDialogOpen(true);
	};

	const handleEdit = (e: React.MouseEvent) => {
		e.stopPropagation();
		onEdit(note);
	};

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		onDelete(note);
	};

	return (
		<>
			<Card
				className="group aspect-square max-w-48 cursor-pointer gap-0 border-border/90 py-3 shadow-xs transition-[border-color,box-shadow] duration-200 hover:border-primary/30 hover:shadow-sm"
				onClick={handleCardClick}
			>
				<CardHeader className="pb-0 px-4">
					<div className="flex items-start justify-between">
						<div className="flex flex-wrap gap-1">
							{note.tags.map((tag) => (
								<Badge key={tag} variant="outline" className="text-xs">
									{tag}
								</Badge>
							))}
							{note.tags.length === 0 && (
								<Badge
									variant="outline"
									className="text-xs text-muted-foreground"
								>
									No tags
								</Badge>
							)}
						</div>
					</div>
				</CardHeader>
				<CardContent className="pt-0 px-4 flex flex-col">
					<p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap mb-3 line-clamp-4">
						{note.text}
					</p>
				</CardContent>
				<div className="px-4 pr-1 mt-auto flex items-center justify-between">
					<p className="text-xs text-muted-foreground">
						{formatDate(note.created_at)}
					</p>
					<div className="flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-opacity">
						<Button
							size="sm"
							variant="ghost"
							className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
							onClick={handleEdit}
						>
							<Edit className="h-4 w-4" />
						</Button>
						<Button
							size="sm"
							variant="ghost"
							className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
							onClick={handleDelete}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</Card>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="flex flex-col gap-4">
					<DialogHeader>
						<DialogTitle>Note Details</DialogTitle>
					</DialogHeader>
					<ScrollArea className="max-h-[450px] pr-4">
						<p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
							{note.text}
						</p>
					</ScrollArea>
					<DialogFooter className="border-t border-solid border-border pt-4">
						<Button
							onClick={() => setIsDialogOpen(false)}
							className="w-full bg-primary hover:bg-primary/90 text-primary-foreground max-w-xs mx-auto"
						>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

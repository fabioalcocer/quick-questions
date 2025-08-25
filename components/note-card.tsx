"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Edit, Trash2 } from "lucide-react";

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
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	return (
		<Card className="group py-3 hover:shadow-md gap-0 aspect-square max-w-48 transition-all duration-200 hover:border-primary/20">
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
						className="h-8 w-8 p-0 hover:bg-primary/90"
						onClick={() => onEdit(note)}
					>
						<Edit className="h-4 w-4" />
					</Button>
					<Button
						size="sm"
						variant="ghost"
						className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
						onClick={() => onDelete(note)}
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</Card>
	);
}

"use client";

import { DeleteNoteDialog } from "@/components/delete-note-dialog";
import { NoteCard } from "@/components/note-card";
import { NoteFormSheet } from "@/components/note-form-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Note {
	id: string;
	text: string;
	tags: string[];
	created_at: string;
}

export default function NotesPage() {
	const [notes, setNotes] = useState<Note[]>([]);
	const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
	const [allTags, setAllTags] = useState<string[]>([]);
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [loading, setLoading] = useState(true);
	const [user, setUser] = useState<any>(null);

	// Modals
	const [noteFormOpen, setNoteFormOpen] = useState(false);
	const [editingNote, setEditingNote] = useState<Note | null>(null);
	const [deleteNoteOpen, setDeleteNoteOpen] = useState(false);
	const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

	const router = useRouter();
	const supabase = createClient();

	useEffect(() => {
		checkUser();
	}, []);

	useEffect(() => {
		if (user) {
			loadNotes();
		}
	}, [user]);

	useEffect(() => {
		filterNotes();
	}, [notes, selectedTags, searchQuery]);

	const checkUser = async () => {
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			router.push("/auth/login");
			return;
		}
		setUser(user);
	};

	const loadNotes = async () => {
		try {
			const { data, error } = await supabase
				.from("notes")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) throw error;

			setNotes(data || []);

			// Extract all unique tags
			const tags = new Set<string>();
			data?.forEach((note) => {
				note.tags?.forEach((tag: string) => tags.add(tag));
			});
			setAllTags(Array.from(tags).sort());
		} catch (error) {
			console.error("Error loading notes:", error);
		} finally {
			setLoading(false);
		}
	};

	const filterNotes = () => {
		let filtered = notes;

		// Filter by selected tags
		if (selectedTags.length > 0) {
			filtered = filtered.filter((note) =>
				selectedTags.some((tag) => note.tags.includes(tag)),
			);
		}

		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(note) =>
					note.text.toLowerCase().includes(query) ||
					note.tags.some((tag) => tag.toLowerCase().includes(query)),
			);
		}

		setFilteredNotes(filtered);
	};

	const handleTagFilter = (tag: string) => {
		if (selectedTags.includes(tag)) {
			setSelectedTags(selectedTags.filter((t) => t !== tag));
		} else {
			setSelectedTags([...selectedTags, tag]);
		}
	};

	const clearFilters = () => {
		setSelectedTags([]);
		setSearchQuery("");
	};

	const handleAddNote = () => {
		setEditingNote(null);
		setNoteFormOpen(true);
	};

	const handleEditNote = (note: Note) => {
		setEditingNote(note);
		setNoteFormOpen(true);
	};

	const handleDeleteNote = (note: Note) => {
		setNoteToDelete(note);
		setDeleteNoteOpen(true);
	};

	const handleNoteFormSuccess = () => {
		loadNotes();
	};

	const handleDeleteSuccess = () => {
		loadNotes();
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
					<p className="mt-2 text-muted-foreground">Loading notes...</p>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="min-h-screen bg-background w-full">
				{/* Header */}
				<div className="border-b border-border">
					<div className="max-w-7xl mx-auto px-6 py-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<Link href="/">
									<Button variant="ghost" size="sm">
										<ArrowLeft className="h-4 w-4 mr-2" />
										Back to Quick Answers
									</Button>
								</Link>
							</div>
							<Button onClick={handleAddNote}>
								<Plus className="h-4 w-4 mr-2" />
								Create Note
							</Button>
						</div>
					</div>
				</div>

				{/* Filters */}
				<div className="max-w-7xl mx-auto px-6 py-6">
					<div className="space-y-4">
						{/* Search */}
						<div className="relative max-w-md">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search notes..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
							/>
						</div>

						{/* Tag filters */}
						{allTags.length > 0 && (
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium text-foreground">
										Filter by tags:
									</span>
									{(selectedTags.length > 0 || searchQuery) && (
										<Button variant="ghost" size="sm" onClick={clearFilters}>
											<X className="h-4 w-4 mr-1" />
											Clear filters
										</Button>
									)}
								</div>
								<div className="flex flex-wrap gap-2">
									{allTags.map((tag) => (
										<Badge
											key={tag}
											variant={
												selectedTags.includes(tag) ? "default" : "outline"
											}
											className="cursor-pointer hover:bg-primary/10"
											onClick={() => handleTagFilter(tag)}
										>
											{tag}
										</Badge>
									))}
								</div>
							</div>
						)}

						{/* Results count */}
						<div className="text-sm text-muted-foreground">
							{filteredNotes.length === notes.length
								? `${notes.length} note${notes.length !== 1 ? "s" : ""}`
								: `${filteredNotes.length} of ${notes.length} note${notes.length !== 1 ? "s" : ""}`}
						</div>
					</div>
				</div>

				{/* Content */}
				<div className="max-w-7xl mx-auto px-6 pb-12">
					{filteredNotes.length > 0 ? (
						<div className="flex flex-wrap gap-4">
							{filteredNotes.map((note) => (
								<NoteCard
									key={note.id}
									note={note}
									onEdit={handleEditNote}
									onDelete={handleDeleteNote}
								/>
							))}
						</div>
					) : (
						<div className="flex items-center justify-center h-64">
							<div className="text-center">
								<p className="text-muted-foreground mb-4">
									{notes.length === 0
										? "No notes yet. Create your first note to get started."
										: "No notes match your current filters."}
								</p>
								{notes.length === 0 ? (
									<Button onClick={handleAddNote}>
										<Plus className="h-4 w-4 mr-2" />
										Create First Note
									</Button>
								) : (
									<Button variant="outline" onClick={clearFilters}>
										Clear filters
									</Button>
								)}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Modals */}
			<NoteFormSheet
				isOpen={noteFormOpen}
				onClose={() => setNoteFormOpen(false)}
				note={editingNote}
				onSuccess={handleNoteFormSuccess}
			/>

			<DeleteNoteDialog
				isOpen={deleteNoteOpen}
				onClose={() => setDeleteNoteOpen(false)}
				note={noteToDelete}
				onSuccess={handleDeleteSuccess}
			/>
		</>
	);
}

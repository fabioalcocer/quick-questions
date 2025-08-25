"use client";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit, MessageSquare, Plus, StickyNote, Trash2 } from "lucide-react";
import Link from "next/link";

interface Category {
	id: string;
	title: string;
	description: string;
	responseCount?: number;
}

interface SidebarProps {
	categories: Category[];
	selectedCategoryId?: string;
	onCategorySelect: (categoryId: string) => void;
	onAddCategory: () => void;
	onEditCategory: (category: Category) => void;
	onDeleteCategory: (category: Category) => void;
}

export function Sidebar({
	categories,
	selectedCategoryId,
	onCategorySelect,
	onAddCategory,
	onEditCategory,
	onDeleteCategory,
}: SidebarProps) {
	return (
		<div className="w-80 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
			{/* Header */}
			<div className="p-6 border-b border-sidebar-border">
				<h1 className="text-xl font-semibold text-sidebar-foreground">
					Quick Answers
				</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Manage your responses
				</p>
			</div>

			{/* Categories Section */}
			<div className="flex-1 flex flex-col">
				<div className="p-4">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-sm font-medium text-sidebar-foreground">
							Categories
						</h2>
						<Button
							size="sm"
							onClick={onAddCategory}
							className="h-8 w-8 p-0 bg-transparent"
							variant="outline"
						>
							<Plus className="h-4 w-4" />
						</Button>
					</div>

					<ScrollArea className="flex-1">
						<div className="space-y-2">
							{categories.map((category) => (
								<Card
									key={category.id}
									className={`group cursor-pointer transition-colors hover:bg-sidebar-accent ${
										selectedCategoryId === category.id
											? "bg-sidebar-accent border-sidebar-primary"
											: ""
									}`}
									onClick={() => onCategorySelect(category.id)}
								>
									<CardHeader className="p-3">
										<div className="flex items-start justify-between">
											<div className="flex-1 min-w-0">
												<CardTitle className="text-sm font-medium text-sidebar-foreground truncate">
													{category.title}
												</CardTitle>
												<CardDescription className="text-xs mt-1 line-clamp-2">
													{category.description}
												</CardDescription>
											</div>
											<div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
												<Button
													size="sm"
													variant="ghost"
													className="h-6 w-6 p-0"
													onClick={(e) => {
														e.stopPropagation();
														onEditCategory(category);
													}}
												>
													<Edit className="h-3 w-3" />
												</Button>
												<Button
													size="sm"
													variant="ghost"
													className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 hover:scale-110 transition-all duration-200 shadow-sm hover:shadow-md"
													onClick={(e) => {
														e.stopPropagation();
														onDeleteCategory(category);
													}}
												>
													<Trash2 className="h-3 w-3" />
												</Button>
											</div>
										</div>
										{category.responseCount !== undefined && (
											<div className="flex items-center gap-1 mt-2">
												<MessageSquare className="h-3 w-3 text-muted-foreground" />
												<span className="text-xs text-muted-foreground">
													{category.responseCount} responses
												</span>
											</div>
										)}
									</CardHeader>
								</Card>
							))}
						</div>
					</ScrollArea>
				</div>

				{/* Notes Section at Bottom */}
				<div className="p-4 border-t border-sidebar-border">
					<Link href="/notes">
						<Button
							variant="outline"
							className="w-full justify-start bg-transparent"
							size="sm"
						>
							<StickyNote className="h-4 w-4 mr-2" />
							Notes
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}

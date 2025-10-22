"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupAction,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	DndContext,
	type DragEndEvent,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	Edit,
	GripVertical,
	MessageSquare,
	Plus,
	Search,
	StickyNote,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Input } from "./ui/input";

interface Category {
	id: string;
	title: string;
	description: string;
	responseCount?: number;
}

interface AppSidebarProps {
	categories: Category[];
	selectedCategoryId?: string;
	onCategorySelect: (categoryId: string) => void;
	onAddCategory: () => void;
	onEditCategory: (category: Category) => void;
	onDeleteCategory: (category: Category) => void;
	onCategoryReorder: (reorderedCategories: Category[]) => void;
	reorderedCategoryIds: string[];
}

interface SortableCategoryCardProps {
	category: Category;
	selectedCategoryId?: string;
	onCategorySelect: (categoryId: string) => void;
	onEditCategory: (category: Category) => void;
	onDeleteCategory: (category: Category) => void;
	isDragDisabled: boolean;
	isReordered: boolean;
}

function SortableCategoryCard({
	category,
	selectedCategoryId,
	onCategorySelect,
	onEditCategory,
	onDeleteCategory,
	isDragDisabled,
	isReordered,
}: SortableCategoryCardProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: category.id,
		disabled: isDragDisabled,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<SidebarMenuItem ref={setNodeRef} style={style}>
			<TooltipProvider>
				<Tooltip delayDuration={400}>
					<TooltipTrigger asChild>
						<Card
							className={`group/card cursor-pointer transition-all duration-300 rounded-md py-0 hover:bg-sidebar-accent ${
								selectedCategoryId === category.id
									? "bg-sidebar-accent border-sidebar-primary"
									: ""
							} ${isDragging ? "shadow-lg" : ""} ${
								isReordered
									? "animate-pulse bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-cyan-950/40 border-emerald-600 dark:border-emerald-700"
									: ""
							}`}
							onClick={() => onCategorySelect(category.id)}
						>
							<CardHeader className="p-3 relative">
								<div className="flex items-start justify-between gap-2">
									<div className="flex-1 min-w-0">
										<CardTitle className="text-sm font-medium text-sidebar-foreground">
											{category.title}
										</CardTitle>
										<CardDescription className="text-xs mt-1 line-clamp-2 text-foreground/80 pr-2">
											{category.description}
										</CardDescription>
									</div>

									{!isDragDisabled && (
										<Button
											size="sm"
											variant="ghost"
											className="absolute top-2.5 right-1 h-6 w-6 p-0 cursor-grab active:cursor-grabbing hover:bg-transparent flex-shrink-0"
											{...attributes}
											{...listeners}
											onClick={(e) => e.stopPropagation()}
										>
											<GripVertical className="h-3 w-3" />
										</Button>
									)}
								</div>
								{category.responseCount !== undefined && (
									<div className="flex items-center justify-between mt-1">
										<div className="flex items-center gap-1">
											<MessageSquare className="h-4 w-4 text-muted-foreground" />
											<span className="text-xs font-medium text-muted-foreground">
												{category.responseCount}
											</span>
										</div>

										<div>
											<Button
												size="sm"
												variant="ghost"
												className="h-6 w-6 p-0 hover:bg-transparent group-hover/card:opacity-100 opacity-0 transition-all duration-200 translate-x-2 group-hover/card:translate-x-0 flex-shrink-0"
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
												className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/40 group-hover/card:opacity-100 opacity-0 transition-all duration-200 translate-x-2 group-hover/card:translate-x-0 flex-shrink-0"
												onClick={(e) => {
													e.stopPropagation();
													onDeleteCategory(category);
												}}
											>
												<Trash2 className="h-3 w-3" />
											</Button>
										</div>
									</div>
								)}
							</CardHeader>
						</Card>
					</TooltipTrigger>
					<TooltipContent
						className="max-w-[250px] dark:bg-black bg-zinc-50 border-zinc-200 dark:border-zinc-800 rounded-sm"
						side="right"
					>
						<p className="font-semibold mb-2 dark:text-foreground text-foreground">
							{category.title}
						</p>
						<p className="text-xs dark:text-foreground/80 text-foreground">
							{category.description}
						</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</SidebarMenuItem>
	);
}

export function AppSidebar({
	categories,
	selectedCategoryId,
	onCategorySelect,
	onAddCategory,
	onEditCategory,
	onDeleteCategory,
	onCategoryReorder,
	reorderedCategoryIds,
}: AppSidebarProps) {
	const [searchQuery, setSearchQuery] = useState("");

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5,
			},
		}),
	);

	const filteredCategories = categories.filter((category) => {
		const query = searchQuery.toLowerCase();
		return (
			category.title.toLowerCase().includes(query) ||
			category.description.toLowerCase().includes(query)
		);
	});

	const isDragDisabled = searchQuery.length > 0;

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;

		if (!over || active.id === over.id) return;

		const oldIndex = categories.findIndex((cat) => cat.id === active.id);
		const newIndex = categories.findIndex((cat) => cat.id === over.id);

		if (oldIndex === -1 || newIndex === -1) return;

		const reorderedCategories = [...categories];
		const [movedCategory] = reorderedCategories.splice(oldIndex, 1);
		reorderedCategories.splice(newIndex, 0, movedCategory);

		onCategoryReorder(reorderedCategories);
	}

	return (
		<Sidebar>
			<SidebarHeader className="border-b border-sidebar-border">
				<div className="p-2 flex items-center justify-between">
					<h1 className="text-xl font-semibold text-sidebar-foreground">
						Quick Answers
					</h1>
				</div>
			</SidebarHeader>

			<SidebarContent className="p-2 pt-0 pr-0">
				<SidebarGroup className="mt-2">
					<SidebarGroupLabel className="px-0">
						<div className="relative max-w-52">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search categories......"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10 border-zinc-200 dark:border-input"
							/>
						</div>
					</SidebarGroupLabel>
					<SidebarGroupAction onClick={onAddCategory}>
						<Plus className="min-h-5 min-w-5" />
					</SidebarGroupAction>
					<ScrollArea className="h-[calc(100vh-190px)] mt-1">
						<SidebarGroupContent className="mt-3">
							<DndContext
								sensors={sensors}
								collisionDetection={closestCenter}
								onDragEnd={handleDragEnd}
							>
								<SortableContext
									items={filteredCategories.map((cat) => cat.id)}
									strategy={verticalListSortingStrategy}
								>
									<SidebarMenu className="space-y-2 pr-2">
										{filteredCategories.map((category) => (
											<SortableCategoryCard
												key={category.id}
												category={category}
												selectedCategoryId={selectedCategoryId}
												onCategorySelect={onCategorySelect}
												onEditCategory={onEditCategory}
												onDeleteCategory={onDeleteCategory}
												isDragDisabled={isDragDisabled}
												isReordered={reorderedCategoryIds.includes(category.id)}
											/>
										))}
									</SidebarMenu>
								</SortableContext>
							</DndContext>
						</SidebarGroupContent>
					</ScrollArea>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="border-t border-sidebar-border">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild>
							<Link href="/notes">
								<StickyNote className="min-w-5" />
								<span>Notes</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}

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
	Edit,
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
}

export function AppSidebar({
	categories,
	selectedCategoryId,
	onCategorySelect,
	onAddCategory,
	onEditCategory,
	onDeleteCategory,
}: AppSidebarProps) {
	const [searchQuery, setSearchQuery] = useState("");

	const filteredCategories = categories.filter((category) => {
		const query = searchQuery.toLowerCase();
		return (
			category.title.toLowerCase().includes(query) ||
			category.description.toLowerCase().includes(query)
		);
	});

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
							<SidebarMenu className="space-y-2 pr-2">
								{filteredCategories.map((category) => (
									<SidebarMenuItem key={category.id}>
										<TooltipProvider>
											<Tooltip delayDuration={400}>
												<TooltipTrigger asChild>
													<Card
														className={`group cursor-pointer transition-colors rounded-md py-0 hover:bg-sidebar-accent ${
															selectedCategoryId === category.id
																? "bg-sidebar-accent border-sidebar-primary"
																: ""
														}`}
														onClick={() => onCategorySelect(category.id)}
													>
														<CardHeader className="p-3">
															<div className="flex items-start justify-between">
																<div className="flex-1 min-w-0">
																	<CardTitle className="text-sm font-medium text-sidebar-foreground">
																		{category.title}
																	</CardTitle>
																	<CardDescription className="text-xs mt-1 line-clamp-2 text-foreground/80">
																		{category.description}
																	</CardDescription>
																</div>
																<div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
																	<Button
																		size="sm"
																		variant="ghost"
																		className="h-6 w-6 p-0 hover:bg-primary/90"
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
																		className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
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
																	<MessageSquare className="h-4 w-4 text-muted-foreground" />
																	<span className="text-xs font-medium text-muted-foreground">
																		{category.responseCount}
																	</span>
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
								))}
							</SidebarMenu>
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

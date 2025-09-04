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
import { Edit, MessageSquare, Plus, StickyNote, Trash2 } from "lucide-react";
import Link from "next/link";

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
	return (
		<Sidebar>
			<SidebarHeader className="border-b border-sidebar-border">
				<div className="p-2">
					<h1 className="text-xl font-semibold text-sidebar-foreground">
						Quick Answers
					</h1>
				</div>
			</SidebarHeader>

			<SidebarContent className="p-2 pt-0 pr-0">
				<SidebarGroup>
					<SidebarGroupLabel>Categories</SidebarGroupLabel>
					<SidebarGroupAction onClick={onAddCategory}>
						<Plus className="h-4 w-4" />
					</SidebarGroupAction>
					<ScrollArea className="h-[calc(100vh-190px)]">
						<SidebarGroupContent className="mt-3">
							<SidebarMenu className="space-y-2 pr-2">
								{categories.map((category) => (
									<SidebarMenuItem key={category.id}>
										<Card
											className={`group cursor-pointer transition-colors py-0 hover:bg-sidebar-accent ${
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

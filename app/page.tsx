"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { CategoryFormSheet } from "@/components/category-form-sheet";
import { DeleteCategoryDialog } from "@/components/delete-category-dialog";
import { DeleteResponseDialog } from "@/components/delete-response-dialog";
import { ModeToggle } from "@/components/mode-toggle";
import { ResponseCard } from "@/components/response-card";
import { ResponseFormSheet } from "@/components/response-form-sheet";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Category {
	id: string;
	title: string;
	description: string;
	responseCount?: number;
}

export interface Response {
	id: string;
	text: string;
	language: string;
	category_id: string;
}

export default function HomePage() {
	const [categories, setCategories] = useState<Category[]>([]);
	const [responses, setResponses] = useState<Response[]>([]);
	const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
	const [loading, setLoading] = useState(true);
	const [user, setUser] = useState<any>(null);

	// Category modals
	const [categoryFormOpen, setCategoryFormOpen] = useState(false);
	const [editingCategory, setEditingCategory] = useState<Category | null>(null);
	const [deleteCategoryOpen, setDeleteCategoryOpen] = useState(false);
	const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
		null,
	);

	// Response modals
	const [responseFormOpen, setResponseFormOpen] = useState(false);
	const [editingResponse, setEditingResponse] = useState<Response | null>(null);
	const [deleteResponseOpen, setDeleteResponseOpen] = useState(false);
	const [responseToDelete, setResponseToDelete] = useState<Response | null>(
		null,
	);

	const router = useRouter();
	const supabase = createClient();

	useEffect(() => {
		checkUser();
	}, []);

	useEffect(() => {
		if (user) {
			loadCategories();
		}
	}, [user]);

	useEffect(() => {
		if (selectedCategoryId) {
			loadResponses(selectedCategoryId);
		}
	}, [selectedCategoryId]);

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

	const loadCategories = async () => {
		try {
			const { data, error } = await supabase
				.from("categories")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) throw error;

			// Load response counts for each category
			const categoriesWithCounts = await Promise.all(
				data.map(async (category) => {
					const { count } = await supabase
						.from("responses")
						.select("*", { count: "exact", head: true })
						.eq("category_id", category.id);

					return {
						...category,
						responseCount: count || 0,
					};
				}),
			);

			setCategories(categoriesWithCounts);

			// Select first category by default
			if (categoriesWithCounts.length > 0 && !selectedCategoryId) {
				setSelectedCategoryId(categoriesWithCounts[0].id);
			}
		} catch (error) {
			console.error("Error loading categories:", error);
		} finally {
			setLoading(false);
		}
	};

	const loadResponses = async (categoryId: string) => {
		try {
			const { data, error } = await supabase
				.from("responses")
				.select("*")
				.eq("category_id", categoryId)
				.order("created_at", { ascending: false });

			if (error) throw error;
			setResponses(data || []);
		} catch (error) {
			console.error("Error loading responses:", error);
		}
	};

	// Category handlers
	const handleAddCategory = () => {
		setEditingCategory(null);
		setCategoryFormOpen(true);
	};

	const handleEditCategory = (category: Category) => {
		setEditingCategory(category);
		setCategoryFormOpen(true);
	};

	const handleDeleteCategory = (category: Category) => {
		setCategoryToDelete(category);
		setDeleteCategoryOpen(true);
	};

	const handleCategoryFormSuccess = () => {
		loadCategories();
	};

	const handleDeleteCategorySuccess = () => {
		loadCategories();
		if (selectedCategoryId === categoryToDelete?.id) {
			setSelectedCategoryId("");
			setResponses([]);
		}
	};

	// Response handlers
	const handleAddResponse = () => {
		setEditingResponse(null);
		setResponseFormOpen(true);
	};

	const handleEditResponse = (response: Response) => {
		setEditingResponse(response);
		setResponseFormOpen(true);
	};

	const handleDeleteResponse = (response: Response) => {
		setResponseToDelete(response);
		setDeleteResponseOpen(true);
	};

	const handleResponseFormSuccess = () => {
		loadResponses(selectedCategoryId);
		loadCategories(); // Refresh counts
	};

	const handleDeleteResponseSuccess = () => {
		loadResponses(selectedCategoryId);
		loadCategories(); // Refresh counts
	};

	if (loading) {
		return (
			<div className="flex items-center w-full inset-0 absolute justify-center min-h-screen">
				<div className="text-center">
					<Loader2 className="animate-spin m-4 size-14 text-primary" />
					<p className="mt-2 text-muted-foreground">Loading...</p>
				</div>
			</div>
		);
	}

	const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

	return (
		<>
			<AppSidebar
				categories={categories}
				selectedCategoryId={selectedCategoryId}
				onCategorySelect={setSelectedCategoryId}
				onAddCategory={handleAddCategory}
				onEditCategory={handleEditCategory}
				onDeleteCategory={handleDeleteCategory}
			/>

			<SidebarInset>
				<main className="flex-1 flex flex-col">
					{selectedCategory ? (
						<>
							<div className="border-b border-border p-6 py-3">
								<div className="container mx-auto flex items-center justify-between">
									<div>
										<div className="flex items-center gap-2">
											<SidebarTrigger className="-ml-1" />
											<div className="flex-1" />
										</div>
									</div>
									<div className="flex items-center gap-2">
										<ModeToggle />
										<Button onClick={handleAddResponse}>
											<Plus className="h-4 w-4 mr-2" />
											Create Response
										</Button>
									</div>
								</div>
							</div>

							{/* Content */}
							<div className="p-6 container mx-auto">
								<div className="">
									<h1 className="text-2xl font-semibold text-foreground">
										{selectedCategory.title}
									</h1>
									<p className="text-muted-foreground mt-1">
										{selectedCategory.description}
									</p>
								</div>

								<div className="flex-1 mt-5">
									{responses.length > 0 ? (
										<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
											{responses.map((response) => (
												<ResponseCard
													key={response.id}
													response={response}
													onEdit={handleEditResponse}
													onDelete={handleDeleteResponse}
												/>
											))}
										</div>
									) : (
										<div className="flex items-center justify-center h-64">
											<div className="text-center">
												<p className="text-muted-foreground mb-4">
													No responses yet in this category
												</p>
												<Button onClick={handleAddResponse}>
													<Plus className="h-4 w-4 mr-2" />
													Create First Response
												</Button>
											</div>
										</div>
									)}
								</div>
							</div>
						</>
					) : (
						<div className="flex-1 flex items-center justify-center">
							<div className="text-center">
								<p className="text-muted-foreground mb-4">
									{categories.length === 0
										? "No categories yet. Create your first category to get started."
										: "Select a category to view responses"}
								</p>
								{categories.length === 0 && (
									<Button onClick={handleAddCategory}>
										<Plus className="h-4 w-4 mr-2" />
										Create First Category
									</Button>
								)}
							</div>
						</div>
					)}
				</main>
			</SidebarInset>

			{/* Category Modals */}
			<CategoryFormSheet
				isOpen={categoryFormOpen}
				onClose={() => setCategoryFormOpen(false)}
				category={editingCategory}
				onSuccess={handleCategoryFormSuccess}
			/>

			<DeleteCategoryDialog
				isOpen={deleteCategoryOpen}
				onClose={() => setDeleteCategoryOpen(false)}
				category={categoryToDelete}
				onSuccess={handleDeleteCategorySuccess}
			/>

			{/* Response Modals */}
			<ResponseFormSheet
				isOpen={responseFormOpen}
				onClose={() => setResponseFormOpen(false)}
				response={editingResponse}
				categoryId={selectedCategoryId}
				onSuccess={handleResponseFormSuccess}
			/>

			<DeleteResponseDialog
				isOpen={deleteResponseOpen}
				onClose={() => setDeleteResponseOpen(false)}
				response={responseToDelete}
				onSuccess={handleDeleteResponseSuccess}
			/>
		</>
	);
}

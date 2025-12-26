"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { CategoryFormSheet } from "@/components/category-form-sheet";
import { DeleteCategoryDialog } from "@/components/delete-category-dialog";
import { DeleteResponseDialog } from "@/components/delete-response-dialog";
import { DeleteTopicDialog } from "@/components/delete-topic-dialog";
import { ModeToggle } from "@/components/mode-toggle";
import { ResponseCard } from "@/components/response-card";
import { ResponseFormSheet } from "@/components/response-form-sheet";
import { TopicFormSheet } from "@/components/topic-form-sheet";
import { TopicsSidebar } from "@/components/topics-sidebar";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Topic {
  id: string;
  title: string;
  description: string;
}

interface Category {
  id: string;
  title: string;
  description: string;
  responseCount?: number;
  topic_id?: string;
}

export interface Response {
  id: string;
  text: string;
  language: string;
  category_id: string;
}

export default function HomePage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("all");
  const [categories, setCategories] = useState<Category[]>([]);
  const [allResponses, setAllResponses] = useState<Response[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<Response[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [reorderedCategoryIds, setReorderedCategoryIds] = useState<string[]>(
    [],
  );

  // Topic modals
  const [topicFormOpen, setTopicFormOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [deleteTopicOpen, setDeleteTopicOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);

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
      loadTopics();
      loadCategories();
      loadAllResponses();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCategoryId && allResponses.length > 0) {
      filterResponsesByCategory(selectedCategoryId);
    }
  }, [selectedCategoryId, allResponses]);

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

  const loadTopics = async () => {
    try {
      const { data, error } = await supabase
        .from("topics")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setTopics(data || []);

      if (data && data.length > 0 && !selectedTopicId) {
        setSelectedTopicId("all");
      }
    } catch (error) {
      console.error("Error loading topics:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;

      const categoriesWithCounts = await Promise.all(
        (data || []).map(async (category) => {
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

      // Handle default category selection when topic changes or initially
      if (categoriesWithCounts.length > 0 && !selectedCategoryId) {
        const firstCatInTopic = categoriesWithCounts.find(c => c.topic_id === selectedTopicId);
        if (firstCatInTopic) {
          setSelectedCategoryId(firstCatInTopic.id);
        }
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllResponses = async () => {
    try {
      const { data, error } = await supabase.from("responses").select("*");

      if (error) throw error;

      const languageOrder = { Spanish: 0, English: 1, Portuguese: 2 };
      const sortedResponses = (data || []).sort((a, b) => {
        const aOrder =
          languageOrder[a.language as keyof typeof languageOrder] ?? 999;
        const bOrder =
          languageOrder[b.language as keyof typeof languageOrder] ?? 999;
        return aOrder - bOrder;
      });

      setAllResponses(sortedResponses);
    } catch (error) {
      console.error("Error loading all responses:", error);
    }
  };

  const updateCategoryOrder = async (reorderedCategories: Category[]) => {
    try {
      // Find all categories first to maintain full list
      const otherTopicsCategories = categories.filter(c => c.topic_id !== selectedTopicId);
      const newCategories = [...otherTopicsCategories, ...reorderedCategories];
      setCategories(newCategories);

      const now = new Date();
      const updates = reorderedCategories.map((category, index) => {
        const newTimestamp = new Date(
          now.getTime() - (reorderedCategories.length - index) * 1000,
        );

        return supabase
          .from("categories")
          .update({ created_at: newTimestamp.toISOString() })
          .eq("id", category.id);
      });

      await Promise.all(updates);
      setReorderedCategoryIds(reorderedCategories.map((cat) => cat.id));
      await loadCategories();

      setTimeout(() => {
        setReorderedCategoryIds([]);
      }, 1000);
    } catch (error) {
      console.error("Error updating category order:", error);
      await loadCategories();
    }
  };

  const filterResponsesByCategory = (categoryId: string) => {
    const filtered = allResponses.filter(
      (response) => response.category_id === categoryId,
    );
    setFilteredResponses(filtered);
  };

  // Topic handlers
  const handleAddTopic = () => {
    setEditingTopic(null);
    setTopicFormOpen(true);
  };

  const handleEditTopic = (topic: Topic) => {
    setEditingTopic(topic);
    setTopicFormOpen(true);
  };

  const handleDeleteTopic = (topic: Topic) => {
    setTopicToDelete(topic);
    setDeleteTopicOpen(true);
  };

  const handleTopicFormSuccess = () => {
    loadTopics();
  };

  const handleDeleteTopicSuccess = () => {
    loadTopics();
    loadCategories();
    if (selectedTopicId === topicToDelete?.id) {
      setSelectedTopicId("all");
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
    loadAllResponses();
    if (selectedCategoryId === categoryToDelete?.id) {
      setSelectedCategoryId("");
      setFilteredResponses([]);
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
    loadAllResponses();
    loadCategories();
  };

  const handleDeleteResponseSuccess = () => {
    loadAllResponses();
    loadCategories();
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

  const filteredCategories = selectedTopicId === "all"
    ? categories
    : categories.filter(c => c.topic_id === selectedTopicId);
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <SidebarProvider>
      <TopicsSidebar
        topics={topics}
        selectedTopicId={selectedTopicId}
        onTopicSelect={(id) => {
          setSelectedTopicId(id);
          const filtered = id === "all" ? categories : categories.filter(c => c.topic_id === id);
          setSelectedCategoryId(filtered[0]?.id || "");
        }}
        onAddTopic={handleAddTopic}
        onEditTopic={handleEditTopic}
        onDeleteTopic={handleDeleteTopic}
      />

      <AppSidebar
        categories={filteredCategories}
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={setSelectedCategoryId}
        onAddCategory={handleAddCategory}
        onEditCategory={handleEditCategory}
        onDeleteCategory={handleDeleteCategory}
        onCategoryReorder={updateCategoryOrder}
        reorderedCategoryIds={reorderedCategoryIds}
      />

      <SidebarInset>
        <main className="flex-1 flex flex-col">
          {selectedCategory ? (
            <>
              <div className="border-b border-border p-6 py-3">
                <div className="container mx-auto flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SidebarTrigger className="-ml-1" />
                    <div className="flex-1" />
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
                  {filteredResponses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredResponses.map((response) => (
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
            <div className="flex-1 flex flex-col">
              <div className="border-b border-border p-6 py-3">
                <div className="container mx-auto flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SidebarTrigger className="-ml-1" />
                    <div className="flex-1" />
                  </div>
                  <div className="flex items-center gap-2">
                    <ModeToggle />
                  </div>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                  {topics.length === 0 ? (
                    <>
                      <p className="text-muted-foreground mb-6">
                        No topics yet. Create your first topic to start organizing your categories and responses.
                      </p>
                      <Button onClick={handleAddTopic} size="lg">
                        <Plus className="h-5 w-5 mr-2" />
                        Create First Topic
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-muted-foreground mb-6">
                        {filteredCategories.length === 0
                          ? "This topic doesn't have any categories yet. Create your first category to get started."
                          : "Select a category from the sidebar to view its responses."}
                      </p>
                      {filteredCategories.length === 0 && (
                        <Button onClick={handleAddCategory} size="lg">
                          <Plus className="h-5 w-5 mr-2" />
                          Create First Category
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </SidebarInset>

      {/* Topic Modals */}
      <TopicFormSheet
        isOpen={topicFormOpen}
        onClose={() => setTopicFormOpen(false)}
        topic={editingTopic}
        onSuccess={handleTopicFormSuccess}
      />

      <DeleteTopicDialog
        isOpen={deleteTopicOpen}
        onClose={() => setDeleteTopicOpen(false)}
        topic={topicToDelete}
        onSuccess={handleDeleteTopicSuccess}
      />

      {/* Category Modals */}
      <CategoryFormSheet
        isOpen={categoryFormOpen}
        onClose={() => setCategoryFormOpen(false)}
        category={editingCategory}
        topics={topics}
        defaultTopicId={selectedTopicId}
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
    </SidebarProvider>
  );
}

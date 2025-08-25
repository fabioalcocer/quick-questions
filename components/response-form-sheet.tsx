"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

interface Response {
	id: string;
	text: string;
	language: string;
	category_id: string;
}

interface ResponseFormSheetProps {
	isOpen: boolean;
	onClose: () => void;
	response?: Response | null;
	categoryId: string;
	onSuccess: () => void;
}

const LANGUAGES = [
	{ value: "Spanish", label: "Spanish", flag: "🇪🇸" },
	{ value: "English", label: "English", flag: "🇺🇸" },
	{ value: "Portuguese", label: "Portuguese", flag: "🇵🇹" },
];

export function ResponseFormSheet({
	isOpen,
	onClose,
	response,
	categoryId,
	onSuccess,
}: ResponseFormSheetProps) {
	const [text, setText] = useState("");
	const [language, setLanguage] = useState("Spanish");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const supabase = createClient();

	const isEditing = !!response;

	useEffect(() => {
		if (response) {
			setText(response.text);
			setLanguage(response.language);
		} else {
			setText("");
			setLanguage("Spanish");
		}
		setError(null);
	}, [response, isOpen]);

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

			if (isEditing && response) {
				// Update existing response
				const { error } = await supabase
					.from("responses")
					.update({
						text: text.trim(),
						language,
						updated_at: new Date().toISOString(),
					})
					.eq("id", response.id);

				if (error) throw error;
			} else {
				// Create new response
				const { error } = await supabase.from("responses").insert({
					text: text.trim(),
					language,
					category_id: categoryId,
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
		setLanguage("Spanish");
		setError(null);
		onClose();
	};

	return (
		<Sheet open={isOpen} onOpenChange={handleClose}>
			<SheetContent className="sm:max-w-lg w-full">
				<SheetHeader className="pb-2">
					<SheetTitle className="text-2xl font-semibold text-foreground">
						{isEditing ? "Edit Response" : "Create New Response"}
					</SheetTitle>
					<SheetDescription className="text-base text-muted-foreground leading-relaxed">
						{isEditing
							? "Update the response text and language below."
							: "Add a new quick response to this category."}
					</SheetDescription>
				</SheetHeader>

				<form onSubmit={handleSubmit} className="space-y-4 px-4">
					<div className="space-y-4">
						<Label
							htmlFor="language"
							className="text-sm font-medium text-foreground"
						>
							Language
						</Label>
						<Select value={language} onValueChange={setLanguage}>
							<SelectTrigger className="h-12 px-4 hover:bg-accent/10 transition-all duration-200">
								<SelectValue placeholder="Select language" />
							</SelectTrigger>
							<SelectContent className="">
								{LANGUAGES.map((lang) => (
									<SelectItem
										key={lang.value}
										value={lang.value}
										className="px-2 py-1"
									>
										<div className="flex items-center gap-3">
											<span className="text-lg">{lang.flag}</span>
											<span className="font-medium">{lang.label}</span>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-4">
						<Label
							htmlFor="text"
							className="text-sm font-medium text-foreground"
						>
							Response Text
						</Label>
						<Textarea
							id="text"
							value={text}
							onChange={(e) => setText(e.target.value)}
							placeholder="Enter your quick response text here..."
							rows={8}
							required
							maxLength={2000}
							className="resize-vertical p-4 focus:shadow-sm border-border transition-all duration-200 text-base leading-relaxed focus:border-primary"
						/>
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">
								This text will be available for quick copying
							</span>
							<span
								className={`font-medium ${text.length > 1800 ? "text-destructive" : "text-muted-foreground"}`}
							>
								{text.length}/2000 characters
							</span>
						</div>
					</div>

					{error && (
						<div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
							<p className="text-sm text-destructive font-medium">{error}</p>
						</div>
					)}

					<div className="flex gap-4 pt-6 justify-end">
						<Button
							type="button"
							variant="outline"
							onClick={handleClose}
							className="hover:bg-gray-100 hover:text-black"
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isLoading || !text.trim()}>
							{isLoading
								? "Saving..."
								: isEditing
									? "Update Response"
									: "Create Response"}
						</Button>
					</div>
				</form>
			</SheetContent>
		</Sheet>
	);
}

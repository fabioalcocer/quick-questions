"use client";

import type { Response } from "@/app/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Check, Copy, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ResponseCardProps {
	response: Response;
	onEdit: (response: Response) => void;
	onDelete: (response: Response) => void;
}

export function ResponseCard({
	response,
	onEdit,
	onDelete,
}: ResponseCardProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(response.text);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);

		toast.success("Response copied to clipboard!");
	};

	const getLanguageColor = (language: string) => {
		switch (language.toLowerCase()) {
			case "spanish":
				return "bg-red-50 text-red-700 hover:bg-red-100 border-red-200 shadow-sm";
			case "english":
				return "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 shadow-sm";
			case "portuguese":
				return "bg-green-50 text-green-700 hover:bg-green-100 border-green-200 shadow-sm";
			default:
				return "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200 shadow-sm";
		}
	};

	const getLanguageFlag = (language: string) => {
		switch (language.toLowerCase()) {
			case "spanish":
				return "🇪🇸";
			case "english":
				return "🇺🇸";
			case "portuguese":
				return "🇵🇹";
			default:
				return "🌐";
		}
	};

	return (
		<Card className="group py-0 pt-5 gap-0 dark:from-gray-800 dark:to-gray-900 dark:border-gray-700 dark:hover:border-gray-800 bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer hover:border-blue-200">
			<CardHeader className="pb-4">
				<div className="flex items-start justify-between">
					<Badge
						variant="secondary"
						className={`${getLanguageColor(response.language)} cursor-default font-medium px-3 py-1.5 text-sm transition-all duration-200`}
					>
						<span className="mr-2 text-base">
							{getLanguageFlag(response.language)}
						</span>
						{response.language}
					</Badge>
					<div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
						<Button
							size="sm"
							variant="ghost"
							className="h-9 w-9 p-0 hover:bg-primary/80 active:scale-[0.92] hover:scale-110 transition-all duration-200 shadow-sm hover:shadow-md"
							onClick={handleCopy}
							disabled={copied}
						>
							{copied ? (
								<Check className="h-4 w-4 text-primary" />
							) : (
								<Copy className="h-4 w-4" />
							)}
						</Button>
						<Button
							size="sm"
							variant="ghost"
							className="h-9 w-9 p-0 hover:bg-primary/80 active:scale-[0.92] hover:scale-110 transition-all duration-200 shadow-sm hover:shadow-md"
							onClick={() => onEdit(response)}
						>
							<Edit className="h-4 w-4" />
						</Button>
						<Button
							size="sm"
							variant="ghost"
							className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 hover:scale-110 transition-all duration-200 shadow-sm hover:shadow-md"
							onClick={() => onDelete(response)}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent className="pt-0 pb-6">
				<p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-medium">
					{response.text}
				</p>
			</CardContent>
		</Card>
	);
}

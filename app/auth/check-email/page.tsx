import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Mail } from "lucide-react";
import Link from "next/link";

export default function CheckEmailPage() {
	return (
		<div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-background">
			<div className="w-full max-w-sm">
				<Card>
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
							<Mail className="h-6 w-6 text-primary" />
						</div>
						<CardTitle className="text-2xl">Check Your Email</CardTitle>
						<CardDescription>
							We&apos;ve sent you a confirmation link to complete your
							registration.
						</CardDescription>
					</CardHeader>
					<CardContent className="text-center">
						<p className="text-sm text-muted-foreground mb-4">
							Click the link in your email to verify your account and start
							using Quick Answers.
						</p>
						<Link
							href="/auth/login"
							className="text-sm text-primary hover:text-primary/80 underline underline-offset-4"
						>
							Back to Sign In
						</Link>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

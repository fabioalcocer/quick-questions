"use client";

import type React from "react";

import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveAccountSession } from "@/lib/auth/saved-accounts";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isAddingAccount, setIsAddingAccount] = useState(false);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		setIsAddingAccount(params.get("mode") === "add-account");
	}, []);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		const supabase = createClient();
		setIsLoading(true);
		setError(null);

		try {
			if (isAddingAccount) {
				const {
					data: { session: currentSession },
				} = await supabase.auth.getSession();
				if (currentSession) saveAccountSession(currentSession);
			}

			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});
			if (error) throw error;
			if (!data.session) throw new Error("The session could not be created");

			saveAccountSession(data.session);
			const params = new URLSearchParams(window.location.search);
			const returnTo = params.get("returnTo");
			const destination = returnTo?.startsWith("/") && !returnTo.startsWith("//")
				? returnTo
				: "/";
			window.location.replace(destination);
		} catch (error: unknown) {
			setError(error instanceof Error ? error.message : "An error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-background">
			<div className="absolute top-4 right-4">
				<ModeToggle />
			</div>
			<div className="w-full max-w-sm">
				<div className="flex flex-col gap-6">
					<Card>
						<CardHeader className="text-center">
							<CardTitle className="text-2xl">
								{isAddingAccount ? "Add another account" : "Welcome!"}
							</CardTitle>
							<CardDescription>
								{isAddingAccount
									? "Sign in without closing your current account"
									: "Sign in to your Quick Answers account"}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleLogin}>
								<div className="flex flex-col gap-6">
									<div className="grid gap-2">
										<Label htmlFor="email">Email</Label>
										<Input
											id="email"
											type="email"
											autoComplete="email"
											placeholder="m@example.com"
											required
											value={email}
											onChange={(e) => setEmail(e.target.value)}
										/>
									</div>
									<div className="grid gap-2">
										<Label htmlFor="password">Password</Label>
										<Input
											id="password"
											type="password"
											autoComplete="current-password"
											required
											value={password}
											onChange={(e) => setPassword(e.target.value)}
										/>
									</div>
									{error && <p className="text-sm text-destructive">{error}</p>}
									<Button type="submit" className="w-full" disabled={isLoading}>
										{isLoading
											? "Signing in..."
											: isAddingAccount
												? "Add account"
												: "Sign In"}
									</Button>
								</div>
								<div className="mt-4 text-center text-sm">
									{isAddingAccount ? (
										<Link
											href="/"
											className="underline underline-offset-4 text-primary hover:text-primary/80"
										>
											Cancel and return to your account
										</Link>
									) : (
										<>
											Don&apos;t have an account?{" "}
											<Link
												href="/auth/sign-up"
												className="underline underline-offset-4 text-primary hover:text-primary/80"
											>
												Sign up
											</Link>
										</>
									)}
								</div>
							</form>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

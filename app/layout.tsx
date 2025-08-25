import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { ToastProvider } from "@/components/ui/toast";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import type React from "react";
import "./globals.css";

export const metadata: Metadata = {
	title: "Quick Answers Manager",
	description:
		"Professional quick answers management for chat and email responses",
	generator: "v0.app",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head>
				<style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
			</head>
			<body>
				<ToastProvider>
					<SidebarProvider>{children}</SidebarProvider>
					<Toaster richColors position="top-center" />
				</ToastProvider>
			</body>
		</html>
	);
}

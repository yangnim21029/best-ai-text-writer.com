import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
    title: "Ai Text Writer Pro - Best AI Content Generator",
    description: "Generate high-quality AI content with ease.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.variable} antialiased font-sans`}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}

import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "MockIt — AI Interview Coach",
  description:
    "Predict interview questions, run mock interviews, and get personalized feedback.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-semibold text-brand-700">
              MockIt
            </Link>
            <nav className="flex gap-4 text-sm text-gray-600">
              <Link href="/progress" className="hover:text-brand-600">
                Progress
              </Link>
              <Link href="/sessions/new" className="hover:text-brand-600">
                New session
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}

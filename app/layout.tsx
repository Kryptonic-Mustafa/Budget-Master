import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "BudgetMaster",
  description: "Secure Personal Finance Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Dark Gradient Background for the whole app */}
      <body className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-slate-50 antialiased selection:bg-cyan-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
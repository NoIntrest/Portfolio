import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Harshak Kumar BM Portfolio",
  description:
    "Portfolio website for Harshak Kumar BM, featuring editable profile details and project showcases.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("dark", "font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Outfit, DM_Serif_Display } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "StrydeOS Dashboard",
  description: "Clinical performance intelligence by StrydeOS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${dmSerif.variable} font-sans antialiased`}>
        <Sidebar />
        <main className="lg:pl-60 min-h-screen">
          <div className="mx-auto max-w-5xl px-6 py-10 pt-16 lg:pt-10">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}

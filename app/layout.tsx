import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TradeDesk — Live Market Dashboard",
  description:
    "Real-time crypto market dashboard built with Next.js, React Query, and Recharts, streaming directly from Binance's public WebSocket API.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${figtree.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

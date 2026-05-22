import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nossa História · Araçá Grill",
  description: "Uma homenagem feita por vocês dois.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#080503",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={cormorant.variable}>
      <body>{children}</body>
    </html>
  );
}

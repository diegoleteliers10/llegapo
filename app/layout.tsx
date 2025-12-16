import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/next"

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Búsqueda de Rutas - Transantiago",
  description: "Planifica tu viaje en tiempo real por Santiago con Llega Po'",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${spaceGrotesk.variable} antialiased`}>
        <Analytics/>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

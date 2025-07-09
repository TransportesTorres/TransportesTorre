import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ReduxProvider from "@/store/Provider";
import AuthWrapper from "@/components/auth/AuthWrapper";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reserva Transporte",
  description: "Sistema de reservas de transporte con conductores profesionales",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ReduxProvider>
          <AuthWrapper>
            {children}
          </AuthWrapper>
        </ReduxProvider>
      </body>
    </html>
  );
}

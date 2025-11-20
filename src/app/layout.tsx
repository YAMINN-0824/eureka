import type { Metadata } from "next";
import "./globals.css";
import Header from "@/app/components/Header";
import { AuthProvider } from "@/app/contexts/AuthContext";
  import ToastProvider from "@/app/components/ToastProvider";

export const metadata: Metadata = {
  title: "Eureka Library",
  description: "青空文庫で、あなただけの読書体験を",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <AuthProvider>
          <Header />
          <main>{children}</main>
          <ToastProvider />
        </AuthProvider>
      </body>
    </html>
  );
}
import type { Metadata } from "next";
//import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/app/components/Header"
import { AuthProvider } from "@/app/contexts/AuthContext";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "Eureka Library",
  description: "青空文庫で、あなただけの読書体験を",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // return (
  //   <html lang="ja">
  //     <body
  //       className={`${geistSans.variable} ${geistMono.variable} antialiased`}
  //     >
  //       {children}
  //     </body>
  //   </html>
  // );
     return (
    <html lang="ja">
      <body className="antialiased">
        {/* ✨ AuthProviderで全体を囲む */}
        <AuthProvider>
          {/* ✨ Headerを追加 */}
          <Header />
          
          {/* メインコンテンツ */}
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}

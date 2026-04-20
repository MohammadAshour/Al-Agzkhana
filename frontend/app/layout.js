import Link from "next/link";
import "./globals.css";
import SessionWrapper from "./components/SessionWrapper";

export const metadata = {
  title: "الأجزخانة",
  description: "نظام إدارة أدوية المنزل",
  themeColor: "#1e3a5f",
  manifest: "/manifest.json",
  icons: [
    { rel: "icon", url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    { rel: "icon", url: "/icon-512.png", sizes: "512x512", type: "image/png" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-gray-50">
        <SessionWrapper>
          <nav className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
            <Link href="/" className="hover:text-blue-200">
              الأجزخانة
            </Link>
            <div className="flex gap-6 items-center">
              <a href="/medicines" className="hover:text-blue-200">
                الأدوية
              </a>
              <a href="/inventory" className="hover:text-blue-200">
                المخزون
              </a>
              <a href="/auth/login" className="hover:text-blue-200">
                تسجيل الدخول
              </a>
            </div>
          </nav>
          <main className="container mx-auto px-4 py-8">{children}</main>
        </SessionWrapper>
      </body>
    </html>
  );
}
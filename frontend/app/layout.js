import "./globals.css";
import DrawerLayout from "./DrawerLayout";

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
        <DrawerLayout>{children}</DrawerLayout>
      </body>
    </html>
  );
}
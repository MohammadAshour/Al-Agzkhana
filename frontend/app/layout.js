import "./globals.css";

export const metadata = {
  title: "الأجزخانة",
  description: "نظام إدارة أدوية المنزل",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-gray-50">
        <nav className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">🏥 الأجزخانة</h1>
          <div className="flex gap-6">
            <a href="/" className="hover:text-blue-200">الرئيسية</a>
            <a href="/medicines" className="hover:text-blue-200">الأدوية</a>
            <a href="/inventory" className="hover:text-blue-200">المخزون</a>
          </div>
        </nav>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'الرئيسية', icon: '🏠' },
  { href: '/medicines', label: 'الأدوية', icon: '💊' },
  { href: '/medicines/add', label: 'إضافة دواء', icon: '➕' },
  { href: '/inventory', label: 'المخزون', icon: '📦' },
  { href: '/inventory/add', label: 'إضافة للمنزل', icon: '🏡' },
];

export default function DrawerLayout({ children }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <nav className="bg-blue-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-lg">
        <button
          onClick={() => setOpen(true)}
          aria-label="فتح القائمة"
          className="p-2 rounded-lg hover:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <Link href="/" className="text-xl font-bold tracking-wide hover:text-blue-200 transition-colors">
          الأجزخانة
        </Link>

        <div className="w-10" />
      </nav>

      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ${
          open ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside
        className={`fixed top-0 right-0 h-full w-72 bg-blue-900 text-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-blue-700">
          <span className="text-xl font-bold">القائمة</span>
          <button
            onClick={() => setOpen(false)}
            aria-label="إغلاق القائمة"
            className="p-2 rounded-lg hover:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="flex flex-col gap-1">
            {navItems.map(({ href, label, icon }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                      active
                        ? 'bg-white text-blue-900 shadow'
                        : 'hover:bg-blue-800 text-blue-100'
                    }`}
                  >
                    <span className="text-xl">{icon}</span>
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-5 py-4 border-t border-blue-700 text-blue-300 text-sm text-center">
          نظام إدارة أدوية المنزل
        </div>
      </aside>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </>
  );
}
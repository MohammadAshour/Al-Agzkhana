'use client';
import dynamic from 'next/dynamic';

const SessionWrapper = dynamic(() => import('./SessionWrapper'), { ssr: false });
const DrawerLayout = dynamic(() => import('../DrawerLayout'), { ssr: false });

export default function ClientLayout({ children }) {
  return (
    <SessionWrapper>
      <DrawerLayout>{children}</DrawerLayout>
    </SessionWrapper>
  );
}
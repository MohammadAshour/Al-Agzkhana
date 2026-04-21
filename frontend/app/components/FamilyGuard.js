'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSelectedFamily } from '../lib/family';

export default function FamilyGuard({ children }) {
  const [family, setFamily] = useState(null);
  const [checked, setChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const f = getSelectedFamily();
    setFamily(f);
    setChecked(true);
  }, []);

  if (!checked) return null;

  if (!family) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
        <h2 className="text-xl font-bold text-blue-900 mb-2">اختر عائلة أولاً</h2>
        <p className="text-gray-500 mb-6">تحتاج لاختيار عائلة لعرض المخزون والمواقع</p>
        <button
          onClick={() => router.push('/families')}
          className="bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800"
        >
          إدارة العائلات
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mb-4 flex items-center justify-between">
        <span className="text-blue-900 font-medium">👨‍👩‍👧‍👦 {family.name}</span>
        <button
          onClick={() => router.push('/families')}
          className="text-blue-600 text-sm hover:underline"
        >
          تغيير
        </button>
      </div>
      {children}
    </>
  );
}
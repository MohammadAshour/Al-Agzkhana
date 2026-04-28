'use client';
import { useState, useEffect } from 'react';
import { getAuthHeaders, getUserRole } from '@/app/lib/api';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const FORM_LABELS = {
  tablet: 'قرص', capsule: 'كبسولة', syrup: 'شراب', drops: 'قطرة',
  cream: 'كريم', injection: 'حقنة', inhaler: 'بخاخ',
  suppository: 'تحميلة', patch: 'لصقة', other: 'أخرى',
};

export default function ModerationPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectNote, setRejectNote] = useState({});
  const [showReject, setShowReject] = useState({});
  const [msg, setMsg] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    const role = await getUserRole();
    if (role === 'user') {
      router.push('/');
      return;
    }
    fetchSubmissions();
  }

  async function fetchSubmissions() {
    const res = await fetch(`${API_URL}/api/submissions/?status=pending`, {
      headers: await getAuthHeaders(),
    });
    const data = await res.json();
    setSubmissions(data.results || data || []);
    setLoading(false);
  }

  async function handleReview(id, status) {
    const note = rejectNote[id] || '';
    const res = await fetch(`${API_URL}/api/submissions/${id}/review/`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ status, review_note: note }),
    });
    if (res.ok) {
      setMsg(status === 'approved' ? 'تم قبول الطلب وإضافة الدواء للكتالوج' : 'تم رفض الطلب');
      fetchSubmissions();
    } else {
      const data = await res.json();
      setMsg(data.error || 'خطأ');
    }
  }

  if (loading) return <p className="text-center text-gray-500">جاري التحميل...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-blue-900 mb-6">مراجعة طلبات الأدوية</h2>

      {msg && (
        <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-2 rounded mb-4">
          {msg}
        </div>
      )}

      {submissions.length === 0 ? (
        <p className="text-center text-gray-500">لا يوجد طلبات قيد المراجعة</p>
      ) : (
        <div className="grid gap-4">
          {submissions.map(sub => (
            <div key={sub.id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg">{sub.name_ar}</h3>
                  {sub.name_en && <p className="text-gray-500 text-sm">{sub.name_en}</p>}
                  <p className="text-sm text-gray-600">شكل الدواء: {FORM_LABELS[sub.form]}</p>
                  <p className="text-sm text-gray-600">مدة الصلاحية: {sub.shelf_life_months} شهر</p>
                  <p className="text-sm text-gray-600">بعد الفتح: {sub.shelf_life_after_opening_months} شهر</p>
                  <p className="text-sm mt-1">
                    {sub.safe_during_pregnancy ? '✅' : '❌'} للحمل
                    {' | '}
                    {sub.safe_during_breastfeeding ? '✅' : '❌'} للرضاعة
                    {' | '}
                    {sub.safe_for_diabetics ? '✅' : '❌'} للسكري
                    {' | '}
                    {sub.safe_for_hypertensive ? '✅' : '❌'} للضغط
                  </p>
                  {sub.conditions?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {sub.conditions.map(c => (
                        <span key={c.id} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {c.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    بواسطة: {sub.submitted_by?.email} — {new Date(sub.submitted_at).toLocaleDateString('ar')}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleReview(sub.id, 'approved')}
                  className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex-1"
                >
                  ✅ قبول
                </button>
                <button
                  onClick={() => setShowReject({ ...showReject, [sub.id]: !showReject[sub.id] })}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500 flex-1"
                >
                  ❌ رفض
                </button>
              </div>

              {showReject[sub.id] && (
                <div className="mt-3">
                  <textarea
                    value={rejectNote[sub.id] || ''}
                    onChange={e => setRejectNote({ ...rejectNote, [sub.id]: e.target.value })}
                    placeholder="سبب الرفض (اختياري)"
                    className="w-full border rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                    rows={2}
                  />
                  <button
                    onClick={() => handleReview(sub.id, 'rejected')}
                    className="mt-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500 w-full"
                  >
                    تأكيد الرفض
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
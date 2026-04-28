'use client';
import { useState, useEffect } from 'react';
import { getAuthHeaders, getUserRole } from '@/app/lib/api';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [msg, setMsg] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (!loading) fetchRequests();
  }, [filter]);

  async function checkAccess() {
    const role = await getUserRole();
    if (role !== 'admin') {
      router.push('/');
      return;
    }
    fetchRequests();
  }

  async function fetchRequests() {
    const res = await fetch(
      `${API_URL}/api/moderator-requests/?status=${filter}`,
      { headers: await getAuthHeaders() }
    );
    const data = await res.json();
    setRequests(Array.isArray(data) ? data : data.results || []);
    setLoading(false);
  }

  async function handleReview(id, status) {
    const res = await fetch(
      `${API_URL}/api/moderator-requests/${id}/review/`,
      {
        method: 'PATCH',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ status }),
      }
    );
    if (res.ok) {
      setMsg(status === 'approved' ? 'تم قبول الطلب وترقية المستخدم لمشرف' : 'تم رفض الطلب');
      fetchRequests();
    } else {
      const data = await res.json();
      setMsg(data.error || 'حدث خطأ');
    }
  }

  if (loading) return <p className="text-center text-gray-500">جاري التحميل...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-blue-900 mb-6">لوحة الإدارة</h2>

      {msg && (
        <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-2 rounded mb-4">
          {msg}
        </div>
      )}

      <h3 className="text-lg font-bold text-blue-900 mb-3">طلبات ترقية المشرفين</h3>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {['pending', 'approved', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === s
                ? 'bg-blue-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {s === 'pending' ? 'قيد المراجعة' : s === 'approved' ? 'مقبول' : 'مرفوض'}
          </button>
        ))}
      </div>

      {requests.length === 0 ? (
        <p className="text-center text-gray-500 py-8">لا يوجد طلبات</p>
      ) : (
        <div className="grid gap-4">
          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold">
                    {req.user?.first_name} {req.user?.last_name}
                  </p>
                  <p className="text-gray-500 text-sm">{req.user?.email}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    طلب في: {new Date(req.requested_at).toLocaleDateString('ar-EG')}
                  </p>
                  {req.reviewed_at && (
                    <p className="text-xs text-gray-400">
                      تمت المراجعة في: {new Date(req.reviewed_at).toLocaleDateString('ar-EG')}
                      {req.reviewed_by && ` بواسطة ${req.reviewed_by.email}`}
                    </p>
                  )}
                </div>

                {req.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReview(req.id, 'approved')}
                      className="bg-green-700 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                    >
                      ✅ قبول
                    </button>
                    <button
                      onClick={() => handleReview(req.id, 'rejected')}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-500"
                    >
                      ❌ رفض
                    </button>
                  </div>
                )}

                {req.status !== 'pending' && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    req.status === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {req.status === 'approved' ? 'مقبول' : 'مرفوض'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
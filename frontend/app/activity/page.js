'use client';
import { useState, useEffect } from 'react';
import { getFamilyId } from '@/app/lib/family';
import { getAuthHeaders } from '@/app/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const ACTION_LABELS = {
  add_inventory: { label: 'إضافة للمخزون', icon: '➕', color: 'text-green-600' },
  edit_inventory: { label: 'تعديل المخزون', icon: '✏️', color: 'text-yellow-600' },
  delete_inventory: { label: 'حذف من المخزون', icon: '🗑️', color: 'text-red-600' },
  deduct_dose: { label: 'أخذ جرعة', icon: '💊', color: 'text-blue-600' },
};

export default function ActivityPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noFamily, setNoFamily] = useState(false);

  useEffect(() => {
    const familyId = getFamilyId();
    if (!familyId) {
      setNoFamily(true);
      setLoading(false);
      return;
    }
    fetchLogs(familyId);
  }, []);

  async function fetchLogs(familyId) {
    const res = await fetch(`${API_URL}/api/activity/?family_id=${familyId}`, {
      headers: await getAuthHeaders(),
    });
    const data = await res.json();
    setLogs(data.results || data || []);
    setLoading(false);
  }

  function groupByDate(logs) {
    const groups = {};
    logs.forEach(log => {
      const date = new Date(log.timestamp).toLocaleDateString('ar-EG', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(log);
    });
    return groups;
  }

  if (loading) return <p className="text-center text-gray-500">جاري التحميل...</p>;

  if (noFamily) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
        <h2 className="text-xl font-bold text-blue-900 mb-2">اختر عائلة أولاً</h2>
        <a href="/families" className="bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800">
          إدارة العائلات
        </a>
      </div>
    );
  }

  const grouped = groupByDate(logs);

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-blue-900 mb-6">سجل النشاط</h2>
      <p className="text-gray-500 text-sm mb-6">آخر 30 يوم</p>

      {logs.length === 0 ? (
        <p className="text-center text-gray-500">لا يوجد نشاط بعد</p>
      ) : (
        Object.entries(grouped).map(([date, entries]) => (
          <div key={date} className="mb-6">
            <h3 className="text-sm font-bold text-gray-400 mb-2 border-b pb-1">{date}</h3>
            <div className="flex flex-col gap-3">
              {entries.map(log => {
                const action = ACTION_LABELS[log.action] || { label: log.action, icon: '📋', color: 'text-gray-600' };
                return (
                  <div key={log.id} className="bg-white rounded-lg shadow px-4 py-3 flex items-start gap-3">
                    <span className="text-2xl">{action.icon}</span>
                    <div className="flex-1">
                      <p className={`font-medium ${action.color}`}>{action.label}</p>
                      <p className="text-gray-800">{log.medicine_name}</p>
                      {log.details?.quantity && (
                        <p className="text-sm text-gray-500">الكمية: {log.details.quantity}</p>
                      )}
                      {log.details?.quantity_deducted && (
                        <p className="text-sm text-gray-500">
                          جرعة: {log.details.quantity_deducted} — متبقي: {log.details.remaining}
                        </p>
                      )}
                      {log.details?.location && (
                        <p className="text-sm text-gray-500">📍 {log.details.location}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {log.user?.first_name || log.user?.email} — {new Date(log.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
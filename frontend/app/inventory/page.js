'use client';
import { useState, useEffect } from 'react';
import FamilyGuard from '@/app/components/FamilyGuard';
import { getFamilyId } from '@/app/lib/family';
import { getAuthHeaders } from '@/app/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function InventoryContent() {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstances();
  }, []);

  async function fetchInstances() {
    const familyId = getFamilyId();
    const res = await fetch(`${API_URL}/api/instances/?family_id=${familyId}`, {
      headers: await getAuthHeaders()
    });
    const data = await res.json();
    const all = data.results || data || [];
    
    const sorted = all.sort((a, b) => {
      if (a.is_expired && !b.is_expired) return -1;
      if (!a.is_expired && b.is_expired) return 1;
      return a.medicine?.name_ar.localeCompare(b.medicine?.name_ar, 'ar');
    });
    
    setInstances(sorted);
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    await fetch(`${API_URL}/api/instances/${id}/`, {
      method: 'DELETE',
      headers: await getAuthHeaders()
    });
    fetchInstances();
  }

  async function handleDeduct(id) {
    const res = await fetch(`${API_URL}/api/instances/${id}/deduct/`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ quantity: 1 }),
    });
    if (res.ok) {
      fetchInstances();
    } else {
      const data = await res.json();
      alert(data.error || 'خطأ في خصم الجرعة');
    }
  }

  function getStatusColor(instance) {
    if (instance.is_expired) return 'bg-red-100 border-red-400';
    const today = new Date();
    const expiry = new Date(instance.expiry_date);
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 90) return 'bg-yellow-100 border-yellow-400';
    if (instance.quantity <= instance.min_threshold) return 'bg-orange-100 border-orange-400';
    return 'bg-white border-gray-200';
  }

  function getStatusText(instance) {
    if (instance.is_expired) return <span className="text-red-600 font-bold">❌ منتهي الصلاحية</span>;
    const today = new Date();
    const expiry = new Date(instance.expiry_date);
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return (
      <div className="flex flex-col gap-1">
        {daysLeft <= 90 
          ? <span className="text-yellow-600 font-bold">⚠️ ينتهي خلال {daysLeft} يوم</span>
          : <span className="text-green-600">✅ صالح حتى {instance.expiry_date}</span>
        }
        {instance.quantity <= instance.min_threshold 
          ? <span className="text-orange-600 font-bold">📦 كمية منخفضة: {instance.quantity} متبقي</span>
          : <span className="text-gray-600 text-sm">📦 الكمية: {instance.quantity}</span>
        }
      </div>
    );
  }

  if (loading) return <p className="text-center text-gray-500">جاري التحميل...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-900">مخزون المنزل</h2>
        <a href="/inventory/add" className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-600">
          ➕ إضافة دواء للمنزل
        </a>
      </div>

      {instances.length === 0 ? (
        <p className="text-center text-gray-500">لا يوجد أدوية في المنزل بعد</p>
      ) : (
        <div className="grid gap-4">
          {instances.map(instance => (
            <div key={instance.id} className={`rounded-lg shadow p-4 border ${getStatusColor(instance)}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{instance.medicine?.name_ar}</h3>
                  {instance.medicine?.name_en && <p className="text-gray-500 text-sm">{instance.medicine.name_en}</p>}
                  <p className="text-sm text-gray-600 mt-1">📍 {instance.location?.name}</p>
                  <p className="text-sm text-gray-600">تاريخ الإنتاج: {instance.production_date}</p>
                  {instance.open_date && <p className="text-sm text-gray-600">تاريخ الفتح: {instance.open_date}</p>}
                  <p className="mt-2">{getStatusText(instance)}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleDeduct(instance.id)}
                    disabled={instance.quantity === 0 || instance.is_expired}
                    className="bg-blue-900 text-white px-3 py-1 rounded hover:bg-blue-800 disabled:opacity-40 text-sm"
                  >
                    💊 أخذ جرعة
                  </button>
                  <a href={`/inventory/edit/${instance.id}`} className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-400 text-sm text-center">
                    تعديل
                  </a>
                  <button onClick={() => handleDelete(instance.id)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-500 text-sm">
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Inventory() {
  return <FamilyGuard><InventoryContent /></FamilyGuard>;
}
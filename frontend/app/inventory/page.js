'use client';
import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Inventory() {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstances();
  }, []);

  async function fetchInstances() {
    const res = await fetch(`${API_URL}/api/instances/`);
    const data = await res.json();
    setInstances(data.results || data || []);
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    await fetch(`${API_URL}/api/instances/${id}/`, { method: 'DELETE' });
    fetchInstances();
  }

  function getStatusColor(instance) {
    if (instance.is_expired) return 'bg-red-100 border-red-400';
    const today = new Date();
    const expiry = new Date(instance.expiry_date);
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 30) return 'bg-yellow-100 border-yellow-400';
    return 'bg-white border-gray-200';
  }

  function getStatusText(instance) {
    if (instance.is_expired) return <span className="text-red-600 font-bold">❌ منتهي الصلاحية</span>;
    const today = new Date();
    const expiry = new Date(instance.expiry_date);
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 30) return <span className="text-yellow-600 font-bold">⚠️ ينتهي خلال {daysLeft} يوم</span>;
    return <span className="text-green-600">✅ صالح حتى {instance.expiry_date}</span>;
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
                <div className="flex gap-2">
                  <a href={`/inventory/edit/${instance.id}`} className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-400">
                    تعديل
                  </a>
                  <button onClick={() => handleDelete(instance.id)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-500">
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
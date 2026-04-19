'use client';
import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Inventory() {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConditions();
  }, []);

  async function fetchConditions() {
    const res = await fetch(`${API_URL}/api/conditions/`);
    const data = await res.json();
    const all = data.results || data || [];
    
    const sorted = all.sort((a, b) => {
      return a.condition?.name.localeCompare(b.condition?.name, 'ar');
    });
    
    setInstances(sorted);
    setLoading(false);
}

  async function handleDelete(id) {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    await fetch(`${API_URL}/api/conditions/${id}/`, { method: 'DELETE' });
    fetchInstances();
  }


  if (loading) return <p className="text-center text-gray-500">جاري التحميل...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-900">الحالات الطبية</h2>
        <a href="/conditions/add" className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-600">
          ➕ إضافة حالة طبية
        </a>
      </div>

      {instances.length === 0 ? (
        <p className="text-center text-gray-500">لا يوجد حالات طبية بعد</p>
      ) : (
        <div className="grid gap-4">
          {instances.map(instance => (
            <div key={instance.id} className={`rounded-lg shadow p-4 border ${getStatusColor(instance)}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{instance.condition?.name}</h3>
                </div>
                <div className="flex gap-2">
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
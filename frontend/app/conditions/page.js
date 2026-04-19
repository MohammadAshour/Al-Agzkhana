'use client';
import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Conditions() {
  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConditions();
  }, []);

  async function fetchConditions() {
    const res = await fetch(`${API_URL}/api/conditions/`);
    const data = await res.json();
    const all = data.results || data || [];
    
    const sorted = all.sort((a, b) => {
      return a.condition?.name.localeCompare(b.name, 'ar');
    });
    
    setConditions(sorted);
    setLoading(false);
}

  async function handleDelete(id) {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    await fetch(`${API_URL}/api/conditions/${id}/`, { method: 'DELETE' });
    fetchConditions();
  }

  if (loading) return <p className="text-center text-gray-500">جاري التحميل...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-900">الحالات الطبية</h2>
      </div>

      {conditions.length === 0 ? (
        <p className="text-center text-gray-500">لا يوجد حالات طبية بعد</p>
      ) : (
        <div className="grid gap-4">
          {conditions.map(condition => (
            <div key={condition.id} className={`rounded-lg shadow p-4 border`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{condition.name}</h3>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleDelete(condition.id)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-500">
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
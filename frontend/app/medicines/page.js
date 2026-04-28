'use client';
import { useState, useEffect } from 'react';
import { getUserRole } from '@/app/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('user');

  useEffect(() => {
    fetchMedicines();
    getUserRole().then(setUserRole);
  }, []);

  async function fetchMedicines() {
    const res = await fetch(`${API_URL}/api/medicines/`);
    const data = await res.json();
    setMedicines(data.results || data || []);
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    await fetch(`${API_URL}/api/medicines/${id}/`, { method: 'DELETE' });
    fetchMedicines();
  }

  if (loading) return <p className="text-center text-gray-500">جاري التحميل...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-900">قائمة الأدوية</h2>
        <a href="/medicines/add" className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800">
          ➕ إضافة دواء
        </a>
      </div>

      {medicines.length === 0 ? (
        <p className="text-center text-gray-500">لا يوجد أدوية بعد</p>
      ) : (
        <div className="grid gap-4">
          {medicines.map(med => (
            <div key={med.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{med.name_ar}</h3>
                  {med.name_en && <p className="text-gray-500">{med.name_en}</p>}
                  <p className="text-sm text-gray-600">شكل الدواء: {{
                    tablet: 'قرص', capsule: 'كبسولة', syrup: 'شراب', drops: 'قطرة',
                    cream: 'كريم', injection: 'حقنة', inhaler: 'بخاخ',
                    suppository: 'تحميلة', patch: 'لصقة', other: 'أخرى'
                  }[med.form] || med.form}</p>
                  <p className="text-sm text-gray-600 mt-1">مدة الصلاحية: {med.shelf_life_months} شهر</p>
                  <p className="text-sm text-gray-600">مدة الصلاحية بعد الفتح: {med.shelf_life_after_opening_months} شهر</p>
                  <p className="text-sm mt-1">
                    {med.safe_during_pregnancy ? '✅ آمن للحمل' : '❌ غير آمن للحمل'}
                    {' | '}
                    {med.safe_during_breastfeeding ? '✅ آمن للرضاعة' : '❌ غير آمن للرضاعة'}
                    {' | '}
                    {med.safe_for_diabetics ? '✅ آمن لمرضى السكري' : '❌ غير آمن لمرضى السكري'}
                    {' | '}
                    {med.safe_for_hypertensive ? '✅ آمن لمرضى الضغط' : '❌ غير آمن لمرضى الضغط'}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {med.conditions?.map(c => (
                      <span key={c.id} className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
                {(userRole === 'moderator' || userRole === 'admin') && (
                  <div className="flex gap-2">
                    <a href={`/medicines/edit/${med.id}`} className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-400">
                      تعديل
                    </a>
                    <button onClick={() => handleDelete(med.id)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-500">
                      حذف
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
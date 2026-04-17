'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function EditMedicine({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [conditions, setConditions] = useState([]);
  const [newCondition, setNewCondition] = useState('');
  const [showNewCondition, setShowNewCondition] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name_ar: '',
    name_en: '',
    shelf_life_months: '',
    shelf_life_after_opening_months: '',
    safe_during_pregnancy: false,
    safe_during_breastfeeding: false,
    condition_ids: [],
  });

  useEffect(() => {
    fetchConditions();
    fetchMedicine();
  }, []);

  async function fetchConditions() {
    const res = await fetch(`${API_URL}/api/conditions/`);
    const data = await res.json();
    setConditions(data.results || data || []);
  }

  async function fetchMedicine() {
    const res = await fetch(`${API_URL}/api/medicines/${id}/`);
    const data = await res.json();
    setForm({
      name_ar: data.name_ar,
      name_en: data.name_en || '',
      shelf_life_months: data.shelf_life_months,
      shelf_life_after_opening_months: data.shelf_life_after_opening_months,
      safe_during_pregnancy: data.safe_during_pregnancy,
      safe_during_breastfeeding: data.safe_during_breastfeeding,
      safe_for_diabetics: data.safe_for_diabetics,
      safe_for_hypertensive: data.safe_for_hypertensive,
      condition_ids: data.conditions?.map(c => c.id) || [],
    });
  }

  async function addNewCondition() {
    if (!newCondition.trim()) return;
    const res = await fetch(`${API_URL}/api/conditions/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCondition }),
    });
    const data = await res.json();
    setConditions([...conditions, data]);
    setForm({ ...form, condition_ids: [...form.condition_ids, data.id] });
    setNewCondition('');
    setShowNewCondition(false);
  }

  function toggleCondition(id) {
    if (form.condition_ids.includes(id)) {
      setForm({ ...form, condition_ids: form.condition_ids.filter(c => c !== id) });
    } else {
      setForm({ ...form, condition_ids: [...form.condition_ids, id] });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    await fetch(`${API_URL}/api/medicines/${id}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    router.push('/medicines');
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-blue-900 mb-6">تعديل الدواء</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 flex flex-col gap-4">

        <div>
          <label className="block text-sm font-medium mb-1">الاسم بالعربي *</label>
          <input required value={form.name_ar} onChange={e => setForm({...form, name_ar: e.target.value})}
            className="w-full border rounded-lg px-4 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">الاسم بالإنجليزي</label>
          <input value={form.name_en} onChange={e => setForm({...form, name_en: e.target.value})}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">مدة الصلاحية (بالشهور) *</label>
          <input required type="number" value={form.shelf_life_months} onChange={e => setForm({...form, shelf_life_months: e.target.value})}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">مدة الصلاحية بعد الفتح (بالشهور) *</label>
          <input required type="number" value={form.shelf_life_after_opening_months} onChange={e => setForm({...form, shelf_life_after_opening_months: e.target.value})}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.safe_during_pregnancy} onChange={e => setForm({...form, safe_during_pregnancy: e.target.checked})} />
            آمن للحمل
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.safe_during_breastfeeding} onChange={e => setForm({...form, safe_during_breastfeeding: e.target.checked})} />
            آمن للرضاعة
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.safe_for_diabetics} onChange={e => setForm({...form, safe_for_diabetics: e.target.checked})} />
            آمن لمرضى السكري
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.safe_for_hypertensive} onChange={e => setForm({...form, safe_for_hypertensive: e.target.checked})} />
            آمن لمرضى الضغط
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">الأعراض التي يعالجها</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {conditions.map(c => (
              <button type="button" key={c.id} onClick={() => toggleCondition(c.id)}
                className={`px-3 py-1 rounded-full text-sm border ${form.condition_ids.includes(c.id) ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-gray-700 border-gray-300'}`}>
                {c.name}
              </button>
            ))}
            <button type="button" onClick={() => setShowNewCondition(!showNewCondition)}
              className="px-3 py-1 rounded-full text-sm border border-dashed border-gray-400 text-gray-500 hover:border-blue-500">
              + إضافة عرض جديد
            </button>
          </div>
          {showNewCondition && (
            <div className="flex gap-2">
              <input value={newCondition} onChange={e => setNewCondition(e.target.value)}
                placeholder="اسم العرض"
                className="flex-1 border rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="button" onClick={addNewCondition} className="bg-blue-900 text-white px-4 py-2 rounded-lg">
                إضافة
              </button>
            </div>
          )}
        </div>

        <button type="submit" disabled={loading}
          className="bg-blue-900 text-white py-3 rounded-lg hover:bg-blue-800 disabled:opacity-50">
          {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
        </button>
      </form>
    </div>
  );
}
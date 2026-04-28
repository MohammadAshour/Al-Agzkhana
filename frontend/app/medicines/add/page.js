'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthHeaders } from '@/app/lib/api';


const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AddMedicine() {
  const router = useRouter();
  const [conditions, setConditions] = useState([]);
  const [newCondition, setNewCondition] = useState('');
  const [showNewCondition, setShowNewCondition] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name_ar: '',
    name_en: '',
    form: 'tablet',
    shelf_life_months: '',
    shelf_life_after_opening_months: '',
    safe_during_pregnancy: false,
    safe_during_breastfeeding: false,
    safe_for_diabetics: false,
    safe_for_hypertensive: false,
    condition_ids: [],
  });

  useEffect(() => {
    fetchConditions();
  }, []);

  async function fetchConditions() {
    const res = await fetch(`${API_URL}/api/conditions/`);
    const data = await res.json();
    setConditions(data.results || data || []);
  }

  function normalizeArabic(text) {
    return text
      .trim()
      .replace(/[\u0610-\u061A\u064B-\u065F]/g, '')
      .replace(/[إأآا]/g, 'ا')
      .replace(/[ةه]/g, 'ه')
      .replace(/[يى]/g, 'ي')
      .replace(/\bال/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  async function addNewCondition() {
    if (!newCondition.trim()) return;

    // Client-side duplicate check
    const normalized = normalizeArabic(newCondition);
    const duplicate = conditions.find(c => normalizeArabic(c.name) === normalized);
    if (duplicate) {
      alert(`هذا العرض موجود بالفعل باسم "${duplicate.name}"`);
      // Auto-select the existing condition instead
      if (!form.condition_ids.includes(duplicate.id)) {
        setForm({ ...form, condition_ids: [...form.condition_ids, duplicate.id] });
      }
      setNewCondition('');
      setShowNewCondition(false);
      return;
    }

    const res = await fetch(`${API_URL}/api/conditions/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCondition }),
    });
    const data = await res.json();

    // Handle backend duplicate error
    if (!res.ok) {
      const errorMsg = data?.name?.[0] || data?.detail || 'حدث خطأ';
      alert(errorMsg);
      return;
    }

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
    const res = await fetch(`${API_URL}/api/submissions/`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setLoading(false);
      setSubmitted(true);
    } else {
      setLoading(false);
      alert('حدث خطأ، حاول مرة أخرى');
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-blue-900 mb-2">تم إرسال الطلب</h2>
        <p className="text-gray-500 mb-6">سيتم مراجعة الدواء من قبل المشرفين قبل إضافته للكتالوج</p>
        <a href="/medicines" className="bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800">
          العودة للأدوية
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-blue-900 mb-6">إضافة دواء جديد</h2>
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
          <div>
            <label className="block text-sm font-medium mb-1">شكل الدواء *</label>
            <select required value={form.form} onChange={e => setForm({...form, form: e.target.value})}
              className="w-full border rounded-lg px-4 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="tablet">قرص</option>
              <option value="capsule">كبسولة</option>
              <option value="syrup">شراب</option>
              <option value="drops">قطرة</option>
              <option value="cream">كريم</option>
              <option value="injection">حقنة</option>
              <option value="inhaler">بخاخ</option>
              <option value="suppository">تحميلة</option>
              <option value="patch">لصقة</option>
              <option value="other">أخرى</option>
            </select>
          </div>
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

        <div className="grid grid-cols-2 gap-3">
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
          {loading ? 'جاري الحفظ...' : 'حفظ الدواء'}
        </button>
      </form>
    </div>
  );
}
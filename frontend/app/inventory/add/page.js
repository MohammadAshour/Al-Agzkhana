'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FamilyGuard from '@/app/components/FamilyGuard';
import { getFamilyId } from '@/app/lib/family';
import { getAuthHeaders } from '@/app/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function AddInventoryContent() {
  const router = useRouter();
  const [medicines, setMedicines] = useState([]);
  const [locations, setLocations] = useState([]);
  const [newLocation, setNewLocation] = useState('');
  const [showNewLocation, setShowNewLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    medicine_id: '',
    production_date: '',
    open_date: '',
    location_id: '',
    quantity: 1,
    min_threshold: 1,
  });

  useEffect(() => {
    fetchMedicines();
    fetchLocations();
  }, []);

  async function fetchMedicines() {
    const res = await fetch(`${API_URL}/api/medicines/`, { headers: await getAuthHeaders() });
    const data = await res.json();
    setMedicines(data.results || data || []);
  }

  async function fetchLocations() {
    const familyId = getFamilyId();
    const res = await fetch(`${API_URL}/api/locations/?family_id=${familyId}`, { headers: await getAuthHeaders() });
    const data = await res.json();
    setLocations(data.results || data || []);
  }

  async function addNewLocation() {
    if (!newLocation.trim()) return;
    const familyId = getFamilyId();
    const res = await fetch(`${API_URL}/api/locations/`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ name: newLocation, family_id: familyId }),
    });
    const data = await res.json();
    setLocations([...locations, data]);
    setForm({ ...form, location_id: data.id });
    setNewLocation('');
    setShowNewLocation(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const familyId = getFamilyId();
    const payload = {
      ...form,
      location_id: form.location_id || null,
      open_date: form.open_date || null,
      family_id: familyId,
    };
    await fetch(`${API_URL}/api/instances/`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    router.push('/inventory');
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-blue-900 mb-6">إضافة دواء للمنزل</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 flex flex-col gap-4">

        <div>
          <label className="block text-sm font-medium mb-1">الدواء *</label>
          <select required value={form.medicine_id} onChange={e => setForm({...form, medicine_id: e.target.value})}
            className="w-full border rounded-lg px-4 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">اختر الدواء</option>
            {medicines.map(m => (
              <option key={m.id} value={m.id}>{m.name_ar}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">المكان *</label>
          <select value={form.location_id} onChange={e => {
            if (e.target.value === 'new') {
              setShowNewLocation(true);
            } else {
              setForm({...form, location_id: e.target.value});
              setShowNewLocation(false);
            }
          }}
            className="w-full border rounded-lg px-4 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">اختر المكان</option>
            {locations.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
            <option value="new">➕ إضافة مكان جديد</option>
          </select>
          {showNewLocation && (
            <div className="flex gap-2 mt-2">
              <input value={newLocation} onChange={e => setNewLocation(e.target.value)}
                placeholder="اسم المكان"
                className="flex-1 border rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="button" onClick={addNewLocation} className="bg-blue-900 text-white px-4 py-2 rounded-lg">
                إضافة
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">الكمية *</label>
          <input required type="number" min="1" value={form.quantity}
            onChange={e => setForm({...form, quantity: parseInt(e.target.value)})}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">حد التنبيه (أقل كمية)</label>
          <input type="number" min="1" value={form.min_threshold}
            onChange={e => setForm({...form, min_threshold: parseInt(e.target.value)})}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
          
        <div>
          <label className="block text-sm font-medium mb-1">تاريخ الإنتاج *</label>
          <input required type="date" value={form.production_date} onChange={e => setForm({...form, production_date: e.target.value})}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">تاريخ الفتح</label>
          <input type="date" value={form.open_date} onChange={e => setForm({...form, open_date: e.target.value})}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <button type="submit" disabled={loading}
          className="bg-green-700 text-white py-3 rounded-lg hover:bg-green-600 disabled:opacity-50">
          {loading ? 'جاري الحفظ...' : 'حفظ'}
        </button>
      </form>
    </div>
  );
}

export default function AddInventory() {
  return <FamilyGuard><AddInventoryContent /></FamilyGuard>;
}
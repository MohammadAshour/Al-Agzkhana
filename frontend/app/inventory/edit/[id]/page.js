'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function EditInventory({ params }) {
  const { id } = use(params);
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
  });

  useEffect(() => {
    fetchMedicines();
    fetchLocations();
    fetchInstance();
  }, []);

  async function fetchMedicines() {
    const res = await fetch(`${API_URL}/api/medicines/`);
    const data = await res.json();
    setMedicines(data.results || data || []);
  }

  async function fetchLocations() {
    const res = await fetch(`${API_URL}/api/locations/`);
    const data = await res.json();
    setLocations(data.results || data || []);
  }

  async function fetchInstance() {
    const res = await fetch(`${API_URL}/api/instances/${id}/`);
    const data = await res.json();
    setForm({
      medicine_id: data.medicine?.id || '',
      production_date: data.production_date || '',
      open_date: data.open_date || '',
      location_id: data.location?.id || '',
    });
  }

  async function addNewLocation() {
    if (!newLocation.trim()) return;
    const res = await fetch(`${API_URL}/api/locations/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newLocation }),
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
    await fetch(`${API_URL}/api/instances/${id}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    router.push('/inventory');
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-blue-900 mb-6">تعديل دواء في المنزل</h2>
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
          {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
        </button>
      </form>
    </div>
  );
}
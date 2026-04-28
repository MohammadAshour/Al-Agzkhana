'use client';
import { useState, useEffect } from 'react';
import { getFamilyId } from '@/app/lib/family';
import { getAuthHeaders } from '@/app/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [expired, setExpired] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExpired();
    fetchLowStock();
  }, []);

  async function fetchExpired() {
    const familyId = getFamilyId();
    if (!familyId) { setExpired([]); return; }
    const res = await fetch(
      `${API_URL}/api/instances/?expired=true&family_id=${familyId}`,
      { headers: await getAuthHeaders() }
    );
    const data = await res.json();
    setExpired(data.results || data);
  }

async function fetchLowStock() {
    const familyId = getFamilyId();
    if (!familyId) { setLowStock([]); return; }
    const res = await fetch(
      `${API_URL}/api/instances/?low_stock=true&family_id=${familyId}`,
      { headers: await getAuthHeaders() }
    );
    const data = await res.json();
    setLowStock(data.results || data);
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!search.trim()) return;
    setLoading(true);
    const res = await fetch(`${API_URL}/api/medicines/?search=${search}`);
    const data = await res.json();
    setResults(data.results || data || []);
    setLoading(false);
  }

  return (
    <div>
      {expired.length > 0 && (
        <a href="/inventory" className="flex items-center gap-2 bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded mb-3 hover:bg-red-200">
          <span className="text-xl">⚠️</span>
          <span><strong>تحذير:</strong> {expired.length} دواء انتهت صلاحيته، اضغط هنا للمخزون!</span>
        </a>
      )}
      {lowStock.length > 0 && (
        <a href="/inventory" className="flex items-center gap-2 bg-orange-100 border border-orange-400 text-orange-800 px-4 py-3 rounded mb-6 hover:bg-orange-200">
          <span className="text-xl">📦</span>
          <span><strong>تنبيه:</strong> {lowStock.length} دواء وصل للحد الأدنى، اضغط هنا للمخزون!</span>
        </a>
      )}

      <div className="max-w-2xl mx-auto mb-8">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث عن دواء أو عرض..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800"
          >
            بحث
          </button>
        </form>
      </div>

      {loading && <p className="text-center text-gray-500">جاري البحث...</p>}

      {results.length > 0 && (
        <div className="grid gap-4 mb-8">
          {results.map(med => (
            <div key={med.id} className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold text-lg">{med.name_ar}</h3>
              {med.name_en && <p className="text-gray-500">{med.name_en}</p>}
              <p className="text-sm mt-1">
                {med.safe_during_pregnancy ? '✅ آمن للحمل' : '❌ غير آمن للحمل'}
                {' | '}
                {med.safe_during_breastfeeding ? '✅ آمن للرضاعة' : '❌ غير آمن للرضاعة'}
               </p>
              <p className="text-sm mt-1">
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
          ))}
        </div>
      )}

      <div className="flex gap-4 justify-center">
        <a href="/medicines/add" className="bg-blue-900 text-white px-8 py-4 rounded-lg hover:bg-blue-800 text-lg">
          ➕ إضافة دواء للقائمة
        </a>
        <a href="/inventory/add" className="bg-green-700 text-white px-8 py-4 rounded-lg hover:bg-green-600 text-lg">
          🏠 إضافة دواء للمنزل
        </a>
      </div>
    </div>
  );
}
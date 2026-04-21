'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthHeaders } from '../lib/api';
import { setSelectedFamily, getSelectedFamily } from '../lib/family';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function FamiliesPage() {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [msg, setMsg] = useState('');
  const router = useRouter();

  useEffect(() => {
    const sel = getSelectedFamily();
    if (sel) setSelectedId(sel.id);
    fetchFamilies();
  }, []);

  async function fetchFamilies() {
    const res = await fetch(`${API_URL}/api/families/`, { headers: getAuthHeaders() });
    const data = await res.json();
    setFamilies(data.results || data || []);
    setLoading(false);
  }

  async function createFamily(e) {
    e.preventDefault();
    if (!newFamilyName.trim()) return;
    const res = await fetch(`${API_URL}/api/families/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name: newFamilyName }),
    });
    if (res.ok) {
      setNewFamilyName('');
      setMsg('تم إنشاء العائلة بنجاح!');
      fetchFamilies();
    }
  }

  async function joinFamily(e) {
    e.preventDefault();
    if (!joinCode.trim()) return;
    const res = await fetch(`${API_URL}/api/families/join/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ code: joinCode }),
    });
    const data = await res.json();
    if (res.ok) {
      setJoinCode('');
      setMsg('انضممت للعائلة بنجاح!');
      fetchFamilies();
    } else {
      setMsg(data.error || 'خطأ في الانضمام');
    }
  }

  async function leaveFamily(family) {
    if (!confirm('هل أنت متأكد من المغادرة؟')) return;
    await fetch(`${API_URL}/api/families/${family.id}/leave/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (selectedId === family.id) {
      setSelectedFamily(null);
      setSelectedId(null);
    }
    fetchFamilies();
  }

  async function deleteFamily(family) {
    if (!confirm('هل أنت متأكد من الحذف؟ سيتم حذف كل المخزون!')) return;
    await fetch(`${API_URL}/api/families/${family.id}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (selectedId === family.id) {
      setSelectedFamily(null);
      setSelectedId(null);
    }
    fetchFamilies();
  }

  function selectFamily(family) {
    setSelectedFamily(family);
    setSelectedId(family.id);
    setMsg(`تم اختيار عائلة "${family.name}"`);
    setTimeout(() => router.push('/'), 800);
  }

  if (loading) return <p className="text-center text-gray-500">جاري التحميل...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-blue-900 mb-6">العائلات</h2>

      {msg && (
        <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-2 rounded mb-4">
          {msg}
        </div>
      )}

      {/* Create family */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h3 className="font-bold mb-3">إنشاء عائلة جديدة</h3>
        <form onSubmit={createFamily} className="flex gap-2">
          <input
            value={newFamilyName}
            onChange={e => setNewFamilyName(e.target.value)}
            placeholder="اسم العائلة"
            className="flex-1 border rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="bg-blue-900 text-white px-4 py-2 rounded-lg">
            إنشاء
          </button>
        </form>
      </div>

      {/* Join family */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="font-bold mb-3">الانضمام لعائلة</h3>
        <form onSubmit={joinFamily} className="flex gap-2">
          <input
            value={joinCode}
            onChange={e => setJoinCode(e.target.value)}
            placeholder="كود العائلة"
            className="flex-1 border rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="bg-green-700 text-white px-4 py-2 rounded-lg">
            انضم
          </button>
        </form>
      </div>

      {/* Family list */}
      {families.length === 0 ? (
        <p className="text-center text-gray-500">لا يوجد عائلات بعد</p>
      ) : (
        <div className="grid gap-4">
          {families.map(family => (
            <div
              key={family.id}
              className={`rounded-lg shadow p-4 border-2 ${selectedId === family.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{family.name}</h3>
                  <p className="text-sm text-gray-500">{family.member_count} عضو</p>
                  {/* Show code only to owner */}
                  {family.owner && (
                    <div className="mt-2 bg-gray-100 rounded px-3 py-1 inline-block">
                      <span className="text-xs text-gray-500">كود الانضمام: </span>
                      <span className="font-mono font-bold text-blue-900">{family.code}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 mr-4">
                  <button
                    onClick={() => selectFamily(family)}
                    className={`px-3 py-1 rounded text-sm ${selectedId === family.id ? 'bg-blue-900 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    {selectedId === family.id ? '✅ محددة' : 'اختر'}
                  </button>
                  {family.owner?.id === family.owner?.id ? (
                    <button
                      onClick={() => deleteFamily(family)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-500"
                    >
                      حذف
                    </button>
                  ) : (
                    <button
                      onClick={() => leaveFamily(family)}
                      className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-400"
                    >
                      مغادرة
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
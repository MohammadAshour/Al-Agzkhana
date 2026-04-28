'use client';
import { useState, useEffect } from 'react';
import { getAuthHeaders } from '@/app/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    const res = await fetch(`${API_URL}/api/profile/`, {
      headers: await getAuthHeaders(),
    });
    const data = await res.json();
    const p = Array.isArray(data) ? data[0] : data;
    setProfile(p);
    setLoading(false);
  }

  async function requestModerator() {
    const res = await fetch(`${API_URL}/api/profile/request-moderator/`, {
      method: 'POST',
      headers: await getAuthHeaders(),
    });
    const data = await res.json();
    setMsg(data.message || data.error || '');
  }

  async function promoteUser(userId, role) {
    const res = await fetch(`${API_URL}/api/profile/promote/`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ user_id: userId, role }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg('تم تحديث الدور بنجاح');
      fetchProfile();
    } else {
      setMsg(data.error || 'خطأ');
    }
  }

  const roleLabel = { user: 'مستخدم', moderator: 'مشرف', admin: 'مدير' };
  const roleColor = { user: 'bg-gray-100 text-gray-700', moderator: 'bg-blue-100 text-blue-700', admin: 'bg-purple-100 text-purple-700' };

  if (loading) return <p className="text-center text-gray-500">جاري التحميل...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-blue-900 mb-6">الملف الشخصي</h2>

      {msg && (
        <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-2 rounded mb-4">
          {msg}
        </div>
      )}

      {profile && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <p className="text-lg font-bold">{profile.user?.first_name} {profile.user?.last_name}</p>
          <p className="text-gray-500 mb-4">{profile.user?.email}</p>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${roleColor[profile.role]}`}>
            {roleLabel[profile.role]}
          </span>

          {profile.role === 'user' && (
            <div className="mt-6">
              <button
                onClick={requestModerator}
                className="bg-blue-900 text-white px-6 py-2 rounded-lg hover:bg-blue-800"
              >
                طلب صلاحية مشرف
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
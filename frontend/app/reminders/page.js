'use client';
import { useState, useEffect } from 'react';
import { getAuthHeaders } from '@/app/lib/api';
import { getFamilyId } from '@/app/lib/family';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function RemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    medicine_instance: '',
    schedule_type: 'fixed_times',
    times: ['08:00'],
    dosage: '',
    interval_hours: 8,
    interval_start_time: '08:00',
  });

  useEffect(() => {
    fetchReminders();
    fetchInstances();
  }, []);

  async function fetchReminders() {
    const res = await fetch(`${API_URL}/api/reminders/`, {
      headers: await getAuthHeaders(),
    });
    const data = await res.json();
    setReminders(data.results || data || []);
    setLoading(false);
  }

  async function fetchInstances() {
    const familyId = getFamilyId();
    if (!familyId) return;
    const res = await fetch(`${API_URL}/api/instances/?family_id=${familyId}`, {
      headers: await getAuthHeaders(),
    });
    const data = await res.json();
    setInstances(data.results || data || []);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      medicine_instance: form.medicine_instance,
      schedule_type: form.schedule_type,
      dosage: form.dosage,
      times: form.schedule_type === 'fixed_times'
        ? form.times
        : { every_hours: form.interval_hours, start_time: form.interval_start_time },
    };
    const res = await fetch(`${API_URL}/api/reminders/`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setMsg('تم إضافة التذكير بنجاح');
      setShowForm(false);
      setForm({ medicine_instance: '', schedule_type: 'fixed_times', times: ['08:00'], dosage: '', interval_hours: 8 });
      fetchReminders();
    } else {
      setMsg('حدث خطأ، حاول مرة أخرى');
    }
  }

  async function handleToggle(id) {
    await fetch(`${API_URL}/api/reminders/${id}/toggle/`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
    });
    fetchReminders();
  }

  async function handleDelete(id) {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    await fetch(`${API_URL}/api/reminders/${id}/`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });
    fetchReminders();
  }

  function addTime() {
    setForm({ ...form, times: [...form.times, '08:00'] });
  }

  function updateTime(index, value) {
    const updated = [...form.times];
    updated[index] = value;
    setForm({ ...form, times: updated });
  }

  function removeTime(index) {
    setForm({ ...form, times: form.times.filter((_, i) => i !== index) });
  }

  function formatTimes(reminder) {
    if (reminder.schedule_type === 'fixed_times') {
      return Array.isArray(reminder.times)
        ? reminder.times.join(' — ')
        : JSON.stringify(reminder.times);
    }
    const every = reminder.times?.every_hours || '?';
    const start = reminder.times?.start_time || '00:00';
    return `كل ${every} ساعة — بداية من ${start}`;
  }

  function getNextNotification(reminder) {
    const now = new Date();
    if (reminder.schedule_type === 'fixed_times' && Array.isArray(reminder.times)) {
      const sorted = [...reminder.times].sort();
      const currentTime = now.toTimeString().slice(0, 5);
      const next = sorted.find(t => t > currentTime) || sorted[0];
      return `التالي: ${next}`;
    }
    if (reminder.schedule_type === 'interval' && reminder.times?.every_hours) {
      const every = reminder.times.every_hours;
      const start = reminder.times?.start_time || '00:00';
      const [startHour, startMin] = start.split(':').map(Number);

      // Calculate all notification times for today
      const notificationTimes = [];
      let h = startHour;
      let m = startMin;
      while (notificationTimes.length < Math.floor(24 / every) + 1) {
        notificationTimes.push(`${String(h % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        h += every;
      }

      const currentTime = now.toTimeString().slice(0, 5);
      const next = notificationTimes.find(t => t > currentTime) || notificationTimes[0];
      return `التالي: ${next}`;
    }
    return '';
  }

  if (loading) return <p className="text-center text-gray-500">جاري التحميل...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-900">التذكيرات</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800"
        >
          ➕ تذكير جديد
        </button>
      </div>

      {msg && (
        <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-2 rounded mb-4">
          {msg}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 mb-6 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">الدواء *</label>
            <select
              required
              value={form.medicine_instance}
              onChange={e => setForm({ ...form, medicine_instance: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">اختر الدواء من المخزون</option>
              {instances.map(i => (
                <option key={i.id} value={i.id}>
                  {i.medicine?.name_ar} — {i.location?.name || 'بدون مكان'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">الجرعة *</label>
            <input
              required
              value={form.dosage}
              onChange={e => setForm({ ...form, dosage: e.target.value })}
              placeholder="مثال: قرص واحد، 5ml"
              className="w-full border rounded-lg px-4 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">نوع الجدول *</label>
            <select
              value={form.schedule_type}
              onChange={e => setForm({ ...form, schedule_type: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="fixed_times">أوقات محددة</option>
              <option value="interval">كل فترة زمنية</option>
            </select>
          </div>

          {form.schedule_type === 'fixed_times' ? (
            <div>
              <label className="block text-sm font-medium mb-2">الأوقات *</label>
              {form.times.map((t, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    type="time"
                    value={t}
                    onChange={e => updateTime(i, e.target.value)}
                    className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {form.times.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTime(i)}
                      className="bg-red-100 text-red-600 px-3 py-2 rounded-lg hover:bg-red-200"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addTime}
                className="text-blue-900 text-sm underline"
              >
                + إضافة وقت آخر
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">كل كم ساعة؟ *</label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={form.interval_hours}
                  onChange={e => setForm({ ...form, interval_hours: parseInt(e.target.value) })}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">وقت البداية *</label>
                <input
                  type="time"
                  value={form.interval_start_time}
                  onChange={e => setForm({ ...form, interval_start_time: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  مثال: إذا اخترت كل 8 ساعات والبداية 08:00 — ستصلك تذكيرات في 08:00 و 16:00 و 00:00
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="bg-blue-900 text-white py-3 rounded-lg hover:bg-blue-800"
          >
            حفظ التذكير
          </button>
        </form>
      )}

      {reminders.length === 0 ? (
        <p className="text-center text-gray-500">لا يوجد تذكيرات بعد</p>
      ) : (
        <div className="grid gap-4">
          {reminders.map(reminder => (
            <div
              key={reminder.id}
              className={`bg-white rounded-lg shadow p-4 border-2 ${reminder.is_active ? 'border-blue-200' : 'border-gray-200 opacity-60'}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{reminder.medicine_name}</h3>
                  <p className="text-sm text-gray-600 mt-1">💊 الجرعة: {reminder.dosage}</p>
                  <p className="text-sm text-gray-600">⏰ {formatTimes(reminder)}</p>
                  <p className="text-xs text-blue-600">{getNextNotification(reminder)}</p>
                  <span className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${reminder.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {reminder.is_active ? 'نشط' : 'موقوف'}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleToggle(reminder.id)}
                    className={`px-3 py-1 rounded text-sm ${reminder.is_active ? 'bg-yellow-500 text-white hover:bg-yellow-400' : 'bg-green-700 text-white hover:bg-green-600'}`}
                  >
                    {reminder.is_active ? 'إيقاف' : 'تفعيل'}
                  </button>
                  <button
                    onClick={() => handleDelete(reminder.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-500"
                  >
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
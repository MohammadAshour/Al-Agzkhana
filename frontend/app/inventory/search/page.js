'use client';
import { useState, useEffect, useRef } from 'react';
import { getAuthHeaders } from '@/app/lib/api';
import { getFamilyId } from '@/app/lib/family';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const FORM_LABELS = {
  tablet: 'قرص', capsule: 'كبسولة', syrup: 'شراب', drops: 'قطرة',
  cream: 'كريم', injection: 'حقنة', inhaler: 'بخاخ',
  suppository: 'تحميلة', patch: 'لصقة', other: 'أخرى',
};

export default function InventorySearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ family_stock: [], global_catalog: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ family_stock: [], global_catalog: [] });
      setSearched(false);
      return;
    }

    // Debounce 300ms
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(query.trim());
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  async function doSearch(q) {
    setLoading(true);
    const familyId = getFamilyId();
    const params = new URLSearchParams({ q });
    if (familyId) params.append('family_id', familyId);

    const res = await fetch(
      `${API_URL}/api/inventory/search/?${params.toString()}`,
      { headers: await getAuthHeaders() }
    );
    const data = await res.json();
    setResults(data);
    setSearched(true);
    setLoading(false);
  }

  const totalResults = results.family_stock.length + results.global_catalog.length;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-blue-900 mb-6">بحث ذكي</h2>

      <div className="relative mb-6">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="ابحث بالاسم العربي أو الإنجليزي أو العرض..."
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
          autoFocus
        />
        {loading && (
          <div className="absolute left-3 top-3.5">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {query && !loading && (
          <button
            onClick={() => setQuery('')}
            className="absolute left-3 top-3 text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        )}
      </div>

      {searched && !loading && (
        <p className="text-sm text-gray-500 mb-4">
          {totalResults === 0 ? 'لا يوجد نتائج' : `${totalResults} نتيجة`}
        </p>
      )}

      {/* Family stock results */}
      {results.family_stock.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
            <span>🏠</span> في مخزونك
          </h3>
          <div className="flex flex-col gap-3">
            {results.family_stock.map(instance => (
              <div
                key={instance.id}
                className={`bg-white rounded-lg shadow p-4 border-2 ${
                  instance.is_expired
                    ? 'border-red-400'
                    : instance.quantity <= instance.min_threshold
                    ? 'border-orange-400'
                    : 'border-blue-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold">{instance.medicine?.name_ar}</h4>
                    {instance.medicine?.name_en && (
                      <p className="text-gray-500 text-sm">{instance.medicine.name_en}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      📍 {instance.location?.name || 'بدون مكان'}
                    </p>
                    <p className="text-sm text-gray-600">
                      📦 الكمية: {instance.quantity}
                    </p>
                    {instance.is_expired
                      ? <span className="text-red-600 text-sm font-bold">❌ منتهي الصلاحية</span>
                      : <span className="text-green-600 text-sm">✅ صالح حتى {instance.expiry_date}</span>
                    }
                  </div>
                  
                   <a href={`/inventory/edit/${instance.id}`}
                    className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-400"
                  >
                    تعديل
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      {results.family_stock.length > 0 && results.global_catalog.length > 0 && (
        <hr className="my-4 border-gray-200" />
      )}

      {/* Global catalog results */}
      {results.global_catalog.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
            <span>🌐</span> الكتالوج العام
          </h3>
          <div className="flex flex-col gap-3">
            {results.global_catalog.map(med => (
              <div key={med.id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-bold">{med.name_ar}</h4>
                    {med.name_en && (
                      <p className="text-gray-500 text-sm">{med.name_en}</p>
                    )}
                    <p className="text-sm text-gray-600">
                      شكل الدواء: {FORM_LABELS[med.form] || med.form}
                    </p>
                    <p className="text-sm mt-1">
                      {med.safe_during_pregnancy ? '✅' : '❌'} للحمل
                      {' | '}
                      {med.safe_during_breastfeeding ? '✅' : '❌'} للرضاعة
                      {' | '}
                      {med.safe_for_diabetics ? '✅' : '❌'} للسكري
                      {' | '}
                      {med.safe_for_hypertensive ? '✅' : '❌'} للضغط
                    </p>
                    {med.conditions?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {med.conditions.map(c => (
                          <span
                            key={c.id}
                            className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                          >
                            {c.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                   <a href="/inventory/add"
                    className="bg-green-700 text-white px-3 py-1 rounded text-sm hover:bg-green-600 mr-2 whitespace-nowrap"
                  >
                    + أضف للمنزل
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {searched && !loading && totalResults === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-gray-500 mb-4">لا يوجد نتائج لـ "{query}"</p>
          
            <a href="/medicines/add"
            className="bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800"
          >
            إضافة دواء جديد للكتالوج
          </a>
        </div>
      )}
    </div>
  );
}
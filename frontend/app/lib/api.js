import { getSession } from "next-auth/react";

export async function getAuthHeaders() {
  const session = await getSession();
  const token = session?.djangoToken || 
    (typeof window !== "undefined" ? localStorage.getItem("authToken") : null);
  return token
    ? { "Content-Type": "application/json", Authorization: `Token ${token}` }
    : { "Content-Type": "application/json" };
}

export async function getUserRole() {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/`, { headers });
    if (!res.ok) return 'user';
    const data = await res.json();
    // profile/ list returns array from ViewSet
    const profile = Array.isArray(data) ? data[0] : data;
    return profile?.role || 'user';
  } catch {
    return 'user';
  }
}
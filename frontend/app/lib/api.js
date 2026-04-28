import { getSession } from "next-auth/react";

export async function getAuthHeaders() {
  const token = await getToken();
  return token
    ? { "Content-Type": "application/json", Authorization: `Token ${token}` }
    : { "Content-Type": "application/json" };
}

async function getToken() {
  if (typeof window === "undefined") return null;
  try {
    const session = await getSession();
    return session?.djangoToken || localStorage.getItem("authToken") || null;
  } catch {
    return localStorage.getItem("authToken") || null;
  }
}

export async function getUserRole() {
  if (typeof window === "undefined") return "user";
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/profile/`,
      { headers }
    );
    if (!res.ok) return "user";
    const data = await res.json();
    const profile = Array.isArray(data) ? data[0] : data;
    return profile?.role || "user";
  } catch {
    return "user";
  }
}
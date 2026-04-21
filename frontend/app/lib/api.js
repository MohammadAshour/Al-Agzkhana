import { getSession } from "next-auth/react";

export async function getAuthHeaders() {
  const session = await getSession();
  const token = session?.djangoToken || 
    (typeof window !== "undefined" ? localStorage.getItem("authToken") : null);
  return token
    ? { "Content-Type": "application/json", Authorization: `Token ${token}` }
    : { "Content-Type": "application/json" };
}
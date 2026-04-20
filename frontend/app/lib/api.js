export function getAuthHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  return token
    ? { "Content-Type": "application/json", Authorization: `Token ${token}` }
    : { "Content-Type": "application/json" };
}
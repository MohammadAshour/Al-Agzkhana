export function getAuthHeaders() {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  if (!token) {
    console.warn('No auth token found in localStorage');
  }
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Token ${token}` }
    : { 'Content-Type': 'application/json' };
}
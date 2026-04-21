// Stores selected family in localStorage
export function getSelectedFamily() {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem('selectedFamily'));
  } catch { return null; }
}

export function setSelectedFamily(family) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('selectedFamily', JSON.stringify(family));
}

export function clearSelectedFamily() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('selectedFamily');
}

export function getFamilyId() {
  return getSelectedFamily()?.id || null;
}
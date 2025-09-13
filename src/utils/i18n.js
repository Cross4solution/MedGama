// Simple i18n helpers for common Turkish -> English conversions used in UI

// Map common Turkish medical specialties to English
const specialtyTrMap = {
  'Kalp Cerrahisi': 'Cardiac Surgery',
  'Onkoloji': 'Oncology',
  'Plastik Cerrahi': 'Plastic Surgery',
  'Estetik': 'Aesthetics',
  'Diş Tedavisi': 'Dental Care',
  'Diş Hekimliği': 'Dentistry',
  'Diş': 'Dental',
  'Göz Hastalıkları': 'Ophthalmology',
  'Göz': 'Eye Care',
  'Nöroloji': 'Neurology',
  'Ortopedi': 'Orthopedics',
  'Üroloji': 'Urology',
  'Kardiyoloji': 'Cardiology',
  'Dermatoloji': 'Dermatology',
  'Deri': 'Dermatology'
};

export function translateSpecialty(label) {
  if (!label) return label;
  return specialtyTrMap[label] || label;
}

// Convert relative time strings like "4 saat önce" -> "4 hours ago"
export function toEnglishTimestamp(ts) {
  if (!ts) return '';
  const s = String(ts).trim().toLowerCase();
  if (s === 'az önce') return 'Just now';
  // Normalize diacritics (gün->gun, yıl->yil, önce->once)
  const ascii = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Accept both with and without 'once' word
  const m = ascii.match(/(\d+)\s*(dakika|saat|gun|hafta|ay|yil)(?:\s+once)?/);
  if (m) {
    const n = parseInt(m[1], 10);
    const unit = m[2];
    const unitMap = { 'dakika': 'minute', 'saat': 'hour', 'gun': 'day', 'hafta': 'week', 'ay': 'month', 'yil': 'year' };
    const enUnit = unitMap[unit] || 'unit';
    return `${n} ${enUnit}${n === 1 ? '' : 's'} ago`;
  }
  // If already English or different format, return as-is
  return ts;
}

export default {
  translateSpecialty,
  toEnglishTimestamp,
};

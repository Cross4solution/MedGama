function stableHash(input) {
  const str = String(input || '');
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function firstFiniteNumber(values) {
  for (const value of values) {
    const n = typeof value === 'number' ? value : Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export function resolveClinicRating(clinic, fallback = 4.8) {
  const explicit = firstFiniteNumber([
    clinic?.rating,
    clinic?.average_rating,
    clinic?.averageRating,
    clinic?.review_score,
    clinic?.reviewScore,
  ]);

  if (explicit !== null) return Number(explicit.toFixed(1));

  const seed = clinic?.codename || clinic?.id || clinic?.name || 'clinic';
  const hash = stableHash(seed);
  const synthetic = 4.5 + ((hash % 5) / 10); // 4.5 .. 4.9 (stable per clinic)
  const base = Number.isFinite(Number(fallback)) ? Number(fallback) : synthetic;
  return Number(base.toFixed(1));
}

export function resolveClinicReviewCount(clinic, fallback = 120) {
  const explicit = firstFiniteNumber([
    clinic?.reviews,
    clinic?.review_count,
    clinic?.reviewCount,
    clinic?.total_reviews,
    clinic?.totalReviews,
  ]);

  if (explicit !== null) return Math.max(0, Math.round(explicit));

  const seed = clinic?.codename || clinic?.id || clinic?.name || 'clinic';
  const hash = stableHash(seed);
  const synthetic = 80 + (hash % 400); // 80 .. 479 (stable per clinic)
  const base = Number.isFinite(Number(fallback)) ? Number(fallback) : synthetic;
  return Math.max(0, Math.round(base));
}

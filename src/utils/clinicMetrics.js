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

// Real rating only — returns null when there are no reviews (UI shows "Yeni").
// NO synthetic/fake values (this is a healthcare platform).
export function resolveClinicRating(clinic) {
  const explicit = firstFiniteNumber([
    clinic?.avg_rating,
    clinic?.rating,
    clinic?.average_rating,
    clinic?.averageRating,
    clinic?.review_score,
    clinic?.reviewScore,
  ]);
  return explicit !== null && explicit > 0 ? Number(explicit.toFixed(1)) : null;
}

export function resolveClinicReviewCount(clinic) {
  const explicit = firstFiniteNumber([
    clinic?.review_count,
    clinic?.reviews,
    clinic?.reviewCount,
    clinic?.total_reviews,
    clinic?.totalReviews,
  ]);
  return explicit !== null ? Math.max(0, Math.round(explicit)) : 0;
}

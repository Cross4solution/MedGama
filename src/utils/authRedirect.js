/**
 * Role-based post-login redirect.
 *
 * Regardless of which login page the user arrived from,
 * they are always sent to the correct dashboard for their role.
 *
 * Role hierarchy:
 *  L5 — superAdmin / saasAdmin  → /admin
 *  L4 — hospital                → /crm
 *  L3 — clinicOwner / clinic    → /crm
 *  L2 — doctor                  → /crm
 *  L1 — patient                 → /explore
 */
export function getRedirectForRole(roleId) {
  switch (roleId) {
    case 'superAdmin':
    case 'saasAdmin':
      return '/admin';
    case 'hospital':
      return '/crm';
    case 'clinicOwner':
    case 'clinic':
      return '/crm';
    case 'doctor':
      return '/crm';
    case 'patient':
    default:
      return '/explore';
  }
}

/**
 * Extract role from AuthContext login() response and return target path.
 * Falls back to `fallback` if role cannot be determined.
 */
export function getRedirectFromLoginResult(res, fallback = '/explore') {
  const roleId =
    res?.data?.user?.role_id ||
    res?.data?.user?.role    ||
    res?.user?.role_id       ||
    res?.user?.role          ||
    '';
  if (!roleId) return fallback;
  return getRedirectForRole(roleId);
}

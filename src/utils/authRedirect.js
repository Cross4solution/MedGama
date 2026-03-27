/**
 * Role-based post-login redirect.
 *
 * Product hierarchy:
 *  • Medstream (/explore) is the MAIN platform — social feed, content, interactions.
 *  • CRM is an EXTRA professional tool accessed from inside Medstream.
 *
 * Login landing rules:
 *  L5 — superAdmin / saasAdmin  → /admin   (platform management)
 *  L4 — hospital                → /crm     (management-only role, no social feed)
 *  L3 — clinicOwner / clinic    → /explore (enter Medstream, then use CRM bridge)
 *  L2 — doctor                  → /explore (enter Medstream, then use CRM bridge)
 *  L1 — patient                 → /explore (Medstream consumer)
 */
export function getRedirectForRole(roleId) {
  switch (roleId) {
    case 'superAdmin':
    case 'saasAdmin':
      return '/admin';
    case 'hospital':
      // Hospital is a management-only role — land directly in CRM panel
      return '/crm';
    case 'clinicOwner':
    case 'clinic':
    case 'doctor':
    case 'patient':
    default:
      // All other roles land in Medstream (main platform)
      // Professionals can reach CRM via the sidebar bridge link
      return '/medstream';
  }
}

/**
 * Extract role from AuthContext login() response and return target path.
 * Falls back to `fallback` if role cannot be determined.
 */
export function getRedirectFromLoginResult(res, fallback = '/medstream') {
  const roleId =
    res?.data?.user?.role_id ||
    res?.data?.user?.role    ||
    res?.user?.role_id       ||
    res?.user?.role          ||
    '';
  if (!roleId) return fallback;
  return getRedirectForRole(roleId);
}

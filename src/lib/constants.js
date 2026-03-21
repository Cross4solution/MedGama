/**
 * Platform-wide constants — Single Source of Truth
 * Used by Admin, Doctor, Patient, and Clinic panels.
 *
 * Status codes are standardized across all SQL queries,
 * API responses, and frontend badge components.
 */

// ══════════════════════════════════════════════
//  MODERATION / REVIEW STATUS
// ══════════════════════════════════════════════
export const STATUS = Object.freeze({
  PENDING:  'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  HIDDEN:   'hidden',
});

export const STATUS_CODE = Object.freeze({
  [STATUS.PENDING]:  0,
  [STATUS.APPROVED]: 1,
  [STATUS.REJECTED]: 2,
  [STATUS.HIDDEN]:   3,
});

export const STATUS_LABEL = Object.freeze({
  [STATUS.PENDING]:  'Pending',
  [STATUS.APPROVED]: 'Approved',
  [STATUS.REJECTED]: 'Rejected',
  [STATUS.HIDDEN]:   'Hidden',
});

// ══════════════════════════════════════════════
//  VERIFICATION STATUS (Doctor + Clinic)
// ══════════════════════════════════════════════
export const VERIFICATION_STATUS = Object.freeze({
  PENDING:        'pending',
  PENDING_REVIEW: 'pending_review', // clinic-specific alias
  APPROVED:       'approved',
  REJECTED:       'rejected',
  UNVERIFIED:     'unverified',
  VERIFIED:       'verified',       // clinic-specific alias
});

// ══════════════════════════════════════════════
//  BADGE STYLES — consistent color mapping
// ══════════════════════════════════════════════
export const STATUS_BADGE = Object.freeze({
  [STATUS.PENDING]: {
    bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200',
    dot: 'bg-amber-400', label: 'Pending',
  },
  [STATUS.APPROVED]: {
    bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200',
    dot: 'bg-emerald-400', label: 'Approved',
  },
  [STATUS.REJECTED]: {
    bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200',
    dot: 'bg-red-400', label: 'Rejected',
  },
  [STATUS.HIDDEN]: {
    bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200',
    dot: 'bg-gray-400', label: 'Hidden',
  },
  // Aliases for clinic verification
  pending_review: {
    bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200',
    dot: 'bg-amber-400', label: 'Pending Review',
  },
  verified: {
    bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200',
    dot: 'bg-emerald-400', label: 'Verified',
  },
  unverified: {
    bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200',
    dot: 'bg-gray-400', label: 'Unverified',
  },
});

/**
 * Get badge classes for any status string.
 * Returns { bg, text, border, dot, label } or a neutral fallback.
 */
export function getStatusBadge(status) {
  return STATUS_BADGE[status] || STATUS_BADGE[STATUS.PENDING];
}

/**
 * Returns a combined Tailwind className for a status badge pill.
 */
export function statusBadgeCls(status) {
  const b = getStatusBadge(status);
  return `${b.bg} ${b.text} border ${b.border}`;
}

// ══════════════════════════════════════════════
//  DOCUMENT TYPES (Verification)
// ══════════════════════════════════════════════
export const DOCUMENT_TYPES = Object.freeze({
  diploma:                'Diploma',
  specialty_certificate:  'Specialty Certificate',
  clinic_license:         'Clinic License',
  id_card:                'ID Card',
  other:                  'Other',
});

// ══════════════════════════════════════════════
//  USER ROLES
// ══════════════════════════════════════════════
export const ROLES = Object.freeze({
  PATIENT:      'patient',
  DOCTOR:       'doctor',
  CLINIC_OWNER: 'clinicOwner',
  SUPER_ADMIN:  'superAdmin',
  SAAS_ADMIN:   'saasAdmin',
});

export const ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.SAAS_ADMIN];
export const CRM_ROLES   = [ROLES.DOCTOR, ROLES.CLINIC_OWNER, ...ADMIN_ROLES];

// ══════════════════════════════════════════════
//  MODAL CENTERING UTILITY
// ══════════════════════════════════════════════
/**
 * Returns inline style or className for modals that should be
 * centered within the right panel (offset by sidebar width).
 * Sidebar width: 16rem = 256px → center offset = 128px
 */
export const MODAL_CENTER_STYLE = {
  left: 'calc(50% + 128px)',
  transform: 'translateX(-50%)',
};

export const MODAL_CENTER_CLS = 'fixed inset-0 z-50 flex items-center justify-center lg:pl-64';

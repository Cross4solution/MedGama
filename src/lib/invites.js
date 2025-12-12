export const INVITES_STORAGE_KEY = 'medgama_invites_v1';
export const CONNECTIONS_STORAGE_KEY = 'medgama_connections_v1';

function safeJsonParse(raw, fallback) {
  try {
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function nowIso() {
  try {
    return new Date().toISOString();
  } catch {
    return '';
  }
}

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function loadInvites() {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(INVITES_STORAGE_KEY);
  const list = safeJsonParse(raw, []);
  return Array.isArray(list) ? list : [];
}

export function saveInvites(invites) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(INVITES_STORAGE_KEY, JSON.stringify(invites || []));
  try {
    window.dispatchEvent(new Event('medgama:invites-updated'));
  } catch {}
}

export function loadConnections() {
  if (typeof window === 'undefined') return { doctorToClinics: {}, clinicToDoctors: {} };
  const raw = window.localStorage.getItem(CONNECTIONS_STORAGE_KEY);
  const data = safeJsonParse(raw, { doctorToClinics: {}, clinicToDoctors: {} });
  const doctorToClinics = data?.doctorToClinics && typeof data.doctorToClinics === 'object' ? data.doctorToClinics : {};
  const clinicToDoctors = data?.clinicToDoctors && typeof data.clinicToDoctors === 'object' ? data.clinicToDoctors : {};
  return { doctorToClinics, clinicToDoctors };
}

export function saveConnections(connections) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CONNECTIONS_STORAGE_KEY, JSON.stringify(connections || { doctorToClinics: {}, clinicToDoctors: {} }));
  try {
    window.dispatchEvent(new Event('medgama:connections-updated'));
  } catch {}
}

export function getClinicsForDoctor(doctorId) {
  if (!doctorId) return [];
  const { doctorToClinics } = loadConnections();
  const list = doctorToClinics?.[doctorId];
  return Array.isArray(list) ? list : [];
}

export function getDoctorsForClinic(clinicId) {
  if (!clinicId) return [];
  const { clinicToDoctors } = loadConnections();
  const list = clinicToDoctors?.[clinicId];
  return Array.isArray(list) ? list : [];
}

function upsertConnectionList(list, entry, key = 'id') {
  const arr = Array.isArray(list) ? [...list] : [];
  const idx = arr.findIndex((x) => x && x[key] === entry[key]);
  if (idx >= 0) arr[idx] = { ...arr[idx], ...entry };
  else arr.push(entry);
  return arr;
}

export function createInvite(opts = {}) {
  const {
    fromType,
    fromId,
    fromName = '',
    fromTitle = '',
    fromAvatar = '',
    toType,
    toId,
    toName = '',
    toTitle = '',
    toAvatar = '',
    message = '',
    clinicMeta = null,
    doctorMeta = null,
  } = opts || {};
  const invites = loadInvites();

  const hasPending = invites.some(
    (i) =>
      i &&
      i.status === 'pending' &&
      i.fromType === fromType &&
      i.fromId === fromId &&
      i.toType === toType &&
      i.toId === toId
  );
  if (hasPending) return { ok: false, reason: 'already_pending' };

  const invite = {
    id: uid(),
    fromType,
    fromId,
    fromName: fromName || '',
    fromTitle: fromTitle || '',
    fromAvatar: fromAvatar || '',
    toType,
    toId,
    toName: toName || '',
    toTitle: toTitle || '',
    toAvatar: toAvatar || '',
    message: (message || '').trim(),
    status: 'pending',
    createdAt: nowIso(),
    respondedAt: null,
    clinicMeta: clinicMeta || null,
    doctorMeta: doctorMeta || null,
  };

  saveInvites([invite, ...invites]);
  return { ok: true, invite };
}

export function updateInviteStatus(inviteId, status) {
  const invites = loadInvites();
  const next = invites.map((i) => {
    if (!i || i.id !== inviteId) return i;
    return { ...i, status, respondedAt: nowIso() };
  });
  saveInvites(next);
  return next.find((i) => i && i.id === inviteId) || null;
}

export function acceptInvite(inviteId) {
  const updated = updateInviteStatus(inviteId, 'accepted');
  if (!updated) return null;

  // Establish a connection both ways
  const connections = loadConnections();

  // Identify doctor & clinic entities regardless of direction
  const doctor = updated.fromType === 'doctor'
    ? {
        id: updated.fromId,
        name: updated.fromName,
        title: updated.fromTitle,
        avatar: updated.fromAvatar,
        ...(updated.doctorMeta || {}),
      }
    : {
        id: updated.toId,
        name: updated.toName,
        title: updated.toTitle,
        avatar: updated.toAvatar,
        ...(updated.doctorMeta || {}),
      };

  const clinic = updated.fromType === 'clinic'
    ? {
        id: updated.fromId,
        name: updated.fromName,
        title: updated.fromTitle,
        avatar: updated.fromAvatar,
        ...(updated.clinicMeta || {}),
      }
    : {
        id: updated.toId,
        name: updated.toName,
        title: updated.toTitle,
        avatar: updated.toAvatar,
        ...(updated.clinicMeta || {}),
      };

  const doctorId = doctor?.id;
  const clinicId = clinic?.id;

  if (doctorId && clinicId) {
    const doctorClinics = upsertConnectionList(connections.doctorToClinics?.[doctorId], {
      id: clinicId,
      name: clinic.name || '',
      href: clinic.href || `/clinic/${clinicId}`,
    });

    const clinicDoctors = upsertConnectionList(connections.clinicToDoctors?.[clinicId], {
      id: doctorId,
      name: doctor.name || '',
      title: doctor.title || '',
      avatar: doctor.avatar || '/images/portrait-candid-male-doctor_720.jpg',
      href: doctor.href || `/doctor/${doctorId}`,
    });

    const nextConnections = {
      doctorToClinics: { ...(connections.doctorToClinics || {}), [doctorId]: doctorClinics },
      clinicToDoctors: { ...(connections.clinicToDoctors || {}), [clinicId]: clinicDoctors },
    };

    saveConnections(nextConnections);
  }

  return updated;
}

export function rejectInvite(inviteId) {
  return updateInviteStatus(inviteId, 'rejected');
}

export function cancelInvite(inviteId) {
  return updateInviteStatus(inviteId, 'cancelled');
}

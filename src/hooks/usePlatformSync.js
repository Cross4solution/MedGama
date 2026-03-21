import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { doctorProfileAPI, adminAPI } from '../lib/api';

/**
 * usePlatformSync — Real-time sync hook (polling-based).
 * 
 * Polls the backend at a configurable interval and calls back
 * when critical data changes, keeping all panels in sync:
 *   - Doctor: verification status changes (admin approved/rejected)
 *   - Admin: dashboard counts, pending alerts
 *   - Clinic: verification + verified badge status
 *
 * Usage:
 *   const { verificationStatus, refreshNow } = usePlatformSync({ interval: 30000 });
 */

const DEFAULT_INTERVAL = 30000; // 30 seconds

export function useDoctorVerificationSync({ interval = DEFAULT_INTERVAL, enabled = true } = {}) {
  const { user, updateUser } = useAuth();
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const prevVerifiedRef = useRef(user?.is_verified);

  const fetchStatus = useCallback(async () => {
    if (!enabled) return;
    const role = user?.role_id || user?.role || '';
    if (role !== 'doctor' && role !== 'clinicOwner') return;

    try {
      setLoading(true);
      const res = await doctorProfileAPI.getVerificationRequests();
      const docs = res?.verification_requests || res?.data?.verification_requests || [];
      setVerificationRequests(Array.isArray(docs) ? docs : []);

      // Check if any request was just approved → update user context
      const hasApproved = docs.some(d => d.status === 'approved');
      if (hasApproved && !prevVerifiedRef.current) {
        prevVerifiedRef.current = true;
        updateUser?.({ is_verified: true });
      }
    } catch {
      // Silent fail — network issues shouldn't break UI
    } finally {
      setLoading(false);
    }
  }, [enabled, user, updateUser]);

  useEffect(() => {
    if (!enabled) return;
    fetchStatus();
    const timer = setInterval(fetchStatus, interval);
    return () => clearInterval(timer);
  }, [fetchStatus, interval, enabled]);

  return {
    verificationRequests,
    loading,
    refreshNow: fetchStatus,
    isVerified: prevVerifiedRef.current || verificationRequests.some(d => d.status === 'approved'),
    hasPending: verificationRequests.some(d => d.status === 'pending'),
  };
}

export function useAdminDashboardSync({ interval = 60000, enabled = true } = {}) {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!enabled) return;
    try {
      setLoading(true);
      const [dashRes, vStats] = await Promise.all([
        adminAPI.dashboard().then(r => r?.data?.data || r?.data || r).catch(() => null),
        adminAPI.verificationStats().then(r => r?.data || r).catch(() => null),
      ]);

      setStats({ dashboard: dashRes, verification: vStats });

      // Build alerts
      const items = [];
      const pending = vStats?.pending || dashRes?.users?.unverified_doctors || 0;
      if (pending > 0) items.push({ id: 'vr', label: `${pending} doctor(s) awaiting verification`, severity: 'warning', path: '/admin/verification' });
      const reports = dashRes?.medstream?.pending_reports || 0;
      if (reports > 0) items.push({ id: 'rp', label: `${reports} flagged content report(s)`, severity: 'critical', path: '/admin/moderation' });
      setAlerts(items);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    fetchStats();
    const timer = setInterval(fetchStats, interval);
    return () => clearInterval(timer);
  }, [fetchStats, interval, enabled]);

  return { stats, alerts, loading, refreshNow: fetchStats };
}

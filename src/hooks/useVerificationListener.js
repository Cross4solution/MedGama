import { useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getEcho } from '../lib/echo';

/**
 * Map verification notification types to toast config.
 */
const NOTIFICATION_TOAST_MAP = {
  verification_approved: {
    type: 'success',
    title: 'Account Verified!',
    message: 'Congratulations! Your professional verification has been approved.',
    timeout: 8000,
  },
  verification_rejected: {
    type: 'error',
    title: 'Verification Rejected',
    message: 'Your verification was not approved. Please re-upload correct documents.',
    timeout: 10000,
  },
  verification_info_requested: {
    type: 'warning',
    title: 'Additional Documents Needed',
    message: 'The admin team has requested additional information.',
    timeout: 10000,
  },
};

/**
 * Real-time verification status listener hook.
 * Listens to private user channel for verification status updates.
 * Auto-updates AuthContext + shows toast notification.
 */
export function useVerificationListener() {
  const { user, fetchCurrentUser } = useAuth();
  const { notify } = useToast();

  const handleVerificationUpdate = useCallback((notification) => {
    // Refresh user context to get updated verification_status
    fetchCurrentUser();

    // Resolve toast config from notification type
    const toastCfg = NOTIFICATION_TOAST_MAP[notification.type];
    if (!toastCfg) return;

    // For info_requested, use the admin's actual message if available
    const message = notification.type === 'verification_info_requested' && notification.message
      ? notification.message
      : toastCfg.message;

    notify({
      type: toastCfg.type,
      title: toastCfg.title,
      message,
      timeout: toastCfg.timeout,
      actionUrl: notification.action_url || '/crm/settings?tab=verification',
    });
  }, [fetchCurrentUser, notify]);

  useEffect(() => {
    if (!user?.id) return;

    const echo = getEcho();
    if (!echo) return;

    const channelName = `user.${user.id}`;
    const channel = echo.private(channelName);

    channel.notification((notification) => {
      if (notification.type?.startsWith('verification_')) {
        handleVerificationUpdate(notification);
      }
    });

    return () => { echo.leave(channelName); };
  }, [user?.id, handleVerificationUpdate]);
}

export default useVerificationListener;

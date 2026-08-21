import { useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getEcho } from '../lib/echo';
import { useTranslation } from 'react-i18next';

/**
 * Map verification notification types to toast config.
 */
// Metinler ANAHTAR olarak tutuluyor; bildirim gösterilirken çevriliyor.
// Modül düzeyinde t() çağrılamaz, düz metin bırakılınca dil ayarı yok sayılıyordu.
const NOTIFICATION_TOAST_MAP = {
  verification_approved: {
    type: 'success',
    titleKey: 'verification.approvedTitle',
    messageKey: 'verification.approvedMessage',
    timeout: 8000,
  },
  verification_rejected: {
    type: 'error',
    titleKey: 'verification.rejectedTitle',
    messageKey: 'verification.rejectedMessage',
    timeout: 10000,
  },
  verification_info_requested: {
    type: 'warning',
    titleKey: 'verification.infoRequestedTitle',
    messageKey: 'verification.infoRequestedMessage',
    timeout: 10000,
  },
};

/**
 * Real-time verification status listener hook.
 * Listens to private user channel for verification status updates.
 * Auto-updates AuthContext + shows toast notification.
 */
export function useVerificationListener() {
  const { t } = useTranslation();
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
      : t(toastCfg.messageKey);

    notify({
      type: toastCfg.type,
      title: t(toastCfg.titleKey),
      message,
      timeout: toastCfg.timeout,
      actionUrl: notification.action_url || '/crm/settings?tab=verification',
    });
  }, [fetchCurrentUser, notify, t]);

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

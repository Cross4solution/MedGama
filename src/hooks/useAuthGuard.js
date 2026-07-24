import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/**
 * useAuthGuard — reusable hook that checks if user is authenticated.
 * Returns a `guardAction` wrapper: if user is logged in, runs the callback;
 * otherwise shows a toast warning ONLY (no redirect — the user stays on the
 * public page and can sign in from the header if they choose).
 *
 * Usage:
 *   const { guardAction } = useAuthGuard();
 *   <button onClick={guardAction(() => doSomething())}>Do Something</button>
 */
export default function useAuthGuard() {
  const { user, token } = useAuth();
  const { notify } = useToast();

  const guardAction = useCallback(
    (callback) => {
      return (...args) => {
        const isLoggedIn = !!(user && (token || localStorage.getItem('auth_state')));
        if (!isLoggedIn) {
          // Toast göster ama ASLA login ekranına yönlendirme — kullanıcı sayfada kalsın.
          notify({
            type: 'warning',
            message: 'Please sign in to continue.',
          });
          return;
        }
        return callback?.(...args);
      };
    },
    [user, token, notify]
  );

  const isGuest = !user;

  return { guardAction, isGuest };
}

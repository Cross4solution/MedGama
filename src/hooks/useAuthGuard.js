import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/**
 * useAuthGuard — reusable hook that checks if user is authenticated.
 * Returns a `guardAction` wrapper: if user is logged in, runs the callback;
 * otherwise shows a toast warning and redirects to /login after 1.5 seconds.
 *
 * Usage:
 *   const { guardAction } = useAuthGuard();
 *   <button onClick={guardAction(() => doSomething())}>Do Something</button>
 */
export default function useAuthGuard() {
  const { user, token } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const redirectTimerRef = useRef(null);

  const guardAction = useCallback(
    (callback) => {
      return (...args) => {
        const isLoggedIn = !!(user && (token || localStorage.getItem('auth_state')));
        if (!isLoggedIn) {
          notify({
            type: 'warning',
            message: 'Bu işlemi gerçekleştirmek için lütfen giriş yapın.',
          });
          // Clear any existing timer to avoid double redirects
          if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
          redirectTimerRef.current = setTimeout(() => {
            navigate('/login');
            redirectTimerRef.current = null;
          }, 1500);
          return;
        }
        return callback?.(...args);
      };
    },
    [user, token, notify, navigate]
  );

  const isGuest = !user;

  return { guardAction, isGuest };
}

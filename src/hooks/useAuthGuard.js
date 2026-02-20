import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/**
 * useAuthGuard — reusable hook that checks if user is authenticated.
 * Returns a `guardAction` wrapper: if user is logged in, runs the callback;
 * otherwise shows a toast and redirects to /login.
 *
 * Usage:
 *   const guardAction = useAuthGuard();
 *   <button onClick={guardAction(() => doSomething())}>Do Something</button>
 */
export default function useAuthGuard() {
  const { user, token } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const guardAction = useCallback(
    (callback) => {
      return (...args) => {
        const isLoggedIn = !!(user && (token || localStorage.getItem('auth_state')));
        if (!isLoggedIn) {
          notify({
            type: 'warning',
            message: 'Please sign in to perform this action.',
          });
          navigate('/login');
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

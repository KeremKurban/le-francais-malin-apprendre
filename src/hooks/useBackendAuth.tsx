/**
 * Ensures the current Supabase user is also registered with the FastAPI backend.
 * Stores the backend JWT in localStorage under `backend_token`.
 */
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { api } from '@/api/backendClient';

interface BackendAuthState {
  ready: boolean;
  error: string | null;
}

export function useBackendAuth(): BackendAuthState {
  const { user } = useAuth();
  const [state, setState] = useState<BackendAuthState>({ ready: false, error: null });

  useEffect(() => {
    if (!user?.email) {
      setState({ ready: false, error: null });
      return;
    }

    const existing = localStorage.getItem('backend_token');
    if (existing) {
      setState({ ready: true, error: null });
      return;
    }

    const password = `supabase-${user.id}`;

    api
      .login({ email: user.email, password })
      .then(({ access_token }) => {
        localStorage.setItem('backend_token', access_token);
        setState({ ready: true, error: null });
      })
      .catch(() => {
        // User not yet registered on backend — register first
        return api
          .register({
            email: user.email!,
            username: user.email!.split('@')[0],
            password,
            target_exam: 'DELF',
            target_level: 'B1',
          })
          .then(({ access_token }) => {
            localStorage.setItem('backend_token', access_token);
            setState({ ready: true, error: null });
          });
      })
      .catch(err => {
        setState({ ready: false, error: err.message });
      });
  }, [user]);

  // Clear backend token on sign-out
  useEffect(() => {
    if (!user) {
      localStorage.removeItem('backend_token');
      setState({ ready: false, error: null });
    }
  }, [user]);

  return state;
}

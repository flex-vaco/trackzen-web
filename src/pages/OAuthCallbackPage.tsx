import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/ui/Spinner';

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshToken } = useAuth();
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setError('No authentication token received. Please try signing in again.');
      return;
    }

    // Store token and hydrate auth context
    localStorage.setItem('accessToken', token);

    // Strip the token from the URL so it is not visible in the address bar
    window.history.replaceState({}, document.title, '/oauth/success');

    // Refresh context so user object is populated, then redirect
    refreshToken()
      .then(() => {
        navigate('/', { replace: true });
      })
      .catch(() => {
        showToast('Authentication failed. Please try again.', 'error');
        navigate('/login', { replace: true });
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-danger/10">
            <svg
              className="h-6 w-6 text-brand-danger"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Authentication Error</h2>
          <p className="mb-6 text-sm text-gray-500">{error}</p>
          <a
            href="/login"
            className="inline-block rounded-lg bg-brand-primary px-5 py-2 text-sm font-medium text-white hover:bg-brand-primary-dk"
          >
            Back to Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-bg">
      <Spinner size="lg" />
      <p className="mt-4 text-sm text-gray-500">Signing you in...</p>
    </div>
  );
}

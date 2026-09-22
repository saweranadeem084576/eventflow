import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { login, register, requestPasswordReset, resetPassword } from '../api';
import { useAuth } from '../context/AuthContext';
import { Alert, Field } from './ui';

const content = {
  login: { title: 'Welcome back', copy: 'Log in to manage your bookings.', submit: 'Log in' },
  signup: {
    title: 'Create your account',
    copy: 'Join EventFlow to book and organize events.',
    submit: 'Create account',
  },
  forgot: {
    title: 'Reset your password',
    copy: 'We will email you a secure reset link.',
    submit: 'Send reset link',
  },
  reset: {
    title: 'Choose a new password',
    copy: 'Pick something memorable and at least 8 characters.',
    submit: 'Reset password',
  },
};

export default function AuthPage({ type }) {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const copy = content[type];
  const bind = (key) => ({
    value: form[key],
    onChange: (event) => setForm({ ...form, [key]: event.target.value }),
  });

  if (user) return <Navigate to="/" replace />;

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      if (type === 'login' || type === 'signup') {
        const { name, email, password, role } = form;
        const signedIn =
          type === 'login'
            ? await login({ email, password })
            : await register({ name, email, password, role });
        setUser(signedIn);
        navigate(location.state?.from || '/', { replace: true });
      } else if (type === 'forgot') {
        await requestPasswordReset(form.email);
        setMessage('If that email exists, a reset link has been sent.');
      } else {
        await resetPassword(searchParams.get('token') || '', form.password);
        setMessage('Password reset. Redirecting to login…');
        window.setTimeout(() => navigate('/login'), 900);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="auth">
      <div className="auth-card stack">
        <Link className="brand" to="/">
          Event<span>Flow</span>
        </Link>
        <form className="card card-body stack" onSubmit={submit}>
          <div>
            <h1>{copy.title}</h1>
            <p className="muted small mt-1">{copy.copy}</p>
          </div>
          <Alert>{error}</Alert>
          <Alert tone="success">{message}</Alert>

          {type === 'signup' && (
            <>
              <Field label="Full name">
                <input className="input" autoComplete="name" {...bind('name')} required />
              </Field>
              <Field label="I want to">
                <select className="input" {...bind('role')}>
                  <option value="user">Attend events</option>
                  <option value="organizer">Organize events</option>
                </select>
              </Field>
            </>
          )}
          {type !== 'reset' && (
            <Field label="Email">
              <input
                className="input"
                type="email"
                autoComplete="email"
                {...bind('email')}
                required
              />
            </Field>
          )}
          {type !== 'forgot' && (
            <Field label={type === 'login' ? 'Password' : 'New password'}>
              <input
                className="input"
                type="password"
                autoComplete={type === 'login' ? 'current-password' : 'new-password'}
                minLength="8"
                {...bind('password')}
                required
              />
            </Field>
          )}
          <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
            {saving ? 'Please wait…' : copy.submit}
          </button>
        </form>
        <div className="auth-links">
          {type === 'login' ? (
            <>
              <Link className="btn-link" to="/signup">
                Create an account
              </Link>
              <Link className="btn-link" to="/forgot-password">
                Forgot password?
              </Link>
            </>
          ) : (
            <Link className="btn-link" to="/login">
              Back to login
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

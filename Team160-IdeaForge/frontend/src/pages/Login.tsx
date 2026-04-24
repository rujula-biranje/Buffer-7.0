import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/menu');
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100">
      <div className="card w-full max-w-md">
        <div className="mb-4 flex justify-center">
          <div className="relative h-28 w-28">
            <span
              aria-hidden
              className="pointer-events-none absolute left-[32px] top-3 block h-6 w-2 rounded-full bg-slate-400/60 blur-[2px] animate-steam"
              style={{ animationDelay: '0s' }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute left-[52px] top-2 block h-7 w-2 rounded-full bg-slate-400/60 blur-[2px] animate-steam"
              style={{ animationDelay: '0.6s' }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute left-[72px] top-3 block h-6 w-2 rounded-full bg-slate-400/60 blur-[2px] animate-steam"
              style={{ animationDelay: '1.2s' }}
            />
            <div className="absolute inset-0 flex items-end justify-center">
              <img
                src="/images/cup-saucer.jpeg"
                alt="Cafe Suswaad Veg"
                className="block h-24 w-24 animate-cup-float object-contain"
              />
            </div>
          </div>
        </div>
        <h1 className="mb-1 text-center text-2xl font-bold text-brand-700">
          Cafe Suswaad Veg
        </h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          Sign in to place orders.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {err && (
            <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
              {err}
            </p>
          )}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          New here?{' '}
          <Link to="/signup" className="font-medium text-brand-600 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

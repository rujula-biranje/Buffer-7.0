import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await signup(email, password, fullName);
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
        <h1 className="mb-2 text-2xl font-bold text-brand-700">
          Create account
        </h1>
        <p className="mb-6 text-sm text-slate-500">
          Regular users sign up here. VIP accounts are created by admins.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
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
              minLength={6}
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
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          Already registered?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

import { FormEvent, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Role, User } from '../types';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  async function load() {
    const res = await api.get<{ users: User[] }>('/admin/users');
    setUsers(res.users);
    setLoading(false);
  }

  useEffect(() => {
    load().catch((e) => alert((e as Error).message));
  }, []);

  async function createVip(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post('/admin/users/vip', {
        email,
        password,
        full_name: fullName || undefined,
      });
      setEmail(''); setPassword(''); setFullName('');
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function setRole(id: string, role: Role) {
    try {
      await api.patch(`/admin/users/${id}/role`, { role });
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Users</h1>

      <form onSubmit={createVip} className="card grid grid-cols-1 gap-3 md:grid-cols-4">
        <h2 className="font-semibold md:col-span-4">Create VIP user</h2>
        <input className="input" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <input className="input" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input" placeholder="Temp password (min 6)" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" className="btn-primary">Create VIP</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="py-2">Name</th>
              <th>Email</th>
              <th>Role</th>
              <th className="text-right">Set role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="py-2">{u.full_name ?? '—'}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge ${
                    u.role === 'admin' ? 'bg-red-100 text-red-700' :
                    u.role === 'vip' ? 'bg-purple-100 text-purple-700' :
                    'bg-slate-200 text-slate-700'
                  }`}>{u.role}</span>
                </td>
                <td className="py-2 text-right">
                  <div className="inline-flex gap-1">
                    <button className="btn-secondary px-2 py-1" onClick={() => setRole(u.id, 'user')}>user</button>
                    <button className="btn-secondary px-2 py-1" onClick={() => setRole(u.id, 'vip')}>vip</button>
                    <button className="btn-secondary px-2 py-1" onClick={() => setRole(u.id, 'admin')}>admin</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Poll } from '../types';

export default function Polls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      const res = await api.get<{ polls: Poll[] }>('/polls');
      setPolls(res.polls);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function vote(pollId: string, optionId: string) {
    try {
      await api.post(`/polls/${pollId}/vote`, { option_id: optionId });
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;
  if (err) return <p className="text-red-600">{err}</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Polls</h1>
      {polls.length === 0 && (
        <p className="text-slate-500">No polls yet.</p>
      )}
      {polls.map((p) => {
        const totalVotes =
          p.options.reduce((s, o) => s + (o.votes ?? 0), 0) || 0;
        return (
          <div key={p.id} className="card">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{p.question}</h3>
              <span
                className={`badge ${
                  p.status === 'open'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {p.status}
              </span>
            </div>
            {p.item && (
              <p className="mt-1 text-sm text-slate-500">
                About: {p.item.name}{' '}
                {p.item.is_available
                  ? `(${p.item.quantity} left)`
                  : '(not available)'}
              </p>
            )}
            <div className="mt-3 space-y-2">
              {p.options.map((o) => {
                const pct = totalVotes
                  ? Math.round(((o.votes ?? 0) / totalVotes) * 100)
                  : 0;
                return (
                  <button
                    key={o.id}
                    disabled={p.status !== 'open'}
                    onClick={() => vote(p.id, o.id)}
                    className="block w-full rounded border border-slate-200 p-2 text-left hover:bg-slate-50 disabled:opacity-70"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span>{o.label}</span>
                      <span className="text-slate-600">
                        {o.votes ?? 0} ({pct}%)
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded bg-slate-100">
                      <div
                        className="h-2 rounded bg-brand-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

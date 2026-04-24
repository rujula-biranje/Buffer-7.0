import { FormEvent, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Item, Poll } from '../types';

export default function AdminPolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const [question, setQuestion] = useState('');
  const [itemId, setItemId] = useState('');
  const [optionsText, setOptionsText] = useState('Yes\nNo');

  async function load() {
    const [p, it] = await Promise.all([
      api.get<{ polls: Poll[] }>('/polls'),
      api.get<{ items: Item[] }>('/items'),
    ]);
    setPolls(p.polls);
    setItems(it.items);
    setLoading(false);
  }

  useEffect(() => {
    load().catch((e) => alert((e as Error).message));
  }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    const options = optionsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (options.length < 2) return alert('Need at least 2 options');
    try {
      await api.post('/polls', {
        question,
        item_id: itemId || undefined,
        options,
      });
      setQuestion('');
      setItemId('');
      setOptionsText('Yes\nNo');
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function close(id: string) {
    try {
      await api.post(`/polls/${id}/close`);
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Polls</h1>

      <form onSubmit={create} className="card space-y-3">
        <h2 className="font-semibold">Create poll</h2>
        <div>
          <label className="label">Question</label>
          <input className="input" value={question} onChange={(e) => setQuestion(e.target.value)} required />
        </div>
        <div>
          <label className="label">Related item (optional)</label>
          <select
            className="input"
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
          >
            <option value="">— none —</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({i.is_available && i.quantity > 0 ? 'available' : 'unavailable'})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Options (one per line)</label>
          <textarea
            className="input min-h-[90px]"
            value={optionsText}
            onChange={(e) => setOptionsText(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary">Create poll</button>
      </form>

      <div className="space-y-3">
        {polls.map((p) => (
          <div key={p.id} className="card">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{p.question}</h3>
              <span className={`badge ${p.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>
                {p.status}
              </span>
            </div>
            {p.item && (
              <p className="mt-1 text-sm text-slate-500">
                About: {p.item.name}
              </p>
            )}
            <ul className="mt-2 text-sm text-slate-700">
              {p.options.map((o) => (
                <li key={o.id}>
                  {o.label} — {o.votes ?? 0} votes
                </li>
              ))}
            </ul>
            {p.status === 'open' && (
              <div className="mt-3 flex justify-end">
                <button className="btn-danger" onClick={() => close(p.id)}>Close poll</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

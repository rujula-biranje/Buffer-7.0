import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Order, OrderStatus } from '../types';

export default function AdminOrders() {
  const [queue, setQueue] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      const res = await api.get<{ queue: Order[] }>('/orders/queue');
      setQueue(res.queue);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  async function setStatus(id: string, status: OrderStatus) {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function dequeueNext() {
    try {
      await api.post('/orders/dequeue-next');
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;
  if (err) return <p className="text-red-600">{err}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Order Queue (FIFO)</h1>
        <button className="btn-primary" onClick={dequeueNext} disabled={queue.length === 0}>
          Deliver head of queue
        </button>
      </div>

      {queue.length === 0 ? (
        <p className="text-slate-500">Queue is empty.</p>
      ) : (
        <div className="space-y-3">
          {queue.map((o) => (
            <div key={o.id} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Position #{o.queue_position} · ETA ~{o.eta_minutes ?? '?'} min
                  </p>
                  <p className="font-semibold">
                    {o.user?.full_name ?? o.user?.email} · ₹
                    {Number(o.total_price).toFixed(2)}
                  </p>
                  <p className="text-sm text-slate-500">
                    Placed at {new Date(o.placed_at).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {o.is_vip && (
                    <span className="badge bg-purple-100 text-purple-700">VIP</span>
                  )}
                  <span className="badge bg-amber-100 text-amber-800">{o.status}</span>
                </div>
              </div>

              <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                {(o.order_items ?? []).map((li) => (
                  <li key={li.id}>
                    {li.item?.name ?? li.item_id} × {li.quantity}
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex justify-end gap-2">
                {o.status === 'pending' && (
                  <button className="btn-secondary" onClick={() => setStatus(o.id, 'preparing')}>
                    Start preparing
                  </button>
                )}
                {o.status !== 'ready' && (
                  <button className="btn-secondary" onClick={() => setStatus(o.id, 'ready')}>
                    Mark ready
                  </button>
                )}
                <button className="btn-primary" onClick={() => setStatus(o.id, 'delivered')}>
                  Mark delivered
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

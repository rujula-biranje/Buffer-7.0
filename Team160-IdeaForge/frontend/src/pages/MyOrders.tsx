import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Order } from '../types';

const CANCEL_WINDOW_SECONDS = 60;

function statusColor(s: Order['status']) {
  switch (s) {
    case 'pending': return 'bg-amber-100 text-amber-800';
    case 'preparing': return 'bg-blue-100 text-blue-800';
    case 'ready': return 'bg-green-100 text-green-800';
    case 'delivered': return 'bg-slate-200 text-slate-700';
    case 'cancelled': return 'bg-red-100 text-red-700';
  }
}

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  async function load() {
    try {
      const res = await api.get<{ orders: Order[] }>('/orders/my');
      setOrders(res.orders);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(() => setNow(Date.now()), 1000);
    const r = setInterval(load, 10_000);
    return () => {
      clearInterval(t);
      clearInterval(r);
    };
  }, []);

  async function cancel(id: string) {
    if (!confirm('Cancel this order?')) return;
    try {
      await api.del(`/orders/${id}`);
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;
  if (err) return <p className="text-red-600">{err}</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Orders</h1>
      {orders.length === 0 && (
        <p className="text-slate-500">You haven't placed any orders yet.</p>
      )}
      {orders.map((o) => {
        const placedMs = new Date(o.placed_at).getTime();
        const cancelSecsLeft = Math.max(
          0,
          Math.ceil((placedMs + CANCEL_WINDOW_SECONDS * 1000 - now) / 1000)
        );
        const canCancel = o.status === 'pending' && cancelSecsLeft > 0;

        return (
          <div key={o.id} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  #{o.id.slice(0, 8)} · {new Date(o.placed_at).toLocaleString()}
                </p>
                <p className="text-lg font-semibold">
                  ₹{Number(o.total_price).toFixed(2)}
                </p>
              </div>
              <span className={`badge ${statusColor(o.status)}`}>{o.status}</span>
            </div>

            <ul className="mt-3 list-disc pl-5 text-sm text-slate-700">
              {(o.order_items ?? []).map((li) => (
                <li key={li.id}>
                  {li.item?.name ?? li.item_id} × {li.quantity} (₹
                  {Number(li.price_at_order).toFixed(2)})
                </li>
              ))}
            </ul>

            {(o.status === 'pending' || o.status === 'preparing') && (
              <div className="mt-3 rounded bg-slate-50 p-3 text-sm">
                <p>
                  Queue position:{' '}
                  <span className="font-semibold">
                    {o.queue_position ?? '–'}
                  </span>
                </p>
                <p>
                  ETA:{' '}
                  <span className="font-semibold">
                    {o.eta_minutes != null ? `~${o.eta_minutes} min` : '–'}
                  </span>
                </p>
                {o.estimated_ready_at && (
                  <p>
                    Ready around:{' '}
                    <span className="font-semibold">
                      {new Date(o.estimated_ready_at).toLocaleTimeString()}
                    </span>
                  </p>
                )}
              </div>
            )}

            {canCancel && (
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm text-amber-700">
                  Cancel window: {cancelSecsLeft}s left
                </p>
                <button className="btn-danger" onClick={() => cancel(o.id)}>
                  Cancel order
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { api } from '../lib/api';
import type { Order } from '../types';

export default function Cart() {
  const { lines, total, update, remove, clear } = useCart();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function placeOrder() {
    setPlacing(true);
    setErr(null);
    try {
      const res = await api.post<{
        order: Order;
        queue_position: number;
        eta_minutes: number;
        cancellation_deadline_seconds: number;
      }>('/orders', {
        items: lines.map((l) => ({
          item_id: l.item.id,
          quantity: l.quantity,
        })),
      });
      clear();
      alert(
        `Order placed!\nQueue position: ${res.queue_position}\nETA: ~${res.eta_minutes} min\nYou can cancel within ${res.cancellation_deadline_seconds}s.`
      );
      navigate('/orders');
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cart</h1>
      {lines.length === 0 ? (
        <p className="text-slate-500">Cart is empty. Go pick something tasty.</p>
      ) : (
        <>
          <div className="card divide-y divide-slate-100">
            {lines.map((l) => (
              <div key={l.item.id} className="flex items-center py-3">
                <div className="flex-1">
                  <p className="font-medium">{l.item.name}</p>
                  <p className="text-sm text-slate-500">
                    ₹{Number(l.item.price).toFixed(2)} each · ~
                    {l.item.prep_time_minutes} min
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="btn-secondary px-2 py-1"
                    onClick={() => update(l.item.id, l.quantity - 1)}
                  >
                    −
                  </button>
                  <span className="w-8 text-center">{l.quantity}</span>
                  <button
                    className="btn-secondary px-2 py-1"
                    onClick={() => update(l.item.id, l.quantity + 1)}
                    disabled={l.quantity >= l.item.quantity}
                  >
                    +
                  </button>
                  <button
                    className="ml-3 text-sm text-red-600 hover:underline"
                    onClick={() => remove(l.item.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="card flex items-center justify-between">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-xl font-bold text-brand-700">
              ₹{total.toFixed(2)}
            </span>
          </div>

          {err && (
            <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
              {err}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={clear}>
              Clear
            </button>
            <button
              className="btn-primary"
              onClick={placeOrder}
              disabled={placing}
            >
              {placing ? 'Placing…' : 'Place order'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import type { Item } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { canOrder, canSeeInventory } from '../lib/permissions';

function fallbackImage(name: string) {
  const text = encodeURIComponent(name);
  return `https://placehold.co/600x400/fed7aa/9a3412/png?text=${text}`;
}

export default function Menu() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const { add, count, flyToCart } = useCart();
  const { user } = useAuth();

  const canSeeQuantity = canSeeInventory(user);
  const allowOrder = canOrder(user);

  useEffect(() => {
    api
      .get<{ items: Item[] }>('/items')
      .then((res) => setItems(res.items))
      .catch((e) => setErr((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-500">Loading menu…</p>;
  if (err) return <p className="text-red-600">{err}</p>;

  const available = items.filter((i) => i.is_available && i.quantity > 0);
  const unavailable = items.filter((i) => !i.is_available || i.quantity === 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Today's Menu</h1>
        {allowOrder && (
          <span className="text-sm text-slate-600">Cart items: {count}</span>
        )}
      </div>

      <Section title="Available" count={available.length}>
        {available.length === 0 ? (
          <p className="text-slate-500">Nothing available right now.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {available.map((it) => (
              <ItemCard
                key={it.id}
                item={it}
                canSeeQuantity={canSeeQuantity}
                onAdd={
                  allowOrder
                    ? (imgEl) => {
                        if (imgEl) {
                          flyToCart(imgEl.src, imgEl.getBoundingClientRect());
                        }
                        add(it, 1);
                      }
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </Section>

      <Section title="Not Available" count={unavailable.length}>
        {unavailable.length === 0 ? (
          <p className="text-slate-500">Everything is in stock right now.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {unavailable.map((it) => (
              <ItemCard
                key={it.id}
                item={it}
                canSeeQuantity={canSeeQuantity}
                disabled
              />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-800">
        {title}
        <span className="badge bg-slate-200 text-slate-700">{count}</span>
      </h2>
      {children}
    </section>
  );
}

function ItemCard({
  item,
  onAdd,
  disabled,
  canSeeQuantity,
}: {
  item: Item;
  onAdd?: (imgEl: HTMLImageElement | null) => void;
  disabled?: boolean;
  canSeeQuantity: boolean;
}) {
  const imgSrc = item.image_url ?? fallbackImage(item.name);
  const imgRef = useRef<HTMLImageElement>(null);
  return (
    <div
      className={`card overflow-hidden p-0 ${disabled ? 'opacity-60' : ''}`}
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <img
          ref={imgRef}
          src={imgSrc}
          alt={item.name}
          loading="lazy"
          className="h-full w-full object-cover object-center"
          onError={(e) => {
            const el = e.currentTarget;
            if (el.src !== fallbackImage(item.name)) {
              el.src = fallbackImage(item.name);
            }
          }}
        />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold">{item.name}</h3>
          <span className="font-bold text-brand-700">
            ₹{Number(item.price).toFixed(2)}
          </span>
        </div>
        {item.description && (
          <p className="mt-1 text-sm text-slate-500">{item.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
          {canSeeQuantity ? (
            <span>Qty left: {item.quantity}</span>
          ) : (
            <span />
          )}
          <span>~{item.prep_time_minutes} min</span>
        </div>
        <div className="mt-4">
          {disabled ? (
            <span className="badge bg-slate-200 text-slate-600">Unavailable</span>
          ) : onAdd ? (
            <button
              className="btn-primary w-full"
              onClick={() => onAdd(imgRef.current)}
            >
              Add to cart
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

import { FormEvent, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Item } from '../types';

function fallbackImage(name: string) {
  return `https://placehold.co/120x80/fed7aa/9a3412/png?text=${encodeURIComponent(
    name
  )}`;
}

export default function AdminItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [prep, setPrep] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  async function load() {
    try {
      const res = await api.get<{ items: Item[] }>('/items');
      setItems(res.items);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post('/items', {
        name,
        description: description || undefined,
        price: Number(price),
        quantity: Number(quantity),
        prep_time_minutes: Number(prep),
        image_url: imageUrl || null,
      });
      setName('');
      setDescription('');
      setPrice('');
      setQuantity('');
      setPrep('');
      setImageUrl('');
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function restock(id: string, delta: number) {
    try {
      await api.post(`/items/${id}/restock`, { quantity_delta: delta });
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function toggleAvailable(it: Item) {
    try {
      await api.patch(`/items/${it.id}`, { is_available: !it.is_available });
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function updateImage(it: Item) {
    const next = prompt('New image URL:', it.image_url ?? '');
    if (next === null) return;
    try {
      await api.patch(`/items/${it.id}`, { image_url: next || null });
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete item?')) return;
    try {
      await api.del(`/items/${id}`);
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;
  if (err) return <p className="text-red-600">{err}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Items</h1>

      <form
        onSubmit={create}
        className="card grid grid-cols-1 gap-3 md:grid-cols-6"
      >
        <input
          className="input md:col-span-2"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="input md:col-span-2"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          className="input"
          placeholder="Price"
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
        <input
          className="input"
          placeholder="Qty"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />
        <input
          className="input"
          placeholder="Prep (min)"
          type="number"
          value={prep}
          onChange={(e) => setPrep(e.target.value)}
          required
        />
        <input
          className="input md:col-span-5"
          placeholder="Image URL or /images/file.jpg (optional)"
          type="text"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
        <button type="submit" className="btn-primary md:col-span-6">
          Add item
        </button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="py-2">Image</th>
              <th>Name</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Prep</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b last:border-0 align-middle">
                <td className="py-2">
                  <img
                    src={it.image_url ?? fallbackImage(it.name)}
                    alt={it.name}
                    className="h-12 w-16 rounded object-cover"
                    onError={(e) => {
                      const el = e.currentTarget;
                      if (el.src !== fallbackImage(it.name))
                        el.src = fallbackImage(it.name);
                    }}
                  />
                </td>
                <td>{it.name}</td>
                <td>₹{Number(it.price).toFixed(2)}</td>
                <td>{it.quantity}</td>
                <td>{it.prep_time_minutes} min</td>
                <td>
                  <span
                    className={`badge ${
                      it.is_available && it.quantity > 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {it.is_available && it.quantity > 0
                      ? 'Available'
                      : 'Unavailable'}
                  </span>
                </td>
                <td className="py-2 text-right">
                  <div className="inline-flex flex-wrap justify-end gap-2">
                    <button
                      className="btn-secondary px-2 py-1"
                      onClick={() => restock(it.id, 10)}
                    >
                      +10
                    </button>
                    <button
                      className="btn-secondary px-2 py-1"
                      onClick={() => restock(it.id, -10)}
                    >
                      -10
                    </button>
                    <button
                      className="btn-secondary px-2 py-1"
                      onClick={() => toggleAvailable(it)}
                    >
                      {it.is_available ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      className="btn-secondary px-2 py-1"
                      onClick={() => updateImage(it)}
                    >
                      Image
                    </button>
                    <button
                      className="btn-danger px-2 py-1"
                      onClick={() => remove(it.id)}
                    >
                      Delete
                    </button>
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

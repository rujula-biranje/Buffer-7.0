import { Link } from 'react-router-dom';

const tiles: { to: string; title: string; desc: string }[] = [
  { to: '/admin/items', title: 'Items', desc: 'Add, update, restock dishes' },
  { to: '/admin/orders', title: 'Orders (FIFO Queue)', desc: 'View queue, advance, deliver' },
  { to: '/admin/polls', title: 'Polls', desc: 'Create polls based on user requests' },
  { to: '/admin/users', title: 'Users', desc: 'Promote VIPs, manage roles' },
];

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Admin</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {tiles.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="card transition hover:shadow-md"
          >
            <h3 className="font-semibold text-brand-700">{t.title}</h3>
            <p className="text-sm text-slate-500">{t.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CART_FLY_TARGET_ID, useCart } from '../context/CartContext';
import { canOrder } from '../lib/permissions';

function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
      />
    </svg>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const allowOrder = canOrder(user);

  const [bump, setBump] = useState(false);
  const prevCount = useRef(count);
  useEffect(() => {
    if (count > prevCount.current) {
      setBump(true);
      const t = window.setTimeout(() => setBump(false), 500);
      prevCount.current = count;
      return () => window.clearTimeout(t);
    }
    prevCount.current = count;
  }, [count]);

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium ${
      isActive
        ? 'bg-brand-100 text-brand-700'
        : 'text-slate-700 hover:bg-slate-100'
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-bold text-brand-700"
          >
            <img
              src="/images/cup-saucer.jpeg"
              alt=""
              className="h-9 w-9 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            Cafe Suswaad Veg
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink to="/menu" className={linkCls}>Menu</NavLink>
            {allowOrder && (
              <>
                <NavLink
                  to="/cart"
                  className={({ isActive }) =>
                    `relative flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                      isActive
                        ? 'bg-brand-100 text-brand-700'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`
                  }
                  aria-label={`Cart (${count})`}
                >
                  <span
                    id={CART_FLY_TARGET_ID}
                    className={`relative inline-flex ${bump ? 'animate-cart-wiggle' : ''}`}
                  >
                    <CartIcon className="h-6 w-6" />
                    {count > 0 && (
                      <span
                        className={`absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-bold text-white ${
                          bump ? 'animate-badge-bump' : ''
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </span>
                </NavLink>
                <NavLink to="/orders" className={linkCls}>My Orders</NavLink>
              </>
            )}
            <NavLink to="/polls" className={linkCls}>Polls</NavLink>
            {user?.role === 'admin' && (
              <NavLink to="/admin" className={linkCls}>Admin</NavLink>
            )}
          </nav>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-slate-600">
                {user.full_name ?? user.email}{' '}
                <span className="badge bg-slate-200 text-slate-700 ml-1">
                  {user.role}
                </span>
              </span>
            )}
            <button
              className="btn-secondary"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

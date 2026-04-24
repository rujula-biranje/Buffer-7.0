import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  CSSProperties,
  ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import type { CartLine, Item } from '../types';

export const CART_FLY_TARGET_ID = 'cart-fly-target';

interface Flight {
  id: string;
  imageSrc: string;
  from: { top: number; left: number; width: number; height: number };
}

interface CartState {
  lines: CartLine[];
  add: (item: Item, qty?: number) => void;
  update: (itemId: string, qty: number) => void;
  remove: (itemId: string) => void;
  clear: () => void;
  total: number;
  count: number;
  flyToCart: (imageSrc: string, from: DOMRect) => void;
}

const CartContext = createContext<CartState | null>(null);

function FlyingImage({
  flight,
  onDone,
}: {
  flight: Flight;
  onDone: () => void;
}) {
  const [style, setStyle] = useState<CSSProperties>({
    position: 'fixed',
    top: flight.from.top,
    left: flight.from.left,
    width: flight.from.width,
    height: flight.from.height,
    transition: 'all 700ms cubic-bezier(0.22, 1, 0.36, 1)',
    zIndex: 60,
    pointerEvents: 'none',
    borderRadius: 12,
    opacity: 1,
    objectFit: 'cover',
    boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
  });

  useEffect(() => {
    const target = document.getElementById(CART_FLY_TARGET_ID);
    if (!target) {
      onDone();
      return;
    }
    const to = target.getBoundingClientRect();
    const raf = requestAnimationFrame(() => {
      setStyle((s) => ({
        ...s,
        top: to.top + to.height / 2 - 14,
        left: to.left + to.width / 2 - 14,
        width: 28,
        height: 28,
        opacity: 0.25,
        transform: 'rotate(25deg)',
      }));
    });
    const t = window.setTimeout(onDone, 720);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [onDone]);

  return <img src={flight.imageSrc} alt="" style={style} />;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [flights, setFlights] = useState<Flight[]>([]);

  function add(item: Item, qty = 1) {
    setLines((cur) => {
      const existing = cur.find((l) => l.item.id === item.id);
      if (existing) {
        return cur.map((l) =>
          l.item.id === item.id ? { ...l, quantity: l.quantity + qty } : l
        );
      }
      return [...cur, { item, quantity: qty }];
    });
  }
  function update(itemId: string, qty: number) {
    if (qty <= 0) return remove(itemId);
    setLines((cur) =>
      cur.map((l) => (l.item.id === itemId ? { ...l, quantity: qty } : l))
    );
  }
  function remove(itemId: string) {
    setLines((cur) => cur.filter((l) => l.item.id !== itemId));
  }
  function clear() {
    setLines([]);
  }

  const total = useMemo(
    () =>
      Math.round(
        lines.reduce((s, l) => s + Number(l.item.price) * l.quantity, 0) * 100
      ) / 100,
    [lines]
  );
  const count = useMemo(
    () => lines.reduce((s, l) => s + l.quantity, 0),
    [lines]
  );

  const flyToCart = useCallback((imageSrc: string, from: DOMRect) => {
    const id = Math.random().toString(36).slice(2);
    setFlights((fs) => [
      ...fs,
      {
        id,
        imageSrc,
        from: {
          top: from.top,
          left: from.left,
          width: from.width,
          height: from.height,
        },
      },
    ]);
  }, []);

  const removeFlight = useCallback((id: string) => {
    setFlights((fs) => fs.filter((f) => f.id !== id));
  }, []);

  return (
    <CartContext.Provider
      value={{ lines, add, update, remove, clear, total, count, flyToCart }}
    >
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <>
            {flights.map((f) => (
              <FlyingImage
                key={f.id}
                flight={f}
                onDone={() => removeFlight(f.id)}
              />
            ))}
          </>,
          document.body
        )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart outside CartProvider');
  return ctx;
}

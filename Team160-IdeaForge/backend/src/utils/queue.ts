import type { Order, OrderItem, Item } from '../types.js';

export interface QueueEntry {
  order: Order;
  prepMinutes: number;
}

/**
 * FIFO queue of active orders. The DSA core of this project.
 * Orders keep their enqueue order (placed_at). `peek` returns the head,
 * `dequeue` removes and returns it, `positionOf(id)` gives the 1-based rank.
 * ETA for an order = sum of prep times of all orders ahead + its own prep time.
 */
export class OrderQueue {
  private entries: QueueEntry[];

  constructor(entries: QueueEntry[]) {
    this.entries = [...entries].sort(
      (a, b) =>
        new Date(a.order.placed_at).getTime() -
        new Date(b.order.placed_at).getTime()
    );
  }

  size(): number {
    return this.entries.length;
  }

  peek(): QueueEntry | null {
    return this.entries[0] ?? null;
  }

  dequeue(): QueueEntry | null {
    return this.entries.shift() ?? null;
  }

  enqueue(entry: QueueEntry): void {
    this.entries.push(entry);
  }

  positionOf(orderId: string): number {
    const idx = this.entries.findIndex((e) => e.order.id === orderId);
    return idx < 0 ? -1 : idx + 1;
  }

  /** Minutes until the given order is ready, computed from queue head. */
  etaMinutesFor(orderId: string): number | null {
    let waited = 0;
    for (const e of this.entries) {
      if (e.order.id === orderId) return waited + e.prepMinutes;
      waited += e.prepMinutes;
    }
    return null;
  }

  toArray(): QueueEntry[] {
    return [...this.entries];
  }
}

/**
 * Prep time for an order = max prep_time of its items (cooked in parallel),
 * scaled slightly by total item count so larger orders take a bit longer.
 */
export function computeOrderPrepMinutes(
  orderItems: (OrderItem & { item: Pick<Item, 'prep_time_minutes'> })[]
): number {
  if (orderItems.length === 0) return 0;
  const maxPrep = Math.max(
    ...orderItems.map((oi) => oi.item.prep_time_minutes)
  );
  const totalQty = orderItems.reduce((s, oi) => s + oi.quantity, 0);
  const loadFactor = 1 + Math.max(0, totalQty - 1) * 0.1;
  return Math.ceil(maxPrep * loadFactor);
}

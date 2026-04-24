export type Role = 'user' | 'vip' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  created_at: string;
}

export interface Item {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  prep_time_minutes: number;
  is_available: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export interface OrderLine {
  id: string;
  order_id: string;
  item_id: string;
  quantity: number;
  price_at_order: number;
  item?: Item;
}

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_price: number;
  placed_at: string;
  cancellation_deadline: string;
  ready_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  estimated_ready_at: string | null;
  is_vip: boolean;
  order_items?: OrderLine[];
  queue_position?: number | null;
  eta_minutes?: number | null;
  user?: { id: string; email: string; full_name: string | null; role: Role };
}

export interface PollOption {
  id: string;
  poll_id: string;
  label: string;
  votes?: number;
}

export interface Poll {
  id: string;
  question: string;
  item_id: string | null;
  status: 'open' | 'closed';
  created_at: string;
  closed_at: string | null;
  options: PollOption[];
  item?: { id: string; name: string; is_available: boolean; quantity: number } | null;
}

export interface CartLine {
  item: Item;
  quantity: number;
}

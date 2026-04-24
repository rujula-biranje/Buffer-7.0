export type Role = 'user' | 'vip' | 'admin';

export interface Profile {
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
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_id: string;
  quantity: number;
  price_at_order: number;
}

export interface OrderWithItems extends Order {
  items: (OrderItem & { item: Item })[];
  queue_position?: number;
}

export interface Artwork {
  id: number;
  title: string;
  artist_name: string;
  category_name: string;
  price: string;
  status: string;
  view_count: number;
  primary_image: string | null;
  created_at: string;
  description?: string;
  medium?: string;
  dimensions?: string;
  avg_rating?: number | null;
  review_count?: number;
  is_favorited?: boolean;
}

export interface Event {
  id: number;
  title: string;
  event_type: string;
  category_name: string;
  location: string;
  start_datetime: string;
  end_datetime: string;
  capacity: number;
  available_slots: number;
  occupancy_rate: number;
  price: string;
  status: string;
  image: string | null;
  description?: string;
  avg_rating?: number | null;
  review_count?: number;
  total_reservations?: number;
}

export interface Reservation {
  id: number;
  event: number;
  event_title: string;
  event_date: string;
  event_location: string;
  participant_count: number;
  status: string;
  notes: string;
  total_price: string;
  reserved_at: string;
}

export interface Order {
  id: number;
  status: string;
  payment_method: string;
  total_amount: string;
  discount_amount: string;
  created_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  artwork: number;
  artwork_detail: Artwork;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface Review {
  id: number;
  user: number;
  user_name: string;
  rating: number;
  comment: string;
  is_verified_purchase?: boolean;
  helpful_count: number;
  reply?: { reply_text: string; replied_by_name: string } | null;
  user_vote?: string | null;
  created_at: string;
}

export interface SupportTicket {
  id: number;
  subject: string;
  category: string;
  status: string;
  created_at: string;
  messages?: SupportMessage[];
}

export interface SupportMessage {
  id: number;
  sender_name: string;
  message: string;
  is_staff_reply: boolean;
  created_at: string;
}

export interface Campaign {
  id: number;
  name: string;
  description: string;
  discount_type: string;
  discount_rate: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

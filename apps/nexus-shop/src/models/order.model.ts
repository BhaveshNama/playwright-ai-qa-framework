import type { CartItem } from './cart.model';
import type { CheckoutAddress } from './checkout.model';

export type OrderStatus = 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface Order {
  id: string;
  items: CartItem[];
  totalInCents: number;
  shippingAddress: CheckoutAddress;
  status: OrderStatus;
  createdAt: string;
}

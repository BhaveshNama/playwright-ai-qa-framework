import type { CartItem } from './cart.model';

export interface CheckoutAddress {
  fullName: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CheckoutSummary {
  items: CartItem[];
  totalInCents: number;
  shippingAddress: CheckoutAddress;
}

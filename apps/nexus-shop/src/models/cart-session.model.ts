import type { CartItem } from './cart.model';

/*
 * Represents the mutable server-side state for one isolated cart.
 *
 * Each browser or API client will eventually receive a unique cart identifier,
 * preventing parallel test executions from modifying the same cart.
 */
export interface CartSession {
  id: string;
  items: CartItem[];
}

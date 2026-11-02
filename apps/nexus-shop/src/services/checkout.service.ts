import type { CheckoutAddress, CheckoutSummary } from '../models/checkout.model';
import { cartService } from './cart.service';

export type CheckoutResult =
  | {
      success: true;
      summary: CheckoutSummary;
    }
  | {
      success: false;
      reason: 'EMPTY_CART' | 'INVALID_ADDRESS';
    };

export class CheckoutService {
  prepareCheckout(cartId: string, shippingAddress: CheckoutAddress): CheckoutResult {
    const cart = cartService.getCart(cartId);

    if (cart.items.length === 0) {
      return {
        success: false,
        reason: 'EMPTY_CART',
      };
    }

    if (!this.isValidAddress(shippingAddress)) {
      return {
        success: false,
        reason: 'INVALID_ADDRESS',
      };
    }

    return {
      success: true,
      summary: {
        items: cart.items,
        totalInCents: cart.totalInCents,
        shippingAddress: {
          ...shippingAddress,
        },
      },
    };
  }

  private isValidAddress(address: CheckoutAddress): boolean {
    return [
      address.fullName,
      address.addressLine1,
      address.city,
      address.state,
      address.postalCode,
      address.country,
    ].every((value) => value.trim().length > 0);
  }
}

export const checkoutService = new CheckoutService();

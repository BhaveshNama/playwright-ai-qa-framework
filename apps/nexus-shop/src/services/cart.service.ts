import type { CartSession } from '../models/cart-session.model';
import type { Cart, CartItem } from '../models/cart.model';
import { productService } from './product.service';

export type CartUpdateResult =
  | {
      success: true;
      cart: Cart;
    }
  | {
      success: false;
      reason: 'PRODUCT_NOT_FOUND' | 'PRODUCT_UNAVAILABLE' | 'INVALID_QUANTITY';
    };

const DEFAULT_CART_ID = 'default';

/*
 * CartService stores carts independently by cart identifier.
 *
 * The default cart preserves compatibility with the existing API and tests
 * while routes are migrated to explicit cart-session identifiers.
 */
export class CartService {
  private readonly sessions = new Map<string, CartSession>();

  getCart(cartId = DEFAULT_CART_ID): Cart {
    const session = this.getOrCreateSession(cartId);

    return {
      items: session.items.map((item) => ({
        product: item.product,
        quantity: item.quantity,
      })),
      totalInCents: this.calculateTotal(session.items),
    };
  }

  addProduct(productId: string, quantity = 1, cartId = DEFAULT_CART_ID): CartUpdateResult {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return {
        success: false,
        reason: 'INVALID_QUANTITY',
      };
    }

    const product = productService.getById(productId);

    if (!product) {
      return {
        success: false,
        reason: 'PRODUCT_NOT_FOUND',
      };
    }

    if (!product.isAvailable) {
      return {
        success: false,
        reason: 'PRODUCT_UNAVAILABLE',
      };
    }

    const session = this.getOrCreateSession(cartId);

    const existingItem = session.items.find((item) => item.product.id === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      session.items.push({
        product,
        quantity,
      });
    }

    return {
      success: true,
      cart: this.getCart(cartId),
    };
  }

  updateQuantity(productId: string, quantity: number, cartId = DEFAULT_CART_ID): CartUpdateResult {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return {
        success: false,
        reason: 'INVALID_QUANTITY',
      };
    }

    const session = this.getOrCreateSession(cartId);

    const item = session.items.find((candidate) => candidate.product.id === productId);

    if (!item) {
      return {
        success: false,
        reason: 'PRODUCT_NOT_FOUND',
      };
    }

    item.quantity = quantity;

    return {
      success: true,
      cart: this.getCart(cartId),
    };
  }

  removeProduct(productId: string, cartId = DEFAULT_CART_ID): Cart {
    const session = this.getOrCreateSession(cartId);

    session.items = session.items.filter((item) => item.product.id !== productId);

    return this.getCart(cartId);
  }

  clear(cartId = DEFAULT_CART_ID): void {
    this.sessions.delete(cartId);
  }

  private getOrCreateSession(cartId: string): CartSession {
    const existingSession = this.sessions.get(cartId);

    if (existingSession) {
      return existingSession;
    }

    const session: CartSession = {
      id: cartId,
      items: [],
    };

    this.sessions.set(cartId, session);

    return session;
  }

  private calculateTotal(items: readonly CartItem[]): number {
    return items.reduce((total, item) => total + item.product.priceInCents * item.quantity, 0);
  }
}

export const cartService = new CartService();

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

/*
 * CartService owns deterministic cart behavior.
 *
 * The initial NexusShop implementation keeps cart state in memory.
 * Persistence and customer-specific carts will be introduced only when
 * those requirements are implemented.
 */
export class CartService {
  private items: CartItem[] = [];

  getCart(): Cart {
    return {
      items: this.items.map((item) => ({
        product: item.product,
        quantity: item.quantity,
      })),
      totalInCents: this.calculateTotal(),
    };
  }

  addProduct(productId: string, quantity = 1): CartUpdateResult {
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

    const existingItem = this.items.find((item) => item.product.id === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.items.push({
        product,
        quantity,
      });
    }

    return {
      success: true,
      cart: this.getCart(),
    };
  }

  updateQuantity(productId: string, quantity: number): CartUpdateResult {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return {
        success: false,
        reason: 'INVALID_QUANTITY',
      };
    }

    const item = this.items.find((candidate) => candidate.product.id === productId);

    if (!item) {
      return {
        success: false,
        reason: 'PRODUCT_NOT_FOUND',
      };
    }

    item.quantity = quantity;

    return {
      success: true,
      cart: this.getCart(),
    };
  }

  removeProduct(productId: string): Cart {
    this.items = this.items.filter((item) => item.product.id !== productId);

    return this.getCart();
  }

  clear(): void {
    this.items = [];
  }

  private calculateTotal(): number {
    return this.items.reduce((total, item) => total + item.product.priceInCents * item.quantity, 0);
  }
}

export const cartService = new CartService();

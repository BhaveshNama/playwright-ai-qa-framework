import { products } from '../data/products.data';
import type { Product } from '../models/product.model';

/*
 * ProductService owns catalogue retrieval logic.
 *
 * Routes should delegate catalogue lookup behavior to this service rather
 * than reading the product dataset directly.
 */
export class ProductService {
  /*
   * Return a new array so callers cannot modify the exported product
   * collection itself.
   */
  getAll(): Product[] {
    return [...products];
  }

  /*
   * Product IDs are deterministic catalogue identifiers.
   *
   * Returning undefined for an unknown identifier allows the HTTP layer
   * to decide how that condition should be represented to API consumers.
   */
  getById(productId: string): Product | undefined {
    return products.find((product) => product.id === productId);
  }
}

export const productService = new ProductService();

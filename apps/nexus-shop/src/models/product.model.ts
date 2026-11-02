/*
 * Represents a product exposed by the NexusShop catalogue.
 *
 * Monetary values are stored as integer cents to avoid floating-point
 * rounding problems in future cart and checkout calculations.
 */
export interface Product {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
  category: string;
  isAvailable: boolean;
}

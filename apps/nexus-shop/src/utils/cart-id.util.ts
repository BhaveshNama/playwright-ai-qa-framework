import type { Request } from 'express';

const DEFAULT_CART_ID = 'default';

/*
 * Resolve the cart identifier associated with an HTTP request.
 *
 * API and browser clients can provide an explicit x-cart-id header.
 * The default identifier preserves backward compatibility while routes
 * and tests are migrated to isolated cart sessions.
 */
export function resolveCartId(request: Request): string {
  const headerValue = request.header('x-cart-id')?.trim();

  if (!headerValue) {
    return DEFAULT_CART_ID;
  }

  return headerValue;
}

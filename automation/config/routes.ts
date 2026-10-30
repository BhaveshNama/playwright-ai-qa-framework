/*
 * Application routes are centralized because route structure is application
 * configuration, not test behavior.
 *
 * Routes are relative so the same automation can execute against different
 * environments through Playwright's baseURL.
 */
export const routes = {
  login: '/login',
  register: '/register',
  catalogue: '/products',
  cart: '/cart',
  checkout: '/checkout',
  orders: '/orders',
  profile: '/profile',
} as const;

export type ApplicationRoute = (typeof routes)[keyof typeof routes];

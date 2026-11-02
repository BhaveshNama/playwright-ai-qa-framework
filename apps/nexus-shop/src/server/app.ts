import express from 'express';

import { authenticationRouter } from '../routes/authentication.route';
import { cartRouter } from '../routes/cart.route';
import { cartPageRouter } from '../routes/cart-page.route';
import { catalogueRouter } from '../routes/catalogue.route';
import { healthRouter } from '../routes/health.route';
import { loginRouter } from '../routes/login.route';
import { productRouter } from '../routes/product.route';

/*
 * Express application creation is separated from network startup.
 *
 * This allows tests to import the application without automatically opening
 * a TCP port.
 */
export function createApp(): express.Express {
  const app = express();

  // Avoid exposing implementation metadata through the default Express header.
  app.disable('x-powered-by');

  app.use(express.json());

  app.use(healthRouter);
  app.use(productRouter);
  app.use(authenticationRouter);
  app.use(cartRouter);
  app.use(cartPageRouter);
  app.use(loginRouter);
  app.use(catalogueRouter);

  return app;
}

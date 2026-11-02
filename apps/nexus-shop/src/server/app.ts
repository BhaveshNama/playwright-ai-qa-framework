import express from 'express';

import { catalogueRouter } from '../routes/catalogue.route';
import { healthRouter } from '../routes/health.route';
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
  app.use(catalogueRouter);

  return app;
}

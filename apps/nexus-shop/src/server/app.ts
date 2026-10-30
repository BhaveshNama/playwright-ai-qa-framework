import express from 'express';

import { healthRouter } from '../routes/health.route';

/*
 * Express application creation is separated from network startup.
 *
 * This will allow future tests to import the application without
 * automatically opening a TCP port.
 */
export function createApp(): express.Express {
  const app = express();

  // Avoid exposing implementation metadata through the default Express header.
  app.disable('x-powered-by');

  app.use(express.json());

  app.use(healthRouter);

  return app;
}

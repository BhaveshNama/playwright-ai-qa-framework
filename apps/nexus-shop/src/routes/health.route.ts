import { Router } from 'express';

import type { HealthResponse } from '../models/health.model';

export const healthRouter = Router();

healthRouter.get('/health', (_request, response) => {
  const body: HealthResponse = {
    status: 'ok',
    service: 'nexus-shop',
  };

  response.status(200).json(body);
});

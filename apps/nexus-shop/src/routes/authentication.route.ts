import { Router } from 'express';
import { z } from 'zod';

import { authenticationService } from '../services/authentication.service';

export const authenticationRouter = Router();

const loginRequestSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
});

authenticationRouter.post('/api/auth/login', (request, response) => {
  const parsedRequest = loginRequestSchema.safeParse(request.body);

  if (!parsedRequest.success) {
    response.status(400).json({
      error: 'Email and password are required',
    });

    return;
  }

  const result = authenticationService.authenticate(
    parsedRequest.data.email,
    parsedRequest.data.password,
  );

  if (!result.success) {
    if (result.reason === 'INACTIVE_ACCOUNT') {
      response.status(403).json({
        error: 'Account is inactive',
      });

      return;
    }

    response.status(401).json({
      error: 'Invalid email or password',
    });

    return;
  }

  response.status(200).json({
    customer: result.customer,
  });
});

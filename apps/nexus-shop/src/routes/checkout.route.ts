import { Router } from 'express';
import { z } from 'zod';

import { checkoutService } from '../services/checkout.service';
import { resolveCartId } from '../utils/cart-id.util';

export const checkoutRouter = Router();

const checkoutAddressSchema = z.object({
  fullName: z.string().trim().min(1),
  addressLine1: z.string().trim().min(1),
  city: z.string().trim().min(1),
  state: z.string().trim().min(1),
  postalCode: z.string().trim().min(1),
  country: z.string().trim().min(1),
});

checkoutRouter.post('/api/checkout', (request, response) => {
  const parsedRequest = checkoutAddressSchema.safeParse(request.body);

  if (!parsedRequest.success) {
    response.status(400).json({
      error: 'A complete shipping address is required',
    });

    return;
  }

  const cartId = resolveCartId(request);

  const result = checkoutService.prepareCheckout(cartId, parsedRequest.data);

  if (!result.success) {
    if (result.reason === 'EMPTY_CART') {
      response.status(409).json({
        error: 'Cannot checkout an empty cart',
      });

      return;
    }

    response.status(400).json({
      error: 'A complete shipping address is required',
    });

    return;
  }

  response.status(200).json(result.summary);
});

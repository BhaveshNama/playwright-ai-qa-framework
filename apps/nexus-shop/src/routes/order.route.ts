import { Router } from 'express';
import { z } from 'zod';

import { checkoutService } from '../services/checkout.service';
import { orderService } from '../services/order.service';
import { resolveCartId } from '../utils/cart-id.util';

export const orderRouter = Router();

const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(1),
  addressLine1: z.string().trim().min(1),
  city: z.string().trim().min(1),
  state: z.string().trim().min(1),
  postalCode: z.string().trim().min(1),
  country: z.string().trim().min(1),
});

orderRouter.post('/api/orders', (request, response) => {
  const parsedRequest = shippingAddressSchema.safeParse(request.body);

  if (!parsedRequest.success) {
    response.status(400).json({
      error: 'A complete shipping address is required',
    });

    return;
  }

  const sessionId = resolveCartId(request);

  const checkoutResult = checkoutService.prepareCheckout(sessionId, parsedRequest.data);

  if (!checkoutResult.success) {
    if (checkoutResult.reason === 'EMPTY_CART') {
      response.status(409).json({
        error: 'Cannot create an order from an empty cart',
      });

      return;
    }

    response.status(400).json({
      error: 'A complete shipping address is required',
    });

    return;
  }

  const order = orderService.createOrder(sessionId, checkoutResult.summary);

  response.status(201).json(order);
});

orderRouter.get('/api/orders', (request, response) => {
  const sessionId = resolveCartId(request);

  response.status(200).json(orderService.getOrders(sessionId));
});

orderRouter.get('/api/orders/:orderId', (request, response) => {
  const sessionId = resolveCartId(request);

  const order = orderService.getOrder(sessionId, request.params.orderId);

  if (!order) {
    response.status(404).json({
      error: 'Order not found',
    });

    return;
  }

  response.status(200).json(order);
});

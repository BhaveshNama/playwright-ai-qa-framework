import { Router } from 'express';
import { z } from 'zod';

import { cartService } from '../services/cart.service';

export const cartRouter = Router();

const addCartItemSchema = z.object({
  productId: z.string().trim().min(1),
  quantity: z.number().int().positive().default(1),
});

const updateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
});

cartRouter.get('/api/cart', (_request, response) => {
  response.status(200).json(cartService.getCart());
});

cartRouter.post('/api/cart/items', (request, response) => {
  const parsedRequest = addCartItemSchema.safeParse(request.body);

  if (!parsedRequest.success) {
    response.status(400).json({
      error: 'Valid productId and quantity are required',
    });

    return;
  }

  const result = cartService.addProduct(parsedRequest.data.productId, parsedRequest.data.quantity);

  if (!result.success) {
    if (result.reason === 'PRODUCT_NOT_FOUND') {
      response.status(404).json({
        error: 'Product not found',
      });

      return;
    }

    if (result.reason === 'PRODUCT_UNAVAILABLE') {
      response.status(409).json({
        error: 'Product is unavailable',
      });

      return;
    }

    response.status(400).json({
      error: 'Invalid quantity',
    });

    return;
  }

  response.status(201).json(result.cart);
});

cartRouter.patch('/api/cart/items/:productId', (request, response) => {
  const parsedRequest = updateCartItemSchema.safeParse(request.body);

  if (!parsedRequest.success) {
    response.status(400).json({
      error: 'Valid quantity is required',
    });

    return;
  }

  const result = cartService.updateQuantity(request.params.productId, parsedRequest.data.quantity);

  if (!result.success) {
    if (result.reason === 'PRODUCT_NOT_FOUND') {
      response.status(404).json({
        error: 'Cart item not found',
      });

      return;
    }

    response.status(400).json({
      error: 'Invalid quantity',
    });

    return;
  }

  response.status(200).json(result.cart);
});

cartRouter.delete('/api/cart/items/:productId', (request, response) => {
  const cart = cartService.removeProduct(request.params.productId);

  response.status(200).json(cart);
});

cartRouter.delete('/api/cart', (_request, response) => {
  cartService.clear();

  response.status(204).send();
});

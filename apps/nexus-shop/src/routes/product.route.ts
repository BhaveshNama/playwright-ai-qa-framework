import { Router } from 'express';

import { productService } from '../services/product.service';

export const productRouter = Router();

/*
 * Return the complete deterministic NexusShop product catalogue.
 */
productRouter.get('/api/products', (_request, response) => {
  const products = productService.getAll();

  response.status(200).json(products);
});

/*
 * Return a single catalogue product by its stable identifier.
 *
 * Unknown identifiers return HTTP 404 instead of an empty successful response.
 */
productRouter.get('/api/products/:productId', (request, response) => {
  const product = productService.getById(request.params.productId);

  if (!product) {
    response.status(404).json({
      error: 'Product not found',
    });

    return;
  }

  response.status(200).json(product);
});

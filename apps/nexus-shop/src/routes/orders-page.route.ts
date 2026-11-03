import { Router } from 'express';

import { orderService } from '../services/order.service';
import { resolveCartId } from '../utils/cart-id.util';

export const ordersPageRouter = Router();

ordersPageRouter.get('/orders', (request, response) => {
  const sessionId = resolveCartId(request);

  const requestedOrderId =
    typeof request.query.orderId === 'string' ? request.query.orderId : undefined;

  const order = requestedOrderId ? orderService.getOrder(sessionId, requestedOrderId) : undefined;

  if (!order) {
    response.status(404).type('html').send(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8">

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1"
          >

          <title>Orders | NexusShop</title>
        </head>

        <body>
          <main>
            <h1>Orders</h1>

            <p role="alert">
              Order not found.
            </p>

            <a href="/products">
              Continue shopping
            </a>
          </main>
        </body>
      </html>
    `);

    return;
  }

  const total = (order.totalInCents / 100).toFixed(2);

  response.status(200).type('html').send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        >

        <title>Order confirmation | NexusShop</title>
      </head>

      <body>
        <main>
          <h1>Order confirmation</h1>

          <section aria-label="Order details">
            <h2>Order details</h2>

            <p aria-label="Order identifier">${order.id}</p>

            <p aria-label="Order status">
              Status: ${order.status}
            </p>

            <p aria-label="Order total">
              Total: $${total}
            </p>

            <p aria-label="Shipping recipient">
              Ship to: ${order.shippingAddress.fullName}
            </p>
          </section>

          <a href="/products">
            Continue shopping
          </a>
        </main>
      </body>
    </html>
  `);
});

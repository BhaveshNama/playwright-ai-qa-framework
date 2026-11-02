import { Router } from 'express';

import { cartService } from '../services/cart.service';

import { resolveCartId } from '../utils/cart-id.util';

export const cartPageRouter = Router();

cartPageRouter.get('/cart', (request, response) => {
  const cartId = resolveCartId(request);
  const cart = cartService.getCart(cartId);

  const cartItems = cart.items
    .map((item) => {
      const unitPrice = (item.product.priceInCents / 100).toFixed(2);

      const lineTotal = ((item.product.priceInCents * item.quantity) / 100).toFixed(2);

      return `
        <article
          aria-label="${item.product.name}"
          data-product-id="${item.product.id}"
        >
          <h2>${item.product.name}</h2>

          <p>Unit price: $${unitPrice}</p>

          <label for="quantity-${item.product.id}">
            Quantity
          </label>

          <input
            id="quantity-${item.product.id}"
            name="quantity-${item.product.id}"
            type="number"
            min="1"
            value="${item.quantity}"
          >

          <p>Line total: $${lineTotal}</p>

          <button
            type="button"
            data-remove-product="${item.product.id}"
          >
            Remove ${item.product.name}
          </button>
        </article>
      `;
    })
    .join('');

  const total = (cart.totalInCents / 100).toFixed(2);

  response.status(200).type('html').send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        >

        <title>Shopping cart | NexusShop</title>
      </head>

      <body>
        <main>
          <h1>Shopping cart</h1>

          <section aria-label="Cart items">
            ${cart.items.length === 0 ? '<p>Your cart is empty.</p>' : cartItems}
          </section>

          <p aria-label="Cart total">
            Total: $${total}
          </p>

          <button
            type="button"
            id="checkout-button"
            ${cart.items.length === 0 ? 'disabled' : ''}
          >
            Checkout
          </button>
        </main>

        <script>
          const quantityInputs = document.querySelectorAll(
            'input[name^="quantity-"]'
          );

          for (const quantityInput of quantityInputs) {
            quantityInput.addEventListener('change', async () => {
              const productId =
                quantityInput.id.replace('quantity-', '');

              const quantity = Number(quantityInput.value);

              const response = await fetch(
                '/api/cart/items/' + productId,
                {
                  method: 'PATCH',
                  headers: {
                    'content-type': 'application/json',
                  },
                  body: JSON.stringify({
                    quantity,
                  }),
                }
              );

              if (response.ok) {
                window.location.reload();
              }
            });
          }

          const removeButtons = document.querySelectorAll(
            '[data-remove-product]'
          );

          for (const removeButton of removeButtons) {
            removeButton.addEventListener('click', async () => {
              const productId =
                removeButton.dataset.removeProduct;

              if (!productId) {
                return;
              }

              const response = await fetch(
                '/api/cart/items/' + productId,
                {
                  method: 'DELETE',
                }
              );

              if (response.ok) {
                window.location.reload();
              }
            });
          }
        </script>
      
      </body>
    </html>
  `);
});

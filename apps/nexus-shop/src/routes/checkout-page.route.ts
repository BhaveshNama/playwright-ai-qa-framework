import { Router } from 'express';

import { cartService } from '../services/cart.service';
import { resolveCartId } from '../utils/cart-id.util';

export const checkoutPageRouter = Router();

checkoutPageRouter.get('/checkout', (request, response) => {
  const cartId = resolveCartId(request);
  const cart = cartService.getCart(cartId);

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

        <title>Checkout | NexusShop</title>
      </head>

      <body>
        <main>
          <h1>Checkout</h1>

          ${
            cart.items.length === 0
              ? `
                <p role="alert">
                  Your cart is empty.
                </p>

                <a href="/products">
                  Continue shopping
                </a>
              `
              : `
                <section aria-label="Order summary">
                  <h2>Order summary</h2>

                  <p aria-label="Checkout total">
                    Total: $${total}
                  </p>
                </section>

                <form id="checkout-form">
                  <fieldset>
                    <legend>Shipping address</legend>

                    <label for="full-name">
                      Full name
                    </label>
                    <input
                      id="full-name"
                      name="fullName"
                      required
                    >

                    <label for="address-line-1">
                      Address line 1
                    </label>
                    <input
                      id="address-line-1"
                      name="addressLine1"
                      required
                    >

                    <label for="city">
                      City
                    </label>
                    <input
                      id="city"
                      name="city"
                      required
                    >

                    <label for="state">
                      State
                    </label>
                    <input
                      id="state"
                      name="state"
                      required
                    >

                    <label for="postal-code">
                      Postal code
                    </label>
                    <input
                      id="postal-code"
                      name="postalCode"
                      required
                    >

                    <label for="country">
                      Country
                    </label>
                    <input
                      id="country"
                      name="country"
                      required
                    >
                  </fieldset>

                  <button type="submit">
                    Place order
                  </button>
                </form>

                <p
                  id="checkout-message"
                  role="status"
                  aria-live="polite"
                ></p>

                <script>
                  const checkoutForm =
                    document.querySelector('#checkout-form');

                  const checkoutMessage =
                    document.querySelector('#checkout-message');

                  checkoutForm.addEventListener(
                    'submit',
                    async (event) => {
                      event.preventDefault();

                      const formData =
                        new FormData(checkoutForm);

                      const response = await fetch(
                        '/api/checkout',
                        {
                          method: 'POST',
                          headers: {
                            'content-type': 'application/json',
                          },
                          body: JSON.stringify({
                            fullName:
                              formData.get('fullName'),
                            addressLine1:
                              formData.get('addressLine1'),
                            city:
                              formData.get('city'),
                            state:
                              formData.get('state'),
                            postalCode:
                              formData.get('postalCode'),
                            country:
                              formData.get('country'),
                          }),
                        }
                      );

                      if (response.ok) {
                        checkoutMessage.textContent =
                          'Checkout details are valid.';
                        return;
                      }

                      const body = await response.json();

                      checkoutMessage.textContent =
                        body.error ??
                        'Checkout could not be prepared.';
                    }
                  );
                </script>
              `
          }
        </main>
      </body>
    </html>
  `);
});

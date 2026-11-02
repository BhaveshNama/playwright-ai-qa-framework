import { Router } from 'express';

import { productService } from '../services/product.service';

export const catalogueRouter = Router();

catalogueRouter.get('/products', (_request, response) => {
  const products = productService.getAll();

  const productCards = products
    .map((product) => {
      const price = (product.priceInCents / 100).toFixed(2);
      const availability = product.isAvailable ? 'Available' : 'Unavailable';

      return `
        <article
          aria-label="${product.name}"
          data-product-id="${product.id}"
          data-product-name="${product.name.toLowerCase()}"
        >
          <h2>${product.name}</h2>
          <p>${product.description}</p>
          <p>Category: ${product.category}</p>
          <p>Price: $${price}</p>
          <p>Status: ${availability}</p>
          <button
            type="button"
            data-add-product="${product.id}"
            ${product.isAvailable ? '' : 'disabled'}
          >
            Add ${product.name} to cart
          </button>
        </article>
      `;
    })
    .join('');

  response.status(200).type('html').send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        >
        <title>Products | NexusShop</title>
      </head>

      <body>
        <main>
          <h1>Products</h1>

          <label for="product-search">
            Search products
          </label>

          <input
            id="product-search"
            name="product-search"
            type="search"
            aria-label="Search products"
          >

          <p
            id="no-products-message"
            role="status"
            hidden
          >
            No products found.
          </p>

          <section aria-label="Product catalogue">
            ${productCards}
          </section>
        </main>

        <script>
          const searchInput = document.getElementById('product-search');
          const productCards = Array.from(
            document.querySelectorAll('[data-product-id]')
          );
          const noProductsMessage = document.getElementById(
            'no-products-message'
          );

          searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim().toLowerCase();
            let visibleProductCount = 0;

            for (const productCard of productCards) {
              const productName =
                productCard.dataset.productName ?? '';

              const isVisible = productName.includes(query);

              productCard.hidden = !isVisible;

              if (isVisible) {
                visibleProductCount += 1;
              }
            }

            noProductsMessage.hidden = visibleProductCount !== 0;
          });

          const addProductButtons = document.querySelectorAll(
            '[data-add-product]'
          );

          for (const button of addProductButtons) {
            button.addEventListener('click', async () => {
              const productId =
                button.dataset.addProduct;

              if (!productId) {
                return;
              }

              const response = await fetch('/api/cart/items', {
                method: 'POST',
                headers: {
                  'content-type': 'application/json',
                },
                body: JSON.stringify({
                  productId,
                  quantity: 1,
                }),
              });

              if (response.ok) {
                window.location.assign('/cart');
              }
            });
          }
        </script>
      </body>
    </html>
  `);
});

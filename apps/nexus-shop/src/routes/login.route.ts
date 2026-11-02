import { Router } from 'express';

export const loginRouter = Router();

loginRouter.get('/login', (_request, response) => {
  response.status(200).type('html').send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        >
        <title>Sign in | NexusShop</title>
      </head>

      <body>
        <main>
          <h1>Sign in</h1>

          <form id="login-form">
            <div>
              <label for="email">
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autocomplete="username"
                required
              >
            </div>

            <div>
              <label for="password">
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                autocomplete="current-password"
                required
              >
            </div>

            <button type="submit">
              Sign in
            </button>

            <p
              id="login-message"
              role="alert"
              hidden
            ></p>
          </form>
        </main>

        <script>
          const loginForm = document.getElementById('login-form');
          const emailInput = document.getElementById('email');
          const passwordInput = document.getElementById('password');
          const loginMessage = document.getElementById('login-message');

          loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            loginMessage.hidden = true;
            loginMessage.textContent = '';

            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
              },
              body: JSON.stringify({
                email: emailInput.value,
                password: passwordInput.value,
              }),
            });

            const body = await response.json();

            if (!response.ok) {
              loginMessage.textContent =
                body.error ?? 'Authentication failed.';
              loginMessage.hidden = false;
              return;
            }

            window.location.assign('/products');
          });
        </script>
      </body>
    </html>
  `);
});

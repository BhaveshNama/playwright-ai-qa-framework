import process from 'node:process';

import { serverConfig } from '../config/server.config';
import { createApp } from './app';

const app = createApp();

const server = app.listen(serverConfig.port, serverConfig.host, () => {
  console.log(`NexusShop listening on ${serverConfig.host}:${serverConfig.port}`);
});

/*
 * Graceful shutdown prevents local development and future CI processes
 * from leaving the server running after execution finishes.
 */
function shutdown(signal: string): void {
  console.log(`NexusShop received ${signal}. Shutting down.`);

  server.close((error) => {
    if (error) {
      console.error('NexusShop shutdown failed.', error);
      process.exitCode = 1;
      return;
    }

    console.log('NexusShop stopped.');
  });
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

import * as http from 'http';

export interface HealthServerOptions {
  port: number;
  botName: string;
  getStatus?: () => Record<string, any>;
}

/**
 * Starts a lightweight HTTP health check server for Docker / Kubernetes health checks.
 */
export function startBotHealthServer(options: HealthServerOptions): http.Server {
  const { port, botName, getStatus } = options;

  const server = http.createServer((req, res) => {
    if (req.url === '/health') {
      const extra = getStatus ? getStatus() : {};
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'ok',
          bot: botName,
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
          ...extra,
        })
      );
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`[bot-core] Health check server for ${botName} listening on http://0.0.0.0:${port}/health`);
  });

  return server;
}

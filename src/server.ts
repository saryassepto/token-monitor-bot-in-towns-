import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

export function startHealthServer(port: number): void {
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    if (req.url === '/health' || req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  });

  server.listen(port, () => {
    console.log(`Health server listening on port ${port}`);
  });
}

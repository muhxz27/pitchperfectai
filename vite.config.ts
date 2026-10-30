import { defineConfig, loadEnv, type Connect, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const DEV_API_ROUTES: Record<string, string> = {
  '/api/analyze': '/api/analyze.ts',
  '/api/revise': '/api/revise.ts',
};

const MAX_BODY_BYTES = 100_000;

function readBody(req: Connect.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;

    req.on('data', (chunk: Buffer) => {
      size += chunk.length;

      if (size > MAX_BODY_BYTES) {
        reject(new Error('Request body is too large.'));
        req.destroy();
        return;
      }

      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

interface DevApiResponse {
  statusCode: number;
  writableEnded: boolean;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
}

function sendJson(res: DevApiResponse, status: number, body: unknown) {
  if (res.writableEnded) {
    return;
  }

  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function devApiPlugin(): Plugin {
  return {
    name: 'pitchperfect-dev-api',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '');

      for (const name of ['AI_PROVIDER', 'AI_API_KEY', 'AI_MODEL']) {
        if (!process.env[name] && env[name]) {
          process.env[name] = env[name];
        }
      }

      const configured = Boolean(
        process.env.AI_PROVIDER &&
          process.env.AI_API_KEY &&
          process.env.AI_MODEL,
      );

      server.config.logger.info(
        configured
          ? 'Dev API ready: POST /api/analyze and POST /api/revise (AI configured).'
          : 'Dev API ready: POST /api/analyze and POST /api/revise (AI_* variables not set — live AI will report as unconfigured).',
      );

      server.middlewares.use(async (req, res, next) => {
        const pathname = (req.url ?? '').split('?')[0];
        const modulePath = DEV_API_ROUTES[pathname];

        if (!modulePath) {
          if (pathname.startsWith('/api/')) {
            sendJson(res, 404, {
              error: {
                code: 'NOT_FOUND',
                message: 'This API route does not exist.',
              },
            });
            return;
          }

          next();
          return;
        }

        if (req.method !== 'POST') {
          res.setHeader('Allow', 'POST');
          sendJson(res, 405, {
            error: {
              code: 'METHOD_NOT_ALLOWED',
              message: 'POST is the only supported method for this endpoint.',
            },
          });
          return;
        }

        let rawBody: string;

        try {
          rawBody = await readBody(req);
        } catch (error) {
          sendJson(res, 413, {
            error: {
              code: 'INVALID_JSON',
              message:
                error instanceof Error
                  ? error.message
                  : 'The request body could not be read.',
            },
          });
          return;
        }

        let body: unknown;

        try {
          body = rawBody ? JSON.parse(rawBody) : undefined;
        } catch {
          sendJson(res, 400, {
            error: {
              code: 'INVALID_JSON',
              message: 'Request body must be valid JSON.',
            },
          });
          return;
        }

        let statusCode = 200;
        const apiResponse = {
          status(code: number) {
            statusCode = code;
            return apiResponse;
          },
          setHeader(name: string, value: string) {
            res.setHeader(name, value);
          },
          json(payload: unknown) {
            sendJson(res, statusCode, payload);
          },
        };

        try {
          const module = await server.ssrLoadModule(modulePath);
          const handler = module.default;

          if (typeof handler !== 'function') {
            throw new Error('The API module has no default handler.');
          }

          await handler({ method: req.method, body }, apiResponse);
        } catch (error) {
          server.config.logger.error(
            `Dev API failed for ${pathname}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
          sendJson(res, 500, {
            error: {
              code: 'DEV_API_ERROR',
              message:
                'The local API failed to handle this request. Check the dev server console.',
            },
          });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), devApiPlugin()],
});

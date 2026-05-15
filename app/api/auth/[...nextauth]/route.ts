import { Auth } from '@auth/core';
import { authConfig } from '@/auth';

// Next.js 16 dev forces NextRequest.url to the actual incoming Host header
// (localhost), silently ignoring URLs we pass to `new NextRequest(...)`. So we
// can't use `handlers.GET` — its internal `reqWithEnvURL` rewrite is a no-op.
// Instead we build a plain Request with the AUTH_URL origin and call
// @auth/core's Auth() directly. Auth reads `req.url` via `new URL(req.url)`,
// which works correctly on plain Request objects.
const origin = process.env.AUTH_URL ?? 'http://127.0.0.1:3000';

function rewriteRequest(req: Request): Request {
  const url = new URL(req.url);
  const target = new URL(origin);
  url.protocol = target.protocol;
  url.hostname = target.hostname;
  url.port = target.port;

  const headers = new Headers(req.headers);
  headers.set('host', target.host);
  headers.set('x-forwarded-host', target.host);
  headers.set('x-forwarded-proto', target.protocol.replace(':', ''));

  return new Request(url.toString(), {
    method: req.method,
    headers,
    body: req.body,
    // @ts-expect-error duplex is required by Node fetch when body is a stream
    duplex: req.body ? 'half' : undefined,
  });
}

export async function GET(req: Request) {
  return Auth(rewriteRequest(req), authConfig);
}

export async function POST(req: Request) {
  return Auth(rewriteRequest(req), authConfig);
}

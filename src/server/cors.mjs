const DEFAULT_CORS_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];
const CORS_METHODS = 'GET, OPTIONS';
const CORS_DEFAULT_HEADERS = 'Content-Type, Authorization';
const CORS_MAX_AGE_SECONDS = '86400';

export function getAllowedCorsOrigins(env = process.env) {
  const rawOrigins = env.MAINTENANCE_API_ALLOWED_ORIGINS ?? env.MAINTENANCE_API_CORS_ORIGINS;

  if (rawOrigins === undefined) {
    return DEFAULT_CORS_ORIGINS;
  }

  return String(rawOrigins)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function createCorsHandler(handler, options = {}) {
  const allowedOrigins = options.allowedOrigins || getAllowedCorsOrigins(options.env);

  return async function corsHandler(request, response) {
    const url = new URL(request.url, 'http://localhost');
    const corsHeaders = getCorsHeaders(request, allowedOrigins);

    if (isCorsApiPath(url.pathname)) {
      const originalWriteHead = response.writeHead.bind(response);
      response.writeHead = (statusCode, statusMessageOrHeaders = {}, maybeHeaders = {}) => {
        if (typeof statusMessageOrHeaders === 'string') {
          return originalWriteHead(statusCode, statusMessageOrHeaders, {
            ...maybeHeaders,
            ...corsHeaders,
          });
        }

        return originalWriteHead(statusCode, {
          ...statusMessageOrHeaders,
          ...corsHeaders,
        });
      };
    }

    if (request.method === 'OPTIONS' && isCorsApiPath(url.pathname)) {
      response.writeHead(204, corsHeaders);
      response.end();
      return;
    }

    return handler(request, response);
  };
}

function isCorsApiPath(pathname) {
  return pathname === '/api/health' || pathname.startsWith('/api/maintenance/');
}

function getCorsHeaders(request, allowedOrigins) {
  const requestOrigin = request.headers?.origin;
  const allowOrigin = resolveAllowOrigin(requestOrigin, allowedOrigins);
  const requestHeaders = request.headers?.['access-control-request-headers'];
  const headers = {
    'Access-Control-Allow-Methods': CORS_METHODS,
    'Access-Control-Allow-Headers': requestHeaders || CORS_DEFAULT_HEADERS,
    'Access-Control-Max-Age': CORS_MAX_AGE_SECONDS,
  };

  if (allowOrigin) {
    headers['Access-Control-Allow-Origin'] = allowOrigin;
    headers.Vary = 'Origin';
  }

  return headers;
}

function resolveAllowOrigin(requestOrigin, allowedOrigins) {
  if (!requestOrigin) {
    return null;
  }

  if (allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }

  return null;
}

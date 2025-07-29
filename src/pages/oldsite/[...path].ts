import type { APIRoute } from 'astro';
import { load } from 'cheerio';

const PATCH_SCRIPT_URL = 'https://ellinet13.com/oldsite-patch.js';
const badHeaders = ['content-encoding', 'transfer-encoding', 'content-length', 'connection'];

// List of wildcard patterns (supports *)
const iframeRules = [
  'astro/*',
  'docs/*',
  'replace/*',
  'html*',
];

// Match wildcard pattern like "games/*"
function matchesWildcard(path: string, pattern: string): boolean {
  const regex = new RegExp(
    '^' + pattern.split('*').map(part => part.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&')).join('.*') + '$'
  );
  return regex.test(path);
}

export const GET: APIRoute = async ({ params, request }) => {
  const path = params.path ? (Array.isArray(params.path) ? params.path.join('/') : params.path) : '';
  const targetUrl = `https://ellinet13.github.io/${path}`;

  // Check for iframe match
  const shouldIframe = iframeRules.some(pattern => matchesWildcard(path, pattern));
  if (shouldIframe) {
    const iframeHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Framed Content</title>
  <style>
    html, body, iframe {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      border: none;
    }
    iframe {
      position: fixed;
      top: 0;
      left: 0;
      border: none;
    }
  </style>
</head>
<body>
  <iframe src="https://ellinet13.github.io/${path}" allowfullscreen></iframe>
</body>
</html>`;
    return new Response(iframeHTML, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
      },
    });
  }

  // Normal proxy behavior
  const res = await fetch(targetUrl, {
    method: 'GET',
    headers: {
      ...Object.fromEntries(
        [...request.headers.entries()].filter(([k]) => k.toLowerCase() !== 'host')
      ),
    },
  });

  const contentType = res.headers.get('content-type') || '';
  const headers: HeadersInit = {};
  res.headers.forEach((value, key) => {
    if (!badHeaders.includes(key.toLowerCase())) {
      headers[key] = value;
    }
  });

  if (contentType.includes('text/html')) {
    let html = await res.text();
    const $ = load(html);

    $('a[href], link[href], script[src], img[src]').each((_, el) => {
      const $el = $(el);
      const attr = $el.attr('href') ? 'href' : 'src';
      const val = $el.attr(attr);
      if (!val) return;

      let newVal = val.replace(/^\/(?!\/)/, '/oldsite/');
      newVal = newVal.replace(/ellinet13\.github\.io/g, 'ellinet13.com/oldsite');
      $el.attr(attr, newVal);
    });

    $('script:not([src])').each((_, el) => {
      const $el = $(el);
      let code = $el.html() || '';
      const backupVar = '___origAssign' + Math.floor(Math.random() * 10000);
      const patched = `
const ${backupVar} = window.location;
window.location = new Proxy(${backupVar}, {
  set(obj, prop, val) {
    if (prop === 'href' && typeof val === 'string') {
      val = val.replace(/^\\//, '/oldsite/').replace('ellinet13.github.io', 'ellinet13.com/oldsite');
    }
    obj[prop] = val;
    return true;
  }
});\n` + code.replace(/(['"])(\/[^'"]*)\1/g, (match, q, p1) => `${q}/oldsite${p1.slice(1)}${q}`)
             .replace(/ellinet13\.github\.io/g, 'ellinet13.com/oldsite');
      $el.html(patched);
    });

    $('body').append(`<script src="${PATCH_SCRIPT_URL}"></script>`);

    return new Response($.html(), {
      status: res.status,
      headers: {
        ...headers,
        'content-type': 'text/html; charset=utf-8',
      },
    });
  } else if (contentType.includes('application/javascript') || path.endsWith('.js')) {
    let js = await res.text();
    js = js
      .replace(/^\/(?!\/)/gm, '/oldsite/')
      .replace(/ellinet13\.github\.io/g, 'ellinet13.com/oldsite');

    return new Response(js, {
      status: res.status,
      headers: {
        ...headers,
        'content-type': 'application/javascript; charset=utf-8',
      },
    });
  } else {
    return new Response(res.body, {
      status: res.status,
      headers,
    });
  }
};

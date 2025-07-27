import type { APIRoute } from 'astro';
import { load } from 'cheerio';

export const GET: APIRoute = async ({ params }) => {
  const path = params.path ? (Array.isArray(params.path) ? params.path.join('/') : params.path) : '';
  const targetUrl = `https://ellinet13.github.io/${path}`;

  const res = await fetch(targetUrl);
  if (!res.ok) {
    return new Response('Failed to fetch target', { status: 502 });
  }

  const headers = new Headers(res.headers);
  const contentType = headers.get('Content-Type') || '';

  if (contentType.includes('text/html')) {
    const html = await res.text();
    const $ = load(html);

    const customCss = `
      /* Adding CSS later */
    `;

    $('head').append(`<style>${customCss}</style>`);

    $('*[href], *[src]').each((_, el) => {
      const $el = $(el);
      const attr = $el.attr('href') ? 'href' : 'src';
      const val = $el.attr(attr);

      if (!val) return;

      if (val.startsWith('/')) {
        $el.attr(attr, '/oldsite' + val);
      } else if (val.startsWith('./')) {
        // do nothing
      } else if (!val.startsWith('http') && !val.startsWith('#')) {
        $el.attr(attr, './' + val);
      }
    });

    headers.set('Content-Type', 'text/html');
    return new Response($.html(), { headers });
  }

  return new Response(res.body, {
    status: res.status,
    headers,
  });
};

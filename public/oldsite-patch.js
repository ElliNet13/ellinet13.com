(() => {
  const originalFetch = window.fetch;
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalAssign = window.location.assign;
  const originalReplace = window.location.replace;
  const originalGetElementById = Document.prototype.getElementById;

  function fixUrl(url) {
    if (typeof url !== 'string') return url;

    // If it's an absolute GitHub Pages URL, redirect to /oldsite
    if (/https?:\/\/ellinet13\.github\.io/gi.test(url)) {
      return url.replace(/https?:\/\/ellinet13\.github\.io/gi, 'https://ellinet13.com/oldsite');
    }

    // Skip special folders like /_vercel, /api, /assets, etc.
    if (url.startsWith('/_vercel') || url.startsWith('/api') || url.startsWith('/assets')) {
      return url;
    }

    // Prepend /oldsite to local root-relative links
    if (url.startsWith('/') && !url.startsWith('//')) {
      return '/oldsite' + url;
    }

    return url;
  }

  window.fetch = function (input, init) {
    if (typeof input === 'string') {
      input = fixUrl(input);
    } else if (input instanceof Request) {
      input = new Request(fixUrl(input.url), input);
    }
    return originalFetch.call(this, input, init);
  };

  XMLHttpRequest.prototype.open = function (method, url, ...args) {
    url = fixUrl(url);
    return originalXhrOpen.call(this, method, url, ...args);
  };

  window.location.assign = function (url) {
    originalAssign.call(this, fixUrl(url));
  };

  window.location.replace = function (url) {
    originalReplace.call(this, fixUrl(url));
  };

  // Patch getElementById to always return an up-to-date element by id
  Document.prototype.getElementById = function(id) {
    return this.querySelector(`[id="${id}"]`);
  };

  document.addEventListener('DOMContentLoaded', () => {
    // Fix all <a href="/..."> links
    for (const a of document.querySelectorAll('a[href^="/"]')) {
      const href = a.getAttribute('href');
      if (href && !href.startsWith('//') && !href.startsWith('/_vercel') && !href.startsWith('/api')) {
        a.setAttribute('href', '/oldsite' + href);
      }
    }

    // Remove sandbox from all iframes
    for (const iframe of document.querySelectorAll('iframe[sandbox]')) {
      iframe.removeAttribute('sandbox');
    }
  });
})();
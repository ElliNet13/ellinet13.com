(() => {
  const originalFetch = window.fetch;
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalAssign = window.location.assign;
  const originalReplace = window.location.replace;

  function fixUrl(url) {
    if (typeof url !== 'string') return url;

    // Bypass URLs starting with /.well-known or /_vercel (do not modify)
    if (url.startsWith('/.well-known') || url.startsWith('/_vercel')) {
      return url;
    }

    if (url.startsWith('/') && !url.startsWith('//')) {
      return '/oldsite' + url;
    }
    return url.replace(/https?:\/\/ellinet13\.github\.io/gi, 'https://ellinet13.com/oldsite');
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

  document.addEventListener('DOMContentLoaded', () => {
    for (const a of document.querySelectorAll('a[href^="/"]')) {
      const href = a.getAttribute('href');
      if (href && !href.startsWith('//') && !href.startsWith('/.well-known') && !href.startsWith('/_vercel')) {
        a.setAttribute('href', '/oldsite' + href);
      }
    }
  });
})();

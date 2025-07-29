(() => {
  // --- Vercel Analytics Injection (do not alter /_vercel) ---
  if (!location.pathname.startsWith("/_vercel")) {
    const va1 = document.createElement("script");
    va1.textContent = `window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };`;
    document.head.appendChild(va1);

    const va2 = document.createElement("script");
    va2.defer = true;
    va2.src = "/_vercel/insights/script.js";
    document.head.appendChild(va2);
  }

  // --- Remove all sandbox attributes from iframes ---
  new MutationObserver(() => {
    document.querySelectorAll("iframe[sandbox]").forEach(iframe => {
      iframe.removeAttribute("sandbox");
    });
  }).observe(document, { childList: true, subtree: true });

  // --- Patch document.getElementById to re-query every time ---
  const realGetElementById = Document.prototype.getElementById;
  Document.prototype.getElementById = function(id) {
    return realGetElementById.call(this, id);
  };

  // --- Proxy/Bypass Rewriting ---
  const originalFetch = window.fetch;
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalAssign = window.location.assign;
  const originalReplace = window.location.replace;

  function fixUrl(url) {
    if (typeof url !== 'string') return url;
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
      if (href && !href.startsWith('//')) {
        a.setAttribute('href', '/oldsite/' + href);
      }
    }
  });
})();

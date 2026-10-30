/**
 * ask-ai-buttons.js — framework-agnostic "Open in ChatGPT" + "Copy as Markdown".
 *
 * Pairs with the chanmeng-geo-markdown-mirror skill. No build step. Drop into any static
 * or Vite site.
 *
 * Usage:
 *   <link rel="stylesheet" href="/ask-ai-buttons.css">
 *   <div data-ask-ai data-mirror="/llms/pricing.md"></div>
 *   <script src="/ask-ai-buttons.js" defer></script>
 *
 * Every element with [data-ask-ai] gets the button pair, pointed at its
 * data-mirror path (the SAME-SITE .md mirror, not a GitHub raw URL).
 */
(function () {
  'use strict';

  function absolute(mirrorPath) {
    return window.location.origin + mirrorPath;
  }

  function openInChatGPT(mirrorPath) {
    var prompt = 'Read ' + absolute(mirrorPath);
    var url = 'https://chatgpt.com/?hints=search&prompt=' + encodeURIComponent(prompt);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function copyMarkdown(mirrorPath, btn) {
    fetch(mirrorPath)
      .then(function (r) { return r.text(); })
      .then(function (md) { return navigator.clipboard.writeText(md); })
      .then(function () {
        var original = btn.dataset.label;
        btn.textContent = 'Copied!';
        setTimeout(function () { btn.textContent = original; }, 2000);
      })
      .catch(function () {
        window.open(mirrorPath, '_blank', 'noopener,noreferrer');
      });
  }

  function makeButton(label, title) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'ask-ai-btn';
    b.textContent = label;
    b.dataset.label = label;
    b.title = title;
    return b;
  }

  function render(el) {
    var mirror = el.getAttribute('data-mirror');
    if (!mirror) return;
    var wrap = document.createElement('div');
    wrap.className = 'ask-ai-buttons';

    var gpt = makeButton('Open in ChatGPT', 'Open this page in ChatGPT');
    gpt.addEventListener('click', function () { openInChatGPT(mirror); });

    var copy = makeButton('Copy as Markdown', 'Copy this page as Markdown');
    copy.addEventListener('click', function () { copyMarkdown(mirror, copy); });

    wrap.appendChild(gpt);
    wrap.appendChild(copy);
    el.appendChild(wrap);
  }

  function init() {
    document.querySelectorAll('[data-ask-ai]').forEach(render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
